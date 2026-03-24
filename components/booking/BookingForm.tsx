'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Calendar, Users, MessageCircle } from 'lucide-react';

interface BookingFormProps {
  apartmentName: string;
  pricePerNight: number;
  slug: string;
}

export default function BookingForm({ apartmentName, pricePerNight, slug }: BookingFormProps) {
  const t = useTranslations('booking');
  const locale = useLocale();

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

  const total = nights * pricePerNight;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Construction du message WhatsApp
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
      <div className="flex items-baseline gap-1 mb-6">
        <span className="text-3xl font-bold text-primary-600">{pricePerNight}€</span>
        <span className="text-gray-400 text-sm">/ {t('night')}</span>
      </div>

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
              max={12}
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
              <span>{pricePerNight}€ × {nights} {t('nights')}</span>
              <span>{pricePerNight * nights}€</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-primary-100">
              <span>{t('total')}</span>
              <span>{total}€</span>
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
