import Link from 'next/link';

interface Props {
  searchParams: Promise<{ bookingId?: string }>;
}

export default async function PayPalSuccessPage({ searchParams }: Props) {
  const { bookingId = '' } = await searchParams;

  return (
    <div className="min-h-screen bg-[#f8f8f6] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-100 p-8 text-center">
        {/* Icône succès */}
        <div className="w-16 h-16 bg-green-50 border border-green-200 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <p className="text-xs font-semibold tracking-widest text-amber-600 uppercase mb-1">Island Living SXM</p>
        <h1 className="text-2xl font-serif text-gray-900 mb-3">Booking Confirmed</h1>
        <p className="text-gray-600 text-sm mb-6 leading-relaxed">
          Your payment has been processed successfully. A confirmation email has been sent to your inbox with all the details of your stay.
        </p>

        {bookingId && (
          <div className="bg-gray-50 rounded px-4 py-3 mb-6">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Booking reference</p>
            <p className="font-mono text-sm text-gray-700 break-all">{bookingId}</p>
          </div>
        )}

        <div className="bg-amber-50 border border-amber-100 rounded p-4 text-sm text-amber-800 mb-6 text-left">
          <p className="font-semibold mb-1">What happens next?</p>
          <ul className="space-y-1 text-xs">
            <li>✓ Confirmation email sent to your address</li>
            <li>✓ Dates blocked in our calendar</li>
            <li>✓ We will contact you 48h before arrival with check-in instructions</li>
            <li>✓ Security deposit due on arrival</li>
          </ul>
        </div>

        <div className="space-y-3">
          <Link
            href="/en"
            className="block w-full bg-gray-900 text-white py-3 rounded text-sm font-semibold hover:bg-gray-800 transition-colors"
          >
            Back to home
          </Link>
          <Link
            href="/en/apartments"
            className="block w-full border border-gray-200 text-gray-600 py-3 rounded text-sm hover:border-gray-300 transition-colors"
          >
            Explore our villas
          </Link>
        </div>

        <p className="text-xs text-gray-400 mt-6">
          Questions? Contact us at{' '}
          <a href="mailto:petrillis@bell.net" className="text-amber-600 hover:underline">
            petrillis@bell.net
          </a>{' '}
          or WhatsApp{' '}
          <a href="https://wa.me/15149476100" className="text-amber-600 hover:underline">
            +1 (514) 947-6100
          </a>
        </p>
      </div>
    </div>
  );
}
