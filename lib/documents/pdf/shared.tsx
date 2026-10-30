// Mise en page commune des documents PDF (en-tête, pied de page, styles).

import React from 'react';
import { Image, StyleSheet, Text, View } from '@react-pdf/renderer';
import { EMBLEM_PNG_DATA_URI } from '../assets/emblem';
import { BRAND, type Seller } from '../company';
import { labels } from '../labels';
import type { DocLocale } from '../types';

export const NAVY = '#0B2346';
export const GOLD = '#B08B52';
export const INK = '#1F2933';
export const MUTED = '#6B7280';
export const LINE = '#E5E1D8';
export const SAND = '#F7F4EE';

export const s = StyleSheet.create({
  page: { paddingTop: 0, paddingBottom: 56, paddingHorizontal: 0, fontFamily: 'Helvetica', fontSize: 9.5, color: INK },
  band: { backgroundColor: NAVY, paddingVertical: 18, paddingHorizontal: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center' },
  emblem: { width: 46, height: 46, marginRight: 12 },
  brandName: { color: '#FFFFFF', fontFamily: 'Helvetica-Bold', fontSize: 13, letterSpacing: 1.5 },
  brandSub: { color: GOLD, fontSize: 7.5, letterSpacing: 1.2, marginTop: 3 },
  docTitle: { color: '#FFFFFF', fontFamily: 'Helvetica-Bold', fontSize: 16, letterSpacing: 2, textAlign: 'right' },
  docMeta: { color: '#D8DEE8', fontSize: 8.5, textAlign: 'right', marginTop: 4 },
  body: { paddingHorizontal: 40, paddingTop: 22 },
  row: { flexDirection: 'row' },
  col: { flex: 1 },
  label: { fontSize: 7.5, color: GOLD, fontFamily: 'Helvetica-Bold', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  strong: { fontFamily: 'Helvetica-Bold' },
  muted: { color: MUTED },
  box: { backgroundColor: SAND, borderRadius: 3, padding: 10, marginTop: 16 },
  tableHead: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: NAVY, paddingBottom: 4, marginTop: 18 },
  th: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: NAVY, textTransform: 'uppercase', letterSpacing: 0.6 },
  tr: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: LINE, paddingVertical: 6 },
  num: { textAlign: 'right' },
  totals: { marginTop: 6, marginLeft: 'auto', width: 250 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  grandTotal: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderTopWidth: 1.5, borderTopColor: GOLD, marginTop: 2 },
  grandTotalText: { fontFamily: 'Helvetica-Bold', fontSize: 11 },
  note: { fontSize: 8.5, color: MUTED, marginTop: 4, lineHeight: 1.4 },
  footer: { position: 'absolute', bottom: 22, left: 40, right: 40, borderTopWidth: 0.5, borderTopColor: LINE, paddingTop: 6, fontSize: 7.5, color: MUTED, flexDirection: 'row', justifyContent: 'space-between' },
});

export function Header({ title, meta }: { title: string; meta: string[] }) {
  return (
    <View style={s.band}>
      <View style={s.brand}>
        <Image src={EMBLEM_PNG_DATA_URI} style={s.emblem} />
        <View>
          <Text style={s.brandName}>ISLAND LIVING SXM</Text>
          <Text style={s.brandSub}>LUXURY VILLAS · SINT MAARTEN</Text>
        </View>
      </View>
      <View>
        <Text style={s.docTitle}>{title}</Text>
        {meta.map((m) => <Text key={m} style={s.docMeta}>{m}</Text>)}
      </View>
    </View>
  );
}

// L'émetteur est la société qui fournit l'hébergement (une par villa).
export function SellerBlock({ locale, seller }: { locale: DocLocale; seller: Seller }) {
  const l = labels(locale);
  return (
    <View style={s.col}>
      <Text style={s.label}>{l.issuedBy}</Text>
      <Text style={s.strong}>{seller.name}</Text>
      {seller.addressLines.map((a) => <Text key={a}>{a}</Text>)}
      <Text>{l.crib} {seller.crib}</Text>
    </View>
  );
}

export function Footer({ locale, seller }: { locale: DocLocale; seller: Seller }) {
  const l = labels(locale);
  return (
    <View style={s.footer} fixed>
      <Text>{seller.name} · {l.crib} {seller.crib} · {BRAND.tradeName} · {BRAND.email} · {BRAND.website}</Text>
      <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  );
}
