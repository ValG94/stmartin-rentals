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
  paymentMethod: string;         // 'card' | 'bank_transfer' | 'paypal' etc.
  bookingId: string;
  locale?: Locale;
  bankDetails?: BankDetails;
  // Statut de l'empreinte caution (uniquement pertinent pour paiement CB).
  // Si 'authorized' → note "empreinte enregistrée". Sinon → CTA
  // "Autoriser mon empreinte" avec lien vers la page fygaro-success.
  depositAuthorizationStatus?: 'authorized' | 'captured' | 'voided' | 'expired' | null;
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
  securityDep:    { fr: 'Dépôt de garantie (empreinte CB)',              en: 'Security deposit (card imprint)' },
  // Note affichée quand la caution n'est PAS payable en ligne
  // (virement bancaire) — empreinte à l'arrivée.
  securityNoteOffline: { fr: 'Empreinte bancaire prise à votre arrivée par carte bancaire. Aucun débit ne sera effectué sauf en cas de dégât constaté au départ.', en: 'Card imprint taken on arrival. No amount will be charged unless damage is found at check-out.' },
  // Notes affichées pour un paiement par carte (Fygaro) : empreinte
  // sécurisée en ligne, avec fallback lien si le client a fermé son
  // navigateur avant l'étape 2.
  securityNoteOnlinePending: { fr: 'Pour finaliser votre réservation, autorisez l\'empreinte CB en ligne (aucun débit — pré-autorisation libérée après votre séjour).', en: 'To finalize your reservation, authorize the card imprint online (no debit — pre-authorization released after your stay).' },
  securityNoteOnlineDone: { fr: 'L\'empreinte de votre carte a bien été enregistrée. Aucun débit sauf en cas de dégât constaté au départ. Libération automatique après votre séjour.', en: 'Your card imprint has been secured. No debit unless damage is found at check-out. Automatic release after your stay.' },
  authorizeDepositBtn: { fr: 'Autoriser mon empreinte CB', en: 'Authorize my card imprint' },
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
  subjectCancelled: { fr: (villa: string) => `Réservation annulée — ${villa} | Island Living SXM`, en: (villa: string) => `Booking Cancelled — ${villa} | Island Living SXM` },
  // Cancellation email content
  cancelledTitle:   { fr: 'Réservation annulée',                            en: 'Booking Cancelled' },
  cancelledIntro:   { fr: (villa: string) => `Nous vous informons que votre réservation pour <strong>${villa}</strong> a été annulée.`, en: (villa: string) => `We are writing to inform you that your booking for <strong>${villa}</strong> has been cancelled.` },
  cancelledReason:  { fr: 'Motif de l\'annulation',                          en: 'Reason for cancellation' },
  cancelledRefund:  { fr: 'Remboursement',                                   en: 'Refund' },
  cancelledRefundBody: {
    fr: 'Si un paiement a déjà été reçu, nous procéderons au remboursement selon nos conditions d\'annulation (voir ci-dessous). En cas de virement bancaire, le remboursement peut nécessiter des frais bancaires internationaux — nous vous tiendrons informé.',
    en: 'If a payment has already been received, we will proceed with the refund according to our cancellation policy (see below). For bank transfers, refund may incur international banking fees — we will keep you informed.',
  },
  cancelledContact: { fr: 'N\'hésitez pas à nous contacter pour toute question ou pour reprogrammer votre séjour.', en: 'Please feel free to contact us with any questions or to reschedule your stay.' },
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

  // Choix de la note caution en fonction du mode de paiement :
  //  - card (Fygaro) → empreinte se fait EN LIGNE (déjà faite ou pending)
  //  - autre (virement)  → empreinte à l'arrivée sur place
  const isCardPayment = d.paymentMethod === 'card' || d.paymentMethod === 'fygaro';
  const depositAlreadySecured = d.depositAuthorizationStatus === 'authorized';
  let securityNoteKey: 'securityNoteOnlineDone' | 'securityNoteOnlinePending' | 'securityNoteOffline';
  if (isCardPayment) {
    securityNoteKey = depositAlreadySecured ? 'securityNoteOnlineDone' : 'securityNoteOnlinePending';
  } else {
    securityNoteKey = 'securityNoteOffline';
  }

  // CTA "Autoriser mon empreinte" — visible uniquement si paiement CB
  // ET empreinte pas encore posée. Pointe vers la page fygaro-success avec
  // le bookingId, qui déclenche l'affichage du bouton "Autoriser la caution".
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://islandlivingsxm.com').replace(/\/+$/, '');
  const authorizeUrl = `${siteUrl}/${locale}/booking/fygaro-success?bookingId=${d.bookingId}&mode=booking`;
  const authorizeCta = (isCardPayment && !depositAlreadySecured) ? `
    <div style="text-align:center;margin:16px 0 4px;">
      <a href="${authorizeUrl}" style="display:inline-block;padding:12px 28px;background:#c9a96e;color:#fff;text-decoration:none;font-size:13px;letter-spacing:0.1em;text-transform:uppercase;border-radius:4px;">
        ${t('authorizeDepositBtn', locale)}
      </a>
    </div>
  ` : '';

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
    <p style="font-size:12px;color:#888;margin-top:8px;">${t(securityNoteKey, locale)}</p>
    ${authorizeCta}
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

