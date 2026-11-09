// 404 des URLs hors /fr et /en. Le layout racine ne rend pas <html> (voir
// app/layout.tsx), cette page le rend elle-même.
import Link from 'next/link';

export default function NotFound() {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', textAlign: 'center', padding: '20vh 16px', background: '#FDFAF6', color: '#0D1B2A' }}>
        <h1 style={{ fontWeight: 300 }}>Page not found</h1>
        <p>
          <Link href="/en" style={{ color: '#6B4F28' }}>Island Living SXM</Link>
          {' · '}
          <Link href="/fr" style={{ color: '#6B4F28' }}>Version française</Link>
        </p>
      </body>
    </html>
  );
}
