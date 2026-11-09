// Données structurées schema.org (JSON-LD) : lues par Google pour les
// résultats enrichis et par les moteurs IA (ChatGPT, Perplexity, Gemini…)
// pour décrire le site sans interpréter la mise en page.
// L'adresse exacte des villas n'est volontairement pas publiée : seul le
// quartier (apartment.location) apparaît, comme sur les fiches.

import type { Apartment } from '@/types';
import { CONTACT_EMAIL, CONTACT_PHONE, SITE_NAME, SITE_URL } from './seo';

const ORG_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;

const stripHtml = (html: string | null | undefined) =>
  (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const villaUrl = (locale: string, slug: string) => `${SITE_URL}/${locale}/apartments/${slug}`;

const organization = () => ({
  '@type': 'LodgingBusiness',
  '@id': ORG_ID,
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/logo-island-living-sxm.png`,
  image: `${SITE_URL}/og-image.jpg`,
  telephone: CONTACT_PHONE,
  email: CONTACT_EMAIL,
  priceRange: '$$$$',
  currenciesAccepted: 'USD',
  knowsLanguage: ['en', 'fr'],
  address: { '@type': 'PostalAddress', addressLocality: 'Sint Maarten', addressCountry: 'SX' },
  areaServed: { '@type': 'Place', name: 'Sint Maarten / Saint-Martin' },
});

/** Accueil : la marque, le site et la liste des villas. */
export function homeJsonLd(locale: string, apartments: Apartment[]) {
  const isFr = locale === 'fr';
  return {
    '@context': 'https://schema.org',
    '@graph': [
      organization(),
      {
        '@type': 'WebSite',
        '@id': WEBSITE_ID,
        url: SITE_URL,
        name: SITE_NAME,
        inLanguage: ['en', 'fr'],
        publisher: { '@id': ORG_ID },
      },
      {
        '@type': 'ItemList',
        name: isFr ? 'Nos villas à Saint-Martin' : 'Our villas in Sint Maarten',
        itemListElement: apartments.map((apt, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: villaUrl(locale, apt.slug),
          name: isFr ? apt.title_fr : apt.title_en,
        })),
      },
    ],
  };
}

/** Fiche villa : hébergement, capacité, prix à partir de, fil d'Ariane. */
export function villaJsonLd(
  locale: string,
  apt: Apartment,
  priceUsd: number,
  apartmentsLabel: string,
  amenityLabels: string[],
) {
  const isFr = locale === 'fr';
  const url = villaUrl(locale, apt.slug);
  const name = isFr ? apt.title_fr : apt.title_en;
  const images = [...(apt.images || [])]
    .sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.position - b.position)
    .slice(0, 10)
    .map((im) => im.url);
  const amenities = amenityLabels.map((a) => ({
    '@type': 'LocationFeatureSpecification',
    name: a,
    value: true,
  }));

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'LodgingBusiness',
        '@id': url,
        name,
        description: stripHtml(isFr ? apt.description_fr : apt.description_en).slice(0, 500),
        url,
        image: images.length ? images : undefined,
        telephone: CONTACT_PHONE,
        email: CONTACT_EMAIL,
        priceRange: '$$$$',
        currenciesAccepted: 'USD',
        address: {
          '@type': 'PostalAddress',
          addressLocality: apt.location || 'Sint Maarten',
          addressCountry: 'SX',
        },
        petsAllowed: false,
        checkinTime: '16:00',
        checkoutTime: '10:00',
        amenityFeature: amenities,
        containsPlace: {
          '@type': 'Accommodation',
          additionalType: 'EntirePlace',
          name,
          numberOfBedrooms: apt.bedrooms,
          numberOfBathroomsTotal: apt.bathrooms,
          occupancy: { '@type': 'QuantitativeValue', maxValue: apt.max_guests },
          amenityFeature: amenities,
        },
        // Prix d'une nuit hors ménage et hors taxe de séjour
        offers: {
          '@type': 'Offer',
          priceCurrency: 'USD',
          price: priceUsd,
          availability: 'https://schema.org/InStock',
          url,
        },
        parentOrganization: { '@id': ORG_ID },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: isFr ? 'Accueil' : 'Home', item: `${SITE_URL}/${locale}` },
          { '@type': 'ListItem', position: 2, name: apartmentsLabel, item: `${SITE_URL}/${locale}/apartments` },
          { '@type': 'ListItem', position: 3, name, item: url },
        ],
      },
    ],
  };
}

/** Balise <script> JSON-LD ; échappe "<" pour qu'un texte saisi en admin ne ferme pas le script. */
export function jsonLdScript(data: unknown) {
  return { __html: JSON.stringify(data).replace(/</g, '\\u003c') };
}
