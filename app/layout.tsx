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
  title: 'Island Living SXM — Luxury Vacation Rentals in Sint Maarten',
  description:
    'Discover Villa Vanille and Villa Blanche, two exceptional luxury villas in Sint Maarten. Private pool, sea view, premium Caribbean experience.',
  keywords: 'luxury villa sint maarten, vacation rental caribbean, villa pool sint maarten, villa vanille, villa blanche, island living sxm',
  openGraph: {
    title: 'Island Living SXM — Luxury Vacation Rentals in Sint Maarten',
    description: 'Two exceptional luxury villas in Sint Maarten. Private pool, sea view, premium Caribbean experience.',
    type: 'website',
    locale: 'en_US',
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
