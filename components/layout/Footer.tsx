// Server Component — charge la liste des villas actives directement depuis
// Supabase pour que tout nouvel ajout côté admin apparaisse dans le footer
// sans modification de code.
import Link from 'next/link';
import { getTranslations, getLocale } from 'next-intl/server';
import { Phone, Mail, MessageCircle, MapPin } from 'lucide-react';
import { getApartments } from '@/lib/api';

export default async function Footer() {
  const t = await getTranslations('footer');
  const tNav = await getTranslations('nav');
  const tConcierge = await getTranslations('concierge');
  const locale = await getLocale();
  const year = new Date().getFullYear();
  const isFr = locale === 'fr';

  const res = await getApartments();
  const apartments = res.data ?? [];

  return (
    <footer className="bg-night-600 text-cream-100">
      <div className="h-px bg-gradient-to-r from-transparent via-bronze-400 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">

          {/* Brand */}
          <div className="md:col-span-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 flex items-center justify-center border border-cream-100/20">
                <span className="font-serif text-sm font-light text-cream-100" style={{letterSpacing:'0.15em'}}>IL</span>
              </div>
              <div>
                <div className="font-serif font-light text-lg text-cream-100 leading-none" style={{letterSpacing:'0.08em'}}>Island Living SXM</div>
                <div className="font-sans text-xs text-bronze-300 mt-0.5" style={{letterSpacing:'0.2em'}}>LUXURY VACATION RENTALS</div>
              </div>
            </div>
            <p className="font-sans text-sm text-cream-100/50 leading-relaxed mb-6">{t('tagline')}</p>
            <div className="flex items-center gap-2 text-cream-100/40 text-xs font-sans">
              <MapPin size={12} className="text-bronze-400" />
              <span style={{letterSpacing:'0.05em'}}>Sint Maarten / Saint-Martin</span>
            </div>
          </div>

          {/* Nos villas — liste dynamique */}
          <div className="md:col-span-2">
            <h3 className="font-sans text-xs font-medium uppercase text-cream-100/40 mb-6" style={{letterSpacing:'0.2em'}}>
              {isFr ? 'Nos villas' : 'Our villas'}
            </h3>
            {apartments.length === 0 ? (
              <p className="font-sans text-sm text-cream-100/40 italic">
                {isFr ? 'Aucune villa disponible' : 'No villas available'}
              </p>
            ) : (
              <ul className="space-y-3">
                {apartments.map((apt) => (
                  <li key={apt.id}>
                    <Link
                      href={`/${locale}/apartments/${apt.slug}`}
                      className="font-sans text-sm text-cream-100/60 hover:text-bronze-300 transition-colors duration-300"
                    >
                      {isFr ? apt.title_fr : apt.title_en}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Navigation */}
          <div className="md:col-span-2">
            <h3 className="font-sans text-xs font-medium uppercase text-cream-100/40 mb-6" style={{letterSpacing:'0.2em'}}>
              {t('links_title')}
            </h3>
            <ul className="space-y-3">
              <li><Link href={`/${locale}`} className="font-sans text-sm text-cream-100/60 hover:text-bronze-300 transition-colors duration-300">{tNav('home')}</Link></li>
              <li><Link href={`/${locale}/apartments`} className="font-sans text-sm text-cream-100/60 hover:text-bronze-300 transition-colors duration-300">{tNav('apartments')}</Link></li>
              <li><Link href={`/${locale}/concierge`} className="font-sans text-sm text-cream-100/60 hover:text-bronze-300 transition-colors duration-300">{tConcierge('link')}</Link></li>
              <li><Link href={`/${locale}/contact`} className="font-sans text-sm text-cream-100/60 hover:text-bronze-300 transition-colors duration-300">{tNav('contact')}</Link></li>
              <li><Link href={`/${locale}/legal`} className="font-sans text-sm text-cream-100/60 hover:text-bronze-300 transition-colors duration-300">{t('legal_mentions')}</Link></li>
              <li><Link href={`/${locale}/privacy`} className="font-sans text-sm text-cream-100/60 hover:text-bronze-300 transition-colors duration-300">{t('privacy')}</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="md:col-span-4">
            <h3 className="font-sans text-xs font-medium uppercase text-cream-100/40 mb-6" style={{letterSpacing:'0.2em'}}>
              {t('contact_title')}
            </h3>
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <Phone size={14} className="text-bronze-400 flex-shrink-0" />
                <span className="font-sans text-sm text-cream-100/60">+1 (514) 947-6100</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={14} className="text-bronze-400 flex-shrink-0" />
                <span className="font-sans text-sm text-cream-100/60">contact@islandlivingsxm.com</span>
              </li>
              <li className="flex items-center gap-3">
                <MessageCircle size={14} className="text-bronze-400 flex-shrink-0" />
                <a href="https://wa.me/15149476100" target="_blank" rel="noopener noreferrer"
                  className="font-sans text-sm text-cream-100/60 hover:text-bronze-300 transition-colors duration-300">
                  WhatsApp
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-cream-100/10 mt-16 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-sans text-xs text-cream-100/30" style={{letterSpacing:'0.05em'}}>
            &copy; {year} Island Living SXM. {t('rights')}.
          </p>
          <div className="divider-bronze" />
          <p className="font-sans text-xs text-cream-100/20" style={{letterSpacing:'0.1em'}}>
            SINT MAARTEN · CARIBBEAN
          </p>
        </div>

        {/* Powered by — credit agence */}
        <div className="mt-6 pt-4 border-t border-cream-100/5 text-center">
          <p className="font-sans text-[10px] text-cream-100/25 uppercase" style={{letterSpacing:'0.2em'}}>
            {isFr ? 'Conçu par' : 'Powered by'}{' '}
            <a
              href="https://www.onenationagency.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-bronze-300/70 hover:text-bronze-300 transition-colors duration-300"
            >
              One Nation Agency
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
