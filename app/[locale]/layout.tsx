import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import type { Metadata } from 'next';
import { Inter, Cormorant_Garamond } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-cormorant',
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// Metadata par défaut. Pas d'`alternates` ici : un canonical hérité
// désignerait une autre page. Chaque page publique déclare le sien via
// pageMetadata() / localeAlternates() (lib/seo.ts).
export const metadata: Metadata = {
  title: 'Island Living SXM — Luxury Vacation Rentals in Sint Maarten',
  description: 'Luxury vacation rentals in Sint Maarten. Discover our exceptional villas with private pool and sea view.',
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
    <html lang={locale} className={`${inter.variable} ${cormorant.variable}`}>
      <body className={inter.className}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
