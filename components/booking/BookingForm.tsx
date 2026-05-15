'use client';

import { useState, useEffect } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { calculatePricing, formatUSD } from '@/lib/services/pricing';
import DateRangePicker from './DateRangePicker';

interface BookingFormProps {
  apartmentId: string;
  apartmentSlug: string;
  apartmentName: string;
  nightlyRate: number;
  maxGuests: number;
  eurRate?: number;
  locale?: string;
}

type PaymentMethod = 'paypal' | 'bank_transfer';
type PaymentOption = 'full' | 'deposit_40';
type Step = 'dates' | 'details' | 'payment';

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '';

export default function BookingForm({
  apartmentId,
  apartmentSlug,
  apartmentName,
  nightlyRate,
  maxGuests,
  eurRate,
  locale = 'en',
}: BookingFormProps) {
  const [step, setStep] = useState<Step>('dates');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [message, setMessage] = useState('');
  const [paymentOption, setPaymentOption] = useState<PaymentOption>('full');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('paypal');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [bankTransferDone, setBankTransferDone] = useState(false);

  const pricing = checkIn && checkOut ? (() => {
    try { return calculatePricing(apartmentSlug, checkIn, checkOut, nightlyRate); }
    catch { return null; }
  })() : null;

  const amountDue = pricing
    ? (paymentOption === 'full' ? pricing.bookingTotal : pricing.depositAmount)
    : 0;

  function fmt(amount: number): string {
    if (locale === 'fr' && eurRate) {
      return `${Math.round(amount * eurRate).toLocaleString('fr-FR')} €`;
    }
    return formatUSD(amount);
  }

  function handleDatesSelected(ci: string, co: string) {
    setCheckIn(ci);
    setCheckOut(co);
  }

  function canProceedToDetails() {
    return checkIn && checkOut && pricing && pricing.nights > 0;
  }

  function canProceedToPayment() {
    return guestName.trim() && guestEmail.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail);
  }

  // ── Virement bancaire ─────────────────────────────────────────────────
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
          apartmentSlug,
          checkIn,
          checkOut,
          guests,
          guestName,
          guestEmail,
          nights: pricing.nights,
          accommodationAmount: pricing.accommodationAmount,
          cleaningFee: pricing.cleaningFee,
          bookingTotal: pricing.bookingTotal,
          paymentOption,
          depositAmount: pricing.depositAmount,
          remainingBalance: pricing.remainingBalance,
          securityDepositAmount: pricing.securityDepositAmount,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error creating booking');
      setBookingId(data.bookingId);
      setBankTransferDone(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  // ── PayPal create order ───────────────────────────────────────────────
  async function createPayPalOrder() {
    if (!pricing) throw new Error('No pricing');
    const res = await fetch('/api/paypal/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apartmentId,
        apartmentSlug,
        checkIn,
        checkOut,
        guests,
        guestName,
        guestEmail,
        nightlyRate,
        nights: pricing.nights,
        accommodationAmount: pricing.accommodationAmount,
        cleaningFee: pricing.cleaningFee,
        bookingTotal: pricing.bookingTotal,
        paymentOption,
        depositAmount: pricing.depositAmount,
        remainingBalance: pricing.remainingBalance,
        securityDepositAmount: pricing.securityDepositAmount,
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
    window.location.href = `/en/booking/paypal-success?bookingId=${bookingId}`;
  }

  // ── Confirmation virement ─────────────────────────────────────────────
  if (bankTransferDone) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="text-center py-4">
          <div className="w-12 h-12 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Booking Request Received</h3>
          <p className="text-sm text-gray-600 mb-4">
            Your booking request has been received. Please complete your bank transfer to confirm your reservation.
            Wire transfer instructions have been sent to <strong>{guestEmail}</strong>.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded p-3 text-left text-sm text-amber-800">
            <p className="font-medium mb-1">⚠️ Important</p>
            <p>Your reservation will only be confirmed after receipt of funds. Dates are held for 48 hours.</p>
          </div>
          <p className="text-xs text-gray-400 mt-4">Booking reference: {bookingId}</p>
        </div>
      </div>
    );
  }

  return (
    <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID || 'test', currency: 'USD', intent: 'capture' }}>
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">

        {/* Prix en-tête */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-gray-900">{fmt(nightlyRate)}</span>
            <span className="text-sm text-gray-500">/ night</span>
          </div>
          {locale === 'fr' && eurRate && (
            <p className="text-xs text-gray-400 mt-1">Rate: 1 USD = {eurRate.toFixed(4)} EUR</p>
          )}
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* ── ÉTAPE 1 : Dates ── */}
          <div>
            <DateRangePicker
              apartmentId={apartmentId}
              checkIn={checkIn}
              checkOut={checkOut}
              onCheckInChange={(d) => { setCheckIn(d); }}
              onCheckOutChange={(d) => { setCheckOut(d); if (checkIn && d) handleDatesSelected(checkIn, d); }}
              locale={locale}
            />
          </div>

          {/* Nombre de voyageurs */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Guests</label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <input
                type="number"
                min={1}
                max={maxGuests}
                value={guests}
                onChange={e => setGuests(Number(e.target.value))}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* ── Récapitulatif pricing ── */}
          {pricing && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>{fmt(nightlyRate)} × {pricing.nights} night{pricing.nights > 1 ? 's' : ''}</span>
                <span>{fmt(pricing.accommodationAmount)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Cleaning fee</span>
                <span>{fmt(pricing.cleaningFee)}</span>
              </div>
              <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t border-gray-200">
                <span>Total</span>
                <span>{fmt(pricing.bookingTotal)}</span>
              </div>
              <div className="flex justify-between text-gray-400 text-xs italic pt-1">
                <span>Security deposit (on arrival)</span>
                <span>{fmt(pricing.securityDepositAmount)}</span>
              </div>
              <p className="text-xs text-gray-400 italic leading-relaxed">
                Security deposit due on arrival, payable in cash or by card. Refunded within 48 hours after check-out if no damage is found.
              </p>
            </div>
          )}

          {/* ── Option de paiement ── */}
          {pricing && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Payment option</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPaymentOption('full')}
                  className={`p-3 rounded border text-sm text-left transition-all ${paymentOption === 'full' ? 'border-amber-500 bg-amber-50 text-amber-900' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                >
                  <div className="font-semibold">Pay in full</div>
                  <div className="text-xs mt-0.5">{fmt(pricing.bookingTotal)}</div>
                </button>
                <button
                  onClick={() => setPaymentOption('deposit_40')}
                  className={`p-3 rounded border text-sm text-left transition-all ${paymentOption === 'deposit_40' ? 'border-amber-500 bg-amber-50 text-amber-900' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                >
                  <div className="font-semibold">Pay 40% deposit</div>
                  <div className="text-xs mt-0.5">{fmt(pricing.depositAmount)} now</div>
                </button>
              </div>
              {paymentOption === 'deposit_40' && (
                <p className="text-xs text-gray-400 mt-2">
                  Remaining balance: <strong>{fmt(pricing.remainingBalance)}</strong> — due before arrival
                </p>
              )}
            </div>
          )}

          {/* ── Informations voyageur ── */}
          {pricing && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Guest information</label>
              <input
                type="text"
                placeholder="Full name"
                value={guestName}
                onChange={e => setGuestName(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-amber-400"
              />
              <input
                type="email"
                placeholder="Email address"
                value={guestEmail}
                onChange={e => setGuestEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-amber-400"
              />
              <textarea
                placeholder="Message (optional)"
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={2}
                className="w-full px-4 py-2.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-amber-400 resize-none"
              />
            </div>
          )}

          {/* ── Méthode de paiement ── */}
          {pricing && canProceedToPayment() && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Payment method</label>
              <div className="space-y-2">
                {/* PayPal */}
                <button
                  onClick={() => setPaymentMethod('paypal')}
                  className={`w-full p-3 rounded border text-sm text-left flex items-center gap-3 transition-all ${paymentMethod === 'paypal' ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className="w-8 h-5 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-6 h-4" fill="none">
                      <path d="M19.5 7.5C19.5 10.5 17.5 13 14 13H12L11 18H8L10 7.5H14C17 7.5 19.5 7.5 19.5 7.5Z" fill="#003087"/>
                      <path d="M21 5C21 8 19 10.5 15.5 10.5H13.5L12.5 15.5H9.5L11.5 5H15.5C18.5 5 21 5 21 5Z" fill="#009CDE"/>
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">PayPal</div>
                    <div className="text-xs text-gray-400">Secure online payment</div>
                  </div>
                </button>

                {/* Virement bancaire */}
                <button
                  onClick={() => setPaymentMethod('bank_transfer')}
                  className={`w-full p-3 rounded border text-sm text-left flex items-center gap-3 transition-all ${paymentMethod === 'bank_transfer' ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className="w-8 h-5 flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">Bank Transfer (USD)</div>
                    <div className="text-xs text-gray-400">Wire transfer — confirmation after receipt</div>
                  </div>
                </button>

                {/* Stripe — Coming soon */}
                <div className="w-full p-3 rounded border border-gray-100 text-sm flex items-center gap-3 opacity-50 cursor-not-allowed bg-gray-50">
                  <div className="w-8 h-5 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-6 h-4" fill="#635BFF">
                      <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-gray-400">Stripe</div>
                    <div className="text-xs text-gray-300">Coming soon</div>
                  </div>
                  <span className="ml-auto text-xs bg-gray-200 text-gray-400 px-2 py-0.5 rounded-full">Soon</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Conditions d'annulation ── */}
          {pricing && canProceedToPayment() && (
            <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-500 space-y-1 border border-gray-100">
              <p className="font-semibold text-gray-700 mb-2">Cancellation Policy</p>
              <p>• <strong>More than 30 days before arrival:</strong> refund possible per conditions</p>
              <p>• <strong>30–14 days before arrival:</strong> deposit non-refundable</p>
              <p>• <strong>Less than 14 days before arrival:</strong> deposit non-refundable; any surplus at owner's discretion</p>
              <p>• <strong>No-show:</strong> no refund</p>
              <p>• <strong>Owner cancellation:</strong> full refund</p>
            </div>
          )}

          {/* ── Case à cocher obligatoire ── */}
          {pricing && canProceedToPayment() && (
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={e => setTermsAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-amber-600 flex-shrink-0"
              />
              <span className="text-xs text-gray-500 leading-relaxed">
                I have read and accept the booking, cancellation and payment terms.
              </span>
            </label>
          )}

          {/* ── Erreur ── */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* ── Boutons de paiement ── */}
          {pricing && canProceedToPayment() && termsAccepted && (
            <div className="space-y-3">
              {/* Montant à payer */}
              <div className="flex justify-between items-center text-sm font-semibold text-gray-900 bg-amber-50 rounded px-4 py-3 border border-amber-200">
                <span>Amount due now</span>
                <span className="text-amber-700 text-base">{fmt(amountDue)}</span>
              </div>

              {paymentMethod === 'paypal' && PAYPAL_CLIENT_ID ? (
                <PayPalButtons
                  style={{ layout: 'vertical', color: 'gold', shape: 'rect', label: 'pay' }}
                  createOrder={createPayPalOrder}
                  onApprove={async (data) => {
                    await capturePayPalOrder(data.orderID);
                  }}
                  onError={(err) => setError(String(err))}
                />
              ) : paymentMethod === 'paypal' ? (
                <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm text-amber-700 text-center">
                  PayPal not configured yet. Please use bank transfer or contact us directly.
                </div>
              ) : null}

              {paymentMethod === 'bank_transfer' && (
                <button
                  onClick={handleBankTransfer}
                  disabled={loading}
                  className="w-full bg-gray-900 text-white py-3 rounded text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Request booking via bank transfer'}
                </button>
              )}
            </div>
          )}

          {/* ── CTA si pas de dates ── */}
          {!pricing && (
            <p className="text-xs text-gray-400 text-center">Select your dates to see pricing</p>
          )}

        </div>
      </div>
    </PayPalScriptProvider>
  );
}
