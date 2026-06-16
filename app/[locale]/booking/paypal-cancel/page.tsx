import Link from 'next/link';
import { XCircle, Mail, Phone } from 'lucide-react';

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ bookingId?: string }>;
}

export default async function PayPalCancelPage({ params, searchParams }: Props) {
  const { locale } = await params;
  await searchParams;
  const isFr = locale === 'fr';

  return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center px-4 py-20">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-cream-50 border border-bronze-200 rounded-full flex items-center justify-center mx-auto mb-8">
            <XCircle className="w-10 h-10 text-night-400" strokeWidth={1.2} />
          </div>
          <p className="section-label mb-4">{isFr ? 'Paiement interrompu' : 'Payment cancelled'}</p>
          <h1
            className="font-serif font-light text-night-600 mb-5 leading-[1.1]"
            style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}
          >
            {isFr ? 'Aucun débit n’a été effectué' : 'No payment was made'}
          </h1>
          <div className="w-12 h-px bg-bronze-400 mx-auto mb-6" />
          <p className="text-night-400 leading-relaxed font-light">
            {isFr
              ? 'Vous avez interrompu votre paiement. Aucun montant n’a été prélevé. Vous pouvez reprendre votre réservation ou choisir un autre moyen de paiement.'
              : 'You cancelled the payment. No amount was charged. You can resume your booking or choose another payment method.'}
          </p>
        </div>

        <div className="space-y-3">
          <Link href={`/${locale}/apartments`} className="btn-primary w-full text-center">
            {isFr ? 'Reprendre la réservation' : 'Resume booking'}
          </Link>
          <a
            href="https://wa.me/15149476100"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full px-8 py-3.5 border border-bronze-300 text-bronze-500 hover:bg-bronze-400 hover:text-cream-100 hover:border-bronze-400 transition-all duration-500 text-xs font-medium uppercase rounded-md"
            style={{ letterSpacing: '0.15em' }}
          >
            {isFr ? 'Nous contacter via WhatsApp' : 'Contact us via WhatsApp'}
          </a>
        </div>

        <div className="text-center mt-12 pt-8 border-t border-bronze-100">
          <p className="text-[10px] uppercase text-night-400 mb-3 font-medium" style={{ letterSpacing: '0.2em' }}>
            {isFr ? 'Besoin d’aide ?' : 'Need help?'}
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
