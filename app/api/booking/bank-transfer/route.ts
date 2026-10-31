import { NextRequest, NextResponse } from 'next/server';
import { sendBankTransferPendingEmail, roomTaxEmailFields } from '@/lib/services/email';
import { PROPERTIES } from '@/lib/documents/company';
import { bookingPricingColumns, computeServerPricing, getServerSupabase } from '@/lib/services/server-pricing';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Champs réellement acceptés du client (les montants sont IGNORÉS)
    const apartmentId: string | undefined = body.apartmentId;
    const checkIn: string | undefined = body.checkIn;
    const checkOut: string | undefined = body.checkOut;
    const guests: number = Number(body.guests);
    const guestName: string = String(body.guestName || '').trim().slice(0, 200);
    const guestEmail: string = String(body.guestEmail || '').trim().slice(0, 200);
    const paymentOption: 'full' | 'deposit_40' =
      body.paymentOption === 'deposit_40' ? 'deposit_40' : 'full';
    const locale: 'fr' | 'en' = body.locale === 'fr' ? 'fr' : 'en';
    const billingAddress: string = String(body.billingAddress || '').trim().slice(0, 500);

    if (!apartmentId || !checkIn || !checkOut) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!guestName || !EMAIL_RE.test(guestEmail)) {
      return NextResponse.json({ error: 'Invalid guest info' }, { status: 400 });
    }
    if (!Number.isFinite(guests) || guests < 1 || guests > 20) {
      return NextResponse.json({ error: 'Invalid guest count' }, { status: 400 });
    }

    // Recalcul complet côté serveur (montants jamais lus du client)
    const pricing = await computeServerPricing({ apartmentId, checkIn, checkOut, paymentOption, guestsCount: guests });

    const supabase = getServerSupabase();

    const { data: booking, error } = await supabase
      .from('bookings')
      .insert({
        apartment_id: apartmentId,
        check_in: checkIn,
        check_out: checkOut,
        guests_count: guests,
        guest_name: guestName,
        guest_email: guestEmail,
        currency: 'USD',
        ...bookingPricingColumns(pricing),
        payment_option: paymentOption,
        security_deposit_due_on_arrival: true,
        billing_address: billingAddress || null,
        payment_method: 'bank_transfer',
        payment_status: 'pending_bank_transfer',
        booking_status: 'pending_bank_transfer',
        locale,
      })
      .select('id')
      .single();

    if (error) throw new Error(`DB error: ${error.message}`);
    const bookingId = booking.id;

    // RIB de la société émettrice de la villa s'il est configuré, sinon le
    // compte par défaut (company_key NULL, Chenille).
    const companyKey = PROPERTIES[pricing.apartmentSlug]?.seller.key;
    const { data: bankRows } = await supabase
      .from('bank_transfer_config')
      .select('*')
      .eq('is_active', true);
    const bankConfig = bankRows?.find((r) => r.company_key === companyKey)
      ?? bankRows?.find((r) => r.company_key == null);

    await sendBankTransferPendingEmail({
      guestName,
      guestEmail,
      villaName: pricing.apartmentName,
      checkIn,
      checkOut,
      nights: pricing.nights,
      accommodationAmount: pricing.accommodationAmount,
      cleaningFee: pricing.cleaningFee,
      bookingTotal: pricing.bookingTotal,
      ...roomTaxEmailFields({
        extra_guests_amount: pricing.extraGuestsAmount,
        room_tax_rate: pricing.roomTaxRate,
        room_tax_amount: pricing.roomTaxAmount,
        total_payable: pricing.totalPayable,
      }),
      paymentOption,
      depositAmount: pricing.depositAmount,
      remainingBalance: pricing.remainingBalance,
      securityDepositAmount: pricing.securityDepositAmount,
      paymentMethod: 'bank_transfer',
      bookingId,
      locale,
      bankDetails: bankConfig ? {
        bankName: bankConfig.bank_name,
        correspondentBank: bankConfig.correspondent_bank,
        swiftCode: bankConfig.swift_code,
        routingNumber: bankConfig.routing_number,
        beneficiaryName: bankConfig.beneficiary_name,
        beneficiaryAccount: bankConfig.beneficiary_account,
        beneficiaryAddress: bankConfig.beneficiary_address,
        bankChargesNotice: bankConfig.bank_charges_notice,
      } : undefined,
    });

    return NextResponse.json({ success: true, bookingId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const code = (err as { code?: string }).code;
    const status = code === 'DATES_UNAVAILABLE' ? 409 : 500;
    console.error('[bank-transfer]', message);
    return NextResponse.json({ error: message }, { status });
  }
}
