'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import {
  LayoutDashboard, Home, Calendar, LogOut, Menu, X,
  ExternalLink, ChevronRight
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const { isAuthenticated, isLoading, logout } = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/${locale}/admin-login`);
    }
  }, [isLoading, isAuthenticated, locale, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0D1B2A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#B08B52] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const navItems = [
    {
      href: `/${locale}/admin/dashboard`,
      icon: <LayoutDashboard size={17} />,
      label: locale === 'fr' ? 'Tableau de bord' : 'Dashboard',
      exact: true,
    },
    {
      href: `/${locale}/admin/apartments`,
      icon: <Home size={17} />,
      label: locale === 'fr' ? 'Mes Villas' : 'My Villas',
      exact: false,
    },
    {
      href: `/${locale}/admin/bookings`,
      icon: <Calendar size={17} />,
      label: locale === 'fr' ? 'Réservations' : 'Bookings',
      exact: false,
    },
  ];

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const SidebarInner = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/10">
        <div className="font-serif font-light text-white text-xl tracking-wider">
          StMartin Rentals
        </div>
        <div className="font-sans text-xs text-[#B08B52] mt-1 uppercase tracking-[0.2em]">
          Administration
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        <p className="font-sans text-xs text-white/30 uppercase px-3 mb-3 tracking-[0.15em]">
          Menu
        </p>
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center justify-between px-4 py-3 transition-all duration-200 rounded-lg ${
                active
                  ? 'bg-[#B08B52]/20 text-[#B08B52] border-l-2 border-[#B08B52]'
                  : 'text-white/60 hover:text-white hover:bg-white/5 border-l-2 border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span className="font-sans text-sm font-medium">{item.label}</span>
              </div>
              {active && <ChevronRight size={14} className="text-[#B08B52]" />}
            </Link>
          );
        })}
      </nav>

      {/* Bas de sidebar */}
      <div className="px-3 py-4 border-t border-white/10 space-y-1">
        <Link
          href={`/${locale}`}
          target="_blank"
          className="flex items-center gap-3 px-4 py-3 text-white/40 hover:text-white/70 hover:bg-white/5 transition-all text-sm rounded-lg"
        >
          <ExternalLink size={16} />
          <span className="font-sans">{locale === 'fr' ? 'Voir le site' : 'View site'}</span>
        </Link>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 text-red-400/70 hover:text-red-300 hover:bg-red-900/20 transition-all text-sm w-full rounded-lg"
        >
          <LogOut size={16} />
          <span className="font-sans">{locale === 'fr' ? 'Déconnexion' : 'Logout'}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ── Sidebar desktop : toujours visible ── */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#0D1B2A] flex-shrink-0 min-h-screen sticky top-0">
        <SidebarInner />
      </aside>

      {/* ── Sidebar mobile : overlay ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-[#0D1B2A] flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
              <span className="font-serif text-white text-lg">Administration</span>
              <button onClick={() => setSidebarOpen(false)} className="text-white/50 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <SidebarInner />
          </aside>
        </div>
      )}

      {/* ── Contenu principal ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header mobile */}
        <header className="lg:hidden bg-[#0D1B2A] text-white px-5 py-4 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white/60 hover:text-white"
          >
            <Menu size={22} />
          </button>
          <span className="font-serif text-lg font-light">Administration</span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
