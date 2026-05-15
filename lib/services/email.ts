// ============================================================
// Island Living SXM — Email Service (Resend)
// Envoie les emails de confirmation de réservation
// ============================================================

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = 'Island Living SXM <noreply@islandlivingsxm.com>';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'petrillis@bell.net';

interface BookingEmailData {
  guestName: string;
  guestEmail: string;
  villaName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  accommodationAmount: number;
  cleaningFee: number;
  bookingTotal: number;
  paymentOption: 'full' | 'deposit_40';
  depositAmount: number;
  remainingBalance: number;
  securityDepositAmount: number;
  paymentMethod: string;
  bookingId: string;
  bankDetails?: BankDetails;
}

interface BankDetails {
  bankName: string;
  correspondentBank?: string;
  swiftCode: string;
  routingNumber?: string;
  beneficiaryName: string;
  beneficiaryAccount: string;
  beneficiaryAddress?: string;
  bankChargesNotice?: string;
}

function formatUSD(amount: number): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function cancellationPolicyHtml(): string {
  return `
    <div style="background:#f8f8f6;border-left:3px solid #c9a96e;padding:12px 16px;margin:16px 0;font-size:13px;color:#555;">
      <strong>Cancellation Policy</strong><br/>
      • More than 30 days before arrival: refund possible per conditions<br/>
      • 30–14 days before arrival: deposit non-refundable<br/>
      • Less than 14 days before arrival: deposit non-refundable; any surplus at owner's discretion<br/>
      • No-show: no refund<br/>
      • Owner cancellation: full refund
    </div>
  `;
}

function bookingSummaryHtml(d: BookingEmailData): string {
  const amountDue = d.paymentOption === 'full' ? d.bookingTotal : d.depositAmount;
  return `
    <table style="width:100%;border-collapse:collapse;font-size:14px;color:#333;">
      <tr><td style="padding:6px 0;border-bottom:1px solid #eee;">Stay (${d.nights} nights × ${formatUSD(d.accommodationAmount / d.nights)})</td><td style="text-align:right;padding:6px 0;border-bottom:1px solid #eee;">${formatUSD(d.accommodationAmount)}</td></tr>
      <tr><td style="padding:6px 0;border-bottom:1px solid #eee;">Cleaning fee</td><td style="text-align:right;padding:6px 0;border-bottom:1px solid #eee;">${formatUSD(d.cleaningFee)}</td></tr>
      <tr style="font-weight:bold;"><td style="padding:6px 0;border-bottom:2px solid #c9a96e;">Total</td><td style="text-align:right;padding:6px 0;border-bottom:2px solid #c9a96e;">${formatUSD(d.bookingTotal)}</td></tr>
      ${d.paymentOption === 'deposit_40' ? `
      <tr><td style="padding:6px 0;color:#c9a96e;">Deposit paid (40%)</td><td style="text-align:right;padding:6px 0;color:#c9a96e;">${formatUSD(d.depositAmount)}</td></tr>
      <tr><td style="padding:6px 0;">Remaining balance</td><td style="text-align:right;padding:6px 0;">${formatUSD(d.remainingBalance)}</td></tr>
      ` : ''}
      <tr><td style="padding:6px 0;color:#888;font-style:italic;">Security deposit (on arrival)</td><td style="text-align:right;padding:6px 0;color:#888;font-style:italic;">${formatUSD(d.securityDepositAmount)}</td></tr>
    </table>
    <p style="font-size:12px;color:#888;margin-top:8px;">Security deposit due on arrival, payable in cash or by card. Refunded within 48 hours after check-out if no damage is found.</p>
  `;
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!RESEND_API_KEY) {
    console.log(`[EMAIL MOCK] To: ${to} | Subject: ${subject}`);
    return;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error(`[EMAIL ERROR] ${err}`);
  }
}

