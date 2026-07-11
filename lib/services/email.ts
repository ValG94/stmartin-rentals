// ============================================================
// Island Living SXM — Email Service (Resend)
// Envoie les emails de confirmation de réservation en FR ou EN
// selon la langue choisie par le voyageur.
// ============================================================

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.EMAIL_FROM || 'Island Living SXM <onboarding@resend.dev>';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'contact@islandlivingsxm.com';

export type Locale = 'fr' | 'en';

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
  locale?: Locale;
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

// ─────────────────────────────────────────────────────────────
// Dictionnaire de traductions
// ─────────────────────────────────────────────────────────────
const TR = {
  // Header
  brand:          { fr: 'Island Living SXM',                            en: 'Island Living SXM' },
  tagline:        { fr: 'LOCATIONS DE LUXE · SAINT-MARTIN',             en: 'LUXURY VACATION RENTALS · SINT MAARTEN' },
  // Salutations
  dear:           { fr: 'Bonjour',                                       en: 'Dear' },
  // Détails séjour
  checkInLbl:     { fr: 'Arrivée :',                                     en: 'Check-in:' },
  checkOutLbl:    { fr: 'Départ :',                                      en: 'Check-out:' },
  durationLbl:    { fr: 'Durée :',                                       en: 'Duration:' },
  durationVal:    { fr: (n: number) => `${n} nuit${n > 1 ? 's' : ''}`,   en: (n: number) => `${n} night${n > 1 ? 's' : ''}` },
  bookingRefLbl:  { fr: 'Référence de réservation :',                    en: 'Booking reference:' },
  // Summary
  paymentSummary: { fr: 'Récapitulatif du paiement',                     en: 'Payment Summary' },
  bookingSummary: { fr: 'Récapitulatif de la réservation',               en: 'Booking Summary' },
  stayLine:       { fr: (n: number, rate: string) => `Séjour (${n} nuit${n > 1 ? 's' : ''} × ${rate})`, en: (n: number, rate: string) => `Stay (${n} nights × ${rate})` },
  cleaningFee:    { fr: 'Frais de ménage',                               en: 'Cleaning fee' },
  total:          { fr: 'Total',                                         en: 'Total' },
  depositPaid:    { fr: 'Acompte versé (40 %)',                          en: 'Deposit paid (40%)' },
  remainingBal:   { fr: 'Solde restant',                                 en: 'Remaining balance' },
  securityDep:    { fr: 'Dépôt de garantie (empreinte CB à l\'arrivée)',  en: 'Security deposit (card imprint on arrival)' },
  securityNote:   { fr: 'Empreinte bancaire prise à votre arrivée par carte bancaire. Aucun débit ne sera effectué sauf en cas de dégât constaté au départ. Si vous avez réglé par virement bancaire, merci de présenter une carte bancaire à l\'arrivée pour l\'empreinte.', en: 'Card imprint taken on arrival. No amount will be charged unless damage is found at check-out. If you paid by bank transfer, please present a credit card on arrival for the imprint.' },
  // Bank transfer instructions
  wireTitle:      { fr: 'Instructions de virement (USD)',                en: 'Wire Transfer Instructions (USD)' },
  amountToTransfer:{ fr: 'Montant à virer :',                            en: 'Amount to transfer:' },
  beneficiary:    { fr: 'Bénéficiaire :',                                en: 'Beneficiary:' },
  accountNumber:  { fr: 'Numéro de compte :',                            en: 'Account number:' },
  bankLbl:        { fr: 'Banque :',                                      en: 'Bank:' },
  correspondent:  { fr: 'Banque correspondante :',                       en: 'Correspondent bank:' },
  swiftLbl:       { fr: 'SWIFT :',                                       en: 'SWIFT:' },
  routingLbl:     { fr: 'Numéro de routage :',                           en: 'Routing number:' },
  addressLbl:     { fr: 'Adresse :',                                     en: 'Address:' },
  bookingRefNote: { fr: (id: string) => `Merci d'indiquer la référence de réservation <strong>${id}</strong> dans les notes du virement.`, en: (id: string) => `Please include your booking reference <strong>${id}</strong> in the transfer notes.` },
  // Status messages
  confirmed:      { fr: 'Réservation confirmée ✓',                       en: 'Booking Confirmed ✓' },
  confirmedIntro: { fr: (villa: string) => `Votre réservation à <strong>${villa}</strong> est confirmée. Nous avons hâte de vous accueillir.`, en: (villa: string) => `Your reservation at <strong>${villa}</strong> has been confirmed. We look forward to welcoming you.` },
  pendingTitle:   { fr: 'Demande de réservation reçue',                  en: 'Booking Request Received' },
  pendingIntro:   { fr: (villa: string) => `Nous avons bien reçu votre demande de réservation pour <strong>${villa}</strong>. Votre réservation sera <strong>confirmée dès réception du virement</strong>.`, en: (villa: string) => `We have received your booking request for <strong>${villa}</strong>. Your reservation will be <strong>confirmed upon receipt of your bank transfer</strong>.` },
  // Important notice
  importantTitle: { fr: 'Important',                                     en: 'Important' },
  importantBody:  { fr: 'Votre réservation n\'est pas encore confirmée. Les dates sont réservées pendant 48 h en attente du virement. Merci d\'effectuer le virement dans ce délai pour garantir votre séjour.', en: 'Your reservation is not yet confirmed. Dates will be held for 48 hours pending receipt of funds. Please transfer within this timeframe to secure your booking.' },
  // Cancellation
  cancelTitle:    { fr: 'Conditions d\'annulation',                       en: 'Cancellation Policy' },
  cancelMore30:   { fr: 'Plus de 30 jours avant l\'arrivée : remboursement possible selon conditions', en: 'More than 30 days before arrival: refund possible per conditions' },
  cancel30to14:   { fr: '30 à 14 jours avant l\'arrivée : acompte non remboursable',                   en: '30–14 days before arrival: deposit non-refundable' },
  cancelLess14:   { fr: 'Moins de 14 jours avant l\'arrivée : acompte non remboursable, surplus à la discrétion de l\'hôte', en: 'Less than 14 days before arrival: deposit non-refundable; any surplus at owner\'s discretion' },
  cancelNoShow:   { fr: 'No-show : aucun remboursement',                  en: 'No-show: no refund' },
  cancelOwner:    { fr: 'Annulation par l\'hôte : remboursement intégral', en: 'Owner cancellation: full refund' },
  // Footer
  questions:      { fr: (mail: string) => `Pour toute question, contactez-nous à <a href="mailto:${mail}" style="color:#c9a96e;">${mail}</a> ou via WhatsApp au +1 (514) 947-6100.`, en: (mail: string) => `If you have any questions, please contact us at <a href="mailto:${mail}" style="color:#c9a96e;">${mail}</a> or via WhatsApp at +1 (514) 947-6100.` },
  signature:      { fr: 'Island Living SXM · Saint-Martin · Caraïbes',   en: 'Island Living SXM · Sint Maarten / Saint-Martin · Caribbean' },
  // Email subjects
  subjectConfirmed: { fr: (villa: string) => `Réservation confirmée — ${villa} | Island Living SXM`, en: (villa: string) => `Booking Confirmed — ${villa} | Island Living SXM` },
  subjectPending:   { fr: (villa: string) => `Demande de réservation — ${villa} | En attente du virement`, en: (villa: string) => `Booking Request — ${villa} | Awaiting Bank Transfer` },
};

