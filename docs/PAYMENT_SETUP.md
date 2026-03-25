# Guide d'intégration des paiements — StMartin Rentals

## Architecture préparée

L'infrastructure de paiement est **prête à brancher**. Les boutons Stripe et PayPal sont déjà présents dans le `BookingForm` (désactivés). Il suffit d'ajouter les clés et d'activer les routes.

---

## 1. Stripe

### Variables d'environnement à ajouter dans Vercel

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Étapes d'activation

1. Créer un compte Stripe sur https://stripe.com
2. Récupérer les clés dans Dashboard → Developers → API Keys
3. Ajouter les variables dans Vercel (Settings → Environment Variables)
4. Décommenter la route `/app/api/payments/stripe/route.ts`
5. Activer le bouton Stripe dans `BookingForm.tsx`

### Route Stripe (à décommenter)

```typescript
// app/api/payments/stripe/route.ts
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const { amount, currency, bookingId, apartmentName } = await req.json();
  
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: currency ?? 'usd',
        product_data: { name: apartmentName },
        unit_amount: Math.round(amount * 100), // en centimes
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/booking/cancel`,
    metadata: { bookingId },
  });

  return Response.json({ url: session.url });
}
```

---

## 2. PayPal

### Variables d'environnement à ajouter dans Vercel

```
NEXT_PUBLIC_PAYPAL_CLIENT_ID=AXxx...
PAYPAL_CLIENT_SECRET=EXxx...
```

### Étapes d'activation

1. Créer un compte PayPal Business sur https://developer.paypal.com
2. Créer une application dans le Dashboard PayPal
3. Récupérer le Client ID et Secret
4. Ajouter les variables dans Vercel
5. Décommenter la route `/app/api/payments/paypal/route.ts`
6. Activer le bouton PayPal dans `BookingForm.tsx`

---

## 3. Modes de paiement à définir

À confirmer avec la cliente :
- [ ] Paiement intégral à la réservation
- [ ] Acompte 30% + solde à l'arrivée
- [ ] Devise : USD uniquement ou USD + EUR

---

## 4. Webhook Stripe (pour confirmer automatiquement les réservations)

Une fois Stripe configuré, créer un webhook dans le Dashboard Stripe pointant vers :
```
https://stmartin-rentals-seven.vercel.app/api/payments/stripe/webhook
```

Événements à écouter :
- `checkout.session.completed` → mettre à jour `booking_status` en `confirmed`
- `payment_intent.payment_failed` → mettre à jour en `cancelled`
