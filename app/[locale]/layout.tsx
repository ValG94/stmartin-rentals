import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import type { Metadata } from 'next';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://islandlivingsxm.com';

// Metadata bilingue par défaut — chaque page peut override title/description
// via son propre generateMetadata (voir /apartments/[slug]).
// L'objet `alternates` cible la racine locale (/en, /fr) ; les pages
// intérieures ré-définissent leurs alternates pour cibler leur URL propre.
export const metadata: Metadata = {
  title: 'Island Living SXM — Luxury Vacation Rentals in Sint Maarten',
  description: 'Luxury vacation rentals in Sint Maarten. Discover our exceptional villas with private pool and sea view.',
  alternates: {
    canonical: `${SITE_URL}/en`,
    languages: {
      en: `${SITE_URL}/en`,
      fr: `${SITE_URL}/fr`,
    },
  },
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </NextIntlClientProvider>
  );
}