// ── Email 1 : Confirmation de réservation payée (PayPal) ──────────────────
export async function sendBookingConfirmationEmail(d: BookingEmailData): Promise<void> {
  const html = `
    <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#333;">
      <div style="background:#0a0a0a;padding:24px;text-align:center;">
        <h1 style="color:#c9a96e;font-size:22px;margin:0;">Island Living SXM</h1>
        <p style="color:#888;font-size:12px;margin:4px 0 0;">LUXURY VACATION RENTALS · SINT MAARTEN</p>
      </div>
      <div style="padding:32px 24px;">
        <h2 style="color:#0a0a0a;font-size:18px;">Booking Confirmed ✓</h2>
        <p>Dear ${d.guestName},</p>
        <p>Your reservation at <strong>${d.villaName}</strong> has been confirmed. We look forward to welcoming you.</p>
        <div style="background:#f8f8f6;padding:16px;border-radius:4px;margin:20px 0;">
          <p style="margin:4px 0;"><strong>Check-in:</strong> ${d.checkIn}</p>
          <p style="margin:4px 0;"><strong>Check-out:</strong> ${d.checkOut}</p>
          <p style="margin:4px 0;"><strong>Duration:</strong> ${d.nights} nights</p>
          <p style="margin:4px 0;"><strong>Booking reference:</strong> ${d.bookingId}</p>
        </div>
        <h3 style="font-size:15px;color:#0a0a0a;">Payment Summary</h3>
        ${bookingSummaryHtml(d)}
        ${cancellationPolicyHtml()}
        <p>If you have any questions, please contact us at <a href="mailto:petrillis@bell.net" style="color:#c9a96e;">petrillis@bell.net</a> or via WhatsApp at +1 (514) 947-6100.</p>
        <p style="color:#888;font-size:12px;margin-top:32px;">Island Living SXM · Sint Maarten / Saint-Martin · Caribbean</p>
      </div>
    </div>
  `;
  await sendEmail(d.guestEmail, `Booking Confirmed — ${d.villaName} | Island Living SXM`, html);
  await sendAdminNotificationEmail(d, 'confirmed');
}

