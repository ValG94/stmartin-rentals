'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Users, MessageCircle } from 'lucide-react';

interface BookingFormProps {
  apartmentName: string;
  pricePerNight: number;   // Prix actif en USD
  basePrice?: number;      // Prix de base en USD (barré si différent)
  minPrice?: number;       // Prix minimum toutes saisons
  slug: string;
  locale: string;
  eurRate: number;         // Taux USD→EUR (passé depuis le serveur)
}

export default function BookingForm({
  apartmentName,
  pricePerNight,
  basePrice,
  slug,
  locale,
  eurRate,
}: BookingFormProps) {
  const t = useTranslations('booking');
  const isFr = locale === 'fr';

  // Formatage des prix selon la locale (calculé côté client)
  const fmt = (usd: number) =>
    isFr
      ? `${Math.round(usd * eurRate).toLocaleString('fr-FR')} €`
      : `$${usd.toLocaleString('en-US')}`;

  const [form, setForm] = useState({
    checkIn: '',
    checkOut: '',
    guests: 2,
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const nights =
    form.checkIn && form.checkOut
      ? Math.max(
          0,
          Math.ceil(
            (new Date(form.checkOut).getTime() - new Date(form.checkIn).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        )
      : 0;

  const totalUsd = nights * pricePerNight;
  const isSeasonalPrice = basePrice !== undefined && basePrice !== pricePerNight;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const msg = encodeURIComponent(
      `Bonjour, je souhaite réserver ${apartmentName}.\n` +
        `Arrivée: ${form.checkIn}\nDépart: ${form.checkOut}\n` +
        `Voyageurs: ${form.guests}\nNom: ${form.name}\nEmail: ${form.email}\n` +
        (form.message ? `Message: ${form.message}` : '')
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
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-3xl font-bold text-primary-600">
          {fmt(pricePerNight)}
        </span>
        <span className="text-gray-400 text-sm">/ {t('night')}</span>
        {isSeasonalPrice && basePrice && (
          <span className="text-sm text-gray-400 line-through">
            {fmt(basePrice)}
          </span>
        )}
      </div>

      {/* Indication de conversion si locale FR */}
      {isFr && (
        <p className="text-xs text-gray-400 mb-3">
          Taux appliqué : 1 $ = {eurRate.toFixed(4)} €
        </p>
      )}

      {isSeasonalPrice && (
        <div className="mb-4 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 font-medium">
          {isFr ? '✨ Tarif saisonnier en vigueur' : '✨ Seasonal rate in effect'}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              {t('check_in')}
            </label>
            <input
              type="date"
              required
              min={new Date().toISOString().split('T')[0]}
              value={form.checkIn}
              onChange={(e) => setForm({ ...form, checkIn: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              {t('check_out')}
            </label>
            <input
              type="date"
              required
              min={form.checkIn || new Date().toISOString().split('T')[0]}
              value={form.checkOut}
              onChange={(e) => setForm({ ...form, checkOut: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </div>
        </div>

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
              value={form.guests}
              onChange={(e) => setForm({ ...form, guests: parseInt(e.target.value) })}
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
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder={t('name_placeholder')}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
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
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder={t('email_placeholder')}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
        </div>

        {/* Message */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            {t('message')} ({t('optional')})
          </label>
          <textarea
            rows={3}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder={t('message_placeholder')}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none"
          />
        </div>

        {/* Récapitulatif */}
        {nights > 0 && (
          <div className="bg-primary-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>{fmt(pricePerNight)} × {nights} {t('nights')}</span>
              <span>{fmt(totalUsd)}</span>
            </div>
            {isFr && (
              <div className="flex justify-between text-xs text-gray-400">
                <span>${pricePerNight.toLocaleString('en-US')} × {nights} nuits</span>
                <span>${totalUsd.toLocaleString('en-US')}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-primary-100">
              <span>{t('total')}</span>
              <span>{fmt(totalUsd)}</span>
            </div>
          </div>
        )}

        {/* Bouton */}
        <button
          type="submit"
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <MessageCircle size={18} />
          {t('book_whatsapp')}
        </button>

        <p className="text-center text-xs text-gray-400">{t('no_charge')}</p>
      </form>
    </div>
  );
}
