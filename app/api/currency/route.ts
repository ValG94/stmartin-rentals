import { NextResponse } from 'next/server';
import { getUsdToEurRate } from '@/lib/currency';

export const revalidate = 3600; // Revalider toutes les heures

export async function GET() {
  const rate = await getUsdToEurRate();
  return NextResponse.json({ usdToEur: rate }, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
    },
  });
}
