# Synchronisation iCal — Airbnb / VRBO / Booking.com

Évite les doubles réservations entre le site et les plateformes externes
(Airbnb en priorité, VRBO et Booking.com en option).

## Architecture

```
┌──────────────┐                       ┌──────────────┐
│   Airbnb     │ ──── iCal export ───► │  Notre site  │
│   (villa)    │   /api/cron/sync-ical │  (cron 30min)│
└──────────────┘                       └──────┬───────┘
                                              │
                                       availability_blocks
                                              │
┌──────────────┐                       ┌──────┴───────┐
│   Airbnb     │ ◄──── iCal export ─── │  Notre site  │
│   (villa)    │                       │  /api/ical/<slug>
└──────────────┘                       └──────────────┘
```

- **Import** : un cron pull chaque URL iCal toutes les 30 min, parse les
  VEVENT et upsert dans `availability_blocks` (`source` ∈ `{airbnb, vrbo, booking_com}`,
  `external_uid` = VEVENT UID pour upsert idempotent).
- **Export** : `/api/ical/[slug]` expose un flux iCal contenant les
  réservations engagées + les blocs manuels (maintenance/owner). Les blocs
  importés (source ≠ manual) sont exclus pour éviter les boucles infinies.

## Configuration

### 1. Migration SQL

Exécuter `supabase/add_ical_sync.sql` une fois dans Supabase SQL Editor.

### 2. Variable d'environnement

```bash
CRON_SECRET=<une-chaîne-aléatoire-longue>
```

À configurer dans Vercel → Settings → Environment Variables (Production + Preview).

### 3. Cron

Deux options selon le plan Vercel :

**Vercel Pro** : le fichier `vercel.json` contient déjà la config
`*/30 * * * *`. Rien à faire après le deploy. Vercel ajoute automatiquement
le header `Authorization: Bearer ${CRON_SECRET}` (si variable existante).

**Vercel Hobby** (limité à 1 cron/jour) : utiliser un service externe gratuit
comme [cron-job.org](https://cron-job.org) :
- URL : `https://<ton-domaine>/api/cron/sync-ical`
- Méthode : GET
- Cadence : */30 * * * *
- Header custom : `Authorization: Bearer <ton-CRON_SECRET>`

## URLs iCal à récupérer côté propriétaire

### Airbnb
1. Airbnb → Annonce → **Calendrier** → **Disponibilité**
2. Section **Sync calendars** → **Export calendar**
3. Copier l'URL (`https://www.airbnb.fr/calendar/ical/...?t=...`)
4. Coller dans Admin villa → onglet Informations → "URL iCal Airbnb"
5. Sauvegarder, puis cliquer "Synchroniser maintenant" pour le premier pull

### Airbnb (sens inverse — pour qu'Airbnb bloque nos réservations)
1. Dans la même section "Sync calendars" → **Import calendar**
2. Coller l'URL affichée dans l'admin sous "Export"
   (`https://<notre-domaine>/api/ical/<slug>`)
3. Nommer "Site Island Living SXM"

### VRBO
Même principe : Listing → Calendar → Import/Export iCal.

## Limites connues

- **Délai de propagation** : 30 min pour notre import + 1-3h pour Airbnb
  qui re-pull notre flux. Dans cette fenêtre, un double-booking reste
  théoriquement possible si deux clients réservent simultanément sur les
  2 plateformes. Pour un volume modéré (2 villas haut de gamme), risque
  acceptable. Pour temps réel garanti → Channel Manager payant
  (Smoobu, Hospitable…).
- **iCal ne transporte pas le nom du voyageur** côté Airbnb pour des raisons
  de confidentialité — on n'a que les dates et "Reserved" en summary. C'est
  suffisant pour bloquer, pas pour identifier le voyageur.
- **Les blocs importés ne créent pas de booking** dans la table `bookings`,
  juste des `availability_blocks` avec `source ≠ manual` et `block_type = 'external'`.
