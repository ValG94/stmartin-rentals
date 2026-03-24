'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { MOCK_BOOKINGS as bookings } from '@/lib/mock-data';
import { Check, X, Clock, Phone, Mail } from 'lucide-react';

export default function AdminBookingsPage() {
  const locale = useLocale();
  const [filter, setFilter] = useState('all');
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.booking_status === filter);

  const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    confirmed: { label: locale === 'fr' ? 'Confirmée' : 'Confirmed', color: 'bg-green-100 text-green-700', icon: <Check size={14} /> },
    pending: { label: locale === 'fr' ? 'En attente' : 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: <Clock size={14} /> },
    cancelled: { label: locale === 'fr' ? 'Annulée' : 'Cancelled', color: 'bg-red-100 text-red-700', icon: <X size={14} /> },
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {locale === 'fr' ? 'Réservations' : 'Bookings'}
        </h1>
        <div className="flex gap-2 flex-wrap">
          {['all', 'confirmed', 'pending', 'cancelled'].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${filter === f ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}>
              {f === 'all' ? (locale === 'fr' ? 'Toutes' : 'All') : statusConfig[f]?.label}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        {filtered.map((booking) => {
          const status = statusConfig[booking.booking_status];
          return (
            <div key={booking.id} className="bg-white rounded-2xl shadow-sm p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-gray-900 text-lg">{booking.guest_name}</h3>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${status?.color}`}>
                      {status?.icon}
                      {status?.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600">
                    <div>
                      <div className="text-xs text-gray-400 mb-0.5">{locale === 'fr' ? 'Appartement' : 'Apartment'}</div>
                      <div className="font-medium">{booking.apartment_id}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-0.5">{locale === 'fr' ? 'Arrivée' : 'Check-in'}</div>
                      <div className="font-medium">{booking.check_in}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-0.5">{locale === 'fr' ? 'Départ' : 'Check-out'}</div>
                      <div className="font-medium">{booking.check_out}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-0.5">{locale === 'fr' ? 'Voyageurs' : 'Guests'}</div>
                      <div className="font-medium">{booking.guests_count} {locale === 'fr' ? 'pers.' : 'pax'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1"><Mail size={13} /> {booking.guest_email}</span>
                    <span className="flex items-center gap-1"><Phone size={13} /> {booking.guest_phone}</span>
                  </div>
                </div>
                <div className="text-right md:ml-4">
                  <div className="text-2xl font-bold text-gray-900">{booking.total_amount}€</div>
                  <div className="text-xs text-gray-400 mt-1">{booking.nights} {locale === 'fr' ? 'nuits' : 'nights'}</div>
                  {booking.booking_status === 'pending' && (
                    <div className="flex gap-2 mt-3">
                      <button className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700">
                        {locale === 'fr' ? 'Confirmer' : 'Confirm'}
                      </button>
                      <button className="px-3 py-1.5 bg-red-100 text-red-600 text-xs font-medium rounded-lg hover:bg-red-200">
                        {locale === 'fr' ? 'Refuser' : 'Decline'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