function t<K extends keyof typeof TR>(key: K, locale: Locale): typeof TR[K]['en'] {
  return TR[key][locale];
}

function formatUSD(amount: number): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// ─────────────────────────────────────────────────────────────
// HTML partials
// ─────────────────────────────────────────────────────────────
function headerHtml(locale: Locale): string {
  return `
    <div style="background:#0a0a0a;padding:24px;text-align:center;">
      <h1 style="color:#c9a96e;font-size:22px;margin:0;">${t('brand', locale)}</h1>
      <p style="color:#888;font-size:12px;margin:4px 0 0;">${t('tagline', locale)}</p>
    </div>
  `;
}

function stayDetailsHtml(d: BookingEmailData, locale: Locale): string {
  const durationFn = t('durationVal', locale) as (n: number) => string;
  return `
    <div style="background:#f8f8f6;padding:16px;border-radius:4px;margin:20px 0;">
      <p style="margin:4px 0;"><strong>${t('checkInLbl', locale)}</strong> ${d.checkIn}</p>
      <p style="margin:4px 0;"><strong>${t('checkOutLbl', locale)}</strong> ${d.checkOut}</p>
      <p style="margin:4px 0;"><strong>${t('durationLbl', locale)}</strong> ${durationFn(d.nights)}</p>
      <p style="margin:4px 0;"><strong>${t('bookingRefLbl', locale)}</strong> ${d.bookingId}</p>
    </div>
  `;
}

