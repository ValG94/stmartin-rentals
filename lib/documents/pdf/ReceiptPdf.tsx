// Reçu PDF : un par paiement, daté du jour d'encaissement, rattaché à la
// facture de la réservation.

import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { date, labels, money, paymentLabel } from '../labels';
import type { ReceiptData } from '../types';
import { Footer, Header, s, SellerBlock } from './shared';

export function ReceiptPdf({ data }: { data: ReceiptData }) {
  const { locale, invoice, payment } = data;
  const l = labels(locale);
  const m = (n: number) => money(n, locale);
  const colon = locale === 'fr' ? ' :' : ':';
  const { seller } = invoice.stay.property;

  return (
    <Document title={`${l.receiptNo} ${payment.receiptNumber}`} author={seller.name} language={locale}>
      <Page size="A4" style={s.page}>
        <Header title={l.receipt} meta={[`${l.receiptNo} ${payment.receiptNumber}`, `${l.paymentDate}${colon} ${date(payment.date, locale)}`]} />

        <View style={s.body}>
          <View style={s.row}>
            <SellerBlock locale={locale} seller={seller} />
            <View style={s.col}>
              <Text style={s.label}>{l.receivedFrom}</Text>
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
            <Text style={[s.th, s.num, { width: 150 }]}>{l.amountReceived}</Text>
          </View>
          <View style={s.tr}>
            <Text style={{ flex: 1 }}>
              {paymentLabel(payment, locale)}
              {payment.processorReference ? `\n${l.processorRef}${colon} ${payment.processorReference}` : ''}
            </Text>
            <Text style={[s.num, { width: 150 }]}>{m(payment.amount)}{'\n'}<Text style={s.muted}>{l.ofWhichRoomTax(m(payment.roomTax))}</Text></Text>
          </View>

          <View style={s.totals}>
            <View style={s.totalRow}><Text>{l.invoiceTotal}</Text><Text>{m(invoice.totalPayable)}</Text></View>
            <View style={s.totalRow}><Text>{l.paidToDate}</Text><Text>{m(data.paidToDate)}</Text></View>
            <View style={s.grandTotal}>
              <Text style={s.grandTotalText}>{l.balanceRemaining}</Text>
              <Text style={s.grandTotalText}>{m(data.balanceRemaining)}</Text>
            </View>
          </View>

          <Text style={[s.note, { marginTop: 24 }]}>{l.thanks} {l.amountsInUsd}</Text>
        </View>

        <Footer locale={locale} seller={seller} />
      </Page>
    </Document>
  );
}