// ─────────────────────────────────────────────────────────────
// Email 4 : Notification d'annulation (envoyée manuellement depuis l'admin)
// ─────────────────────────────────────────────────────────────
interface CancellationEmailData {
  guestName: string;
  guestEmail: string;
  villaName: string;
  checkIn: string;
  checkOut: string;
  bookingId: string;
  reason?: string;       // motif renseigné par l'admin (optionnel)
  locale?: Locale;
}

export async function sendBookingCancellationEmail(d: CancellationEmailData): Promise<void> {
  const locale: Locale = d.locale === 'fr' ? 'fr' : 'en';
  const subjectFn = t('subjectCancelled', locale) as (v: string) => string;
  const introFn = t('cancelledIntro', locale) as (v: string) => string;

  const reasonBlock = d.reason
    ? `
      <div style="background:#fff3cd;border-left:3px solid #c9a96e;padding:12px 16px;margin:16px 0;font-size:13px;color:#555;">
        <strong>${t('cancelledReason', locale)} :</strong><br/>
        ${d.reason.replace(/\n/g, '<br/>')}
      </div>
    `
    : '';

  const html = `
    <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#333;">
      ${headerHtml(locale)}
      <div style="padding:32px 24px;">
        <h2 style="color:#0a0a0a;font-size:18px;">${t('cancelledTitle', locale)}</h2>
        <p>${t('dear', locale)} ${d.guestName},</p>
        <p>${introFn(d.villaName)}</p>
        <div style="background:#f8f8f6;padding:16px;border-radius:4px;margin:20px 0;">
          <p style="margin:4px 0;"><strong>${t('checkInLbl', locale)}</strong> ${d.checkIn}</p>
          <p style="margin:4px 0;"><strong>${t('checkOutLbl', locale)}</strong> ${d.checkOut}</p>
          <p style="margin:4px 0;"><strong>${t('bookingRefLbl', locale)}</strong> ${d.bookingId}</p>
        </div>
        ${reasonBlock}
        <h3 style="font-size:15px;color:#0a0a0a;margin-top:24px;">${t('cancelledRefund', locale)}</h3>
        <p style="font-size:13px;color:#555;">${t('cancelledRefundBody', locale)}</p>
        <p style="margin-top:24px;">${t('cancelledContact', locale)}</p>
        ${cancellationPolicyHtml(locale)}
        ${footerHtml(locale)}
      </div>
    </div>
  `;
  await sendEmail(d.guestEmail, subjectFn(d.villaName), html);
}

// ─────────────────────────────────────────────────────────────
// Email 4b : Rappel de règlement du solde (bookings 40% acompte)
// ─────────────────────────────────────────────────────────────
interface BalanceReminderEmailData {
  guestName: string;
  guestEmail: string;
  villaName: string;
  checkIn: string;
  checkOut: string;
  remainingBalance: number;
  bookingTotal: number;
  depositAmountPaid: number;
  bookingId: string;
  paymentLink: string;    // URL vers /booking/pay-balance/[bookingId]
  daysUntilCheckIn: number;
  locale?: Locale;
}

