import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdminTokenAsync } from '@/lib/auth-admin';
import { issueCreditNote } from '@/lib/documents/credit-notes';
import { sendCreditNoteEmail } from '@/lib/services/email';

const METHODS = ['card', 'bank_transfer', 'paypal'] as const;

/**
 * POST /api/admin/bookings/credit-note
 *
 * Émet un avoir pour un remboursement (revue manuelle par l'admin) et,
 * si demandé, l'envoie au voyageur avec copie à la propriétaire.
 *
 * Body : { bookingId, amount, roomTax, issueDate (YYYY-MM-DD), reason?,
 *          refundMethod?, refundReference?, sendEmail? }
 */
export async function POST(req: NextRequest) {
  if (!(await verifyAdminTokenAsync(req))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const body = await req.json();
  const amount = Number(body.amount);
  const roomTax = Number(body.roomTax);
  if (!body.bookingId) return NextResponse.json({ error: 'bookingId requis' }, { status: 400 });
  if (!Number.isFinite(amount) || !Number.isFinite(roomTax)) {
    return NextResponse.json({ error: 'Montants invalides' }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(body.issueDate))) {
    return NextResponse.json({ error: 'issueDate doit être au format AAAA-MM-JJ' }, { status: 400 });
  }
  if (body.refundMethod && !METHODS.includes(body.refundMethod)) {
    return NextResponse.json({ error: 'Mode de remboursement invalide' }, { status: 400 });
  }

  try {
    const note = await issueCreditNote(supabaseAdmin, body.bookingId, {
      amount,
      roomTax,
      issueDate: body.issueDate,
      reason: body.reason,
      refundMethod: body.refundMethod || undefined,
      refundReference: body.refundReference,
    });

    let emailSent = false;
    if (body.sendEmail) {
      const { data: b } = await supabaseAdmin
        .from('bookings')
        .select('guest_name, check_in, check_out, apartments:apartment_id (title_fr, title_en)')
        .eq('id', body.bookingId)
        .single();
      const apt = b && (Array.isArray(b.apartments) ? b.apartments[0] : b.apartments);
      try {
        await sendCreditNoteEmail({
          guestName: b?.guest_name ?? '',
          guestEmail: note.guestEmail,
          villaName: (note.locale === 'fr' ? apt?.title_fr : apt?.title_en) || 'Villa',
          checkIn: b?.check_in ?? '',
          checkOut: b?.check_out ?? '',
          amount,
          creditNoteNumber: note.number,
          bookingId: body.bookingId,
          attachments: [{ filename: note.filename, content: note.pdf.toString('base64') }],
          locale: note.locale,
        });
        emailSent = true;
      } catch (emailErr) {
        console.error('[credit-note] email failed:', emailErr);
      }
    }

    return NextResponse.json({ success: true, number: note.number, emailSent });
  } catch (err) {
    console.error('[credit-note]', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 400 });
  }
}
