'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Phone, Mail, MessageCircle, MapPin } from 'lucide-react';

export default function Footer() {
  const t = useTranslations('footer');
  const tNav = useTranslations('nav');
  const locale = useLocale();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-night-600 text-cream-100">
      {/* Ligne décorative bronze */}
      <div className="h-px bg-gradient-to-r from-transparent via-bronze-400 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">

          {/* Brand — 4 colonnes */}
          <div className="md:col-span-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 flex items-center justify-center border border-cream-100/20">
                <span className="font-serif text-sm font-light text-cream-100" style={{letterSpacing:'0.15em'}}>SM</span>
              </div>
              <div>
                <div className="font-serif font-light text-lg text-cream-100 leading-none" style={{letterSpacing:'0.08em'}}>StMartin Rentals</div>
                <div className="font-sans text-xs text-bronze-300 mt-0.5" style={{letterSpacing:'0.2em'}}>SAINT-MARTIN</div>
              </div>
            </div>
            <p className="font-sans text-sm text-cream-100/50 leading-relaxed mb-6">{t('tagline')}</p>
            <div className="flex items-center gap-2 text-cream-100/40 text-xs font-sans">
              <MapPin size={12} className="text-bronze-400" />
              <span style={{letterSpacing:'0.05em'}}>Saint-Martin, Antilles françaises</span>
            </div>
          </div>

          {/* Nos villas — 2 colonnes */}
          <div className="md:col-span-2">
            <h3 className="font-sans text-xs font-medium uppercase text-cream-100/40 mb-6" style={{letterSpacing:'0.2em'}}>
              {locale === 'fr' ? 'Nos villas' : 'Our villas'}
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href={`/${locale}/apartments/villa-vanille`} className="font-sans text-sm text-cream-100/60 hover:text-bronze-300 transition-colors duration-300">
                  La Villa Vanille
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/apartments/villa-blanche`} className="font-sans text-sm text-cream-100/60 hover:text-bronze-300 transition-colors duration-300">
                  La Villa Blanche
                </Link>
              </li>
            </ul>
          </div>

          {/* Navigation — 2 colonnes */}
          <div className="md:col-span-2">
            <h3 className="font-sans text-xs font-medium uppercase text-cream-100/40 mb-6" style={{letterSpacing:'0.2em'}}>
              {t('links_title')}
            </h3>
            <ul className="space-y-3">
              <li><Link href={`/${locale}`} className="font-sans text-sm text-cream-100/60 hover:text-bronze-300 transition-colors duration-300">{tNav('home')}</Link></li>
              <li><Link href={`/${locale}/apartments`} className="font-sans text-sm text-cream-100/60 hover:text-bronze-300 transition-colors duration-300">{tNav('apartments')}</Link></li>
              <li><Link href={`/${locale}/contact`} className="font-sans text-sm text-cream-100/60 hover:text-bronze-300 transition-colors duration-300">{tNav('contact')}</Link></li>
              <li><Link href={`/${locale}/legal`} className="font-sans text-sm text-cream-100/60 hover:text-bronze-300 transition-colors duration-300">{t('legal_mentions')}</Link></li>
              <li><Link href={`/${locale}/privacy`} className="font-sans text-sm text-cream-100/60 hover:text-bronze-300 transition-colors duration-300">{t('privacy')}</Link></li>
            </ul>
          </div>

          {/* Contact — 4 colonnes */}
          <div className="md:col-span-4">
            <h3 className="font-sans text-xs font-medium uppercase text-cream-100/40 mb-6" style={{letterSpacing:'0.2em'}}>
              {t('contact_title')}
            </h3>
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <Phone size={14} className="text-bronze-400 flex-shrink-0" />
                <span className="font-sans text-sm text-cream-100/60">+590 690 XX XX XX</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={14} className="text-bronze-400 flex-shrink-0" />
                <span className="font-sans text-sm text-cream-100/60">contact@stmartin-rentals.com</span>
              </li>
              <li className="flex items-center gap-3">
                <MessageCircle size={14} className="text-bronze-400 flex-shrink-0" />
                <a href="https://wa.me/590690XXXXXX" target="_blank" rel="noopener noreferrer"
                  className="font-sans text-sm text-cream-100/60 hover:text-bronze-300 transition-colors duration-300">
                  WhatsApp
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bas de footer */}
        <div className="border-t border-cream-100/10 mt-16 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-sans text-xs text-cream-100/30" style={{letterSpacing:'0.05em'}}>
            &copy; {year} StMartin Rentals. {t('rights')}.
          </p>
          <div className="divider-bronze" />
          <p className="font-sans text-xs text-cream-100/20" style={{letterSpacing:'0.1em'}}>
            SAINT-MARTIN · ANTILLES FRANÇAISES
          </p>
        </div>
      </div>
    </footer>
  );
}
