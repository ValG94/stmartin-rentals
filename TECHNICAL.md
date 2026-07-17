# Fiche technique — Island Living SXM

> Documentation vivante du projet. Les sections marquées `AUTO` sont
> régénérées à chaque commit par `scripts/update-technical-doc.mjs`.
> **Ne pas éditer manuellement** ces blocs — édite le reste librement.

<!-- AUTO:META -->
> **Dernière mise à jour** : 2026-07-17 17:09 UTC
> **Branche** : `main` — **HEAD** : `b06061d`
<!-- /AUTO:META -->

---

## 1. Stack technique

| Couche | Techno | Notes |
|---|---|---|
| Framework | Next.js 15 (App Router) | Server Components + Server Actions |
| Langage | TypeScript strict | |
| Base de données | Supabase (PostgreSQL managé) | RLS actives sur toutes les tables |
| Auth admin | Supabase Auth | Login email/password, token cookie httpOnly |
| Storage images | Supabase Storage | Bucket `apartment-images` public |
| i18n | next-intl v4 | Locales `fr`, `en` — routing basé path |
| Paiement CB | **Fygaro** (RBC Caraïbes) | JWT signed Payment Buttons |
| Paiement virement | Manuel (via mail) | Instructions dans le mail de résa |
| Paiement PayPal | Code dormant | Désactivé via `PAYPAL_UI_ENABLED=false` |
| Emails | Resend | Domain `islandlivingsxm.com` vérifié |
| Hébergement | Vercel | Domain via IONOS DNS |
| Package manager | **pnpm** | ⚠️ npm casse le lockfile — ne pas utiliser |

---

## 2. Variables d'environnement

À copier tel quel dans un nouveau projet (juste les valeurs à changer).

### Public / partagées

```env
NEXT_PUBLIC_SITE_URL=https://islandlivingsxm.com
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
NEXT_PUBLIC_FYGARO_ENABLED=true
```

### Server (private)

```env
SUPABASE_SERVICE_ROLE_KEY=xxxxx
ADMIN_USERNAME=admin
ADMIN_PASSWORD=strong-password
ADMIN_EMAIL=contact@islandlivingsxm.com

# Fygaro (paiement CB Caraïbes)
FYGARO_PUBLIC_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
FYGARO_SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FYGARO_PAYMENT_URL_BOOKING=https://www.fygaro.com/en/pb/<uuid-booking>/
FYGARO_PAYMENT_URL_DEPOSIT=https://www.fygaro.com/en/pb/<uuid-caution>/
# FYGARO_WEBHOOK_SECRET=xxxxx   # optionnel — fallback sur SECRET_KEY
# FYGARO_TEST_AMOUNT=1          # TEST MODE — retirer en prod

# Emails
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=Island Living SXM <contact@islandlivingsxm.com>

# PayPal (code dormant — inutilisé mais garder les vars pour éviter les
# erreurs de build)
PAYPAL_ENV=sandbox
PAYPAL_CLIENT_ID=placeholder
PAYPAL_CLIENT_SECRET=placeholder
NEXT_PUBLIC_PAYPAL_CLIENT_ID=placeholder

# Cron (sitemap iCal + rappels caution)
CRON_SECRET=long-random-string
```

---

## 3. Intégration Fygaro — guide complet

**Contexte** : Fygaro est une passerelle de paiement caribéenne (RBC compatible) qui remplace Stripe (indisponible sur les îles néerlandaises). Le tunnel utilise des **Payment Buttons signés par JWT** — notre serveur calcule le prix, signe un JWT HMAC-SHA256 avec le montant réel, et Fygaro l'override sur le montant statique du bouton.

### 3.1 Setup côté Fygaro dashboard

**Étape 1 — Compte marchand**
1. La cliente (dirigeante de la société qui va facturer) doit accepter l'invitation Fygaro elle-même — pas nous — pour des raisons légales
2. Une fois acceptée, elle peut ajouter des delegated users (nous) pour gérer la config
3. Le compte doit être sur un plan qui expose la **"Fygaro Links Integration API"** (JWT override activable)

**Étape 2 — API Credentials** (Settings → API Credentials → Generate)
- **API Key** (Public) → à mettre dans `FYGARO_PUBLIC_KEY`
- **API Secret** → à mettre dans `FYGARO_SECRET_KEY` (visible **une seule fois** — copier immédiatement)
- Les 2 doivent venir de la **même paire** — sinon signature invalide
- Cette même paire signe aussi les webhooks entrants (`FYGARO_WEBHOOK_SECRET` fallback)
- Configurer cette paire dans **Default Hook Credentials**

