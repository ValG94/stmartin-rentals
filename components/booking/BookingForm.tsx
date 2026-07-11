'use client';

import { useState } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { Users, ShieldCheck, Clock, ChevronDown, CheckCircle2 } from 'lucide-react';
import { calculatePricing, formatUSD, type SeasonalPriceInput } from '@/lib/services/pricing';
import DateRangePicker from './DateRangePicker';

interface BookingFormProps {
  apartmentId: string;
  apartmentSlug: string;
  apartmentName: string;
  nightlyRate: number;
  maxGuests: number;
  extraGuestsMax?: number;            // capacité supplémentaire payante (0 = pas d'extras)
  extraGuestPricePerNight?: number;   // tarif par voyageur supplémentaire par nuit
  eurRate?: number;
  locale?: string;
  seasonalPrices?: SeasonalPriceInput[];
}

type PaymentMethod = 'paypal' | 'bank_transfer' | 'fygaro';
type PaymentOption = 'full' | 'deposit_40';

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '';

// ────────────────────────────────────────────────────────────────────
// Feature flags — pilotent quelles méthodes de paiement sont exposées.
// Toute la logique PayPal (SDK, handlers, provider) est conservée mais
// masquée en attendant que la propriétaire réouvre un compte PayPal
// compatible SXM. Pour réactiver : passer PAYPAL_UI_ENABLED à true.
// ────────────────────────────────────────────────────────────────────
const PAYPAL_UI_ENABLED = false;

// Fygaro : activé via env var côté client (NEXT_PUBLIC_FYGARO_ENABLED).
// - false / non défini → carré 'Bientôt disponible'
// - 'true'             → option active, redirect vers Fygaro Payment Link
// Cette approche permet de basculer sans redéploiement de code, juste
// une modif env sur Vercel.
const FYGARO_UI_ENABLED = process.env.NEXT_PUBLIC_FYGARO_ENABLED === 'true';