// ── Email 2 : Demande de réservation en attente de virement ───────────────
export async function sendBankTransferPendingEmail(d: BookingEmailData): Promise<void> {
  const amountDue = d.paymentOption === 'full' ? d.bookingTotal : d.depositAmount;
  const bankHtml = d.bankDetails ? `
    <div style="background:#f8f8f6;border:1px solid #e0d8cc;padding:16px;border-radius:4px;margin:20px 0;">
      <h3 style="color:#c9a96e;font-size:14px;margin:0 0 12px;">Wire Transfer Instructions (USD)</h3>
      <p style="margin:4px 0;font-size:13px;"><strong>Amount to transfer:</strong> ${formatUSD(amountDue)} USD</p>
      <p style="margin:4px 0;font-size:13px;"><strong>Beneficiary:</strong> ${d.bankDetails.beneficiaryName}</p>
      <p style="margin:4px 0;font-size:13px;"><strong>Account number:</strong> ${d.bankDetails.beneficiaryAccount}</p>
      <p style="margin:4px 0;font-size:13px;"><strong>Bank:</strong> ${d.bankDetails.bankName}</p>
      ${d.bankDetails.correspondentBank ? `<p style="margin:4px 0;font-size:13px;"><strong>Correspondent bank:</strong> ${d.bankDetails.correspondentBank}</p>` : ''}
      <p style="margin:4px 0;font-size:13px;"><strong>SWIFT:</strong> ${d.bankDetails.swiftCode}</p>
      ${d.bankDetails.routingNumber ? `<p style="margin:4px 0;font-size:13px;"><strong>Routing number:</strong> ${d.bankDetails.routingNumber}</p>` : ''}
      ${d.bankDetails.beneficiaryAddress ? `<p style="margin:4px 0;font-size:13px;"><strong>Address:</strong> ${d.bankDetails.beneficiaryAddress}</p>` : ''}
      <p style="margin:12px 0 0;font-size:12px;color:#888;font-style:italic;">${d.bankDetails.bankChargesNotice || ''}</p>
      <p style="margin:8px 0 0;font-size:12px;color:#888;">Please include your booking reference <strong>${d.bookingId}</strong> in the transfer notes.</p>
    </div>
  ` : '';

  const html = `
    <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#333;">
      <div style="background:#0a0a0a;padding:24px;text-align:center;">
        <h1 style="color:#c9a96e;font-size:22px;margin:0;">Island Living SXM</h1>
        <p style="color:#888;font-size:12px;margin:4px 0 0;">LUXURY VACATION RENTALS · SINT MAARTEN</p>
      </div>
      <div style="padding:32px 24px;">
        <h2 style="color:#0a0a0a;font-size:18px;">Booking Request Received</h2>
        <p>Dear ${d.guestName},</p>
        <p>We have received your booking request for <strong>${d.villaName}</strong>. Your reservation will be <strong>confirmed upon receipt of your bank transfer</strong>.</p>
        <div style="background:#f8f8f6;padding:16px;border-radius:4px;margin:20px 0;">
          <p style="margin:4px 0;"><strong>Check-in:</strong> ${d.checkIn}</p>
          <p style="margin:4px 0;"><strong>Check-out:</strong> ${d.checkOut}</p>
          <p style="margin:4px 0;"><strong>Duration:</strong> ${d.nights} nights</p>
          <p style="margin:4px 0;"><strong>Booking reference:</strong> ${d.bookingId}</p>
        </div>
        <h3 style="font-size:15px;color:#0a0a0a;">Booking Summary</h3>
        ${bookingSummaryHtml(d)}
        ${bankHtml}
        <div style="background:#fff3cd;border:1px solid #ffc107;padding:12px 16px;border-radius:4px;margin:16px 0;font-size:13px;">
          ⚠️ <strong>Important:</strong> Your reservation is not yet confirmed. Dates will be held for 48 hours pending receipt of funds. Please transfer within this timeframe to secure your booking.
        </div>
        ${cancellationPolicyHtml()}
        <p>Questions? Contact us at <a href="mailto:petrillis@bell.net" style="color:#c9a96e;">petrillis@bell.net</a> or WhatsApp +1 (514) 947-6100.</p>
        <p style="color:#888;font-size:12px;margin-top:32px;">Island Living SXM · Sint Maarten / Saint-Martin · Caribbean</p>
      </div>
    </div>
  `;
  await sendEmail(d.guestEmail, `Booking Request — ${d.villaName} | Awaiting Bank Transfer`, html);
  await sendAdminNotificationEmail(d, 'pending_bank_transfer');
}

// ── Email 3 : Notification admin ─────────────────────────────────────────
async function sendAdminNotificationEmail(d: BookingEmailData, status: string): Promise<void> {
  const statusLabel = status === 'confirmed' ? '✅ CONFIRMED (PayPal)' : '⏳ PENDING BANK TRANSFER';
  const html = `
    <div style="font-family:monospace;max-width:600px;margin:0 auto;color:#333;font-size:13px;">
      <h2 style="color:#c9a96e;">New Booking — ${statusLabel}</h2>
      <p><strong>Guest:</strong> ${d.guestName} (${d.guestEmail})</p>
      <p><strong>Villa:</strong> ${d.villaName}</p>
      <p><strong>Check-in:</strong> ${d.checkIn} | <strong>Check-out:</strong> ${d.checkOut} (${d.nights} nights)</p>
      <p><strong>Total:</strong> $${d.bookingTotal} | <strong>Payment:</strong> ${d.paymentOption === 'full' ? 'Full payment' : '40% deposit ($' + d.depositAmount + ')'}</p>
      <p><strong>Method:</strong> ${d.paymentMethod}</p>
      <p><strong>Booking ID:</strong> ${d.bookingId}</p>
      <hr/>
      <p><a href="https://stmartin-rentals-seven.vercel.app/en/admin/bookings">View in admin dashboard →</a></p>
    </div>
  `;
  await sendEmail(ADMIN_EMAIL, `[Island Living SXM] New Booking — ${d.guestName} — ${statusLabel}`, html);
}