**Étape 3 — Créer 2 Payment Buttons** (Fygaro Links → New Payment Button)

Bouton **A : "Booking"** (paiement séjour, capture immédiate)
- **General Settings** → Button Type = **`Variable Amount`** ⚠️ obligatoire pour que le JWT override le montant
- **Advanced Options** → `Require JWT` **coché** ⚠️ sécurité : empêche tout paiement non-signé
- **Advanced Options** → `Manual Capture` **décoché** (débit immédiat)
- **Advanced Options** → `Active` coché
- **Plugins tab** :
  - Checkout URL : générée automatiquement — la copier dans `FYGARO_PAYMENT_URL_BOOKING`
  - Hook URL : `https://<domain>/api/webhooks/fygaro`
  - Return URL : `https://<domain>/en/booking/fygaro-success`

Bouton **B : "Caution"** (empreinte, Manual Capture)
- Config **identique au bouton A** **SAUF** :
- **Advanced Options** → `Manual Capture` **coché** (pré-autorisation sans débit)
- Copier son URL dans `FYGARO_PAYMENT_URL_DEPOSIT` (UUID DIFFÉRENT du bouton A)
- Hook URL + Return URL identiques au bouton A

### 3.2 Flow côté serveur — construction du JWT

Fichier : [lib/services/fygaro.ts](lib/services/fygaro.ts)

```ts
// Header JWT
{ alg: 'HS256', typ: 'JWT', kid: FYGARO_PUBLIC_KEY }

// Payload — STRICTEMENT ces claims (autres = "Invalid JWT")
{
  exp: <unix timestamp + 3600>,   // 1h de validité
  amount: "4310.00",              // string, 2 décimales
  currency: "USD",
  custom_reference: "b:<uuid>"    // max 40 chars — sinon "Custom Reference cannot exceed 40 characters"
}

// Signature = HMAC-SHA256(header + "." + payload, FYGARO_SECRET_KEY)
// URL finale = `${FYGARO_PAYMENT_URL_BOOKING}?jwt=<signed>`
```

### 3.3 Références (custom_reference) — préfixes courts

Limite Fygaro : **40 chars max**. On utilise 3 préfixes courts (2 chars + UUID = 38 chars) :

- `b:<uuid>` → paiement séjour (booking)
- `d:<uuid>` → empreinte caution (deposit)
- `bal:<uuid>` → paiement du solde (balance) après acompte 40%

Le webhook parse la référence pour router vers le bon handler.

### 3.4 Webhook Fygaro

Fichier : [app/api/webhooks/fygaro/route.ts](app/api/webhooks/fygaro/route.ts)

- Signature vérifiée avec HMAC-SHA256 (`Fygaro-Signature` header, format `t=<ts>,v1=<hash>`)
- Timestamp anti-replay : tolérance 5 min
- Payload lu **en raw text** avant tout parsing JSON (indispensable pour HMAC)
- Route selon le préfixe de `custom_reference`
- Idempotence : re-appels avec le même `transactionId` retournent `alreadyProcessed: true`
- Validation montant : tolérance ±$0.01. Skippée si `FYGARO_TEST_AMOUNT` défini.

### 3.5 Bugs connus & solutions

| Symptôme | Cause | Fix |
|---|---|---|
| `Invalid JWT` | Public/Secret Keys pas de la même paire | Régénérer les 2 en même temps, mettre à jour Vercel |
| `Invalid JWT` (bis) | Claims `iss`/`aud`/`iat` dans le payload | Retirer — Fygaro n'accepte que exp/amount/currency/custom_reference |
| `Custom Reference cannot exceed 40 characters` | Préfixe `booking:` = 44 chars | Utiliser `b:` (38 chars) |
| Montant déduit = montant du bouton (pas du JWT) | Button Type = `Fixed Amount` | Passer en `Variable Amount` |
| Pas de webhook reçu | Hook URL configurée sur le mauvais bouton | Vérifier que l'UUID de `FYGARO_PAYMENT_URL_*` = celui du bouton Fygaro |
| Return URL en 404 | Typo (autocomplete phone) — ex `/yen/booking/` | Recopier proprement `/[locale]/booking/fygaro-success` |
| DB error `bookings_payment_method_check` | Contrainte SQL n'accepte pas 'fygaro' | Migration `supabase/add_fygaro_to_payment_methods.sql` |
| Un bouton hérite de la config d'un autre | Config faite dans l'onglet Plugins global au lieu de l'onglet du bouton | Toujours passer par la fiche individuelle du bouton (General Settings + Advanced Options) |

### 3.6 Mode test

