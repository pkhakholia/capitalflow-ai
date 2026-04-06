# VentureMatch (Next.js + TypeScript + Tailwind)

A modern VC-startup matching platform template with:

- Landing page
- Startup + investor signup/profile forms
- Dashboard layout
- Matching page with explainable scoring
- Clean, professional Tailwind UI

## Getting started

1) Install Node.js (recommended: Node 20+).
2) In this folder:

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Pages

- `/`: Landing
- `/startup-signup`: Startup profile form
- `/investor-signup`: Investor profile form
- `/dashboard`: Dashboard overview
- `/dashboard/matches`: Matches list

## Notes

- Profiles are saved to **Supabase** (including embeddings) and matching uses stored embeddings.
- Some UI state (like paywall unlock) may use `localStorage` as a convenience for the demo.

## Embedding backfill (admin)
If some existing `Startups`/`investors` rows have `embedding` as `null`, you can backfill them:

1. Set `ADMIN_EMBEDDINGS_TOKEN` in your server environment (e.g. in `.env.local`).
2. Call:
   - `POST /api/admin/backfill-embeddings`
   - JSON body: `{ "adminToken": "<token>", "dryRun": true }`

Set `dryRun: false` to actually update rows.

## Razorpay paywall
Environment variables:
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `PAYWALL_SESSION_SECRET` (used to sign the server-issued paid cookie)

