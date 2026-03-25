'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Users, MessageCircle, CreditCard, Wallet } from 'lucide-react';
import DateRangePicker from './DateRangePicker';

interface BookingFormProps {
  apartmentName: string;
  apartmentId: string;
  pricePerNight: number;   // Prix actif en USD
  basePrice?: number;      // Prix de base en USD (barré si différent)
  minPrice?: number;
  slug: string;
  locale: string;
  eurRate: number;         // Taux USD→EUR
}

export default function BookingForm({
  apartmentName,
  apartmentId,
  pricePerNight,
  basePrice,
  locale,
  eurRate,
}: BookingFormProps) {
  const t = useTranslations('booking');
  const isFr = locale === 'fr';

  const fmt = (usd: number) =>
    isFr
      ? `${Math.round(usd * eurRate).toLocaleString('fr-FR')} €`
      : `$${usd.toLocaleString('en-US')}`;

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const nights =
    checkIn && checkOut
      ? Math.max(0, Math.round(
          (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000
        ))
      : 0;

  const totalUsd = nights * pricePerNight;
  const isSeasonalPrice = basePrice !== undefined && basePrice !== pricePerNight;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkIn || !checkOut) return;
    const msg = encodeURIComponent(
      `Bonjour, je souhaite réserver ${apartmentName}.\n` +
      `Arrivée: ${checkIn}\nDépart: ${checkOut}\n` +
      `Voyageurs: ${guests}\nNom: ${name}\nEmail: ${email}\n` +
      (message ? `Message: ${message}` : '')
    );
    window.open(`https://wa.me/590690XXXXXX?text=${msg}`, '_blank');
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
        <div className="text-4xl mb-3">✅</div>
        <h3 className="font-bold text-green-800 text-lg mb-2">{t('success_title')}</h3>
        <p className="text-green-700 text-sm">{t('success_message')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-24">
      {/* Prix affiché */}
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-3xl font-bold text-gray-900">
          {fmt(pricePerNight)}
        </span>
        <span className="text-gray-400 text-sm">/ {t('night')}</span>
        {isSeasonalPrice && basePrice && (
          <span className="text-sm text-gray-400 line-through">{fmt(basePrice)}</span>
        )}
      </div>

      {isFr && (
        <p className="text-xs text-gray-400 mb-3">
          1 $ = {eurRate.toFixed(4)} €
        </p>
      )}

      {isSeasonalPrice && (
        <div className="mb-4 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 font-medium">
          ✨ {isFr ? 'Tarif saisonnier en vigueur' : 'Seasonal rate in effect'}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Calendrier dynamique */}
        <DateRangePicker
          checkIn={checkIn}
          checkOut={checkOut}
          onCheckInChange={setCheckIn}
          onCheckOutChange={setCheckOut}
          apartmentId={apartmentId}
          locale={locale}
        />

        {/* Voyageurs */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            {t('guests')}
          </label>
          <div className="flex items-center gap-3 border border-gray-200 rounded-xl px-3 py-2.5">
            <Users size={16} className="text-gray-400" />
            <input
              type="number"
              min={1}
              max={20}
              value={guests}
              onChange={(e) => setGuests(parseInt(e.target.value))}
              className="flex-1 text-sm focus:outline-none"
            />
          </div>
        </div>

        {/* Nom */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            {t('name')}
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('name_placeholder')}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B08B52]/30 focus:border-[#B08B52]"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            {t('email')}
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('email_placeholder')}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B08B52]/30 focus:border-[#B08B52]"
          />
        </div>

        {/* Message */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            {t('message')} ({t('optional')})
          </label>
          <textarea
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('message_placeholder')}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B08B52]/30 focus:border-[#B08B52] resize-none"
          />
        </div>

        {/* Récapitulatif */}
        {nights > 0 && (
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm border border-gray-100">
            <div className="flex justify-between text-gray-600">
              <span>{fmt(pricePerNight)} × {nights} {isFr ? (nights > 1 ? 'nuits' : 'nuit') : (nights > 1 ? 'nights' : 'night')}</span>
              <span>{fmt(totalUsd)}</span>
            </div>
            {isFr && (
              <div className="flex justify-between text-xs text-gray-400">
                <span>${pricePerNight.toLocaleString('en-US')} × {nights} nights</span>
                <span>${totalUsd.toLocaleString('en-US')}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-200">
              <span>{t('total')}</span>
              <span>{fmt(totalUsd)}</span>
            </div>
          </div>
        )}

        {/* Bouton WhatsApp (principal) */}
        <button
          type="submit"
          disabled={!checkIn || !checkOut}
          className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <MessageCircle size={18} />
          {t('book_whatsapp')}
        </button>

        {/* Séparateur paiement en ligne (à venir) */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-2 text-gray-400">
              {isFr ? 'ou payer en ligne' : 'or pay online'}
            </span>
          </div>
        </div>

        {/* Boutons paiement (désactivés — à brancher) */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled
            title={isFr ? 'Bientôt disponible' : 'Coming soon'}
            className="flex items-center justify-center gap-2 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-400 cursor-not-allowed bg-gray-50"
          >
            <CreditCard size={16} />
            Stripe
          </button>
          <button
            type="button"
            disabled
            title={isFr ? 'Bientôt disponible' : 'Coming soon'}
            className="flex items-center justify-center gap-2 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-400 cursor-not-allowed bg-gray-50"
          >
            <Wallet size={16} />
            PayPal
          </button>
        </div>

        <p className="text-center text-xs text-gray-400">{t('no_charge')}</p>
      </form>
    </div>
  );
}