- `FYGARO_TEST_AMOUNT=1` sur Vercel → tout paiement Fygaro coûte $1 (au lieu du vrai montant)
- La booking est créée en DB avec les vrais montants (email de confirmation correct)
- Le webhook skip la validation de montant en mode test
- **Retirer cette variable pour repasser en prod réelle**

### 3.7 Actions post-paiement admin (Capture / Void)

L'API REST publique Fygaro pour Capture/Void n'est pas documentée. Sonia les fait via le **dashboard Fygaro** :
- Empreinte a été autorisée mais pas de dégât → laisser expirer (auto-release ~7 jours)
- Dégât constaté → dashboard Fygaro → transaction → **Capture** en saisissant le montant
- Le webhook Fygaro nous notifie l'action → notre `deposit_authorization_status` passe à `captured` ou `voided`
- Bouton "Gérer caution ↗" dans notre back-office redirige vers Fygaro dashboard (ID transaction en tooltip)

---

## 4. Flows de paiement — vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Client remplit BookingForm sur /apartments/[slug]            │
│    → dates + guests + payment_option (full ou 40% acompte)      │
│    → paymentMethod : 'fygaro' (CB) | 'bank_transfer' | 'paypal' │
└──────────────────┬──────────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. POST /api/checkout/fygaro/create-link  (mode='booking')      │
│    → serveur recalcule le prix (jamais confiance client)        │
│    → INSERT booking (status=pending, payment_status=pending)    │
│    → génère URL Fygaro signée JWT                               │
│    → return { redirectUrl }                                     │
└──────────────────┬──────────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Redirection navigateur → page Fygaro (formulaire CB)         │
│    → client saisit CB, valide                                   │
└──────────────────┬──────────────────────────────────────────────┘
                   ↓
     ┌─────────────┴──────────────┐
     ↓                            ↓
┌──────────────────────┐  ┌───────────────────────────────────────┐
│ 4a. Webhook Fygaro   │  │ 4b. Return URL vers                   │
│  POST /api/webhooks/ │  │  /booking/fygaro-success              │
│    fygaro            │  │                                       │
│  → vérif signature   │  │  → affiche récap + CTA                │
│  → status='confirmed'│  │    "Étape 2/2 — Autoriser caution"    │
│  → block calendrier  │  └────────────────┬──────────────────────┘
│  → send email        │                   ↓
└──────────────────────┘  ┌───────────────────────────────────────┐
                          │ 5. Client clique CTA caution          │
                          │   POST /api/checkout/fygaro/          │
                          │     create-link (mode='deposit')      │
                          │   → redirection vers bouton Caution   │
                          │     (Manual Capture)                  │
                          └────────────────┬──────────────────────┘
                                           ↓
                          ┌───────────────────────────────────────┐
                          │ 6. Webhook 'd:<uuid>'                 │
                          │   → deposit_authorization_id stocké   │
                          │   → status='authorized'               │
                          │   → email empreinte enregistrée       │
                          └───────────────────────────────────────┘
