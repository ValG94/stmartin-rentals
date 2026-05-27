import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      // Supabase Storage
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.supabase.in' },
      // Domaines partenaires externes (boomerangsxm, etc.)
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
  // node-ical embarque des modules Node natifs (BigInt côté init de certains
  // chunks) qui plantent quand Next.js tente de les bundler. On l'externalise
  // pour qu'il soit require() au runtime côté serveur uniquement.
  serverExternalPackages: ['node-ical'],
};

export default withNextIntl(nextConfig);
