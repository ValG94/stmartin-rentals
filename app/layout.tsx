import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'StMartin Rentals - Locations de Villas à Saint-Martin',
  description: 'Découvrez nos villas de luxe à Saint-Martin. Location saisonnière avec piscine, vue mer et services premium.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