function bookingSummaryHtml(d: BookingEmailData, locale: Locale): string {
  const stayFn = t('stayLine', locale) as (n: number, rate: string) => string;
  const rate = formatUSD(d.accommodationAmount / d.nights);
  return `
    <table style="width:100%;border-collapse:collapse;font-size:14px;color:#333;">
      <tr><td style="padding:6px 0;border-bottom:1px solid #eee;">${stayFn(d.nights, rate)}</td><td style="text-align:right;padding:6px 0;border-bottom:1px solid #eee;">${formatUSD(d.accommodationAmount)}</td></tr>
      <tr><td style="padding:6px 0;border-bottom:1px solid #eee;">${t('cleaningFee', locale)}</td><td style="text-align:right;padding:6px 0;border-bottom:1px solid #eee;">${formatUSD(d.cleaningFee)}</td></tr>
      <tr style="font-weight:bold;"><td style="padding:6px 0;border-bottom:2px solid #c9a96e;">${t('total', locale)}</td><td style="text-align:right;padding:6px 0;border-bottom:2px solid #c9a96e;">${formatUSD(d.bookingTotal)}</td></tr>
      ${d.paymentOption === 'deposit_40' ? `
      <tr><td style="padding:6px 0;color:#c9a96e;">${t('depositPaid', locale)}</td><td style="text-align:right;padding:6px 0;color:#c9a96e;">${formatUSD(d.depositAmount)}</td></tr>
      <tr><td style="padding:6px 0;">${t('remainingBal', locale)}</td><td style="text-align:right;padding:6px 0;">${formatUSD(d.remainingBalance)}</td></tr>
      ` : ''}
      <tr><td style="padding:6px 0;color:#888;font-style:italic;">${t('securityDep', locale)}</td><td style="text-align:right;padding:6px 0;color:#888;font-style:italic;">${formatUSD(d.securityDepositAmount)}</td></tr>
    </table>
    <p style="font-size:12px;color:#888;margin-top:8px;">${t('securityNote', locale)}</p>
  `;
}

function bankInstructionsHtml(d: BookingEmailData, locale: Locale): string {
  if (!d.bankDetails) return '';
  const amountDue = d.paymentOption === 'full' ? d.bookingTotal : d.depositAmount;
  const refFn = t('bookingRefNote', locale) as (id: string) => string;
  return `
    <div style="background:#f8f8f6;border:1px solid #e0d8cc;padding:16px;border-radius:4px;margin:20px 0;">
      <h3 style="color:#c9a96e;font-size:14px;margin:0 0 12px;">${t('wireTitle', locale)}</h3>
      <p style="margin:4px 0;font-size:13px;"><strong>${t('amountToTransfer', locale)}</strong> ${formatUSD(amountDue)} USD</p>
      <p style="margin:4px 0;font-size:13px;"><strong>${t('beneficiary', locale)}</strong> ${d.bankDetails.beneficiaryName}</p>
      <p style="margin:4px 0;font-size:13px;"><strong>${t('accountNumber', locale)}</strong> ${d.bankDetails.beneficiaryAccount}</p>
      <p style="margin:4px 0;font-size:13px;"><strong>${t('bankLbl', locale)}</strong> ${d.bankDetails.bankName}</p>
      ${d.bankDetails.correspondentBank ? `<p style="margin:4px 0;font-size:13px;"><strong>${t('correspondent', locale)}</strong> ${d.bankDetails.correspondentBank}</p>` : ''}
      <p style="margin:4px 0;font-size:13px;"><strong>${t('swiftLbl', locale)}</strong> ${d.bankDetails.swiftCode}</p>
      ${d.bankDetails.routingNumber ? `<p style="margin:4px 0;font-size:13px;"><strong>${t('routingLbl', locale)}</strong> ${d.bankDetails.routingNumber}</p>` : ''}
      ${d.bankDetails.beneficiaryAddress ? `<p style="margin:4px 0;font-size:13px;"><strong>${t('addressLbl', locale)}</strong> ${d.bankDetails.beneficiaryAddress}</p>` : ''}
      <p style="margin:12px 0 0;font-size:12px;color:#888;font-style:italic;">${d.bankDetails.bankChargesNotice || ''}</p>
      <p style="margin:8px 0 0;font-size:12px;color:#888;">${refFn(d.bookingId)}</p>
    </div>
  `;
}

function cancellationPolicyHtml(locale: Locale): string {
  return `
    <div style="background:#f8f8f6;border-left:3px solid #c9a96e;padding:12px 16px;margin:16px 0;font-size:13px;color:#555;">
      <strong>${t('cancelTitle', locale)}</strong><br/>
      • ${t('cancelMore30', locale)}<br/>
      • ${t('cancel30to14', locale)}<br/>
      • ${t('cancelLess14', locale)}<br/>
      • ${t('cancelNoShow', locale)}<br/>
      • ${t('cancelOwner', locale)}
    </div>
  `;
}

function footerHtml(locale: Locale): string {
  const questionsFn = t('questions', locale) as (m: string) => string;
  return `
    <p>${questionsFn('contact@islandlivingsxm.com')}</p>
    <p style="color:#888;font-size:12px;margin-top:32px;">${t('signature', locale)}</p>
  `;
}

