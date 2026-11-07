// Avoir PDF : un par remboursement, rattaché à la facture de la réservation.

import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { date, labels, money } from '../labels';
import type { CreditNoteData } from '../types';
import { Footer, Header, s, SellerBlock } from './shared';

export function CreditNotePdf({ data }: { data: CreditNoteData }) {
  const { locale, invoice } = data;
  const l = labels(locale);
  const m = (n: number) => money(n, locale);
  const colon = locale === 'fr' ? ' :' : ':';
  const { seller } = invoice.stay.property;

  return (
    <Document title={`${l.creditNoteNo} ${data.number}`} author={seller.name} language={locale}>
      <Page size="A4" style={s.page}>
        <Header title={l.creditNote} meta={[`${l.creditNoteNo} ${data.number}`, `${l.issueDate}${colon} ${date(data.issueDate, locale)}`]} />

        <View style={s.body}>
          <View style={s.row}>
            <SellerBlock locale={locale} seller={seller} managedBy={invoice.stay.property.managedBy} />
            <View style={s.col}>
              <Text style={s.label}>{l.issuedTo}</Text>
              <Text style={s.strong}>{invoice.guest.name}</Text>
              {invoice.guest.billingAddressLines.map((a) => <Text key={a}>{a}</Text>)}
              <Text style={s.muted}>{invoice.guest.email}</Text>
            </View>
          </View>

          <View style={[s.box, s.row]}>
            <View style={s.col}>
              <Text style={s.label}>{l.forInvoice}</Text>
              <Text style={s.strong}>{invoice.number}</Text>
              <Text>{l.issueDate}{colon} {date(invoice.issueDate, locale)}</Text>
            </View>
            <View style={s.col}>
              <Text style={s.label}>{l.stay}</Text>
              <Text>{invoice.stay.property.name}</Text>
              <Text>{l.stayDates(date(invoice.stay.checkIn, locale), date(invoice.stay.checkOut, locale))}</Text>
              <Text style={{ fontSize: 8 }}>{l.bookingRef}{colon} {invoice.stay.bookingReference}</Text>
            </View>
          </View>

          <View style={s.tableHead}>
            <Text style={[s.th, { flex: 1 }]}>{l.description}</Text>
            <Text style={[s.th, s.num, { width: 150 }]}>{l.amountCredited}</Text>
          </View>
          <View style={s.tr}>
            <Text style={{ flex: 1 }}>
              {data.reason ? `${l.refund}${colon} ${data.reason}` : l.refund}
              {data.refundMethod ? `\n${l.refundMethod}${colon} ${l.paymentMethod[data.refundMethod]}` : ''}
              {data.refundReference ? `\n${l.processorRef}${colon} ${data.refundReference}` : ''}
            </Text>
            <Text style={[s.num, { width: 150 }]}>{m(-data.amount)}{'\n'}<Text style={s.muted}>{l.ofWhichRoomTax(m(-data.roomTax))}</Text></Text>
          </View>

          <View style={s.totals}>
            <View style={s.totalRow}><Text>{l.invoiceTotal}</Text><Text>{m(invoice.totalPayable)}</Text></View>
            <View style={s.totalRow}><Text>{l.paidToDate}</Text><Text>{m(data.paidToDate)}</Text></View>
            <View style={s.totalRow}><Text>{l.totalCredited}</Text><Text>{m(-data.creditedToDate)}</Text></View>
            <View style={s.grandTotal}>
              <Text style={s.grandTotalText}>{l.netPaid}</Text>
              <Text style={s.grandTotalText}>{m(data.netPaid)}</Text>
            </View>
          </View>

          <Text style={[s.note, { marginTop: 24 }]}>{l.creditNoteNote(invoice.number)} {l.amountsInUsd}</Text>
        </View>

        <Footer locale={locale} seller={seller} />
      </Page>
    </Document>
  );
}
