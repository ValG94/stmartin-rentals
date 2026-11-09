import type { Metadata } from 'next';

// Pages de retour de paiement et de solde : propres à une réservation,
// jamais indexées (elles sont aussi bloquées dans robots.txt).
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
