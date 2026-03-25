'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, Lock } from 'lucide-react';

export default function Header() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const otherLocale = locale === 'fr' ? 'en' : 'fr';
  const isHome = pathname === `/${locale}` || pathname === `/${locale}/`;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const switchLanguage = () => {
    const newPath = pathname.replace(`/${locale}`, `/${otherLocale}`);
    router.push(newPath);
  };

  const navLinks = [
    { href: `/${locale}`, label: t('home') },
    { href: `/${locale}/apartments`, label: t('apartments') },
    { href: `/${locale}/contact`, label: t('contact') },
  ];

  const transparent = isHome && !scrolled;
  const headerBg = transparent ? 'bg-transparent' : 'bg-cream-50/98 backdrop-blur-md shadow-sm';
  const textColor = transparent ? 'text-white' : 'text-night-600';
  const hoverColor = transparent ? 'hover:text-sand-300' : 'hover:text-bronze-400';

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${headerBg}`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex items-center justify-between h-20">

            {/* Logo */}
            <Link href={`/${locale}`} className={`flex items-center gap-3 transition-colors duration-300 ${textColor}`}>
              <div className={`w-9 h-9 flex items-center justify-center border transition-colors duration-300 ${transparent ? 'border-white/60' : 'border-night-600'}`}>
                <span className="font-serif text-sm font-light" style={{letterSpacing:'0.15em'}}>SM</span>
              </div>
              <div className="hidden sm:block">
                <div className="font-serif font-light text-lg leading-none" style={{letterSpacing:'0.08em'}}>StMartin Rentals</div>
                <div className={`font-sans text-xs font-light mt-0.5 transition-colors duration-300 ${transparent ? 'text-white/60' : 'text-bronze-400'}`} style={{letterSpacing:'0.2em'}}>SAINT-MARTIN</div>
              </div>
            </Link>

            {/* Navigation desktop */}
            <nav className="hidden md:flex items-center gap-10">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link key={link.href} href={link.href}
                    className={`font-sans text-xs font-medium transition-colors duration-300 relative group uppercase ${textColor} ${hoverColor}`}
                    style={{letterSpacing:'0.15em'}}>
                    {link.label}
                    <span className={`absolute -bottom-1 left-0 h-px bg-bronze-400 transition-all duration-500 ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`} />
                  </Link>
                );
              })}
            </nav>

            {/* Actions droite */}
            <div className="flex items-center gap-4">
              <button onClick={switchLanguage}
                className={`font-sans text-xs font-medium transition-colors duration-300 ${textColor} ${hoverColor}`}
                style={{letterSpacing:'0.2em'}} aria-label={`Switch to ${otherLocale.toUpperCase()}`}>
                {otherLocale.toUpperCase()}
              </button>
              <div className={`hidden sm:block w-px h-5 transition-colors duration-300 ${transparent ? 'bg-white/30' : 'bg-night-200'}`} />
              <Link href={`/${locale}/apartments`}
                className={`hidden sm:inline-flex items-center px-5 py-2.5 text-xs font-medium uppercase border transition-all duration-500 ${
                  transparent
                    ? 'border-white/60 text-white hover:bg-white hover:text-night-600'
                    : 'border-night-600 text-night-600 hover:bg-night-600 hover:text-cream-100'
                }`}
                style={{letterSpacing:'0.15em'}}>
                {t('apartments')}
              </Link>

              {/* Bouton Admin — discret, icône cadenas */}
              <Link
                href={`/${locale}/admin-login`}
                title={locale === 'fr' ? 'Espace administration' : 'Admin area'}
                className={`hidden sm:flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 opacity-30 hover:opacity-100 ${
                  transparent ? 'text-white hover:bg-white/10' : 'text-night-400 hover:bg-night-100'
                }`}
              >
                <Lock size={14} />
              </Link>

              <button onClick={() => setMenuOpen(!menuOpen)}
                className={`md:hidden p-1 transition-colors duration-300 ${textColor}`} aria-label="Menu">
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>
        <div className={`absolute bottom-0 left-0 right-0 h-px transition-all duration-700 ${transparent ? 'opacity-30' : 'opacity-0'} bg-gradient-to-r from-transparent via-bronze-400 to-transparent`} />
      </header>

      {/* Menu mobile overlay */}
      <div className={`fixed inset-0 z-40 transition-all duration-500 md:hidden ${menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-night-600/95 backdrop-blur-md" onClick={() => setMenuOpen(false)} />
        <div className="relative h-full flex flex-col items-center justify-center gap-10">
          {navLinks.map((link, i) => (
            <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}
              className="font-serif text-4xl font-light text-cream-100 hover:text-bronze-300 transition-colors duration-300"
              style={{letterSpacing:'0.05em', animationDelay:`${i*100}ms`}}>
              {link.label}
            </Link>
          ))}
          <div className="divider-bronze mx-auto mt-4" />
          <Link href={`/${locale}/apartments`} onClick={() => setMenuOpen(false)} className="btn-bronze mt-2">
            {locale === 'fr' ? 'Réserver' : 'Book now'}
          </Link>
          <button onClick={() => { switchLanguage(); setMenuOpen(false); }}
            className="font-sans text-xs text-cream-100/60 uppercase mt-2" style={{letterSpacing:'0.2em'}}>
            {otherLocale.toUpperCase()}
          </button>
          {/* Lien admin mobile */}
          <Link href={`/${locale}/admin-login`} onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 font-sans text-xs text-cream-100/30 hover:text-cream-100/60 uppercase mt-4 transition-colors"
            style={{letterSpacing:'0.15em'}}>
            <Lock size={12} />
            Admin
          </Link>
        </div>
      </div>
    </>
  );
}
