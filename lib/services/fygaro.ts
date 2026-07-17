// ============================================================
// Service Fygaro — passerelle de paiement Caraïbes (RBC-compatible)
// ============================================================
//
// Deux flows :
//  - Paiement de séjour (capture immédiate) → bouton FYGARO_PAYMENT_URL_BOOKING
//  - Empreinte CB pour caution (Manual Capture, hold 30 jours si MCC Hotel)
//    → bouton FYGARO_PAYMENT_URL_DEPOSIT
//
// Mécanisme :
//  1. Notre serveur signe un JWT HMAC-SHA256 avec la Secret Key Fygaro,
//     contenant le montant réel + une référence booking + les return URLs
//  2. Le JWT est appendé en query param à l'URL du Payment Button
//  3. Fygaro utilise ces valeurs (au lieu du montant statique du bouton)
//  4. Après paiement, Fygaro appelle notre webhook signé HMAC-SHA256
//     que nous vérifions avant de mettre à jour la booking
//
// Aucune donnée CB ne transite chez nous — Fygaro héberge la page de saisie.
// ============================================================

import { createHmac, timingSafeEqual } from 'crypto';

// ── Types payload ────────────────────────────────────────────────────────────

export interface FygaroPaymentPayload {
  amount: number;
  currency?: string;               // 'USD' par défaut
  reference: string;               // notre bookingId, retourné dans le webhook
  // Le return_url se configure directement dans le Payment Button
  // (Plugins tab côté Fygaro). Les infos client (email/nom/téléphone) sont
  // saisies par le client sur la page de paiement hébergée Fygaro — pas
  // besoin de les pré-remplir via le JWT.
}

/**
 * Résultat de la vérification d'un webhook Fygaro.
 * On préfère un résultat structuré plutôt qu'un throw pour permettre au
 * caller de logger proprement avant de renvoyer 401.
 */
export interface FygaroWebhookVerification {
  valid: boolean;
  reason?: string;
  timestamp?: number;
}

// ── Helpers base64url (URL-safe base64 sans padding) ─────────────────────────

function base64UrlEncode(input: string | Buffer): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf-8') : input;
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// ── JWT HMAC-SHA256 ─────────────────────────────────────────────────────────

interface JwtHeader {
  alg: 'HS256';
  typ: 'JWT';
  kid?: string;
}

function signHS256(payload: Record<string, unknown>, secret: string, kid?: string): string {
  const header: JwtHeader = { alg: 'HS256', typ: 'JWT', ...(kid ? { kid } : {}) };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = createHmac('sha256', secret).update(signingInput).digest();
  return `${signingInput}.${base64UrlEncode(signature)}`;
}

// ── Construction d'une URL Fygaro Payment Link signée ────────────────────────

/**
 * Extrait l'UUID du Payment Button depuis son URL.
 * Format attendu : https://www.fygaro.com/en/pb/[uuid]/
 */
