import { getTranslations, getLocale } from 'next-intl/server';

export default async function LegalPage() {
  const locale = await getLocale();
  const t = await getTranslations('legal');

  return (
    <div className="bg-white min-h-screen pt-20">
      <div className="bg-primary-700 text-white py-12 px-4 text-center">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-12 prose prose-gray max-w-none">
        <h2>{t('editor_title')}</h2>
        <p>{t('editor_content')}</p>
        <h2>{t('host_title')}</h2>
        <p>{t('host_content')}</p>
        <h2>{t('ip_title')}</h2>
        <p>{t('ip_content')}</p>
        <h2>{t('liability_title')}</h2>
        <p>{t('liability_content')}</p>
      </div>
    </div>
  );
}
