import Link from 'next/link';

export default function PayPalCancelPage({
  searchParams,
}: {
  searchParams: { bookingId?: string };
}) {
  return (
    <div className="min-h-screen bg-[#f8f8f6] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-100 p-8 text-center">
        {/* Icône annulation */}
        <div className="w-16 h-16 bg-gray-50 border border-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <p className="text-xs font-semibold tracking-widest text-amber-600 uppercase mb-1">Island Living SXM</p>
        <h1 className="text-2xl font-serif text-gray-900 mb-3">Payment Cancelled</h1>
        <p className="text-gray-600 text-sm mb-6 leading-relaxed">
          Your payment was cancelled. No charges have been made. You can try again or choose a different payment method.
        </p>

        <div className="space-y-3">
          <Link
            href="/en/apartments"
            className="block w-full bg-gray-900 text-white py-3 rounded text-sm font-semibold hover:bg-gray-800 transition-colors"
          >
            Return to villas
          </Link>
          <a
            href="https://wa.me/15149476100"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full border border-gray-200 text-gray-600 py-3 rounded text-sm hover:border-gray-300 transition-colors"
          >
            Contact us via WhatsApp
          </a>
        </div>

        <p className="text-xs text-gray-400 mt-6">
          Need help?{' '}
          <a href="mailto:petrillis@bell.net" className="text-amber-600 hover:underline">
            petrillis@bell.net
          </a>
        </p>
      </div>
    </div>
  );
}
