import { NextRequest, NextResponse } from 'next/server';
import { buildApartmentIcal } from '@/lib/services/ical-export';

// GET /api/ical/[slug]
//
// Endpoint public exposant le flux iCal d'une villa, à importer dans
// Airbnb (Calendar → Sync calendars → Import calendar) et autres OTA.
//
// Inclut : bookings confirmées + blocs manuels (maintenance/propriétaire).
// Exclut : blocs déjà importés depuis Airbnb/VRBO (évite la boucle).
//
// Cache CDN court (5 min) pour réduire la charge tout en gardant un
// délai de propagation acceptable lors d'une nouvelle réservation.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const ical = await buildApartmentIcal(slug);

  if (!ical) {
    return new NextResponse('Apartment not found or no calendar available', {
      status: 404,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  return new NextResponse(ical, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `inline; filename="${slug}.ics"`,
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
