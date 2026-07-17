import Link from 'next/link';
import { CheckCircle2, Calendar, MapPin, Users, Mail, Phone, ShieldCheck } from 'lucide-react';
import { getServerSupabase } from '@/lib/services/server-pricing';
import { formatUSD } from '@/lib/services/pricing';
import AuthorizeDepositButton from '@/components/booking/AuthorizeDepositButton';

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    bookingId?: string;
    mode?: string;
    // Fygaro append ces 2 params quand il redirige vers la Return URL :
    // ?reference=<transactionId>&customReference=<notre custom_reference JWT>
    // On parse customReference ("booking:<uuid>" ou "deposit:<uuid>") pour
    // extraire mode + bookingId.
    reference?: string;
    customReference?: string;
  }>;
}

/**
 * Page de retour après paiement Fygaro (mode=booking ou mode=deposit).
 *
 * Reçoit soit :
 *  - `customReference=booking:<uuid>` OU `customReference=deposit:<uuid>`
 *    quand Fygaro nous renvoie directement depuis leur Return URL
 *  - `bookingId=<uuid>&mode=booking|deposit` quand on redirige nous-mêmes
 *    (fallback interne, pratique pour des tests manuels)
 */
export default async function FygaroSuccessPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;

  // Priorité au customReference envoyé par Fygaro (source de vérité webhook)
  let bookingId = sp.bookingId || '';
  let mode = sp.mode || 'booking';
  if (sp.customReference) {
    const [refType, refId] = sp.customReference.split(':');
    if (refType && refId) {
      // Préfixes courts b:/d: (limite 40 chars Fygaro) + anciens booking:/deposit:
      // pour rétrocompat sur d'éventuelles redirections en flight.
      if (refType === 'b' || refType === 'booking') mode = 'booking';
      else if (refType === 'd' || refType === 'deposit') mode = 'deposit';
      bookingId = refId;
    }
  }

  const isFr = locale === 'fr';
  const isDepositMode = mode === 'deposit';

  type BookingView = {
    guest_name: string;
    guest_email: string;
    check_in: string;
    check_out: string;
    nights: number;
    guests_count: number;
    booking_total: number;
    payment_option: string;
    deposit_amount: number;
    remaining_balance: number;
    security_deposit_amount: number;
    deposit_authorization_status: string | null;
    apartments?: { title_fr?: string; title_en?: string; location?: string };
  };
  let booking: BookingView | null = null;

  if (bookingId) {
    try {
      const supabase = getServerSupabase();
      const { data } = await supabase
        .from('bookings')
        .select(`
          guest_name, guest_email, check_in, check_out, nights, guests_count,
          booking_total, payment_option, deposit_amount, remaining_balance,
          security_deposit_amount, deposit_authorization_status,
          apartments:apartment_id (title_fr, title_en, location)
        `)
        .eq('id', bookingId)
        .maybeSingle();
      if (data) {
        const apartments = Array.isArray(data.apartments) ? data.apartments[0] : data.apartments;
        booking = { ...data, apartments } as unknown as BookingView;
      }
    } catch {
      /* la page reste utilisable même si le fetch échoue */
    }
  }

  const villaName = booking?.apartments
    ? (isFr ? booking.apartments.title_fr : booking.apartments.title_en)
    : null;

  const isDepositBooking = booking?.payment_option === 'deposit_40';
  const paidAmount = booking
    ? (isDepositBooking ? booking.deposit_amount : booking.booking_total)
    : 0;

  return (
    <div className="min-h-screen bg-cream-100 py-20 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Hero confirmation */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-cream-50 border border-bronze-300 rounded-full flex items-center justify-center mx-auto mb-8">
            {isDepositMode
              ? <ShieldCheck className="w-10 h-10 text-bronze-500" strokeWidth={1.2} />
              : <CheckCircle2 className="w-10 h-10 text-bronze-500" strokeWidth={1.2} />}
          </div>
          <p className="section-label mb-4">
            {isDepositMode
              ? (isFr ? 'Empreinte enregistrée' : 'Card imprint on file')
              : (isFr ? 'Paiement reçu' : 'Payment received')}
          </p>
          <h1
            className="font-serif font-light text-night-600 mb-5 leading-[1.1]"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)' }}
          >
            {isDepositMode
              ? (isFr ? 'Votre caution est sécurisée' : 'Your deposit is secured')
              : (isFr ? 'Votre séjour est confirmé' : 'Your stay is confirmed')}
          </h1>
          <div className="w-12 h-px bg-bronze-400 mx-auto mb-6" />
          <p className="text-night-400 leading-relaxed font-light max-w-lg mx-auto">
            {isDepositMode
              ? (isFr
                  ? "Une empreinte de votre carte a été enregistrée en garantie. Aucun débit n'est effectué — le montant sera libéré automatiquement après votre départ, sauf en cas de dégât constaté."
                  : "A card imprint has been secured as a guarantee. No debit is made — the amount will be released automatically after your departure, unless damage is found.")
              : (isFr
                  ? "Nous avons reçu votre paiement et votre réservation est définitivement confirmée. Un email récapitulatif vient de vous être envoyé."
                  : "Your payment has been received and your booking is now confirmed. A confirmation email has just been sent to you.")}
          </p>
        </div>

        {/* Card récap */}
        {booking && (
          <div className="bg-cream-50 border border-bronze-100 rounded-2xl p-8 mb-8">
            <div className="flex items-baseline justify-between mb-6 pb-6 border-b border-bronze-100">
              <div>
                <p className="section-label mb-2">{isFr ? 'Votre villa' : 'Your villa'}</p>
                <h2 className="font-serif font-light text-2xl text-night-600">{villaName}</h2>
                {booking.apartments?.location && (
                  <div className="flex items-center gap-1.5 text-sm text-night-400 mt-1 font-light">
                    <MapPin size={13} className="text-bronze-400" />
                    {booking.apartments.location}
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="section-label mb-2">
                  {isDepositMode
                    ? (isFr ? 'Caution garantie' : 'Deposit secured')
                    : (isFr ? 'Montant réglé' : 'Amount paid')}
                </p>
                <p className="font-serif text-2xl text-night-600">
                  {formatUSD(isDepositMode ? booking.security_deposit_amount : paidAmount)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6 text-center">
              <Info icon={<Calendar size={14} className="text-bronze-400" />} label={isFr ? 'Arrivée' : 'Check-in'} value={booking.check_in} />
              <Info icon={<Calendar size={14} className="text-bronze-400" />} label={isFr ? 'Départ' : 'Check-out'} value={booking.check_out} />
              <Info icon={<Users size={14} className="text-bronze-400" />} label={isFr ? 'Voyageurs' : 'Guests'} value={`${booking.guests_count}`} />
            </div>

            {!isDepositMode && isDepositBooking && (
              <div className="bg-cream-100 border border-bronze-200 rounded-lg p-4 mb-4">
                <p className="text-[11px] uppercase font-medium text-bronze-600 mb-1" style={{ letterSpacing: '0.12em' }}>
                  {isFr ? 'Solde à régler avant arrivée' : 'Balance due before arrival'}
                </p>
                <p className="font-serif text-xl text-night-600">{formatUSD(booking.remaining_balance)}</p>
              </div>
            )}

            {!isDepositMode && (
              <div className="bg-cream-100 border border-bronze-100 rounded-lg p-4">
                <p className="text-[11px] uppercase font-medium text-night-500 mb-1" style={{ letterSpacing: '0.12em' }}>
                  {isFr ? 'Dépôt de garantie (empreinte CB)' : 'Security deposit (card imprint)'}
                </p>
                <p className="font-serif text-lg text-night-600">{formatUSD(booking.security_deposit_amount)}</p>
                <p className="text-xs text-night-400 mt-1 font-light">
                  {booking.deposit_authorization_status === 'authorized'
                    ? (isFr
                        ? "✓ Empreinte déjà posée sur votre carte. Aucun débit sauf en cas de dégât."
                        : "✓ Card imprint already secured. No debit unless damage is found.")
                    : (isFr
                        ? "Une empreinte de votre carte sera prise avant votre arrivée. Aucun débit sauf en cas de dégât constaté au départ."
                        : "A card imprint will be secured before your arrival. No debit unless damage is found at check-out.")}
                </p>
              </div>
            )}
          </div>
        )}

        {/* CTA caution — visible uniquement après le paiement séjour, si la
            caution n'a pas déjà été autorisée. La caution est prise sur un
            Payment Button Fygaro dédié avec Manual Capture (pré-autorisation
            sans débit immédiat). */}
        {!isDepositMode && booking && bookingId
          && booking.security_deposit_amount > 0
          && booking.deposit_authorization_status !== 'authorized' && (
          <div className="bg-cream-50 border-2 border-bronze-400 rounded-2xl p-8 mb-8">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-12 h-12 bg-bronze-100 rounded-full flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-6 h-6 text-bronze-500" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <p className="section-label mb-2 text-bronze-500">
                  {isFr ? 'Étape 2 sur 2' : 'Step 2 of 2'}
                </p>
                <h3 className="font-serif text-xl text-night-600 mb-2">
                  {isFr ? 'Autorisez votre caution' : 'Authorize your security deposit'}
                </h3>
                <p className="text-sm text-night-500 font-light leading-relaxed">
                  {isFr
                    ? <>Pour finaliser votre réservation, autorisez une empreinte CB de <strong>{formatUSD(booking.security_deposit_amount)}</strong> en garantie. <strong>Aucun débit</strong> n&apos;est effectué — le montant est simplement pré-autorisé sur votre carte et sera libéré après votre départ, sauf en cas de dégât.</>
                    : <>To finalize your reservation, authorize a card imprint of <strong>{formatUSD(booking.security_deposit_amount)}</strong> as a guarantee. <strong>No debit</strong> is charged — the amount is simply pre-authorized on your card and released after your departure, unless damage is found.</>}
                </p>
              </div>
            </div>
            <AuthorizeDepositButton
              bookingId={bookingId}
              label={isFr ? `Autoriser la caution — ${formatUSD(booking.security_deposit_amount)}` : `Authorize deposit — ${formatUSD(booking.security_deposit_amount)}`}
              loadingLabel={isFr ? 'Redirection…' : 'Redirecting…'}
              errorPrefix={isFr ? 'Erreur :' : 'Error:'}
            />
            <p className="text-[11px] text-night-400 mt-4 text-center font-light">
              {isFr
                ? "Étape obligatoire pour finaliser votre séjour."
                : 'Required step to finalize your stay.'}
            </p>
          </div>
        )}

        {/* Prochaines étapes */}
        <div className="bg-night-600 text-cream-100 rounded-2xl p-8 mb-8">
          <p className="text-[11px] uppercase font-medium text-bronze-300 mb-4" style={{ letterSpacing: '0.15em' }}>
            {isFr ? 'Prochaines étapes' : 'What happens next'}
          </p>
          <ul className="space-y-3 text-sm font-light">
            {isDepositMode ? (
              <>
                <Step text={isFr ? "Votre empreinte CB est active jusqu'à votre départ." : 'Your card imprint remains active until check-out.'} />
                <Step text={isFr ? "Aucun débit n'est effectué. La caution est simplement pré-autorisée." : 'No debit is charged. The deposit is simply pre-authorized.'} />
                <Step text={isFr ? "Libération automatique après votre départ, si aucun dégât n'est constaté." : 'Automatic release after check-out, if no damage is found.'} />
                <Step text={isFr ? "En cas de dégât, la propriétaire peut prélever le montant correspondant." : 'In case of damage, the owner may capture the corresponding amount.'} />
              </>
            ) : (
              <>
                <Step text={isFr ? 'Vous recevez votre email de confirmation avec tous les détails.' : 'You receive your confirmation email with all the details.'} />
                <Step text={isFr ? 'Vos dates sont bloquées dans notre calendrier.' : 'Your dates are blocked in our calendar.'} />
                <Step text={isFr ? "Nous vous contactons 48 h avant l'arrivée pour les instructions check-in." : 'We contact you 48 h before arrival with check-in instructions.'} />
                <Step text={isFr ? "Une empreinte CB de caution est prise avant l'arrivée (aucun débit sauf dégât)." : 'A card imprint is secured before arrival (no debit unless damage).'} />
              </>
            )}
          </ul>
        </div>

        {/* Référence */}
        {bookingId && (
          <div className="text-center mb-8">
            <p className="text-[10px] uppercase text-night-300 mb-1" style={{ letterSpacing: '0.2em' }}>
              {isFr ? 'Référence' : 'Reference'}
            </p>
            <p className="font-mono text-xs text-night-500 break-all">{bookingId}</p>
          </div>
        )}

        {/* CTA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link href={`/${locale}`} className="btn-primary text-center">
            {isFr ? "Retour à l'accueil" : 'Back to home'}
          </Link>
          <Link
            href={`/${locale}/apartments`}
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 border border-bronze-300 text-bronze-500 hover:bg-bronze-400 hover:text-cream-100 hover:border-bronze-400 transition-all duration-500 text-xs font-medium uppercase rounded-md"
            style={{ letterSpacing: '0.15em' }}
          >
            {isFr ? 'Voir nos villas' : 'Explore our villas'}
          </Link>
        </div>

        {/* Contact */}
        <div className="text-center mt-12 pt-8 border-t border-bronze-100">
          <p className="text-[10px] uppercase text-night-400 mb-3 font-medium" style={{ letterSpacing: '0.2em' }}>
            {isFr ? 'Une question ?' : 'Need anything?'}
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-night-500">
            <a href="mailto:contact@islandlivingsxm.com" className="inline-flex items-center gap-1.5 hover:text-bronze-500 transition-colors font-light">
              <Mail size={13} /> contact@islandlivingsxm.com
            </a>
            <a href="https://wa.me/15149476100" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-bronze-500 transition-colors font-light">
              <Phone size={13} /> +1 (514) 947-6100
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center justify-center gap-1.5 mb-1 text-[10px] uppercase text-night-400 font-medium" style={{ letterSpacing: '0.12em' }}>
        {icon}
        {label}
      </div>
      <div className="font-serif text-base text-night-600">{value}</div>
    </div>
  );
}

function Step({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3 text-cream-100/90">
      <CheckCircle2 size={14} className="text-bronze-300 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
      <span>{text}</span>
    </li>
  );
}