```

Pour l'acompte 40 % — Sonia peut envoyer un **rappel manuel** depuis `/admin/bookings` (bouton "Rappel solde"). Le client reçoit un mail avec un lien `/booking/pay-balance/[uuid]` qui redirige vers Fygaro pour payer le solde. Webhook `bal:<uuid>` → `payment_status='paid'`, mail "Séjour intégralement payé".

Un **cron J-2** ([app/api/cron/deposit-reminders/route.ts](app/api/cron/deposit-reminders/route.ts)) scanne quotidiennement les bookings CB dont l'empreinte n'est pas posée et envoie un rappel automatique.

---

## 5. Service email (Resend)

Fichier : [lib/services/email.ts](lib/services/email.ts)

| Fonction | Déclencheur | Destinataire |
|---|---|---|
| `sendBookingConfirmationEmail` | Webhook Fygaro booking OK / virement reçu | Client + admin |
| `sendBankTransferPendingEmail` | Résa par virement (avant réception) | Client |
| `sendBookingCancellationEmail` | Bouton "Cancel + email" back-office | Client |
| `sendBalanceReminderEmail` | Bouton "Rappel solde" back-office | Client |
| `sendBalancePaidEmail` | Webhook Fygaro `bal:<uuid>` OK | Client |
| `sendDepositReminderEmail` | Cron J-2 automatique | Client |
| `sendDepositAuthorizedEmail` | Webhook Fygaro `d:<uuid>` OK | Client |

Tous les emails sont **bilingues** (FR/EN selon `locale` de la booking).

Setup Resend :
- Domaine `islandlivingsxm.com` vérifié via DNS (DKIM CNAME + MX/TXT sur subdomain `send`)
- `EMAIL_FROM=Island Living SXM <contact@islandlivingsxm.com>`

---

## 6. Back-office admin (`/admin`)

- Login Supabase Auth via `/admin-login`
- Middleware : token vérifié à chaque requête (cookie httpOnly)
- Pages :
  - `/admin/dashboard` — KPI clickables + calendriers villas
  - `/admin/bookings` — liste avec filtres (all, awaiting transfer, **deposit missing**, confirmed, pending, cancelled, completed) + pagination + multi-select delete
  - `/admin/apartments` — CRUD villas + upload images (drag-drop) + prix saisonniers
  - `/admin/apartments/[id]/edit` — édition riche (TipTap) description
  - `/admin/digital-guide` — guide client interne
  - `/admin/destination` — infos SXM

Actions bookings :
- **Confirmer / Refuser** (bookings en attente virement)
- **Virement reçu** → passe en confirmed + envoie email
- **Rappel solde** (40% acompte, solde > 0) → envoie mail avec lien Fygaro balance
- **Gérer caution ↗** (empreinte active) → ouvre dashboard Fygaro
- **Cancel + email** → annule + notifie + libère calendrier
- **Marquer terminée** (post check-out)

---

## 7. Sync iCal Airbnb ↔ site

Bidirectionnelle :
- **Airbnb → nous** : cron toutes les 30 min ([app/api/cron/sync-ical/route.ts](app/api/cron/sync-ical/route.ts)) parse les feeds iCal des villas Airbnb et insère les dates comme `availability_blocks` avec `source='airbnb'`
- **Nous → Airbnb** : endpoint public ([app/api/apartments/[id]/ical/route.ts](app/api/apartments/[id]/ical/route.ts)) génère un iCal des bookings confirmées, à connecter côté Airbnb dashboard

---

## 8. SEO / partage social

- Open Graph + Twitter Card avec image hero 1200×630 sur toutes les pages
- Chaque fiche villa a **son propre OG image** (photo de couverture)
- Sitemap dynamique : `/sitemap.xml` (généré par [app/sitemap.ts](app/sitemap.ts))
- Robots : `/robots.txt` (généré par [app/robots.ts](app/robots.ts))
- JSON-LD `LodgingBusiness` sur fiches villa (rich results Google)
- `hreflang` alternates fr ↔ en partout
- Google Search Console verification file : [public/google520a13a002e41628.html](public/google520a13a002e41628.html)

---

## 9. Déploiement

### Vercel
- Import projet depuis GitHub `ValG94/stmartin-rentals`
- Framework : Next.js (auto-détecté)
- Package manager : **pnpm** (auto — grâce au `pnpm-lock.yaml`)
- Build command : `pnpm build`
- Env vars : voir section 2 (Production + Preview)
- Cron : configuré via `vercel.json` (sync-ical + deposit-reminders)

### Supabase
- Projet cloud + base PostgreSQL
- Storage bucket `apartment-images` public
- RLS activé — les policies sont dans `supabase/*.sql`
- Migrations à exécuter dans l'ordre chronologique dans SQL Editor

### DNS (IONOS pour ce projet)
- A record `@` → `216.150.1.1` (Vercel)
- CNAME `www` → `<project>.vercel.app`
- Records Resend : `send.islandlivingsxm.com` MX + TXT + DKIM CNAME `resend`
- TTL 1h en général

---

## 10. Roadmap / TODO persistant

Ces items restent dans le doc tant qu'ils sont ouverts.

### Fygaro / Paiement
- [ ] Bouton "Capture / Void" natif dans le back-office (nécessite API REST Fygaro — non documentée publiquement, à demander au support)
- [ ] Auto-release après check-out (cron J+7 qui void les empreintes non capturées si `check_out < now - 7d`)

### Client / UX
- [ ] Filtre "Solde en retard" dans /admin/bookings (bookings avec check_in < J+7 et remaining_balance > 0)
- [ ] Cron J-5 rappel solde automatique (en plus du bouton manuel)
- [ ] Page publique `/faq` avec réponses courantes (annulation, caution, arrivée, etc.)
- [ ] Traduction complète FR (audit final)

### Admin
- [ ] Export bookings CSV pour compta
- [ ] Historique des mails envoyés (log des `sendEmail`)
- [ ] Notifications push admin (nouvelle résa, empreinte, etc.)

### SEO / Marketing
- [ ] Google Business Profile (fiche Sonia + Google Maps)
- [ ] Blog `/blog` avec 3-5 articles (idées séjours SXM, guide culinaire, etc.)
- [ ] Schéma FAQ JSON-LD sur les pages villas (rich results Google)

### Infra
- [ ] Sentry pour tracker les erreurs prod (webhook Fygaro, emails, etc.)
- [ ] Analytics (Plausible ou GA4 — respect RGPD)
- [ ] Tests e2e Playwright sur le tunnel de résa complet

---

## 11. Historique récent (auto)

<!-- AUTO:LAST_COMMITS -->
| Hash | Date | Auteur | Sujet |
|---|---|---|---|
| `b06061d` | 2026-07-17 | Valery Garrec | feat(seo): Open Graph link previews + sitemap + robots + JSON-LD + hreflang |
| `fa8ee44` | 2026-07-17 | Valery Garrec | feat(bookings): cron J-2 deposit reminders + 'Manage deposit' shortcut to Fygaro |
| `516eb43` | 2026-07-17 | Valery Garrec | feat(bookings): deposit-missing filter + balance reminder flow + adapted deposit email |
| `3d4ee16` | 2026-07-17 | Valery Garrec | feat(fygaro): deposit-authorized email + admin caution status badges |
| `ced9830` | 2026-07-17 | Valery Garrec | feat(booking): chain caution flow after Fygaro booking payment |
| `f48a3c1` | 2026-07-17 | Valery Garrec | fix(admin): show 'Card' badge on Fygaro bookings (was mislabeled 'PayPal') |
| `3e4426f` | 2026-07-17 | Valery Garrec | fix(fygaro): shorten custom_reference to fit 40-char Fygaro limit |
| `44fad02` | 2026-07-17 | Valery Garrec | fix(fygaro): strip non-documented JWT claims to avoid 'Invalid JWT' |
| `9d52fb8` | 2026-07-17 | Valery Garrec | fix(db): allow 'fygaro' in bookings.payment_method CHECK constraint |
| `763d89b` | 2026-07-17 | Valery Garrec | fix(booking): calendar UX + FYGARO_TEST_AMOUNT env for e2e testing |
| `f2f50d1` | 2026-07-17 | Valery Garrec | fix(fygaro): align JWT payload + webhook secret with official docs |
| `33fa91e` | 2026-07-11 | Valery Garrec | feat(dashboard): pagination + multi-select + batch delete on bookings table |
| `7076fb0` | 2026-07-11 | Valery Garrec | feat(admin): clickable KPI cards on dashboard — shortcuts to related pages |
| `53f7c21` | 2026-07-11 | Valery Garrec | feat(admin): 'Cancel + email' button on bookings — releases dates + notifies guest |
| `9ec4088` | 2026-07-11 | Valery Garrec | feat(booking): payment method UI — Fygaro card + hide PayPal (dormant) |
<!-- /AUTO:LAST_COMMITS -->

---

## 12. Structure des fichiers clés

```
app/
├─ layout.tsx                       # metadata racine + OG globaux
├─ sitemap.ts                       # sitemap.xml dynamique
├─ robots.ts                        # robots.txt
├─ [locale]/
│  ├─ layout.tsx                    # metadata locale + alternates
│  ├─ page.tsx                      # home
│  ├─ apartments/
│  │  ├─ page.tsx                   # listing villas
│  │  └─ [slug]/page.tsx            # fiche villa (JSON-LD + OG dédié)
│  ├─ booking/
│  │  ├─ fygaro-success/            # page retour Fygaro (booking + deposit)
│  │  ├─ fygaro-cancel/
│  │  └─ pay-balance/[bookingId]/   # auto-redirect Fygaro pour solde
│  └─ admin/                        # back-office
└─ api/
   ├─ checkout/fygaro/create-link/  # POST — génère lien signé JWT
   ├─ webhooks/fygaro/              # POST — reçoit events Fygaro
   ├─ admin/bookings/               # actions back-office
   ├─ apartments/[id]/ical/         # feed iCal sortant
   └─ cron/
      ├─ sync-ical/                 # */30 * * * * — Airbnb pull
      └─ deposit-reminders/         # 0 9 * * * — J-2 empreinte

lib/services/
├─ fygaro.ts                        # JWT sign + webhook verify
├─ email.ts                         # tous les emails Resend
├─ pricing.ts                       # formatUSD + calculs client
├─ server-pricing.ts                # computeServerPricing (source de vérité)
└─ sanitize.ts                      # sanitize HTML riche

supabase/                           # migrations SQL (à exécuter dans l'ordre)
```

---

*Généré à partir de [TECHNICAL.md](TECHNICAL.md). Édite directement le fichier
pour toute mise à jour manuelle. Les blocs `<!-- AUTO:* -->` sont regénérés
à chaque commit par `scripts/update-technical-doc.mjs`.*
