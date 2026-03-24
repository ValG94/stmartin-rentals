import { getTranslations, getLocale } from 'next-intl/server';

export default async function PrivacyPage() {
  const locale = await getLocale();
  const t = await getTranslations('privacy');

  return (
    <div className="bg-white min-h-screen">
      <div className="bg-primary-700 text-white py-12 px-4 text-center">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-12 prose prose-gray max-w-none">
        <h2>{t('collect_title')}</h2>
        <p>{t('collect_content')}</p>
        <h2>{t('use_title')}</h2>
        <p>{t('use_content')}</p>
        <h2>{t('rights_title')}</h2>
        <p>{t('rights_content')}</p>
        <h2>{t('contact_title')}</h2>
        <p>{t('contact_content')}</p>
      </div>
    </div>
  );
}