export async function sendBalanceReminderEmail(d: BalanceReminderEmailData): Promise<void> {
  const locale: Locale = d.locale === 'fr' ? 'fr' : 'en';
  const subject = locale === 'fr'
    ? `Rappel : solde de votre séjour à ${d.villaName}`
    : `Reminder: balance due for your stay at ${d.villaName}`;

  const intro = locale === 'fr'
    ? `Votre arrivée à <strong>${d.villaName}</strong> approche dans ${d.daysUntilCheckIn} jour${d.daysUntilCheckIn > 1 ? 's' : ''}. Il reste à régler le solde de votre séjour pour finaliser votre réservation.`
    : `Your arrival at <strong>${d.villaName}</strong> is approaching in ${d.daysUntilCheckIn} day${d.daysUntilCheckIn > 1 ? 's' : ''}. The balance of your stay is still due to finalize your booking.`;

  const balanceLabel = locale === 'fr' ? 'Solde restant à régler' : 'Balance still due';
  const paidLabel = locale === 'fr' ? 'Acompte déjà versé (40 %)' : 'Deposit already paid (40%)';
  const totalLabel = locale === 'fr' ? 'Total du séjour' : 'Stay total';
  const villaLabel = locale === 'fr' ? 'Villa' : 'Villa';
  const checkInLabel = locale === 'fr' ? 'Arrivée' : 'Check-in';
  const checkOutLabel = locale === 'fr' ? 'Départ' : 'Check-out';
  const ctaLabel = locale === 'fr' ? 'Régler le solde par carte' : 'Pay balance by card';
  const noteBody = locale === 'fr'
    ? 'Le paiement est sécurisé et instantané. Vous recevrez un email de confirmation dès la réception. En cas de difficulté, contactez-nous.'
    : 'Payment is secure and instant. You will receive a confirmation email upon receipt. Please contact us if you encounter any difficulty.';

  const html = `
    <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#333;">
      ${headerHtml(locale)}
      <div style="padding:32px 24px;">
        <h2 style="color:#0a0a0a;font-size:18px;">${locale === 'fr' ? 'Solde à régler' : 'Balance due'}</h2>
        <p>${t('dear', locale)} ${d.guestName},</p>
        <p>${intro}</p>

        <div style="background:#f8f8f6;padding:16px;border-radius:4px;margin:20px 0;font-size:14px;">
          <p style="margin:4px 0;"><strong>${villaLabel} :</strong> ${d.villaName}</p>
          <p style="margin:4px 0;"><strong>${checkInLabel} :</strong> ${d.checkIn}</p>
          <p style="margin:4px 0;"><strong>${checkOutLabel} :</strong> ${d.checkOut}</p>
        </div>

        <table style="width:100%;border-collapse:collapse;font-size:14px;color:#333;margin:16px 0;">
          <tr><td style="padding:6px 0;">${totalLabel}</td><td style="text-align:right;padding:6px 0;">${formatUSD(d.bookingTotal)}</td></tr>
          <tr><td style="padding:6px 0;color:#c9a96e;">${paidLabel}</td><td style="text-align:right;padding:6px 0;color:#c9a96e;">−${formatUSD(d.depositAmountPaid)}</td></tr>
          <tr style="font-weight:bold;font-size:16px;"><td style="padding:10px 0;border-top:2px solid #c9a96e;">${balanceLabel}</td><td style="text-align:right;padding:10px 0;border-top:2px solid #c9a96e;color:#c9a96e;">${formatUSD(d.remainingBalance)}</td></tr>
        </table>

        <div style="text-align:center;margin:28px 0 8px;">
          <a href="${d.paymentLink}" style="display:inline-block;padding:14px 32px;background:#c9a96e;color:#fff;text-decoration:none;font-size:13px;letter-spacing:0.1em;text-transform:uppercase;border-radius:4px;">
            ${ctaLabel}
          </a>
        </div>

        <p style="font-size:12px;color:#888;text-align:center;margin-top:12px;">${noteBody}</p>

        ${footerHtml(locale)}
      </div>
    </div>
  `;
  await sendEmail(d.guestEmail, subject, html);
}

// ─────────────────────────────────────────────────────────────
// Email 4c : Confirmation de règlement du solde
// ─────────────────────────────────────────────────────────────
interface BalancePaidEmailData {
  guestName: string;
  guestEmail: string;
  villaName: string;
  checkIn: string;
  checkOut: string;
  amountPaid: number;
  bookingTotal: number;
  bookingId: string;
  locale?: Locale;
}

