// /llms.txt — résumé du site pour les assistants IA (proposition de standard
// llmstxt.org). Markdown simple, généré depuis la base pour que les villas,
// capacités et prix restent à jour sans retoucher le fichier.
// En anglais : c'est la langue que les moteurs IA exploitent le mieux, les
// liens FR sont donnés à côté.

import { getApartments } from '@/lib/api';
import { CONCIERGE_SERVICES } from '@/lib/concierge';
import { CLEANING_FEES, DEPOSIT_RATE, ROOM_TAX, SECURITY_DEPOSITS } from '@/lib/services/pricing';
import { CONTACT_EMAIL, CONTACT_PHONE, SITE_NAME, SITE_URL } from '@/lib/seo';

export const revalidate = 600;

const usd = (n: number) => `USD ${n.toLocaleString('en-US')}`;
const plain = (html: string | null | undefined) =>
  (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

export async function GET() {
  const { data } = await getApartments();
  const apartments = data ?? [];

  const villas = apartments.map((apt) => {
    const from = apt.min_price ?? apt.price_per_night;
    const lines = [
      `### ${apt.title_en}`,
      '',
      plain(apt.short_description_en) || plain(apt.description_en).slice(0, 300),
      '',
      `- Location: ${apt.location || 'Sint Maarten'}`,
      `- Bedrooms: ${apt.bedrooms}, bathrooms: ${apt.bathrooms}`,
      `- Sleeps up to ${apt.max_guests} guests` +
        (apt.extra_guests_max > 0 ? ` (plus up to ${apt.extra_guests_max} extra guests at ${usd(apt.extra_guest_price_per_night)} per guest per night)` : ''),
      `- Nightly rate: from ${usd(from)}, varies by season`,
    ];
    if (CLEANING_FEES[apt.slug]) lines.push(`- Cleaning fee: ${usd(CLEANING_FEES[apt.slug])} per stay`);
    if (SECURITY_DEPOSITS[apt.slug]) lines.push(`- Security deposit: ${usd(SECURITY_DEPOSITS[apt.slug])}`);
    lines.push(
      `- Details, photos, availability and booking: ${SITE_URL}/en/apartments/${apt.slug} (French: ${SITE_URL}/fr/apartments/${apt.slug})`,
    );
    return lines.join('\n');
  });

  const body = `# ${SITE_NAME}

> ${SITE_NAME} rents ${apartments.length} private luxury villas in Sint Maarten / Saint-Martin (Caribbean) directly to guests, with online booking, real-time availability and a concierge service. The website is available in English and French.

## Villas

${villas.join('\n\n')}

## Booking and payment

- Book directly on the website: choose dates, see the full price, then pay online.
- Prices are in US dollars (USD).
- Pay the full stay at booking, or a ${Math.round(DEPOSIT_RATE * 100)}% deposit with the balance due before arrival.
- A ${Math.round(ROOM_TAX.rate * 100)}% Sint Maarten room tax is added to the stay price.
- A security deposit is required on arrival.
- Cancellation and refund terms depend on how long before arrival the booking is cancelled. Full terms: ${SITE_URL}/en/legal

## Concierge services

${CONCIERGE_SERVICES.map((s) => `- ${s.title_en}`).join('\n')}

Details: ${SITE_URL}/en/concierge

## Contact

- Phone and WhatsApp: ${CONTACT_PHONE}
- Email: ${CONTACT_EMAIL}
- Contact page: ${SITE_URL}/en/contact

## Pages

- [Home](${SITE_URL}/en): overview of the villas
- [All villas](${SITE_URL}/en/apartments): list with prices
- [Concierge](${SITE_URL}/en/concierge): services before and during the stay
- [Rental terms](${SITE_URL}/en/legal): payment, deposit and cancellation policy
- [Privacy policy](${SITE_URL}/en/privacy)
- [Version française](${SITE_URL}/fr)
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
