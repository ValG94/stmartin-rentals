import { NextRequest, NextResponse } from 'next/server';
import { sendBankTransferPendingEmail } from '@/lib/services/email';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      apartmentId,
      checkIn,
      checkOut,
      guests,
      guestName,
      guestEmail,
      accommodationAmount,
      cleaningFee,
      bookingTotal,
      paymentOption,
      depositAmount,
      remainingBalance,
      securityDepositAmount,
      nights,
      apartmentSlug,
    } = body;

    const amountDue = paymentOption === 'full' ? bookingTotal : depositAmount;

    // Créer la réservation avec statut pending_bank_transfer
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert({
        apartment_id: apartmentId,
        check_in: checkIn,
        check_out: checkOut,
        guests,
        guest_name: guestName,
        guest_email: guestEmail,
        currency: 'USD',
        accommodation_amount: accommodationAmount,
        cleaning_fee: cleaningFee,
        booking_total: bookingTotal,
        payment_option: paymentOption,
        deposit_amount: depositAmount,
        remaining_balance: remainingBalance,
        security_deposit_due_on_arrival: true,
        security_deposit_amount: securityDepositAmount,
        payment_method: 'bank_transfer',
        payment_status: 'pending_bank_transfer',
        booking_status: 'pending_bank_transfer',
        total_amount: amountDue,
      })
      .select('id')
      .single();

    if (error) throw new Error(`DB error: ${error.message}`);

    const bookingId = booking.id;

    // Récupérer les coordonnées bancaires depuis la config sécurisée
    const { data: bankConfig } = await supabase
      .from('bank_transfer_config')
      .select('*')
      .eq('is_active', true)
      .single();

    const villaName = apartmentSlug === 'villa-vanille' ? 'La Villa Vanille' : 'Maison Blanche';

    // Envoyer l'email avec les instructions de virement
    await sendBankTransferPendingEmail({
      guestName,
      guestEmail,
      villaName,
      checkIn,
      checkOut,
      nights,
      accommodationAmount,
      cleaningFee,
      bookingTotal,
      paymentOption,
      depositAmount,
      remainingBalance,
      securityDepositAmount,
      paymentMethod: 'bank_transfer',
      bookingId,
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
    console.error('[bank-transfer]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
