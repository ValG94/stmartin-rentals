'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { Home, Calendar, TrendingUp } from 'lucide-react';
import { MOCK_APARTMENTS as apartments, MOCK_BOOKINGS as bookings } from '@/lib/mock-data';

export default function AdminDashboard() {
  const locale = useLocale();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const totalRevenue = bookings.reduce((sum, b) => sum + b.total_amount, 0);
  const confirmedBookings = bookings.filter(b => b.booking_status === 'confirmed').length;

  const stats = [
    { label: locale === 'fr' ? 'Appartements' : 'Apartments', value: apartments.length, icon: <Home size={22} />, color: 'bg-blue-500' },
    { label: locale === 'fr' ? 'Réservations' : 'Bookings', value: bookings.length, icon: <Calendar size={22} />, color: 'bg-green-500' },
    { label: locale === 'fr' ? 'Confirmées' : 'Confirmed', value: confirmedBookings, icon: <TrendingUp size={22} />, color: 'bg-primary-500' },
    { label: locale === 'fr' ? 'Revenus (€)' : 'Revenue (€)', value: totalRevenue.toLocaleString(), icon: <TrendingUp size={22} />, color: 'bg-amber-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        {locale === 'fr' ? 'Tableau de bord' : 'Dashboard'}
      </h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 shadow-sm">
            <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center text-white mb-3`}>
              {stat.icon}
            </div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="font-bold text-gray-900 text-lg mb-4">
          {locale === 'fr' ? 'Dernières réservations' : 'Recent bookings'}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="pb-3 font-medium">{locale === 'fr' ? 'Client' : 'Guest'}</th>
                <th className="pb-3 font-medium">{locale === 'fr' ? 'Appartement' : 'Apartment'}</th>
                <th className="pb-3 font-medium">{locale === 'fr' ? 'Arrivée' : 'Check-in'}</th>
                <th className="pb-3 font-medium">{locale === 'fr' ? 'Départ' : 'Check-out'}</th>
                <th className="pb-3 font-medium">Total</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="py-3 font-medium text-gray-900">{b.guest_name}</td>
                  <td className="py-3 text-gray-600">{b.apartment_id}</td>
                  <td className="py-3 text-gray-600">{b.check_in}</td>
                  <td className="py-3 text-gray-600">{b.check_out}</td>
                  <td className="py-3 font-semibold text-gray-900">{b.total_amount}€</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium
                      ${b.booking_status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        b.booking_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'}`}>
                      {b.booking_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