function extractButtonId(url: string): string | null {
  const m = url.match(/\/pb\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  return m ? m[1] : null;
}

/**
 * Construit l'URL de redirection Fygaro pour un paiement donné, avec JWT signé
 * qui override les valeurs par défaut du Payment Button.
 *
 * @param buttonUrl URL de base du Payment Button (FYGARO_PAYMENT_URL_*)
 * @param payload   Données à injecter (montant réel, référence booking, retours)
 * @returns URL complète à laquelle rediriger le client
 */
export function buildFygaroPaymentUrl(
  buttonUrl: string,
  payload: FygaroPaymentPayload,
): string {
  const publicKey = process.env.FYGARO_PUBLIC_KEY;
  const secretKey = process.env.FYGARO_SECRET_KEY;
  if (!publicKey || !secretKey) {
    throw new Error('FYGARO_PUBLIC_KEY / FYGARO_SECRET_KEY non configurés');
  }

  const buttonId = extractButtonId(buttonUrl);
  if (!buttonId) {
    throw new Error(`URL Payment Button invalide : ${buttonUrl}`);
  }

  const now = Math.floor(Date.now() / 1000);

  // Payload JWT — strictement les claims documentés par Fygaro :
  //   https://help.fygaro.com/en-us/article/fygaro-links-integration-api-h78p9y/
  //   - amount (string, 2 décimales) : override le montant statique du bouton
  //   - currency (string)            : override la devise
  //   - custom_reference (string)    : notre bookingId, retourné dans webhook + return URL
  //   - exp (UnixTimestamp)          : fenêtre de validité de l'URL signée (1h)
  //   - nbf (UnixTimestamp)          : validité en avance (optionnel, non utilisé ici)
  //
  // On N'INCLUT PAS iss / aud / iat : ces claims JWT standards ne sont
  // pas dans la liste documentée par Fygaro. Certains validateurs stricts
  // rejettent "Invalid JWT" quand ils rencontrent des claims inattendus.
  //
  // Les infos client (email, nom) sont saisies par le client sur la page
  // hébergée. Le return_url est configuré côté Payment Button (Plugins tab).
  const jwtPayload: Record<string, unknown> = {
    exp: now + 60 * 60,                          // 1h pour compléter le paiement
    amount: payload.amount.toFixed(2),           // string 2 décimales (doc Fygaro)
    currency: payload.currency || 'USD',
    custom_reference: payload.reference,         // ex : "booking:<uuid>" ou "deposit:<uuid>"
  };
  // buttonId sert uniquement à valider le format côté nous — pas envoyé
  // dans le JWT. Fygaro sait quel bouton on cible via l'URL de destination.
  void buttonId;

  const jwt = signHS256(jwtPayload, secretKey, publicKey);

  const url = new URL(buttonUrl);
  url.searchParams.set('jwt', jwt);
  return url.toString();
}

// ── Vérification signature webhook Fygaro ────────────────────────────────────

/**
 * Vérifie la signature HMAC-SHA256 d'un webhook Fygaro entrant.
 *
 * Format du header Fygaro-Signature attendu :
 *   "t=<timestamp>,v1=<hash>[,v1=<hash2>...]"
 *
 * Le message signé est `${timestamp}.${raw_body}`.
 *
 * @param rawBody         Corps brut de la requête (avant tout parsing JSON)
 * @param signatureHeader Contenu du header 'Fygaro-Signature'
 * @param toleranceSec    Fenêtre max entre timestamp et now (anti-replay)
 * @returns { valid, reason?, timestamp? }
 */
export function verifyFygaroWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  toleranceSec = 5 * 60,           // 5 min de tolérance sur la clock skew
): FygaroWebhookVerification {
  // Fygaro signe les webhooks avec la Secret Key API du compte
  // (Settings → API Credentials). Doc :
  // https://help.fygaro.com/en-us/article/payment-button-hook-1wkui1k/
  // On garde WEBHOOK_SECRET en env optionnel pour supporter une éventuelle
  // rotation de clé future sans redéploiement, mais par défaut = SECRET_KEY.
  const secret = process.env.FYGARO_WEBHOOK_SECRET || process.env.FYGARO_SECRET_KEY;
  if (!secret) return { valid: false, reason: 'Aucune clé Fygaro configurée (SECRET_KEY ou WEBHOOK_SECRET)' };
  if (!signatureHeader) return { valid: false, reason: 'Header Fygaro-Signature manquant' };

  // Parse le header
  let timestamp: string | null = null;
  const hashes: string[] = [];
  for (const part of signatureHeader.split(',').map(p => p.trim())) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const key = part.slice(0, eq);
    const value = part.slice(eq + 1);
    if (key === 't') timestamp = value;
    else if (key === 'v1') hashes.push(value);
  }
  if (!timestamp || hashes.length === 0) {
    return { valid: false, reason: 'Header Fygaro-Signature mal formé' };
  }

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return { valid: false, reason: 'Timestamp invalide' };

  // Anti-replay : refuse les webhooks trop vieux ou trop dans le futur
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > toleranceSec) {
    return { valid: false, reason: `Timestamp hors tolérance (Δ=${Math.abs(now - ts)}s)`, timestamp: ts };
  }

  // Calcule le HMAC attendu
  const signedPayload = `${timestamp}.${rawBody}`;
  const expected = createHmac('sha256', secret).update(signedPayload).digest();

  // Compare en temps constant contre chaque v1 fourni (Fygaro peut envoyer
  // plusieurs signatures pendant une rotation de secret)
  for (const hexHash of hashes) {
    let provided: Buffer;
    try {
      provided = Buffer.from(hexHash, 'hex');
    } catch {
      continue;
    }
    if (provided.length !== expected.length) continue;
    if (timingSafeEqual(expected, provided)) {
      return { valid: true, timestamp: ts };
    }
  }
  return { valid: false, reason: 'Aucune signature ne matche', timestamp: ts };
}

// ── Payload webhook typé ─────────────────────────────────────────────────────

/**
 * Structure canonique du payload webhook Fygaro (v1).
 * Tous les champs custom_* qu'on a envoyés à la création de l'URL sont
 * retournés tels quels dans le webhook.
 */
export interface FygaroWebhookPayload {
  transactionId: string;
  reference?: string;
  customReference?: string;
  authCode?: string;
  currency: string;
  amount: string;                  // string avec 2 décimales (attention : pas number)
  createdAt: string;               // ISO-8601 UTC
  status?: string;                 // 'succeeded' | 'authorized' | 'voided' | 'refunded' ...
  card?: { last4?: string; brand?: string };
  client?: { email?: string; first_name?: string; last_name?: string };
  gratuity_amount?: string;
}
