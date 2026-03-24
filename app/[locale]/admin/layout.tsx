'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { LayoutDashboard, Home, Calendar, LogOut, Menu, X } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const [isAuth, setIsAuth] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem('admin_auth');
    if (!auth) {
      router.push(`/${locale}/admin-login`);
    } else {
      setIsAuth(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('admin_auth');
    router.push(`/${locale}/admin-login`);
  };

  if (!isAuth) return null;

  const navItems = [
    { href: `/${locale}/admin/dashboard`, icon: <LayoutDashboard size={18} />, label: locale === 'fr' ? 'Tableau de bord' : 'Dashboard' },
    { href: `/${locale}/admin/apartments`, icon: <Home size={18} />, label: locale === 'fr' ? 'Appartements' : 'Apartments' },
    { href: `/${locale}/admin/bookings`, icon: <Calendar size={18} />, label: locale === 'fr' ? 'Réservations' : 'Bookings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-primary-900 text-white transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:flex-shrink-0`}>
        <div className="flex items-center justify-between p-6 border-b border-primary-700">
          <div>
            <div className="font-bold text-lg">StMartin</div>
            <div className="text-primary-300 text-xs">Administration</div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-primary-300 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium
                ${pathname === item.href ? 'bg-primary-700 text-white' : 'text-primary-200 hover:bg-primary-800 hover:text-white'}`}>
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-primary-700 absolute bottom-0 left-0 right-0">
          <Link href={`/${locale}`}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-primary-200 hover:bg-primary-800 hover:text-white text-sm font-medium mb-2">
            <Home size={18} />
            {locale === 'fr' ? 'Voir le site' : 'View site'}
          </Link>
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-300 hover:bg-red-900/30 hover:text-red-200 text-sm font-medium w-full">
            <LogOut size={18} />
            {locale === 'fr' ? 'Déconnexion' : 'Logout'}
          </button>
        </div>
      </aside>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-500 hover:text-gray-700">
            <Menu size={22} />
          </button>
          <span className="font-semibold text-gray-900">Administration</span>
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
