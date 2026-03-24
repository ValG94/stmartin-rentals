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
    <footer className="bg-primary-700 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <span className="text-primary-600 font-bold text-sm">SM</span>
              </div>
              <span className="font-bold text-lg">StMartin Rentals</span>
            </div>
            <p className="text-primary-100 text-sm leading-relaxed">{t('tagline')}</p>
            <div className="flex items-center gap-1.5 mt-3 text-primary-200 text-sm">
              <MapPin size={14} />
              <span>Saint-Martin, Antilles françaises</span>
            </div>
          </div>

          {/* Liens rapides */}
          <div>
            <h3 className="font-semibold text-white mb-4">{t('links_title')}</h3>
            <ul className="space-y-2 text-sm text-primary-200">
              <li>
                <Link href={`/${locale}`} className="hover:text-white transition-colors">
                  {tNav('home')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/apartments`} className="hover:text-white transition-colors">
                  {tNav('apartments')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/contact`} className="hover:text-white transition-colors">
                  {tNav('contact')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Légal */}
          <div>
            <h3 className="font-semibold text-white mb-4">{t('legal_title')}</h3>
            <ul className="space-y-2 text-sm text-primary-200">
              <li>
                <Link href={`/${locale}/legal`} className="hover:text-white transition-colors">
                  {t('legal_mentions')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/privacy`} className="hover:text-white transition-colors">
                  {t('privacy')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-white mb-4">{t('contact_title')}</h3>
            <ul className="space-y-3 text-sm text-primary-200">
              <li className="flex items-center gap-2">
                <Phone size={14} className="text-accent-500 flex-shrink-0" />
                <span>+590 690 XX XX XX</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={14} className="text-accent-500 flex-shrink-0" />
                <span>contact@stmartin-rentals.com</span>
              </li>
              <li className="flex items-center gap-2">
                <MessageCircle size={14} className="text-accent-500 flex-shrink-0" />
                <a
                  href="https://wa.me/590690XXXXXX"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  WhatsApp
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-600 mt-8 pt-6 text-center text-sm text-primary-300">
          <p>
            &copy; {year} StMartin Rentals. {t('rights')}.
          </p>
        </div>
      </div>
    </footer>
  );
}
