# Shelfie

Shelfie is a small reading tracker. People sign up with an email and password, pick the genres they like, set a yearly reading goal and add their first book. They search a catalogue of about 50 books, keep books on three shelves (Want to read, Reading, Finished), rate and review what they finish, invite friends, and can upgrade to a Pro plan through a simulated checkout. A weekly job flags readers who are behind on their goal, and a small JSON API serves a reader's shelves to a mobile app. It is built with Next.js (App Router), TypeScript, Prisma and Postgres (Neon), with product analytics in PostHog.

## Setup

Requires Node 20 or newer.

```bash
npm install
npm run setup        # creates .env from .env.example, applies migrations, seeds the books
# fill DATABASE_URL, DATABASE_URL_UNPOOLED and NEXT_PUBLIC_POSTHOG_KEY in .env first
npm run dev          # http://localhost:3000
```

Other scripts:

| Script | What it does |
| --- | --- |
| `npm run build` | Generates the Prisma client and builds the app |
| `npm run start` | Serves the production build |
| `npm run db:seed` | Seeds the books (skips if books already exist) |
| `npm run job:goal-check` | Runs the weekly reading-goal check |
| `npx prisma migrate dev` | Applies migrations and creates new ones after schema changes |

To pay at checkout, use any 16-digit card number (for example `4242 4242 4242 4242`).

## Flows

| # | Flow | UI page | Handler |
| --- | --- | --- | --- |
| 1 | Landing page with pricing, "Start free trial" | `app/page.tsx` | links to `/signup` |
| 2a | Sign up | `app/signup/page.tsx` | `signup` in `app/actions/auth.ts` |
| 2b | Log in | `app/login/page.tsx` | `login` in `app/actions/auth.ts` |
| 2c | Log out | `components/nav.tsx` | `logout` in `app/actions/auth.ts` |
| 3a | Onboarding step 1: pick genres | `app/onboarding/genres/page.tsx` | `saveGenres` in `app/actions/onboarding.ts` |
| 3b | Onboarding step 2: yearly goal | `app/onboarding/goal/page.tsx` | `saveGoal` in `app/actions/onboarding.ts` |
| 3c | Onboarding step 3: first book | `app/onboarding/first-book/page.tsx` | `addFirstBook` in `app/actions/onboarding.ts` |
| 4 | Search with genre, year and author filters | `app/search/page.tsx` | query in the page (server component); books seeded by `prisma/seed.ts` |
| 4b | Quick add from search results | `app/search/page.tsx` | `quickAdd` in `app/actions/search.ts` |
| 5a | Add a book to a shelf | `app/books/[id]/page.tsx` | `addToShelf` in `app/actions/shelf.ts` |
| 5b | Move a book between shelves | `app/shelves/page.tsx` | `moveShelf` in `app/actions/shelf.ts` |
| 5c | Remove a book from a shelf | `app/shelves/page.tsx` | `removeFromShelf` in `app/actions/shelf.ts` |
| 6 | Rate and review a finished book | `app/books/[id]/review/page.tsx` | `saveReview` in `app/actions/reviews.ts` |
| 7 | Invite a friend by email | `app/invite/page.tsx` | `sendInvite` in `app/actions/invites.ts` |
| 8 | Upgrade to Pro (checkout and payment webhook) | `app/checkout/page.tsx`, `app/checkout/checkout-form.tsx` | `POST /api/payments/webhook` in `app/api/payments/webhook/route.ts` |
| 9 | Cancel the subscription with a reason | `app/settings/cancel/page.tsx` | `cancelSubscription` in `app/actions/subscription.ts` |
| 10a | Change the yearly goal | `app/settings/page.tsx` | `updateGoal` in `app/actions/settings.ts` |
| 10b | Delete the account | `app/settings/page.tsx` | `deleteAccount` in `app/actions/settings.ts` |
| 11 | Mobile API: the signed-in reader's shelves | none | `GET /api/shelves` in `app/api/shelves/route.ts` |
| 12 | Weekly reading-goal check | none (`npm run job:goal-check`) | `jobs/weekly-goal-check.ts` |

Shared code: `lib/auth.ts` (password hashing, sessions, the `shelfie_session` cookie and bearer tokens), `lib/db.ts` (Prisma client), `lib/shelves.ts` (shelves, genres, price), `prisma/schema.prisma` (data model).

### Mobile API

`GET /api/shelves` accepts the session cookie or `Authorization: Bearer <token>`, where the token is a session token from the `Session` table. It returns `401` without either.

## Analytics

Product analytics go to PostHog.

- **Browser:** `components/analytics/analytics-provider.tsx` starts posthog-js once the visitor accepts the cookie banner (`components/analytics/consent-banner.tsx`), sends page views, and identifies signed-in readers by their user id. Client events go through `capture()` in `lib/analytics/client.ts`.
- **Server:** server actions and route handlers call `track()` in `lib/analytics/server.ts` (posthog-node, sent before the response).
- **Relay:** `POST /api/events` forwards a few client events through our own domain so ad blockers don't drop them (`forward()` in `lib/analytics/client.ts`).
- **Jobs:** `jobs/weekly-goal-check.ts` sends `goal_reminder_sent`.
