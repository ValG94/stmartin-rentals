import { redirect } from 'next/navigation';
import Link from 'next/link';
import { buildFygaroPaymentUrl } from '@/lib/services/fygaro';
import { getServerSupabase } from '@/lib/services/server-pricing';
import { formatUSD } from '@/lib/services/pricing';

interface Props {
  params: Promise<{ locale: string; bookingId: string }>;
}

/**
 * Page qui reçoit un client depuis un email de rappel de solde et le
 * redirige immédiatement vers Fygaro pour payer le remaining_balance.
 *
 * URL : /[locale]/booking/pay-balance/[bookingId]
 *
 * Sécurité : le bookingId dans l'URL est suffisant — on ne demande pas
 * d'auth car le lien vient d'un email envoyé au client lui-même. Le
 * paiement crée un webhook Fygaro qui matchera cette booking par ID.
 *
 * Cas gérés :
 *  - Booking introuvable → écran d'erreur
 *  - Booking déjà entièrement payée → écran de confirmation
 *  - Aucun solde restant → écran d'info (rien à payer)
 *  - Sinon → génère le lien Fygaro et redirige
 */
export default async function PayBalancePage({ params }: Props) {
  const { locale, bookingId } = await params;
  const isFr = locale === 'fr';

  // UUID basique — on refuse les IDs mal formés pour éviter les 500 SQL
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bookingId)) {
    return <InfoScreen title={isFr ? 'Lien invalide' : 'Invalid link'} body={isFr ? 'Le lien de paiement est incorrect. Vérifiez votre email ou contactez-nous.' : 'The payment link is invalid. Please check your email or contact us.'} locale={locale} />;
  }

  const supabase = getServerSupabase();
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, remaining_balance, payment_status, booking_status')
    .eq('id', bookingId)
    .maybeSingle();

  if (!booking) {
    return <InfoScreen title={isFr ? 'Réservation introuvable' : 'Booking not found'} body={isFr ? 'Nous ne trouvons pas cette réservation. Contactez-nous si vous pensez qu\'il s\'agit d\'une erreur.' : "We can't find this booking. Please contact us if you believe this is an error."} locale={locale} />;
  }
  if (booking.booking_status === 'cancelled') {
    return <InfoScreen title={isFr ? 'Réservation annulée' : 'Booking cancelled'} body={isFr ? 'Cette réservation a été annulée. Aucun paiement n\'est requis.' : 'This booking has been cancelled. No payment is required.'} locale={locale} />;
  }
  if (booking.payment_status === 'paid' || Number(booking.remaining_balance) <= 0) {
    return <InfoScreen title={isFr ? 'Déjà payée' : 'Already paid'} body={isFr ? 'Votre séjour est déjà intégralement réglé — rien à faire de plus.' : 'Your stay is already fully paid — nothing more to do.'} locale={locale} />;
  }

  // Test mode override (si l'admin a mis FYGARO_TEST_AMOUNT en env)
  const testAmountRaw = process.env.FYGARO_TEST_AMOUNT;
  const testAmount = testAmountRaw ? Number(testAmountRaw) : null;
  const useTestAmount = testAmount !== null && Number.isFinite(testAmount) && testAmount > 0;

  const bookingButton = process.env.FYGARO_PAYMENT_URL_BOOKING;
  if (!bookingButton) {
    return <InfoScreen title={isFr ? 'Paiement indisponible' : 'Payment unavailable'} body={isFr ? 'Le paiement en ligne est temporairement indisponible. Contactez-nous.' : 'Online payment is temporarily unavailable. Please contact us.'} locale={locale} />;
  }

  let redirectUrl: string;
  try {
    redirectUrl = buildFygaroPaymentUrl(bookingButton, {
      amount: useTestAmount ? testAmount! : Number(booking.remaining_balance),
      currency: 'USD',
      reference: `bal:${bookingId}`,
    });
  } catch (err) {
    console.error('[pay-balance]', err);
    return <InfoScreen title={isFr ? 'Erreur' : 'Error'} body={isFr ? "Impossible de générer le lien de paiement. Contactez-nous." : 'Unable to generate the payment link. Please contact us.'} locale={locale} />;
  }

  // Redirection immédiate côté serveur — l'utilisateur ne voit pas cette
  // page, il est envoyé directement sur Fygaro.
  redirect(redirectUrl);
}

function InfoScreen({ title, body, locale }: { title: string; body: string; locale: string }) {
  const isFr = locale === 'fr';
  void formatUSD;
  return (
    <div className="min-h-screen bg-cream-100 py-20 px-4">
      <div className="max-w-lg mx-auto text-center">
        <h1 className="font-serif font-light text-night-600 text-3xl mb-4">{title}</h1>
        <div className="w-12 h-px bg-bronze-400 mx-auto mb-6" />
        <p className="text-night-500 font-light leading-relaxed mb-8">{body}</p>
        <Link href={`/${locale}`} className="btn-primary inline-block">
          {isFr ? "Retour à l'accueil" : 'Back to home'}
        </Link>
      </div>
    </div>
  );
}
