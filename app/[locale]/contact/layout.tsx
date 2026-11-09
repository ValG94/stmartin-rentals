import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo';

// La page contact est un composant client : ses métadonnées sont ici.
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contact' });
  return pageMetadata(locale, '/contact', t('title'), t('subtitle'));
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
