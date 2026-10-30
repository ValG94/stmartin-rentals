// Facture PDF : une par réservation (validé par la comptable).

import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { date, labels, lineLabel, money, paymentLabel, percent } from '../labels';
import type { InvoiceData } from '../types';
import { Footer, Header, s, SellerBlock } from './shared';

export function InvoicePdf({ data }: { data: InvoiceData }) {
  const { locale } = data;
  const l = labels(locale);
  const m = (n: number) => money(n, locale);
  const totalPaid = Math.round(data.payments.reduce((sum, p) => sum + p.amount, 0) * 100) / 100;
  const colon = locale === 'fr' ? ' :' : ':';
  const { seller } = data.stay.property;

  return (
    <Document title={`${l.invoiceNo} ${data.number}`} author={seller.name} language={locale}>
      <Page size="A4" style={s.page}>
        <Header title={l.invoice} meta={[`${l.invoiceNo} ${data.number}`, `${l.issueDate}${colon} ${date(data.issueDate, locale)}`]} />

        <View style={s.body}>
          <View style={s.row}>
            <SellerBlock locale={locale} seller={seller} />
            <View style={s.col}>
              <Text style={s.label}>{l.billTo}</Text>
              <Text style={s.strong}>{data.guest.name}</Text>
              {data.guest.billingAddressLines.map((a) => <Text key={a}>{a}</Text>)}
              <Text style={s.muted}>{data.guest.email}</Text>
            </View>
          </View>

          <View style={[s.box, s.row]}>
            <View style={s.col}>
              <Text style={s.label}>{l.property}</Text>
              <Text style={s.strong}>{data.stay.property.name}</Text>
              {data.stay.property.addressLines.map((a) => <Text key={a}>{a}</Text>)}
            </View>
            <View style={s.col}>
              <Text style={s.label}>{l.stay}</Text>
              <Text>{l.stayDates(date(data.stay.checkIn, locale), date(data.stay.checkOut, locale))}</Text>
              <Text>{l.nightsGuests(data.stay.nights, data.stay.guestsCount)}</Text>
              <Text style={[s.label, { marginTop: 6 }]}>{l.bookingRef}</Text>
              <Text style={{ fontSize: 8 }}>{data.stay.bookingReference}</Text>
            </View>
          </View>

          {/* Lignes : hébergement, ménage, voyageurs sup. séparés */}
          <View style={s.tableHead}>
            <Text style={[s.th, { flex: 1 }]}>{l.description}</Text>
            <Text style={[s.th, s.num, { width: 40 }]}>{l.qty}</Text>
            <Text style={[s.th, s.num, { width: 90 }]}>{l.unitPrice}</Text>
            <Text style={[s.th, s.num, { width: 95 }]}>{l.amount}</Text>
          </View>
          {data.lines.map((line) => (
            <View key={line.kind} style={s.tr}>
              <Text style={{ flex: 1 }}>{lineLabel(line, locale)}</Text>
              <Text style={[s.num, { width: 40 }]}>{line.quantity}</Text>
              <Text style={[s.num, { width: 90 }]}>{m(line.unitPrice)}</Text>
              <Text style={[s.num, { width: 95 }]}>{m(line.amount)}</Text>
            </View>
          ))}

          <View style={s.totals}>
            <View style={s.totalRow}><Text>{l.subtotal}</Text><Text>{m(data.subtotal)}</Text></View>
            {data.roomTax.rate > 0 ? (
              <View style={s.totalRow}>
                <Text>{l.roomTax(percent(data.roomTax.rate, locale), m(data.roomTax.base))}</Text>
                <Text>{m(data.roomTax.amount)}</Text>
              </View>
            ) : (
              <View style={s.totalRow}><Text>{l.roomTaxExempt}</Text><Text>{m(0)}</Text></View>
            )}
            <View style={s.grandTotal}>
              <Text style={s.grandTotalText}>{l.totalPayable}</Text>
              <Text style={s.grandTotalText}>{m(data.totalPayable)}</Text>
            </View>
          </View>
          {data.roomTax.exemptionNote ? <Text style={[s.note, { textAlign: 'right' }]}>{data.roomTax.exemptionNote}</Text> : null}

          {/* Paiements reçus à la date d'émission, puis reste à payer */}
          <Text style={[s.label, { marginTop: 22 }]}>{l.paymentsReceived}</Text>
          {data.payments.length === 0 ? <Text style={s.muted}>{l.noPaymentYet}</Text> : null}
          {data.payments.map((p) => (
            <View key={p.receiptNumber} style={s.tr}>
              <Text style={{ width: 75 }}>{date(p.date, locale)}</Text>
              <Text style={{ flex: 1 }}>{paymentLabel(p, locale)}{'\n'}<Text style={s.muted}>{l.receiptCol} {p.receiptNumber}</Text></Text>
              <Text style={[s.num, { width: 150 }]}>{m(p.amount)}{'\n'}<Text style={s.muted}>{l.ofWhichRoomTax(m(p.roomTax))}</Text></Text>
            </View>
          ))}
          <View style={s.totals}>
            <View style={s.totalRow}><Text>{l.totalPaid}</Text><Text>{m(totalPaid)}</Text></View>
            <View style={s.grandTotal}>
              <Text style={s.grandTotalText}>{l.balanceDue}</Text>
              <Text style={s.grandTotalText}>{m(data.balanceDue)}</Text>
            </View>
            {data.balanceDue > 0 ? (
              <Text style={[s.note, s.num]}>
                {l.ofWhichRoomTax(m(data.balanceRoomTax))}{'\n'}{l.balanceDueBy(date(data.balanceDueDate, locale))}
              </Text>
            ) : null}
          </View>

          <View style={[s.box, { marginTop: 22 }]}>
            <Text style={s.note}>{l.securityDeposit(m(data.securityDepositAmount))}</Text>
            <Text style={s.note}>{l.amountsInUsd}</Text>
          </View>
        </View>

        <Footer locale={locale} seller={seller} />
      </Page>
    </Document>
  );
}