export default function BookingForm({
  apartmentId,
  apartmentSlug,
  nightlyRate,
  maxGuests,
  extraGuestsMax = 0,
  extraGuestPricePerNight = 0,
  eurRate,
  locale = 'en',
  seasonalPrices = [],
}: BookingFormProps) {
  const isFr = locale === 'fr';

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [message, setMessage] = useState('');
  const [paymentOption, setPaymentOption] = useState<PaymentOption>('full');
  // Défaut = Fygaro si activé, sinon virement (fallback toujours disponible).
  // PayPal n'est jamais choisi par défaut tant que PAYPAL_UI_ENABLED est false.
  const defaultPaymentMethod: PaymentMethod = FYGARO_UI_ENABLED ? 'fygaro' : 'bank_transfer';
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(defaultPaymentMethod);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showCancellation, setShowCancellation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [bankTransferDone, setBankTransferDone] = useState(false);

  const pricing = checkIn && checkOut ? (() => {
    try {
      return calculatePricing(
        apartmentSlug,
        checkIn,
        checkOut,
        nightlyRate,
        seasonalPrices,
        extraGuestPricePerNight > 0
          ? { guestsCount: guests, baseCapacity: maxGuests, pricePerNight: extraGuestPricePerNight }
          : undefined,
      );
    } catch { return null; }
  })() : null;

  const guestsCeiling = maxGuests + extraGuestsMax;
  const extraGuestsActive = pricing && pricing.extraGuestsCount > 0;

  const amountDue = pricing
    ? (paymentOption === 'full' ? pricing.bookingTotal : pricing.depositAmount)
    : 0;

  function fmt(amount: number): string {
    if (isFr && eurRate) {
      return `${Math.round(amount * eurRate).toLocaleString('fr-FR')} €`;
    }
    return formatUSD(amount);
  }

  function canProceed() {
    return !!(pricing && pricing.nights > 0 && guestName.trim()
      && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail));
  }

  async function handleBankTransfer() {
    if (!pricing || !termsAccepted) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/booking/bank-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apartmentId,
          checkIn,
          checkOut,
          guests,
          guestName,
          guestEmail,
          paymentOption,
          locale,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || (isFr ? 'Erreur lors de la création de la réservation' : 'Error creating booking'));
      setBookingId(data.bookingId);
      setBankTransferDone(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : (isFr ? 'Une erreur est survenue' : 'An error occurred'));
    } finally {
      setLoading(false);
    }
  }

  // ── Flow Fygaro (paiement CB via Payment Link hébergé) ─────────────────
  // Le serveur recalcule le prix, crée la booking pending, signe le JWT
  // et renvoie l'URL Fygaro. On redirige vers cette URL — Fygaro affiche
  // le formulaire CB puis nous appelle en webhook + redirige vers la
  // fygaro-success/cancel page côté client.
  async function handleFygaro() {
    if (!pricing || !termsAccepted) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/checkout/fygaro/create-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'booking',
          apartmentId,
          checkIn,
          checkOut,
          guests,
          guestName,
          guestEmail,
          paymentOption,
          locale,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.redirectUrl) {
        throw new Error(data.error || (isFr ? 'Impossible de créer le lien de paiement' : 'Unable to create payment link'));
      }
      // Redirection full-page vers Fygaro
      window.location.href = data.redirectUrl;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : (isFr ? 'Une erreur est survenue' : 'An error occurred'));
      setLoading(false);
    }
  }

  async function createPayPalOrder() {
    if (!pricing) throw new Error('No pricing');
    const res = await fetch('/api/paypal/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apartmentId,
        checkIn,
        checkOut,
        guests,
        guestName,
        guestEmail,
        paymentOption,
        locale,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'PayPal order creation failed');
    setBookingId(data.bookingId);
    return data.orderId;
  }

  async function capturePayPalOrder(orderId: string) {
    const res = await fetch('/api/paypal/capture-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, bookingId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'PayPal capture failed');
    window.location.href = `/${locale}/booking/paypal-success?bookingId=${bookingId}`;
  }

  // Libère immédiatement les dates quand l'utilisateur ferme la popup PayPal
  // sans payer (sinon le TTL serveur de 30 min les libérera plus tard).
  async function cancelPendingBooking() {
    if (!bookingId) return;
    try {
      await fetch('/api/booking/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });
    } catch {
      /* échec silencieux : le TTL serveur libérera les dates de toute façon */
    }
  }

  // ── Écran de confirmation virement ────────────────────────────
  if (bankTransferDone) {
    return (
      <div className="bg-cream-100 border border-bronze-200 rounded-2xl p-8 text-center">
        <div className="w-14 h-14 bg-bronze-50 border border-bronze-300 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-7 h-7 text-bronze-500" strokeWidth={1.5} />
        </div>
        <p className="section-label mb-3">{isFr ? 'Demande enregistrée' : 'Request received'}</p>
        <h3 className="font-serif font-light text-2xl text-night-600 mb-4 leading-tight">
          {isFr ? 'Votre réservation est en cours de validation' : 'Your booking is being processed'}
        </h3>
        <p className="text-sm text-night-400 leading-relaxed mb-6 font-light">
          {isFr
            ? <>Les instructions de virement (USD) ont été envoyées à <span className="text-night-600 font-medium">{guestEmail}</span>. Votre hôte confirmera la réservation dès réception des fonds.</>
            : <>Wire transfer instructions (USD) have been sent to <span className="text-night-600 font-medium">{guestEmail}</span>. Your host will confirm the booking upon receipt of funds.</>}
        </p>
        <div className="bg-sand-100 border border-bronze-100 rounded-lg p-4 text-left text-xs text-night-500 leading-relaxed">
          <p className="font-medium text-night-600 mb-1 uppercase" style={{ letterSpacing: '0.1em' }}>
            {isFr ? 'À noter' : 'Please note'}
          </p>
          <p>{isFr
            ? 'Les dates sont réservées pour 48 h. La confirmation est définitive uniquement après réception du virement.'
            : 'Dates are held for 48 h. Confirmation is final only after receipt of the transfer.'}</p>
        </div>
        <p className="text-[10px] text-night-300 mt-6 uppercase font-medium" style={{ letterSpacing: '0.2em' }}>
          {isFr ? 'Référence' : 'Reference'} · {bookingId}
        </p>
      </div>
    );
  }

  return (
    <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID || 'test', currency: 'USD', intent: 'capture' }}>
      <div className="bg-cream-100 border border-bronze-100 rounded-2xl">

        {/* ── En-tête : tarif ────────────────────────────────────── */}
        <div className="px-8 pt-8 pb-6 border-b border-bronze-100 rounded-t-2xl">
          <p className="section-label mb-2">{isFr ? 'À partir de' : 'From'}</p>
          <div className="flex items-baseline gap-2">
            <span className="font-serif font-light text-night-600" style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)' }}>
              {fmt(nightlyRate)}
            </span>
            <span className="text-sm text-night-400 font-light">/ {isFr ? 'nuit' : 'night'}</span>
          </div>
          {isFr && eurRate && (
            <p className="text-[10px] text-night-300 mt-2 uppercase" style={{ letterSpacing: '0.15em' }}>
              1 USD = {eurRate.toFixed(4)} EUR
            </p>
          )}
        </div>

        <div className="px-8 py-7 space-y-6">

          {/* Dates */}
          <div>
            <p className="section-label mb-3">{isFr ? 'Vos dates' : 'Your dates'}</p>
            <DateRangePicker
              apartmentId={apartmentId}
              checkIn={checkIn}
              checkOut={checkOut}
              onCheckInChange={(d) => setCheckIn(d)}
              onCheckOutChange={(d) => setCheckOut(d)}
              locale={locale}
            />
          </div>

          {/* Voyageurs */}
          <div>
            <label htmlFor="guest-count" className="section-label block mb-3">
              {isFr ? 'Voyageurs' : 'Guests'}
            </label>
            <div className="relative">
              <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-bronze-400" />
              <input
                id="guest-count"
                type="number"
                min={1}
                max={guestsCeiling}
                value={guests}
                onChange={e => setGuests(Number(e.target.value))}
                className="w-full pl-11 pr-4 py-3 bg-cream-50 border border-bronze-100 rounded-md text-sm text-night-600 focus:outline-none focus:border-bronze-400 focus:ring-1 focus:ring-bronze-400 transition-colors"
              />
            </div>
            {extraGuestsMax > 0 && (
              <p className="text-[11px] text-night-400 mt-2 font-light leading-relaxed">
                {isFr
                  ? `Capacité incluse : ${maxGuests} voyageurs. Jusqu'à ${extraGuestsMax} voyageurs supplémentaires acceptés à ${fmt(extraGuestPricePerNight)}/nuit/personne.`
                  : `Included capacity: ${maxGuests} guests. Up to ${extraGuestsMax} extra guests at ${fmt(extraGuestPricePerNight)}/night/person.`}
              </p>
            )}
          </div>

          {/* Récap pricing */}
          {pricing && (
            <div className="bg-sand-100 border border-bronze-100 rounded-lg p-5 space-y-3">
              <div className="flex justify-between text-sm text-night-500">
                <span className="font-light">{fmt(pricing.nightlyRate)} × {pricing.nights} {isFr ? `nuit${pricing.nights > 1 ? 's' : ''}` : `night${pricing.nights > 1 ? 's' : ''}`}</span>
                <span>{fmt(pricing.accommodationAmount)}</span>
              </div>
              <div className="flex justify-between text-sm text-night-500">
                <span className="font-light">{isFr ? 'Frais de ménage' : 'Cleaning fee'}</span>
                <span>{fmt(pricing.cleaningFee)}</span>
              </div>
              {extraGuestsActive && (
                <div className="flex justify-between text-sm text-night-500">
                  <span className="font-light">
                    {isFr
                      ? `Voyageurs sup. : ${pricing.extraGuestsCount} × ${fmt(extraGuestPricePerNight)} × ${pricing.nights} nuit${pricing.nights > 1 ? 's' : ''}`
                      : `Extra guests: ${pricing.extraGuestsCount} × ${fmt(extraGuestPricePerNight)} × ${pricing.nights} night${pricing.nights > 1 ? 's' : ''}`}
                  </span>
                  <span>{fmt(pricing.extraGuestsAmount)}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-3 border-t border-bronze-200">
                <span className="text-xs uppercase font-medium text-night-600" style={{ letterSpacing: '0.15em' }}>Total</span>
                <span className="font-serif font-light text-2xl text-night-600">{fmt(pricing.bookingTotal)}</span>
              </div>
            </div>
          )}

          {/* Dépôt de garantie — premium visible */}
          {pricing && (
            <div className="bg-cream-50 border border-bronze-200 rounded-lg p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-bronze-500 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                <div className="flex-1">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-xs uppercase font-medium text-bronze-600" style={{ letterSpacing: '0.12em' }}>
                      {isFr ? 'Dépôt de garantie' : 'Security deposit'}
                    </span>
                    <span className="text-base font-serif text-night-600">{fmt(pricing.securityDepositAmount)}</span>
                  </div>
                  <p className="text-xs text-night-400 leading-relaxed font-light">
                    {isFr
                      ? 'Empreinte bancaire prise à l’arrivée par carte bancaire — aucun débit sauf en cas de dégât constaté au départ. Pour les paiements par virement, merci de présenter une carte bancaire à l’arrivée pour l’empreinte.'
                      : 'Card imprint taken on arrival — no charge unless damage is found at check-out. For bank transfer bookings, please present a credit card on arrival for the imprint.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Option de paiement */}
          {pricing && (
            <div>
              <p className="section-label mb-3">{isFr ? 'Modalité' : 'Payment plan'}</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentOption('full')}
                  className={`p-4 rounded-md border text-left transition-all duration-300 ${
                    paymentOption === 'full'
                      ? 'border-bronze-400 bg-bronze-50'
                      : 'border-bronze-100 bg-cream-50 hover:border-bronze-200'
                  }`}
                >
                  <div className="text-[11px] uppercase font-medium text-night-600 mb-1" style={{ letterSpacing: '0.1em' }}>
                    {isFr ? 'Intégral' : 'Pay in full'}
                  </div>
                  <div className="font-serif text-night-600 text-lg">{fmt(pricing.bookingTotal)}</div>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentOption('deposit_40')}
                  className={`p-4 rounded-md border text-left transition-all duration-300 ${
                    paymentOption === 'deposit_40'
                      ? 'border-bronze-400 bg-bronze-50'
                      : 'border-bronze-100 bg-cream-50 hover:border-bronze-200'
                  }`}
                >
                  <div className="text-[11px] uppercase font-medium text-night-600 mb-1" style={{ letterSpacing: '0.1em' }}>
                    {isFr ? 'Acompte 40 %' : '40% deposit'}
                  </div>
                  <div className="font-serif text-night-600 text-lg">{fmt(pricing.depositAmount)}</div>
                </button>
              </div>
              {paymentOption === 'deposit_40' && (
                <p className="text-xs text-night-400 mt-3 font-light">
                  {isFr ? 'Solde :' : 'Balance:'} <span className="text-night-600 font-medium">{fmt(pricing.remainingBalance)}</span>
                  {isFr ? ' — dû avant l’arrivée' : ' — due before arrival'}
                </p>
              )}
            </div>
          )}

          {/* Coordonnées voyageur */}
          {pricing && (
            <div className="space-y-3">
              <p className="section-label">{isFr ? 'Vos coordonnées' : 'Your details'}</p>
              <div>
                <label htmlFor="guest-name" className="sr-only">{isFr ? 'Nom complet' : 'Full name'}</label>
                <input
                  id="guest-name"
                  type="text"
                  placeholder={isFr ? 'Nom complet' : 'Full name'}
                  value={guestName}
                  onChange={e => setGuestName(e.target.value)}
                  className="w-full px-4 py-3 bg-cream-50 border border-bronze-100 rounded-md text-sm text-night-600 placeholder:text-night-300 focus:outline-none focus:border-bronze-400 focus:ring-1 focus:ring-bronze-400 transition-colors"
                />
              </div>
              <div>
                <label htmlFor="guest-email" className="sr-only">Email</label>
                <input
                  id="guest-email"
                  type="email"
                  placeholder={isFr ? 'Adresse email' : 'Email address'}
                  value={guestEmail}
                  onChange={e => setGuestEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-cream-50 border border-bronze-100 rounded-md text-sm text-night-600 placeholder:text-night-300 focus:outline-none focus:border-bronze-400 focus:ring-1 focus:ring-bronze-400 transition-colors"
                />
              </div>
              <div>
                <label htmlFor="guest-message" className="sr-only">{isFr ? 'Message' : 'Message'}</label>
                <textarea
                  id="guest-message"
                  placeholder={isFr ? 'Message (facultatif)' : 'Message (optional)'}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 bg-cream-50 border border-bronze-100 rounded-md text-sm text-night-600 placeholder:text-night-300 focus:outline-none focus:border-bronze-400 focus:ring-1 focus:ring-bronze-400 resize-none transition-colors"
                />
              </div>
            </div>
          )}

          {/* Méthode de paiement */}
          {pricing && canProceed() && (
            <fieldset>
              <legend className="section-label mb-3">{isFr ? 'Mode de paiement' : 'Payment method'}</legend>
              <div className="space-y-2">

                {/* Fygaro — Carte bancaire (via Payment Link hébergé) */}
                {FYGARO_UI_ENABLED ? (
                  <PaymentRadio
                    active={paymentMethod === 'fygaro'}
                    onClick={() => setPaymentMethod('fygaro')}
                    name="payment"
                    value="fygaro"
                    title={isFr ? 'Carte bancaire' : 'Credit / Debit card'}
                    subtitle={isFr ? 'Paiement immédiat sécurisé — Visa, Mastercard, Amex' : 'Instant secure payment — Visa, Mastercard, Amex'}
                    icon={
                      <svg className="w-6 h-4 text-bronze-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <rect x="2" y="6" width="20" height="14" rx="2" strokeWidth={1.5} />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2 10h20M6 15h4" />
                      </svg>
                    }
                  />
                ) : (
                  // Placeholder "Bientôt disponible" tant que Fygaro n'est pas
                  // activé (plan Free Trial ou env NEXT_PUBLIC_FYGARO_ENABLED absente)
                  <div className="w-full p-4 rounded-md border border-bronze-100 bg-cream-50 flex items-center gap-3 opacity-50 cursor-not-allowed" aria-disabled="true">
                    <div className="w-8 h-5 flex items-center justify-center">
                      <svg className="w-6 h-4 text-night-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <rect x="2" y="6" width="20" height="14" rx="2" strokeWidth={1.5} />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2 10h20M6 15h4" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-night-300">{isFr ? 'Carte bancaire' : 'Credit / Debit card'}</div>
                      <div className="text-xs text-night-300 font-light">{isFr ? 'Bientôt disponible' : 'Coming soon'}</div>
                    </div>
                    <span className="text-[10px] uppercase text-night-300 bg-bronze-50 px-2 py-1 rounded" style={{ letterSpacing: '0.15em' }}>
                      {isFr ? 'Bientôt' : 'Soon'}
                    </span>
                  </div>
                )}

                {/* Virement bancaire — toujours dispo */}
                <PaymentRadio
                  active={paymentMethod === 'bank_transfer'}
                  onClick={() => setPaymentMethod('bank_transfer')}
                  name="payment"
                  value="bank_transfer"
                  title={isFr ? 'Virement bancaire (USD)' : 'Bank Transfer (USD)'}
                  subtitle={isFr ? 'Confirmation après réception des fonds' : 'Confirmation upon receipt of funds'}
                  icon={
                    <svg className="w-5 h-5 text-bronze-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  }
                />

                {/* PayPal — masqué en attendant la réouverture du compte */}
                {PAYPAL_UI_ENABLED && (
                  <PaymentRadio
                    active={paymentMethod === 'paypal'}
                    onClick={() => setPaymentMethod('paypal')}
                    name="payment"
                    value="paypal"
                    title="PayPal"
                    subtitle={isFr ? 'Paiement en ligne sécurisé' : 'Secure online payment'}
                    icon={
                      <svg viewBox="0 0 24 24" className="w-6 h-4" fill="none" aria-hidden="true">
                        <path d="M19.5 7.5C19.5 10.5 17.5 13 14 13H12L11 18H8L10 7.5H14C17 7.5 19.5 7.5 19.5 7.5Z" fill="#003087"/>
                        <path d="M21 5C21 8 19 10.5 15.5 10.5H13.5L12.5 15.5H9.5L11.5 5H15.5C18.5 5 21 5 21 5Z" fill="#009CDE"/>
                      </svg>
                    }
                  />
                )}
              </div>
            </fieldset>
          )}

          {/* Cancellation policy — collapsible */}
          {pricing && canProceed() && (
            <button
              type="button"
              onClick={() => setShowCancellation(s => !s)}
              className="w-full flex items-center justify-between py-3 border-y border-bronze-100 text-night-500 hover:text-bronze-500 transition-colors"
              aria-expanded={showCancellation}
            >
              <span className="text-[11px] uppercase font-medium" style={{ letterSpacing: '0.15em' }}>
                {isFr ? 'Conditions d’annulation' : 'Cancellation policy'}
              </span>
              <ChevronDown size={14} className={`transition-transform ${showCancellation ? 'rotate-180' : ''}`} />
            </button>
          )}
          {pricing && canProceed() && showCancellation && (
            <ul className="text-xs text-night-500 space-y-2 font-light leading-relaxed">
              <li>• <span className="text-night-600 font-medium">{isFr ? 'Plus de 30 j avant arrivée :' : 'More than 30 days before arrival:'}</span> {isFr ? 'remboursement possible selon conditions.' : 'refund possible per conditions.'}</li>
              <li>• <span className="text-night-600 font-medium">{isFr ? '30 à 14 j avant arrivée :' : '30–14 days before arrival:'}</span> {isFr ? 'acompte non remboursable.' : 'deposit non-refundable.'}</li>
              <li>• <span className="text-night-600 font-medium">{isFr ? 'Moins de 14 j avant arrivée :' : 'Less than 14 days before arrival:'}</span> {isFr ? 'acompte non remboursable, surplus à discrétion.' : 'deposit non-refundable, surplus at host discretion.'}</li>
              <li>• <span className="text-night-600 font-medium">{isFr ? 'No-show :' : 'No-show:'}</span> {isFr ? 'aucun remboursement.' : 'no refund.'}</li>
              <li>• <span className="text-night-600 font-medium">{isFr ? 'Annulation par l’hôte :' : 'Owner cancellation:'}</span> {isFr ? 'remboursement intégral.' : 'full refund.'}</li>
            </ul>
          )}

          {/* Case à cocher */}
          {pricing && canProceed() && (
            <label className="flex items-start gap-3 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={e => setTermsAccepted(e.target.checked)}
                className="mt-1 w-4 h-4 accent-bronze-500 flex-shrink-0"
              />
              <span className="text-xs text-night-500 leading-relaxed font-light">
                {isFr
                  ? 'J’ai lu et j’accepte les conditions de réservation, d’annulation et de paiement.'
                  : 'I have read and accept the booking, cancellation and payment terms.'}
              </span>
            </label>
          )}

          {/* Erreur */}
          {error && (
            <div className="bg-cream-50 border border-red-200 rounded-md p-3 text-sm text-red-700" role="alert">
              {error}
            </div>
          )}

          {/* Amount due + bouton de paiement */}
          {pricing && canProceed() && termsAccepted && (
            <div className="space-y-4 pt-2">
              {/* Amount due now — visuel prominent */}
              <div className="bg-night-600 text-cream-100 rounded-lg px-6 py-5">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-[11px] uppercase font-medium text-bronze-300" style={{ letterSpacing: '0.15em' }}>
                    {isFr ? 'À régler maintenant' : 'Amount due now'}
                  </span>
                  <span className="font-serif font-light text-3xl text-cream-100">{fmt(amountDue)}</span>
                </div>
                {paymentOption === 'deposit_40' && (
                  <p className="text-[10px] text-bronze-200 mt-2 font-light italic">
                    {isFr ? `Solde restant ${fmt(pricing.remainingBalance)} dû avant l’arrivée` : `Remaining balance ${fmt(pricing.remainingBalance)} due before arrival`}
                  </p>
                )}
              </div>

              {/* Bouton Fygaro : redirect vers Payment Link hébergé */}
              {paymentMethod === 'fygaro' && FYGARO_UI_ENABLED && (
                <button
                  type="button"
                  onClick={handleFygaro}
                  disabled={loading}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-wait"
                >
                  {loading
                    ? (isFr ? 'Redirection…' : 'Redirecting…')
                    : (isFr ? 'Payer par carte' : 'Pay by card')}
                </button>
              )}

              {/* PayPal — rendu conditionné au flag PAYPAL_UI_ENABLED
                  (masqué en attendant la réouverture du compte Chenille) */}
              {PAYPAL_UI_ENABLED && paymentMethod === 'paypal' && PAYPAL_CLIENT_ID ? (
                <PayPalButtons
                  style={{ layout: 'vertical', color: 'gold', shape: 'rect', label: 'pay' }}
                  createOrder={createPayPalOrder}
                  onApprove={async (data) => { await capturePayPalOrder(data.orderID); }}
                  onCancel={cancelPendingBooking}
                  onError={(err) => { setError(String(err)); cancelPendingBooking(); }}
                />
              ) : PAYPAL_UI_ENABLED && paymentMethod === 'paypal' ? (
                <div className="bg-bronze-50 border border-bronze-200 rounded-md p-3 text-sm text-bronze-600 text-center">
                  {isFr
                    ? 'PayPal n’est pas encore configuré. Veuillez utiliser le virement bancaire ou nous contacter.'
                    : 'PayPal not configured yet. Please use bank transfer or contact us.'}
                </div>
              ) : null}

              {paymentMethod === 'bank_transfer' && (
                <button
                  type="button"
                  onClick={handleBankTransfer}
                  disabled={loading}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-wait"
                >
                  {loading
                    ? (isFr ? 'Traitement…' : 'Processing…')
                    : (isFr ? 'Demander la réservation' : 'Request booking')}
                </button>
              )}
            </div>
          )}

          {/* CTA si pas de dates */}
          {!pricing && (
            <p className="text-xs text-night-400 text-center font-light pt-2">
              {isFr ? 'Sélectionnez vos dates pour voir les tarifs' : 'Select your dates to see pricing'}
            </p>
          )}
        </div>

        {/* ── Footer : réassurance ────────────────────────────────── */}
        <div className="px-8 py-5 border-t border-bronze-100 bg-sand-100 rounded-b-2xl">
          <div className="flex items-center justify-between gap-4 text-[11px] text-night-500">
            <div className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-bronze-400" />
              <span className="font-light">{isFr ? 'Paiement sécurisé' : 'Secure payment'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-bronze-400" />
              <span className="font-light">{isFr ? 'Réponse < 2 h' : 'Reply < 2 h'}</span>
            </div>
          </div>
        </div>
      </div>
    </PayPalScriptProvider>
  );
}

function PaymentRadio({
  active, onClick, name, value, title, subtitle, icon,
}: {
  active: boolean;
  onClick: () => void;
  name: string;
  value: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <label
      onClick={onClick}
      className={`w-full p-4 rounded-md border flex items-center gap-3 cursor-pointer transition-all duration-300 ${
        active
          ? 'border-bronze-400 bg-bronze-50'
          : 'border-bronze-100 bg-cream-50 hover:border-bronze-200'
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={active}
        onChange={onClick}
        className="sr-only"
      />
      <div className="w-8 h-5 flex items-center justify-center">{icon}</div>
      <div className="flex-1">
        <div className="text-sm font-medium text-night-600">{title}</div>
        <div className="text-xs text-night-400 font-light">{subtitle}</div>
      </div>
      <div className={`w-4 h-4 rounded-full border-2 transition-colors ${active ? 'border-bronze-500 bg-bronze-500' : 'border-bronze-200'}`} aria-hidden="true">
        {active && <div className="w-1.5 h-1.5 bg-cream-100 rounded-full m-auto mt-[3px]" />}
      </div>
    </label>
  );
}