// ─────────────────────────────────────────────────────────────
// Send
// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
// Email 1 : Confirmation de réservation payée (PayPal ou virement reçu)
// ─────────────────────────────────────────────────────────────
export async function sendBookingConfirmationEmail(d: BookingEmailData): Promise<void> {
  const locale: Locale = d.locale === 'fr' ? 'fr' : 'en';
  const subjectFn = t('subjectConfirmed', locale) as (v: string) => string;
  const introFn = t('confirmedIntro', locale) as (v: string) => string;

  const html = `
    <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#333;">
      ${headerHtml(locale)}
      <div style="padding:32px 24px;">
        <h2 style="color:#0a0a0a;font-size:18px;">${t('confirmed', locale)}</h2>
        <p>${t('dear', locale)} ${d.guestName},</p>
        <p>${introFn(d.villaName)}</p>
        ${stayDetailsHtml(d, locale)}
        <h3 style="font-size:15px;color:#0a0a0a;">${t('paymentSummary', locale)}</h3>
        ${bookingSummaryHtml(d, locale)}
        ${cancellationPolicyHtml(locale)}
        ${footerHtml(locale)}
      </div>
    </div>
  `;
  await sendEmail(d.guestEmail, subjectFn(d.villaName), html);
  await sendAdminNotificationEmail(d, 'confirmed');
}

// ─────────────────────────────────────────────────────────────
// Email 2 : Demande de réservation en attente de virement
// ─────────────────────────────────────────────────────────────
export async function sendBankTransferPendingEmail(d: BookingEmailData): Promise<void> {
  const locale: Locale = d.locale === 'fr' ? 'fr' : 'en';
  const subjectFn = t('subjectPending', locale) as (v: string) => string;
  const introFn = t('pendingIntro', locale) as (v: string) => string;

  const html = `
    <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#333;">
      ${headerHtml(locale)}
      <div style="padding:32px 24px;">
        <h2 style="color:#0a0a0a;font-size:18px;">${t('pendingTitle', locale)}</h2>
        <p>${t('dear', locale)} ${d.guestName},</p>
        <p>${introFn(d.villaName)}</p>
        ${stayDetailsHtml(d, locale)}
        <h3 style="font-size:15px;color:#0a0a0a;">${t('bookingSummary', locale)}</h3>
        ${bookingSummaryHtml(d, locale)}
        ${bankInstructionsHtml(d, locale)}
        <div style="background:#fff3cd;border:1px solid #ffc107;padding:12px 16px;border-radius:4px;margin:16px 0;font-size:13px;">
          ⚠️ <strong>${t('importantTitle', locale)} :</strong> ${t('importantBody', locale)}
        </div>
        ${cancellationPolicyHtml(locale)}
        ${footerHtml(locale)}
      </div>
    </div>
  `;
  await sendEmail(d.guestEmail, subjectFn(d.villaName), html);
  await sendAdminNotificationEmail(d, 'pending_bank_transfer');
}

// ─────────────────────────────────────────────────────────────
// Email 3 : Notification admin (toujours en EN — propriétaire bilingue)
// ─────────────────────────────────────────────────────────────
async function sendAdminNotificationEmail(d: BookingEmailData, status: string): Promise<void> {
  const statusLabel = status === 'confirmed' ? '✅ CONFIRMED' : '⏳ PENDING BANK TRANSFER';
  const html = `
    <div style="font-family:monospace;max-width:600px;margin:0 auto;color:#333;font-size:13px;">
      <h2 style="color:#c9a96e;">New Booking — ${statusLabel}</h2>
      <p><strong>Guest:</strong> ${d.guestName} (${d.guestEmail})</p>
      <p><strong>Locale:</strong> ${d.locale || 'en'}</p>
      <p><strong>Villa:</strong> ${d.villaName}</p>
      <p><strong>Check-in:</strong> ${d.checkIn} | <strong>Check-out:</strong> ${d.checkOut} (${d.nights} nights)</p>
      <p><strong>Total:</strong> $${d.bookingTotal} | <strong>Payment:</strong> ${d.paymentOption === 'full' ? 'Full payment' : '40% deposit ($' + d.depositAmount + ')'}</p>
      <p><strong>Method:</strong> ${d.paymentMethod}</p>
      <p><strong>Booking ID:</strong> ${d.bookingId}</p>
      <hr/>
      <p><a href="https://islandlivingsxm.com/en/admin/bookings">View in admin dashboard →</a></p>
    </div>
  `;
  await sendEmail(ADMIN_EMAIL, `[Island Living SXM] New Booking — ${d.guestName} — ${statusLabel}`, html);
}