export async function sendBalancePaidEmail(d: BalancePaidEmailData): Promise<void> {
  const locale: Locale = d.locale === 'fr' ? 'fr' : 'en';
  const subject = locale === 'fr'
    ? `Solde reçu — votre séjour à ${d.villaName} est intégralement payé`
    : `Balance received — your stay at ${d.villaName} is fully paid`;

  const intro = locale === 'fr'
    ? `Nous avons bien reçu le règlement de votre solde. Votre séjour à <strong>${d.villaName}</strong> est maintenant <strong>intégralement payé</strong> — il ne vous reste plus qu'à préparer vos valises !`
    : `We have received your balance payment. Your stay at <strong>${d.villaName}</strong> is now <strong>fully paid</strong> — all that's left is to pack your bags!`;

  const villaLabel = locale === 'fr' ? 'Villa' : 'Villa';
  const checkInLabel = locale === 'fr' ? 'Arrivée' : 'Check-in';
  const checkOutLabel = locale === 'fr' ? 'Départ' : 'Check-out';
  const amountLabel = locale === 'fr' ? 'Solde réglé' : 'Balance paid';
  const totalLabel = locale === 'fr' ? 'Total du séjour' : 'Stay total';

  const html = `
    <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#333;">
      ${headerHtml(locale)}
      <div style="padding:32px 24px;">
        <h2 style="color:#0a0a0a;font-size:18px;">${locale === 'fr' ? 'Séjour intégralement payé ✓' : 'Stay fully paid ✓'}</h2>
        <p>${t('dear', locale)} ${d.guestName},</p>
        <p>${intro}</p>

        <div style="background:#f8f8f6;padding:16px;border-radius:4px;margin:20px 0;font-size:14px;">
          <p style="margin:4px 0;"><strong>${villaLabel} :</strong> ${d.villaName}</p>
          <p style="margin:4px 0;"><strong>${checkInLabel} :</strong> ${d.checkIn}</p>
          <p style="margin:4px 0;"><strong>${checkOutLabel} :</strong> ${d.checkOut}</p>
          <p style="margin:12px 0 4px;"><strong>${amountLabel} :</strong> ${formatUSD(d.amountPaid)}</p>
          <p style="margin:4px 0;color:#666;font-size:12px;"><strong>${totalLabel} :</strong> ${formatUSD(d.bookingTotal)}</p>
        </div>

        <p style="font-size:13px;color:#555;margin-top:20px;">
          ${locale === 'fr'
            ? "Nous vous contacterons 48 h avant votre arrivée pour vous transmettre les instructions de check-in."
            : 'We will contact you 48 hours before your arrival with check-in instructions.'}
        </p>

        ${footerHtml(locale)}
      </div>
    </div>
  `;
  await sendEmail(d.guestEmail, subject, html);
}

// ─────────────────────────────────────────────────────────────
// Email 4d : Rappel d'empreinte CB si non posée avant l'arrivée
// ─────────────────────────────────────────────────────────────
interface DepositReminderEmailData {
  guestName: string;
  guestEmail: string;
  villaName: string;
  checkIn: string;
  securityDepositAmount: number;
  bookingId: string;
  authorizeUrl: string;
  locale?: Locale;
}

export async function sendDepositReminderEmail(d: DepositReminderEmailData): Promise<void> {
  const locale: Locale = d.locale === 'fr' ? 'fr' : 'en';
  const subject = locale === 'fr'
    ? `Rappel : autorisation de caution pour ${d.villaName}`
    : `Reminder: deposit authorization for ${d.villaName}`;

  const intro = locale === 'fr'
    ? `Votre arrivée à <strong>${d.villaName}</strong> est prévue le ${d.checkIn}. Pour finaliser votre séjour, il ne reste qu'à autoriser l'empreinte CB de garantie — c'est instantané et sans débit.`
    : `Your arrival at <strong>${d.villaName}</strong> is scheduled for ${d.checkIn}. To finalize your stay, only the security deposit imprint remains to be authorized — instant and without debit.`;

  const ctaLabel = locale === 'fr' ? 'Autoriser mon empreinte CB' : 'Authorize my card imprint';
  const amountLine = locale === 'fr'
    ? `Montant pré-autorisé : <strong>${formatUSD(d.securityDepositAmount)}</strong>`
    : `Pre-authorized amount: <strong>${formatUSD(d.securityDepositAmount)}</strong>`;
  const noDebitNote = locale === 'fr'
    ? "Aucun débit ne sera effectué. L'empreinte est libérée automatiquement après votre départ, sauf en cas de dégât constaté."
    : 'No debit will be charged. The imprint is released automatically after your departure, unless damage is found.';

  const html = `
    <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#333;">
      ${headerHtml(locale)}
      <div style="padding:32px 24px;">
        <h2 style="color:#0a0a0a;font-size:18px;">${locale === 'fr' ? 'Autorisez votre caution' : 'Authorize your deposit'}</h2>
        <p>${t('dear', locale)} ${d.guestName},</p>
        <p>${intro}</p>
        <p style="text-align:center;font-size:15px;margin:20px 0;">${amountLine}</p>

        <div style="text-align:center;margin:28px 0 8px;">
          <a href="${d.authorizeUrl}" style="display:inline-block;padding:14px 32px;background:#c9a96e;color:#fff;text-decoration:none;font-size:13px;letter-spacing:0.1em;text-transform:uppercase;border-radius:4px;">
            ${ctaLabel}
          </a>
        </div>

        <p style="font-size:12px;color:#888;text-align:center;margin-top:12px;">${noDebitNote}</p>

        ${footerHtml(locale)}
      </div>
    </div>
  `;
  await sendEmail(d.guestEmail, subject, html);
}

