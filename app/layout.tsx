import type { Metadata } from 'next';
import { Inter, Cormorant_Garamond } from 'next/font/google';
import './globals.css';

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

export const metadata: Metadata = {
  title: 'StMartin Rentals — Villas de Luxe à Saint-Martin',
  description:
    'Découvrez La Villa Vanille et La Villa Blanche, deux villas d\'exception à Saint-Martin. Piscine privée, vue mer, expérience caraïbes haut de gamme.',
  keywords: 'villa luxe saint-martin, location villa caraïbes, villa piscine saint-martin, villa vanille, villa blanche',
  openGraph: {
    title: 'StMartin Rentals — Villas de Luxe à Saint-Martin',
    description: 'Deux villas d\'exception à Saint-Martin. Piscine privée, vue mer, expérience caraïbes haut de gamme.',
    type: 'website',
    locale: 'fr_FR',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html className={`${inter.variable} ${cormorant.variable}`}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
