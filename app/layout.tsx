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

// L'URL de base sert pour :
//   - résoudre les chemins relatifs (og:image, canonical, sitemap)
//   - alternates hreflang
//   - Twitter Card
// On lit NEXT_PUBLIC_SITE_URL en priorité pour rester cohérent avec les
// autres endroits du code (Fygaro return URLs, emails).
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://islandlivingsxm.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // Template : "Villa Vanille — Island Living SXM" pour les pages enfants
  // qui définissent leur propre title. Le "%s" est remplacé par le title
  // spécifique, ou par le title par défaut si aucun n'est fourni.
  title: {
    default: 'Island Living SXM — Luxury Vacation Rentals in Sint Maarten',
    template: '%s — Island Living SXM',
  },
  description:
    'Discover Villa Vanille and Villa Blanche, two exceptional luxury villas in Sint Maarten. Private pool, sea view, premium Caribbean experience.',
  keywords: [
    'luxury villa sint maarten',
    'vacation rental caribbean',
    'villa pool sint maarten',
    'villa vanille',
    'villa blanche',
    'island living sxm',
    'saint martin villa',
    'location villa luxe saint martin',
  ],
  authors: [{ name: 'Chenille Investments Ltd' }],
  creator: 'Island Living SXM',
  publisher: 'Island Living SXM',
  // Empêche les moteurs de deviner mal les numéros de téléphone comme des
  // liens (utile parce qu'on affiche le +1 (514) 947-6100).
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'Island Living SXM — Luxury Vacation Rentals in Sint Maarten',
    description: 'Two exceptional luxury villas in Sint Maarten. Private pool, sea view, premium Caribbean experience.',
    url: SITE_URL,
    siteName: 'Island Living SXM',
    type: 'website',
    locale: 'en_US',
    alternateLocale: 'fr_FR',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Island Living SXM — Luxury villas in Sint Maarten',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Island Living SXM — Luxury Vacation Rentals in Sint Maarten',
    description: 'Two exceptional luxury villas in Sint Maarten. Private pool, sea view, premium Caribbean experience.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: '/logo-island-living-sxm.png',
    apple: '/logo-island-living-sxm.png',
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