// ─────────────────────────────────────────────────────────────
// Email 5 : Confirmation empreinte caution (Manual Capture Fygaro)
// ─────────────────────────────────────────────────────────────
interface DepositAuthorizedEmailData {
  guestName: string;
  guestEmail: string;
  villaName: string;
  checkIn: string;
  checkOut: string;
  securityDepositAmount: number;
  bookingId: string;
  locale?: Locale;
}

export async function sendDepositAuthorizedEmail(d: DepositAuthorizedEmailData): Promise<void> {
  const locale: Locale = d.locale === 'fr' ? 'fr' : 'en';
  const subject = locale === 'fr'
    ? `Votre caution est sécurisée — ${d.villaName}`
    : `Your security deposit is secured — ${d.villaName}`;

  const intro = locale === 'fr'
    ? `Nous confirmons que l'empreinte de votre carte a bien été enregistrée en garantie pour votre séjour à <strong>${d.villaName}</strong>.`
    : `We confirm that your card imprint has been secured as a guarantee for your stay at <strong>${d.villaName}</strong>.`;

  const noDebitTitle = locale === 'fr' ? 'Aucun débit effectué' : 'No debit charged';
  const noDebitBody = locale === 'fr'
    ? "Le montant de votre caution est simplement pré-autorisé sur votre carte — aucune somme n'est prélevée. La pré-autorisation est visible sur votre relevé mais ne réduit pas votre solde disponible de manière définitive."
    : "Your deposit amount is simply pre-authorized on your card — no amount is charged. The pre-authorization may show on your statement but does not permanently reduce your available balance.";

  const releaseTitle = locale === 'fr' ? 'Libération automatique' : 'Automatic release';
  const releaseBody = locale === 'fr'
    ? `L'empreinte sera libérée automatiquement après votre départ du <strong>${d.checkOut}</strong>, sous réserve qu'aucun dégât ne soit constaté lors du check-out. En cas de sinistre, le montant correspondant pourra être capturé par la propriétaire.`
    : `The imprint will be released automatically after your departure on <strong>${d.checkOut}</strong>, provided no damage is found at check-out. In case of an issue, the corresponding amount may be captured by the owner.`;

  const summaryTitle = locale === 'fr' ? 'Récapitulatif' : 'Summary';
  const amountLabel = locale === 'fr' ? 'Montant pré-autorisé' : 'Pre-authorized amount';
  const villaLabel = locale === 'fr' ? 'Villa' : 'Villa';
  const checkInLabel = locale === 'fr' ? 'Arrivée' : 'Check-in';
  const checkOutLabel = locale === 'fr' ? 'Départ' : 'Check-out';
  const refLabel = locale === 'fr' ? 'Référence' : 'Reference';

  const html = `
    <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#333;">
      ${headerHtml(locale)}
      <div style="padding:32px 24px;">
        <h2 style="color:#0a0a0a;font-size:18px;">${locale === 'fr' ? 'Empreinte enregistrée ✓' : 'Card imprint on file ✓'}</h2>
        <p>${t('dear', locale)} ${d.guestName},</p>
        <p>${intro}</p>

        <div style="background:#f8f8f6;padding:16px;border-radius:4px;margin:20px 0;font-size:14px;">
          <p style="margin:4px 0;"><strong>${villaLabel} :</strong> ${d.villaName}</p>
          <p style="margin:4px 0;"><strong>${checkInLabel} :</strong> ${d.checkIn}</p>
          <p style="margin:4px 0;"><strong>${checkOutLabel} :</strong> ${d.checkOut}</p>
          <p style="margin:12px 0 4px;"><strong>${amountLabel} :</strong> ${formatUSD(d.securityDepositAmount)}</p>
          <p style="margin:4px 0;color:#666;font-size:12px;"><strong>${refLabel} :</strong> ${d.bookingId}</p>
        </div>

        <h3 style="font-size:15px;color:#0a0a0a;margin-top:24px;">${noDebitTitle}</h3>
        <p style="font-size:13px;color:#555;">${noDebitBody}</p>

        <h3 style="font-size:15px;color:#0a0a0a;margin-top:20px;">${releaseTitle}</h3>
        <p style="font-size:13px;color:#555;">${releaseBody}</p>

        ${footerHtml(locale)}
      </div>
    </div>
  `;
  await sendEmail(d.guestEmail, subject, html);
}
