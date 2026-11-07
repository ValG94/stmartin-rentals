// Rendu serveur des documents en PDF (Buffer prêt à joindre à un mail
// Resend ou à stocker dans Supabase Storage).

import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { CreditNotePdf } from './pdf/CreditNotePdf';
import { InvoicePdf } from './pdf/InvoicePdf';
import { ReceiptPdf } from './pdf/ReceiptPdf';
import type { CreditNoteData, InvoiceData, ReceiptData } from './types';

export function renderInvoicePdf(data: InvoiceData): Promise<Buffer> {
  return renderToBuffer(<InvoicePdf data={data} />);
}

export function renderReceiptPdf(data: ReceiptData): Promise<Buffer> {
  return renderToBuffer(<ReceiptPdf data={data} />);
}

export function renderCreditNotePdf(data: CreditNoteData): Promise<Buffer> {
  return renderToBuffer(<CreditNotePdf data={data} />);
}
