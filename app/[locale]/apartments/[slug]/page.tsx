import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Bed, Bath, Users, MapPin, BookOpen, Shield, Sparkles, Clock } from 'lucide-react';
import { getApartmentBySlug, getApartments } from '@/lib/api';
import { getUsdToEurRate } from '@/lib/currency';
import ImageGallery from '@/components/apartments/ImageGallery';
import BookingForm from '@/components/booking/BookingForm';
import { AMENITIES_MAP } from '@/components/apartments/AmenityIcon';
import { sanitizeRichHtml } from '@/lib/services/sanitize';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://islandlivingsxm.com').replace(/\/+$/, '');

/**
 * generateMetadata — SEO par villa :
 *  - title/description bilingues extraits de la DB
 *  - OG image = image de couverture de la villa (au lieu du hero générique)
 *  - canonical + hreflang alternates (fr ↔ en)
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const res = await getApartmentBySlug(slug);
  if (!res.data) return {};
  const apt = res.data;
  const isFr = locale === 'fr';
  const name = isFr ? apt.title_fr : apt.title_en;
  const rawDesc = isFr ? apt.description_fr : apt.description_en;
  // La description peut contenir du HTML riche (formatting admin) — on strip
  // les balises et on coupe à ~155 chars pour rester dans les limites SEO.
  const plainDesc = (rawDesc || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const description = plainDesc.length > 155 ? plainDesc.slice(0, 152) + '…' : plainDesc;

  const cover = apt.images?.find((im) => im.is_cover) || apt.images?.[0];
  const coverUrl = cover?.url;

  const canonicalPath = `/${locale}/apartments/${slug}`;

  return {
    title: name,
    description,
    alternates: {
      canonical: canonicalPath,
      languages: {
        en: `/en/apartments/${slug}`,
        fr: `/fr/apartments/${slug}`,
      },
    },
    openGraph: {
      title: `${name} — Island Living SXM`,
      description,
      url: `${SITE_URL}${canonicalPath}`,
      siteName: 'Island Living SXM',
      type: 'website',
      locale: isFr ? 'fr_FR' : 'en_US',
      alternateLocale: isFr ? 'en_US' : 'fr_FR',
      images: coverUrl ? [{
        url: coverUrl,
        width: 1200,
        height: 800,
        alt: name,
      }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${name} — Island Living SXM`,
      description,
      images: coverUrl ? [coverUrl] : undefined,
    },
  };
}

// Revalide la fiche villa toutes les 60 s côté CDN. Les nouvelles villas
// pas pré-rendues au build seront générées à la première requête (dynamicParams
// reste à true par défaut), puis cachées 60 s avant nouvelle revalidation.
export const revalidate = 60;

export async function generateStaticParams() {
  const res = await getApartments();
  const apartments = res.data ?? [];
  return apartments.flatMap((apt) => [
    { locale: 'fr', slug: apt.slug },
    { locale: 'en', slug: apt.slug },
  ]);
}

export default async function ApartmentDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations('apartment_detail');
  const tApt = await getTranslations('apartments');

  const res = await getApartmentBySlug(slug);
  if (!res.data) notFound();
  const apartment = res.data;

  let eurRate = 0.92;
  try {
    eurRate = await getUsdToEurRate();
  } catch {
    /* fallback silencieux */
  }

  const isFr = locale === 'fr';
  const activePriceUsd = apartment.current_price ?? apartment.price_per_night;
  const name = locale === 'fr' ? apartment.title_fr : apartment.title_en;
  const description = locale === 'fr' ? apartment.description_fr : apartment.description_en;

  // ── JSON-LD structured data (LodgingBusiness) — indexation Google ──
  // Rich results possibles : nom, image, adresse, rating, prix. Injecté
  // en <script type="application/ld+json"> juste avant le contenu HTML.
  const coverImg = apartment.images?.find((im) => im.is_cover) || apartment.images?.[0];
  const canonicalUrl = `${SITE_URL}/${locale}/apartments/${apartment.slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    '@id': canonicalUrl,
    name,
    description: (description || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300),
    url: canonicalUrl,
    image: coverImg?.url ? [coverImg.url] : undefined,
    telephone: '+1-514-947-6100',
    priceRange: '$$$$',
    address: {
      '@type': 'PostalAddress',
      addressLocality: apartment.location || 'Sint Maarten',
      addressCountry: 'SX',
    },
    numberOfRooms: apartment.bedrooms,
    petsAllowed: false,
    checkinTime: '16:00',
    checkoutTime: '10:00',
    amenityFeature: (apartment.amenities || []).slice(0, 12).map((a: string) => ({
      '@type': 'LocationFeatureSpecification',
      name: a,
      value: true,
    })),
    offers: {
      '@type': 'Offer',
      priceCurrency: 'USD',
      price: activePriceUsd,
      availability: 'https://schema.org/InStock',
      url: canonicalUrl,
    },
  };

  return (
    <div className="bg-cream-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">

        {/* ── Breadcrumb ─────────────────────────────────────────── */}
        <nav className="text-xs uppercase mb-10 font-medium text-night-300" style={{ letterSpacing: '0.2em' }}>
          <Link href={`/${locale}`} className="hover:text-bronze-400 transition-colors duration-300">
            {isFr ? 'Accueil' : 'Home'}
          </Link>
          <span className="mx-3 text-bronze-300">·</span>
          <Link href={`/${locale}/apartments`} className="hover:text-bronze-400 transition-colors duration-300">
            {tApt('page_title')}
          </Link>
          <span className="mx-3 text-bronze-300">·</span>
          <span className="text-night-600">{name}</span>
        </nav>

        {/* ── Header villa ───────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div className="max-w-3xl">
            <p className="section-label mb-4">{isFr ? 'Villa privée' : 'Private villa'}</p>
            <h1
              className="font-serif font-light text-night-600 mb-4 leading-[1.05]"
              style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)', letterSpacing: '-0.01em' }}
            >
              {name}
            </h1>
            <div className="flex items-center gap-2 text-night-400">
              <MapPin size={16} className="text-bronze-400" />
              <span className="text-sm">{apartment.location}</span>
            </div>
          </div>

          <Link
            href={`/${locale}/apartments/${slug}/guide`}
            className="group inline-flex items-center gap-3 px-6 py-3 border border-bronze-300 text-bronze-500 hover:bg-bronze-400 hover:text-cream-100 hover:border-bronze-400 transition-all duration-500 text-xs font-medium uppercase whitespace-nowrap"
            style={{ letterSpacing: '0.15em' }}
          >
            <BookOpen size={16} />
            {t('view_guide')}
          </Link>
        </div>

        {/* ── Gallery ────────────────────────────────────────────── */}
        <div className="mb-16">
          <ImageGallery mediaItems={apartment.images} alt={name} locale={locale} />
        </div>

        {/* ── Contenu principal + sidebar ────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-16">

          {/* ─── Colonne gauche ──────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-16">

            {/* Specs */}
            <div className="bg-sand-100 border border-bronze-100 rounded-2xl p-8">
              <div className="grid grid-cols-3 gap-px bg-bronze-100">
                <Spec icon={<Bed size={22} className="text-bronze-400" />} value={apartment.bedrooms} label={t('bedrooms')} />
                <Spec icon={<Bath size={22} className="text-bronze-400" />} value={apartment.bathrooms} label={t('bathrooms')} />
                <Spec
                  icon={<Users size={22} className="text-bronze-400" />}
                  value={
                    apartment.extra_guests_max > 0 ? (
                      <span className="inline-flex items-baseline gap-1">
                        <span>{apartment.max_guests}</span>
                        <span className="text-base text-bronze-400 font-medium">+{apartment.extra_guests_max}</span>
                      </span>
                    ) : (
                      apartment.max_guests
                    )
                  }
                  label={t('guests')}
                />
              </div>
              {apartment.extra_guests_max > 0 && (
                <p className="mt-5 pt-5 border-t border-bronze-100 text-xs text-night-400 text-center leading-relaxed">
                  {isFr
                    ? <>
                        <strong className="text-night-500 font-medium">{apartment.max_guests} voyageurs inclus</strong>
                        {' '}+ jusqu&apos;à {apartment.extra_guests_max} en supplément à {apartment.extra_guest_price_per_night}$/nuit/personne
                      </>
                    : <>
                        <strong className="text-night-500 font-medium">{apartment.max_guests} guests included</strong>
                        {' '}+ up to {apartment.extra_guests_max} extra at ${apartment.extra_guest_price_per_night}/night/person
                      </>}
                </p>
              )}
            </div>

            {/* Description */}
            <section>
              <p className="section-label mb-4">{isFr ? 'L’âme du lieu' : 'The soul of the place'}</p>
              <h2 className="font-serif font-light text-night-600 mb-8" style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)' }}>
                {t('description')}
              </h2>
              <div className="w-12 h-px bg-bronze-400 mb-8" />
              <div
                className="text-night-500 leading-relaxed text-base md:text-lg font-light max-w-3xl villa-description"
                dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(description) }}
              />
            </section>

            {/* Amenities */}
            <section>
              <p className="section-label mb-4">{isFr ? 'Équipements & prestations' : 'Amenities & services'}</p>
              <h2 className="font-serif font-light text-night-600 mb-8" style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)' }}>
                {t('amenities')}
              </h2>
              <div className="w-12 h-px bg-bronze-400 mb-8" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {apartment.amenities.map((amenityKey, i) => {
                  const def = AMENITIES_MAP[amenityKey];
                  const label = def ? (isFr ? def.label_fr : def.label_en) : amenityKey;
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-4 bg-cream-100 border border-bronze-100 hover:border-bronze-300 transition-colors duration-500 rounded-md"
                    >
                      <span className="text-bronze-400 flex-shrink-0 text-lg">{def?.icon ?? '✓'}</span>
                      <span className="text-sm font-medium text-night-600">{label}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Notre engagement — trust signals */}
            <section className="border-y border-bronze-100 py-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Commitment
                  icon={<Shield size={22} className="text-bronze-400" />}
                  title={isFr ? 'Paiement sécurisé' : 'Secure payment'}
                  body={isFr ? 'Transactions cryptées via PayPal ou virement bancaire SWIFT.' : 'Encrypted transactions via PayPal or SWIFT bank transfer.'}
                />
                <Commitment
                  icon={<Clock size={22} className="text-bronze-400" />}
                  title={isFr ? 'Réponse en moins de 2 h' : 'Reply within 2 h'}
                  body={isFr ? 'Votre hôte vous répond personnellement, en français ou en anglais.' : 'Your host replies personally, in English or French.'}
                />
                <Link
                  href={`/${locale}/concierge`}
                  className="group block text-center md:text-left transition-opacity duration-300 hover:opacity-80"
                >
                  <div className="mb-3 flex justify-center md:justify-start">
                    <Sparkles size={22} className="text-bronze-400" />
                  </div>
                  <h3 className="font-serif text-lg text-night-600 mb-2 group-hover:text-bronze-500 transition-colors duration-300">
                    {isFr ? 'Conciergerie incluse' : 'Concierge included'}
                  </h3>
                  <p className="text-sm text-night-400 leading-relaxed font-light">
                    {isFr ? 'Livraison de courses, restaurants, location de bateau — sur simple demande.' : 'Grocery delivery, restaurants, boat rental — on request.'}
                  </p>
                  <span
                    className="inline-flex items-center gap-1.5 mt-3 text-[11px] uppercase font-medium text-bronze-400 group-hover:text-bronze-500 transition-colors duration-300"
                    style={{ letterSpacing: '0.15em' }}
                  >
                    {isFr ? 'Voir les services' : 'View services'} →
                  </span>
                </Link>
              </div>
            </section>
          </div>

          {/* ─── Sidebar booking ─────────────────────────────────── */}
          <aside className="lg:col-span-1">
            <div className="lg:sticky lg:top-28">
              <BookingForm
                apartmentName={name}
                apartmentId={apartment.id}
                apartmentSlug={slug}
                nightlyRate={apartment.price_per_night}
                maxGuests={apartment.max_guests || 8}
                extraGuestsMax={apartment.extra_guests_max || 0}
                extraGuestPricePerNight={apartment.extra_guest_price_per_night || 0}
                locale={locale}
                eurRate={eurRate}
                seasonalPrices={(apartment.seasonal_prices ?? []).map((sp) => ({
                  is_active: sp.is_active,
                  date_from: sp.date_from,
                  date_to: sp.date_to,
                  price_per_night: Number(sp.price_per_night),
                }))}
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Spec({ icon, value, label }: { icon: React.ReactNode; value: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-4 bg-sand-100">
      {icon}
      <div className="text-2xl font-serif font-light text-night-600">{value}</div>
      <div className="text-[10px] uppercase font-medium text-night-400" style={{ letterSpacing: '0.2em' }}>{label}</div>
    </div>
  );
}

function Commitment({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="text-center md:text-left">
      <div className="mb-3 flex justify-center md:justify-start">{icon}</div>
      <h3 className="font-serif text-lg text-night-600 mb-2">{title}</h3>
      <p className="text-sm text-night-400 leading-relaxed font-light">{body}</p>
    </div>
  );
}
