# Shelfie tracking audit: first audit (26 Nov 2026)

**No analytics data was read.** The PostHog pull needs a project id (`analytics.project_id` in `.datalyze/config.yaml`), the host and a personal API key with Query Read (`POSTHOG_API_KEY`). None of these are set, and this session has no PostHog connection. Every data check is therefore *not measured* (–), and nothing below says whether an event arrives. All tracking code was first committed on 26 Nov 2026, so none of it is older than the seven days the "broken" bucket needs anyway. This audit compares the plan with the code only.

Scope: the whole repo, on `main`. This run also wrote the first tracking plan.

## 1. Summary

Shelfie sends 21 events: 16 from the server (server actions, the payment webhook, the mobile API and the weekly job) and 5 from the browser. Every one of the 21 has at least one problem found in the code. There are **33 findings: 13 high, 13 medium and 7 low.** None was disproved by the verifier. There are 3 open questions, 10 property suggestions and 8 property conditions. Health is not scored without data.

The three things to fix first:

1. **Personal data is going to PostHog** (F2, F3, F4, F5, F9, F22). This breaks the team's own privacy rule. The values sent are emails (`invite_sent.invitee_email` and `meta`, and `email` on identify), typed text (review bodies, the cancel reason text, search queries, and the search URL in `$current_url`) and typed card digits (`checkout_failed.card_last4`). `search_performed` is also sent for readers who declined cookies.
2. **Money is counted wrong** (F6, F7, F8, F10). `checkout_completed` fires on the Pay click, before any payment. `payment_succeeded` is sent before the duplicate check, so a webhook delivered twice is counted twice. Its amount comes from a request the browser posts itself.
3. **The activation funnel is broken at both ends** (F1, F11, F21). `user_signed_up` goes out under the reader's email, not their user id, so sign-ups never join onboarding. `onboarding_completed` sits after a `redirect()` and never fires. `reset` is never called at logout.

## 2. How this product tracks today

- **SDKs:** posthog-js in the browser and posthog-node on the server.
- **Browser:** `capture()` in `lib/analytics/client.ts` sends only after cookie consent, once posthog-js has loaded. `components/analytics/analytics-provider.tsx` starts posthog-js after consent (`autocapture: false`, `capture_pageview: true`). It also sends `$pageview` itself on every route change, registers `platform=web` and `app_version`, and calls `identify(user.id, { email, plan, signed_up_at })` on every page load of a signed-in reader. `TrackLink` sends `cta_clicked`.
- **Relay:** `forward()` posts to `POST /api/events`, which re-sends the event (only `search_performed`) from the server. It doesn't check consent, and it uses the literal id `"anonymous"` until posthog-js has loaded. Because the search form causes a full page load, that is nearly always.
- **Server:** `track(distinctId, event, props)` in `lib/analytics/server.ts` is awaited before redirects and adds `app_version`. Every server action and route handler uses it.
- **Job:** `jobs/weekly-goal-check.ts` builds its own posthog-node client. It sends `goal_reminder_sent` and is never flushed or shut down.
- **Identity:**
  - The client identifies readers by `users.id`.
  - The server sends as `users.id` everywhere except two places. `user_signed_up` goes out as the email, and the relayed `search_performed` goes out as the browser id or `"anonymous"`. `_identity.yaml` records `server.same_as_client: false` for this reason.
  - `reset` is never called, and `alias` isn't used.
- **Not a tracker:** `lib/logging/logEvent.ts` (`logEvent("book-added", …)` in onboarding) only logs to the console in development and never reaches PostHog.
- **What the scan can't see:**
  - `cta_clicked`'s properties: `TrackLink` receives them as a prop. The plan takes them from `app/page.tsx`.
  - `goal_reminder_sent`'s properties: the job's single-object `posthog.capture({...})` call. The profile names the event through `dynamic_names`.
  - posthog-js's own automatic first `$pageview`.
- **Not opened:** no file in a language the scan doesn't open.

**The first plan:**
- 8 area files: accounts, onboarding, library, invites, billing, goals, mobile-api and marketing-site.
- `_tracking_profile.yaml`, `_identity.yaml`, `_user_properties.yaml`, `_super_properties.yaml`, `_properties.yaml` (with the synonym `amount: amount_cents`) and `_baseline.json`.
- `fires_at` placed for all 21 events, 0 corrected. `goal_reminder_sent` is run by a CLI job, which follows no HTTP request, so its R035 error is accepted as debt.
- Rule errors: R001 `$pageview` is covered by question Q3, R004 `checkout_failed` by F9, and R014 `checkout_started.amount` by F15.

## 3. Event by event

✓ ok · ✗ problem · ◦ suggestion · – not measured (no data)

| Event | Area | Tier | Fires | Moment | Paths | Once | Name accurate | Name clear | Properties | Values filled | Values sensible | Could carry |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `user_signed_up` | accounts | identity | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ |
| `user_logged_in` | accounts | identity | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ◦ |
| `account_deleted` | accounts | other | ✓ | ✗ | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `checkout_started` | billing | money | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ | ✓ |
| `checkout_completed` | billing | money | ✓ | ✗ | ✓ | ✓ | ✗ | ✓ | ✗ | ✓ | ✓ | ✓ |
| `checkout_failed` | billing | money | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ | ◦ |
| `payment_succeeded` | billing | money | ✓ | ✗ | ✓ | ✗ | ✓ | ✓ | ✗ | ✓ | ✗ | ◦ |
| `subscription_canceled` | billing | money | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ◦ |
| `reading_goal_updated` | goals | other | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `goal_reminder_sent` | goals | core | ✗ | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ | ✓ | ✓ | ✓ |
| `invite_sent` | invites | core | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ | ✓ | ✗ | ✓ |
| `search_performed` | library | core | ✓ | ✗ | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ | ✓ |
| `book_added` | library | core | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✓ | ✓ | ✓ |
| `book_shelf_changed` | library | core | ✓ | ✗ | ✗ | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `book_removed` | library | core | ✓ | ✗ | ✓ | ✗ | ✓ | ✓ | ✗ | ✓ | ✗ | ✓ |
| `review_submitted` | library | core | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ | ◦ |
| `cta_clicked` | marketing-site | funnel | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ◦ |
| `$pageview` | marketing-site | other | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ |
| `mobile_shelves_fetched` | mobile-api | core | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | ✗ | ◦ |
| `onboarding_step_completed` | onboarding | onboarding | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✗ | ◦ |
| `onboarding_completed` | onboarding | onboarding | ✗ | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

- `user_signed_up` properties: A sign-up can fail on the server (email taken, invalid email, short password) but the event has no status or failure_reason: every refusal redirects before the call, so the sign-up funnel can't show how many attempts fail or why. (F25)
- `user_signed_up` values_filled: plan_intent is read from a form field named plan, but the /signup form has no plan field: the page reads ?plan= from the URL and only uses it for a note, never putting it in the form. So plan_intent is null on every sign-up, including those that came from a plan call to action (/signup?plan=pro and /signup?plan=free from the home page). (F26)
- `user_signed_up` values_sensible: The event is sent with the reader's email as the PostHog distinct id, while identify (client) and every other server event use users.id. The sign-up lands on a separate person keyed by an email (personal data as an id, against the team's privacy rule), so it never joins the reader's later events and sign-up to activation funnels break. user.id is in scope two lines above. (F1)
- `user_logged_in` properties: A login can fail (unknown email or wrong password) but the event has no status or failure_reason; the refusal redirects before the call, so failed logins can't be counted. (F25)
- `account_deleted` moment: Sent before destroySession and db.user.delete: a delete that throws afterwards is still counted as a deleted account. The outcome should be sent after db.user.delete resolves (user.id, plan and createdAt are still in scope). (F30)
- `account_deleted` name_accurate: Nothing is deleted yet when it fires (same cause as moment). (F30)
- `checkout_started` paths: Lost on a full page load or refresh of /checkout: React runs the page's effects (inside <main>) before AnalyticsProvider's init effect, which sits after {children} in app/layout.tsx, so capture() sees posthog.__loaded false and returns. It only arrives when the reader reaches /checkout by client-side navigation (Upgrade to Pro link in settings, plan card on the home page). (F14)
- `checkout_started` properties: Checkout has two ways in (the Upgrade to Pro link in settings and the Pro plan card on the home page) but no entry_point, so nobody can tell which surface drives upgrades. (F15)
- `checkout_started` values_sensible: amount is sent as text in dollars ("5.00") from toFixed(2), while checkout_completed and payment_succeeded send amount_cents as a number: sums break and the same price lives under two names and units. (F15)
- `checkout_completed` moment: Sent from the browser on submit, before the payment request at :31 is even sent: every attempt counts as completed, including the ones that then fail at :47. A money outcome belongs on the server after the payment is recorded; it is also dropped for readers who declined cookies. (F6)
- `checkout_completed` name_accurate: Nothing is completed when it fires: the payment hasn't been requested yet. It is a checkout_submitted intent. (F6)
- `checkout_completed` properties: Presented as the checkout outcome but has no status or failure_reason, and no payment_id to join it to payment_succeeded, although the id is generated three lines later. (F6)
- `checkout_failed` paths: If fetch rejects (network error, offline) the await at :31 throws: no checkout_failed is sent, and setPending(false) never runs, so the button stays on Processing. (F9)
- `checkout_failed` name_clear: A separate _failed event next to checkout_completed: conversion needs a union. The invalid_card branch is a client refusal before any request (belongs on an error event), and payment_failed belongs as status=failed on the server payment outcome. Its `reason` property also means a failure code here but a cancellation reason on subscription_canceled, instead of the standard failure_reason. (F9)
- `checkout_failed` values_filled: card is the typed input with whitespace stripped; a field of spaces passes the HTML required check and yields card_last4 = "", and a short entry yields fewer than four characters. (F9)
- `checkout_failed` values_sensible: card_last4 is the last four characters of whatever the reader typed in the card field, which failed the digit check, so it can hold letters or other typed text: card details and raw typed text, both banned by the privacy rules and context.md. It answers no question about why checkouts fail. (F9)
- `payment_succeeded` moment: Sent before the payment, subscription and plan are written: if the transaction at :40 throws, revenue is counted for a reader who never became Pro. (F7)
- `payment_succeeded` once: Sent before the duplicate check, so a webhook delivered twice (providers retry) is counted twice while the second delivery writes nothing. (F7)
- `payment_succeeded` properties: A money outcome that can fail with no status or failure_reason: any other webhook type (a failed payment) returns at :24 and sends nothing, so failed payments are invisible on the server. (F10)
- `payment_succeeded` values_sensible: amount_cents is whatever the request body says: the browser itself posts the webhook with its own amountCents, and the route neither verifies a signature nor checks it against PRO_PRICE_CENTS, so revenue can be faked from the browser. (F8)
- `subscription_canceled` values_sensible: detail is the free text the reader typed in "Anything else?" (up to 1000 characters), sent as an event property: raw typed text, which the privacy rules and context.md forbid. It is already stored in subscription.cancelDetail; send a length instead. (F3)
- `reading_goal_updated` moment: Sent after db.user.update resolves, but also when the saved goal equals the current one: the input is pre-filled with the current goal and there is no old != new check, so pressing Save without changing it counts as a goal change and inflates 'how often do readers change their goal'. (F31)
- `goal_reminder_sent` fires: Reachable (npm run job:goal-check, package.json:11; no scheduler in the repo), but the job's own posthog-node client only queues capture() for a batched flush and is never flushed or shut down: main() ends with db.$disconnect() only, and the error path calls process.exit(1). Events still queued when the process exits are lost. This is from the code, not from data. (F23)
- `goal_reminder_sent` once: The row is an upsert on (userId, weekOf), but the event is sent on every run: re-running the job in the same week sends goal_reminder_sent again for the same reader and week_of. (F23)
- `goal_reminder_sent` name_accurate: Nothing is sent to the reader: the job only upserts a GoalReminder row, and nothing in the repo reads that table or sends an email/notification. The event records 'reader flagged behind pace', not a reminder delivered (yet the home page sells 'Weekly goal reminders'). (F24)
- `goal_reminder_sent` properties: Sent with the job's own posthog.capture, not the server wrapper track(), so it lacks app_version, which the wrapper adds to every other server event (super_property_missing). books_read, expected, yearly_goal and week_of are all on the only call. (F23)
- `invite_sent` name_accurate: Nothing is sent to the friend: the invite is only stored (no email, no link, no acceptance flow), and the page itself tells the reader 'Invite saved.' Analysts reading invite_sent will assume the friend was contacted. Keep the name (renames need a dual-fire window) but say it in the description and don't build invite-to-signup conversion on it. (F33)
- `invite_sent` properties: An outcome that can fail carries no status or failure_reason: the server refuses an email without @ and a self-invite with a redirect before any event, so refusals are invisible. No invite_id joins the event to the Invite row (the create result is discarded). (F17)
- `invite_sent` values_sensible: Personal data: invitee_email is the friend's email address (a non-user who never consented) and meta is the sender's own email, read from a hidden form field the browser controls (so it can be forged) and duplicating user.id which already identifies the sender. context.md forbids sending emails. Drop both properties. (F2)
- `search_performed` moment: Fires in a mount effect, so simply opening /search (no title, no filter: q, genre, year and author all default to "") sends a search. Page opens are counted as searches, inflating the count and the zero-filter share. (F20)
- `search_performed` once: The effect runs on every mount, so a refresh or a back/forward navigation to the same /search?q=... URL sends the same search again; nothing dedupes an unchanged search. (F20)
- `search_performed` name_accurate: Same cause as moment: on a plain page open nothing was searched, yet search_performed is sent. (F20)
- `search_performed` properties: Sends the raw query instead of char_count (the standard property for typed text), and names the result count results_count instead of the standard result_count. Because it goes through the server relay, the client super property platform is not on it. (F4)
- `search_performed` values_filled: query is "" on every page open and every filter-only search. year is Number(year) unguarded: a non-numeric year param gives NaN (sent as null) while filter_count still counts it, whereas the page itself ignores it. (F20)
- `search_performed` values_sensible: query is the raw text the reader typed (personal data, forbidden by context.md Privacy). The distinct id is the browser's PostHog id or the literal "anonymous" when analytics hasn't started, so every visitor who declined or hasn't answered the cookie banner is merged into one "anonymous" person, and the event is sent despite declined consent. The page requires a signed-in user, so the server knows user.id but doesn't use it. (F4)
- `book_added` moment: On the book page the call follows an upsert, so it is sent when an existing shelf item is changed with 'Update shelf', and even when the reader resubmits the shelf the book is already on. Moves and no-ops are counted as adds. (F16)
- `book_added` paths: The first book added in onboarding creates a shelf item but only calls logEvent (a dev-only console log), so the reader's first book never sends book_added. (F18)
- `book_added` once: A double submit of 'Add to shelf' runs the upsert twice without error and sends book_added twice. (quickAdd is guarded: it only creates and sends when no item exists.) (F16)
- `book_added` name_accurate: Same cause as moment: on the 'Update shelf' path nothing is added; the book moves shelf (or nothing changes). (F16)
- `book_added` properties: genre is in the plan with no only_when but the search path leaves it out, though book (with genre) is loaded two lines up. No source value for onboarding, since that path doesn't send. (F18)
- `book_shelf_changed` moment: Sent after the update even when the shelf picked equals the current one; the select defaults to the current shelf, so clicking Move without changing it sends from_shelf = to_shelf. (F16)
- `book_shelf_changed` paths: Changing an existing book's shelf from the book page ('Update shelf') moves it too, but sends book_added instead, so moves made there (including marking finished) are missing here. (F16)
- `book_shelf_changed` name_accurate: Same cause as moment: when from_shelf equals to_shelf nothing changed. (F16)
- `book_removed` moment: Sent after deleteMany whatever it deleted: an item id that isn't the reader's, or one already removed, sends book_removed with nothing removed. (F19)
- `book_removed` once: Same cause as moment: a double click on Remove runs deleteMany twice (the second deletes 0 rows) and sends two events. (F19)
- `book_removed` properties: Only item_id (the shelf item's id), so it can't be joined to book_added / book_shelf_changed, which carry book_id, and it has no shelf, so the plan's question 'from which shelf' can't be answered. (F19)
- `book_removed` values_sensible: item_id is taken from the form, not from a deleted row, so it can be an id that isn't the reader's or doesn't exist. (F19)
- `review_submitted` properties: Sends review, the full text the reader typed (up to 5000 chars), as an event property; the analysis needs only its length (char_count). No way to tell a new review from an edit. (F3)
- `review_submitted` values_sensible: review is raw typed text: personal data, forbidden by context.md Privacy and good-vs-bad 'Personal data'. (F3)
- `cta_clicked` paths: The nav's Sign up link is a call to action into sign-up on every page (including /) and sends nothing, so 'which CTAs bring visitors to sign-up' misses that way in. The plan documents the gap but doesn't justify it. (F28)
- `cta_clicked` values_sensible: plan splits by casing: the hero sends the literal "pro" while the cards send the display name plan.name ("Free", "Pro"), so Pro appears as two values; the plan's values: [pro, Free, Pro] records the split. The hero's plan "pro" is also hard-coded for signed-in visitors, whose hero link goes to /shelves, not a Pro sign-up. (F28)
- `$pageview` once: posthog.init has capture_pageview: true, so posthog-js sends its own $pageview for the first page, and the provider's effect sends another as soon as ready flips to true: the first page of every consented visit is counted twice. (F29)
- `$pageview` values_sensible: $current_url is the full URL with its query string. The search form submits by GET, so /search?q=<typed title> puts the text a reader typed on every search page view, which the team's privacy rule forbids; a kept URL should drop its query string. (F5)
- `mobile_shelves_fetched` name_accurate: The name says the mobile app fetched shelves, but the route accepts the shelfie_session cookie too, so a signed-in browser that opens /api/shelves sends mobile_shelves_fetched; the code can tell the two apart (bearer vs cookie) but doesn't. The plan's description admits this. (F27)
- `mobile_shelves_fetched` values_sensible: platform is hard-coded "ios" on every request, whatever sent it: cookie requests from a browser and any Android client are recorded as ios, and the server event's platform overrides nothing useful (the client super property platform=web isn't on server events). The plan's values: [ios] locks the constant in. Derive it from the request (bearer vs cookie, or the User-Agent / an X-Platform header the app sends). (F27)
- `onboarding_step_completed` once: The onboarding pages only check the session, so a reader who goes back (browser back, or the URL) and submits again sends a second onboarding_step_completed for the same step; the write keeps onboardingStep with Math.max and nothing marks the repeat. (F12)
- `onboarding_step_completed` values_sensible: step is the number 1 on the genres screen but form.get("step") on the goal screen, the string "2" from a hidden input: a type split against the plan's numeric type, and a value the browser controls. (F13)
- `onboarding_completed` fires: Unreachable: the call sits after redirect("/shelves?welcome=1"), which throws, so addFirstBook never reaches it. The track() helper itself says to call it before redirect(). (F11)
- `onboarding_completed` once: Once it runs, a reader who returns to /onboarding/first-book (the page only checks the session) and submits again sends onboarding_completed a second time; addFirstBook sets onboardingStep 4 without checking it was already 4. (F12)

## 4. Findings

Most important first. The verifier dismissed none.

### F1 · high · user_signed_up is sent with the reader's email as the distinct id

The signup action passes the email to track() as the distinct id, while identify and every other server event use users.id. Each sign-up lands on a separate PostHog person keyed by personal data, so the sign-up never joins the reader's onboarding and later events, and the activation funnel from sign-up breaks.

- Evidence: `app/actions/auth.ts:28`; `components/analytics/analytics-provider.tsx:42`
- Fix: Pass user.id (in scope from db.user.create) as the first argument of track() in signup. Past sign-ups stay on email-keyed persons; note the date in the changelog (SEMANTICS) so the funnel can start from it.

### F2 · high · invite_sent sends the friend's email and the sender's email as properties

invitee_email is the friend's email address, and meta is the sender's own email, read from a hidden form field the browser controls. Emails must never be event properties (context.md Privacy), and the sender is already known from the distinct id.

- Evidence: `app/actions/invites.ts:19`; `app/invite/page.tsx:24`
- Fix: Stop sending invitee_email and meta; drop the hidden meta field. Send an invite_id from the created row instead (see F17).

### F3 · high · review_submitted and subscription_canceled send text the reader typed

review_submitted sends the whole review body as review, and subscription_canceled sends the free text of "Anything else?" as detail. Raw typed text is personal data and context.md forbids it; both texts are already stored in the database.

- Evidence: `app/actions/reviews.ts:30`; `app/actions/subscription.ts:37`
- Fix: Remove review and detail from the calls. Send char_count (body.length) on review_submitted and a detail_char_count on subscription_canceled if the length matters (suggestions S-review and S-detail).

### F4 · high · search_performed sends the typed query, ignores cookie consent and goes out as "anonymous"

SearchTracker sends query (the title the reader typed) through forward(), which posts to /api/events whether or not analytics has started, so readers who declined cookies are tracked too. The distinct id is the PostHog id only when posthog has loaded, else the literal "anonymous". The search form is a GET form, so every search is a full page load, and on a full load SearchTracker's effect runs before AnalyticsProvider starts posthog-js: nearly every search, consent or not, goes out under the one id "anonymous", although the page requires sign-in. Through the server relay it also loses the client super property platform, and it uses results_count where the standard name is result_count.

- Evidence: `components/analytics/search-tracker.tsx:10`; `lib/analytics/client.ts:27`; `app/api/events/route.ts:17`
- Fix: Send char_count instead of query and result_count instead of results_count. Wait until consent is granted and posthog's loaded callback has run, then send through capture() (the browser id is then the identified user.id); or send it from the search page's server side with user.id. New names are additive; drop query.

### F5 · high · $pageview sends the search text in its URL

The page-view effect sends $current_url as window.location.href. The search form is a GET form, so every search page view carries /search?q=<the title the reader typed>.

- Evidence: `components/analytics/analytics-provider.tsx:37`; `app/search/page.tsx:32`
- Fix: Add a before_send hook in posthog.init that strips q from $current_url, $referrer, $initial_referrer and $initial_current_url, in properties and in $set_once, on every event (posthog-js adds these itself, and the next page's referrer carries the search too).

### F6 · high · checkout_completed fires on the Pay click, before any payment

The browser sends checkout_completed as soon as a 16-digit card number is submitted, before the payment request is made, so every attempt, including ones that then fail, counts as completed. It has no status and no payment_id to join it to payment_succeeded, although the id is created inside the payment request's body just below.

- Evidence: `app/checkout/checkout-form.tsx:27`; `app/checkout/checkout-form.tsx:31`
- Fix: Treat the click as an intent: add checkout_submitted (client, with a payment_id created before both the event and the request) and deprecate checkout_completed with replaced_by checkout_submitted; take the outcome from the server (payment_completed, F10). Breaking: add the new event, keep the old one firing with deprecated, replaced_by and a dual_fire_until window (at least 30 days), and a SEMANTICS changelog line.

### F7 · high · payment_succeeded is sent before the duplicate check and before the payment is written

The webhook tracks payment_succeeded before it looks for an existing payment with the same id and before the transaction that writes the payment, subscription and plan. A webhook delivered twice counts the revenue twice, and a transaction that fails still counts it.

- Evidence: `app/api/payments/webhook/route.ts:35`; `app/api/payments/webhook/route.ts:37`; `app/api/payments/webhook/route.ts:40`
- Fix: Move the track call after the duplicate check returns and after db.$transaction resolves. Changelog SEMANTICS line for the moved moment.

### F8 · high · payment_succeeded takes its amount from an unverified request the browser sends

The checkout form posts the payment.succeeded body to the webhook itself, and the route checks no signature and doesn't compare amountCents with PRO_PRICE_CENTS. Anyone can post any amount, so revenue in PostHog can be faked from the browser. It also never checks that userId is the signed-in reader, so anyone can upgrade any account and have it counted.

- Evidence: `app/checkout/checkout-form.tsx:31`; `app/api/payments/webhook/route.ts:27`
- Fix: Verify the provider's signature in the webhook (or, while it is simulated, set amount_cents from the server's price), and never accept the event from the browser.

### F9 · high · checkout_failed is a separate failure event, sent from the browser with typed card digits

Failures go on their own event instead of status on the outcome, so every conversion rate needs a union. invalid_card is a browser refusal before any request and sends card_last4, the last four characters typed into the card field (card data, possibly any text, possibly empty). A network error makes fetch throw, so no checkout_failed is sent and the button stays on Processing.

- Evidence: `app/checkout/checkout-form.tsx:23`; `app/checkout/checkout-form.tsx:49`; `app/checkout/checkout-form.tsx:31`
- Fix: Stop sending card_last4. Record payment failures as status=failed with failure_reason on the server outcome (payment_completed, F10). The client refusal (invalid_card) has no outcome event: put it on an error event (error_occurred with feature=checkout, error_reason=invalid_card, a new event for the team to approve). Catch the fetch rejection. Deprecate checkout_failed with replaced_by payment_completed for its payment_failed half. Breaking: dual-fire for at least 30 days, with a SEMANTICS changelog line.

### F11 · high · onboarding_completed never fires: the call sits after redirect()

In addFirstBook, track("onboarding_completed") comes after redirect("/shelves?welcome=1"). redirect() throws, so the line never runs and no reader is ever counted as finishing onboarding.

- Evidence: `app/actions/onboarding.ts:58`; `app/actions/onboarding.ts:59`
- Fix: Move the await track(...) call above the redirect.

### F21 · high · reset is never called at logout

Nothing calls posthog.reset(): logout only destroys the session. On a shared browser the next reader keeps the previous reader's distinct id until identify runs, and anything sent before that (and every page view of a logged-out visitor) lands on the previous reader.

- Evidence: `app/actions/auth.ts:46`; `components/nav.tsx:23`
- Fix: Call posthog.reset() on logout (e.g. in the provider when user goes from set to null) and after account deletion.

### F22 · high · identify writes the reader's email to the PostHog profile

AnalyticsProvider calls identify with email as a person property on every page load. context.md says never to send emails.

- Evidence: `components/analytics/analytics-provider.tsx:42`
- Fix: Remove email from identify's properties, unset email on existing profiles, and remove it from _user_properties.yaml. (signed_up_at as set_once is a tidy-up: createdAt never changes.)

### F23 · high · goal_reminder_sent is probably lost, and is resent on every run

The weekly job makes its own posthog-node client and never calls flush or shutdown: main() ends with db.$disconnect() and the error path calls process.exit(1), so queued events can be dropped when the process exits. It is sent every run although the row is upserted per reader and week, so a second run in a week counts the same reader again. It bypasses track(), so it has no app_version.

- Evidence: `jobs/weekly-goal-check.ts:5`; `jobs/weekly-goal-check.ts:40`; `jobs/weekly-goal-check.ts:56`
- Fix: Send through the server wrapper track(), or await posthog.shutdown() on both the success and the error path before exit. Send only for a new week's row: read it with findUnique on userId_weekOf first, or create and catch the unique-constraint error (upsert doesn't say whether it created).

### F10 · medium · Failed payments send nothing: no payment outcome with status

The webhook returns early for every type but payment.succeeded, and payment_succeeded carries no status or failure_reason. Today the only failures are the route's own 400 and 404 answers and a failed write, which only the browser records (checkout_failed reason=payment_failed); once a real provider sends payment.failed, those will be dropped too.

- Evidence: `app/api/payments/webhook/route.ts:23`; `app/api/payments/webhook/route.ts:24`
- Fix: Add payment_completed from the webhook, after the duplicate check and the transaction, with status=success|failed, failure_reason from the route's refusal branches (missing_fields, unknown_user; the provider's codes UNCONFIRMED until there is one), payment_id, amount_cents, currency and plan; deprecate payment_succeeded with replaced_by payment_completed. Breaking: add the new event or property, keep the old one firing with deprecated, replaced_by and a dual_fire_until window (at least 30 days), and a SEMANTICS changelog line.
- New events: payment_completed

### F12 · medium · Onboarding events are sent again when a reader goes back and resubmits a screen

The onboarding pages only require a session, and the actions save and track whatever the step, so going back to a screen and submitting it again sends a second onboarding_step_completed (and, once F11 is fixed, a second onboarding_completed).

- Evidence: `app/onboarding/genres/page.tsx:12`; `app/actions/onboarding.ts:53`
- Fix: Send onboarding_completed only when onboardingStep was below 4 before the update; add is_revisit (user.onboardingStep already past this step) to onboarding_step_completed, or skip the event on a revisit.

### F13 · medium · onboarding_step_completed.step is a number on one screen and text on the other

The genres screen sends step 1 as a number; the goal screen sends form.get("step"), the string "2" from a hidden input the browser controls. The property splits into two types in PostHog.

- Evidence: `app/actions/onboarding.ts:23`; `app/actions/onboarding.ts:38`
- Fix: Hard-code step: 2 on the goal screen. If text "2" has already been sent, keep step numeric going forward and note the date (type change needs a new name only if the team wants history clean).

### F14 · medium · checkout_started is dropped when /checkout is loaded directly or refreshed

The checkout form's mount effect runs before AnalyticsProvider's effect starts posthog-js (the provider comes after the page in the layout), so capture() finds posthog not loaded and does nothing. Only readers who reach /checkout by client-side navigation are counted, so the checkout funnel's first step undercounts.

- Evidence: `app/checkout/checkout-form.tsx:13`; `app/layout.tsx:25`; `lib/analytics/client.ts:21`
- Fix: Queue client events until posthog has loaded (capture() can push to a buffer the provider flushes in loaded), or send checkout_started from the server page.

### F16 · medium · book_added counts shelf updates as adds, and book_shelf_changed misses them

The book page's addToShelf upserts and always sends book_added, so "Update shelf" on a book already shelved (or a double submit) counts as an add and never as a move. moveShelf sends book_shelf_changed even when the shelf picked is the current one, which the select defaults to.

- Evidence: `app/actions/shelf.ts:19`; `app/actions/shelf.ts:25`; `app/actions/shelf.ts:47`
- Fix: In addToShelf, read the existing item first: send book_added only when it was created, book_shelf_changed (with from_shelf) when the shelf really changed, nothing otherwise. In moveShelf, skip the event when from equals to. Changelog SEMANTICS line. Add the book page path to book_shelf_changed's fires_at.

### F17 · medium · invite_sent has no status, no failure reason and no invite id

Invalid emails and self-invites redirect before any event, so refused invites are invisible, and the created invite's id is thrown away, so the event can't be joined to anything later. The email field is type=email and required, so invalid_email is mostly reachable only by a direct post; self_invite is the real failure.

- Evidence: `app/actions/invites.ts:14`; `app/actions/invites.ts:17`
- Fix: Send invite_sent with status=success|failed and failure_reason=self_invite|invalid_email (only_when status=failed), and invite_id from db.invite.create (only_when status=success).

### F18 · medium · book_added misses the onboarding first book, and the search path leaves out genre

The first book added in onboarding only calls logEvent, a development console log, so it never reaches PostHog. Quick add from search sends book_added without genre, although book is loaded right there.

- Evidence: `app/actions/onboarding.ts:55`; `app/actions/search.ts:20`
- Fix: Send book_added with source=onboarding from addFirstBook, before its redirect, and add onboarding to source's values; add genre: book.genre in quickAdd.

### F19 · medium · book_removed is sent when nothing was removed, and can't be joined to the book

removeFromShelf sends book_removed after deleteMany whatever it deleted, so a double click or a stale id counts a removal that didn't happen. It carries only item_id from the form: no book_id and no shelf.

- Evidence: `app/actions/shelf.ts:54`; `app/actions/shelf.ts:55`
- Fix: Read the item first (findFirst with userId), delete it, and send book_removed only when it existed, with book_id and shelf.

### F20 · medium · search_performed fires on every open or reload of /search, not when a search settles

SearchTracker sends from a mount effect, so opening /search from the nav or the shelves page's Find a book link counts as a search with no title or filter, and a reload or back navigation sends the same search again. query is then empty.

- Evidence: `components/analytics/search-tracker.tsx:8`; `components/analytics/search-tracker.tsx:17`
- Fix: Send only when a title or filter is set, once per distinct search (key on the URL's search string).

### F25 · medium · user_signed_up and user_logged_in record only successes

Refused sign-ups (invalid email, short password, email taken) and refused logins (wrong email or password) redirect before any event, so failure rates are invisible. The browser's required, type=email and minLength checks stop most invalid emails and short passwords, so email_taken and wrong_credentials are the failures that really reach the server.

- Evidence: `app/actions/auth.ts:22`; `app/actions/auth.ts:38`
- Fix: Add status=success|failed and failure_reason (invalid_email | password_too_short | email_taken; wrong_credentials) with only_when status=failed. The failed path has no user id: send it with the visitor's anonymous id passed from the form, which is a team decision (open question Q2).

### F26 · medium · user_signed_up.plan_intent is always null

signup reads plan_intent from a form field named plan, but the signup form has no such field; the page reads ?plan= from the URL only to show a note. Sign-ups from the Pro call to action can't be told apart.

- Evidence: `app/actions/auth.ts:16`; `app/signup/page.tsx:22`
- Fix: Add a hidden input name="plan" with the URL's plan to the signup form, and keep plan in the URL of the error redirects so a retry keeps it.

### F28 · medium · cta_clicked splits plan by casing and misses the nav Sign up button

The hero sends plan "pro" and the pricing cards send the display name "Free" or "Pro", so Pro shows as two values. The nav's Sign up link, shown to signed-out visitors on every page, is a call to action into sign-up and sends nothing.

- Evidence: `app/page.tsx:29`; `app/page.tsx:50`; `components/nav.tsx:32`
- Fix: Send plan: plan.name.toLowerCase() on the cards, and use TrackLink with cta="nav" for the nav Sign up link (plan only_when cta is hero or plan_card; add nav to cta's values and a fires_at entry). Enum casing change: add the lower-case values and note the date.

### F29 · medium · $pageview counts the first page of each visit twice

posthog.init has capture_pageview: true and the provider's effect also captures $pageview once ready, so the first page after analytics starts is sent twice.

- Evidence: `components/analytics/analytics-provider.tsx:22`; `components/analytics/analytics-provider.tsx:37`
- Fix: Set capture_pageview: false (the effect already sends every route change), or drop the effect and use capture_pageview: 'history_change'.

### F15 · low · checkout_started sends amount as text and has no entry_point

amount is (amountCents / 100).toFixed(2), the string "5.00" in dollars, while the other billing events send amount_cents as a number. Checkout opens from the settings Upgrade link and the landing page's Pro card, and nothing says which.

- Evidence: `app/checkout/checkout-form.tsx:13`; `app/settings/page.tsx:28`
- Fix: Add amount_cents (number) and entry_point (settings | pricing) and deprecate amount; a type change needs the new name.

### F24 · low · goal_reminder_sent says a reminder was sent, but nothing is delivered

The job only writes a GoalReminder row; nothing in the repo reads it or notifies the reader, while the landing page sells weekly goal reminders.

- Evidence: `jobs/weekly-goal-check.ts:35`; `app/page.tsx:13`
- Fix: Keep the name for now (renaming needs dual-fire); describe it as 'reader flagged behind pace'. When delivery is built, send a reminder_delivered outcome with status.

### F27 · low · mobile_shelves_fetched records every request as iOS

platform is hard-coded "ios", so any Android client counts as iOS and the property says nothing. The route also accepts the browser's session cookie, so a browser that opens /api/shelves would be counted as mobile, though no code in the repo calls it from the web.

- Evidence: `app/api/shelves/route.ts:17`; `lib/auth.ts:68`
- Fix: Set platform from a header the app sends, else the User-Agent; if the request can't tell, drop the property.

### F30 · low · account_deleted is sent before the account is deleted

deleteAccount tracks before destroySession and db.user.delete, so a delete that fails is still counted.

- Evidence: `app/actions/settings.ts:24`; `app/actions/settings.ts:29`
- Fix: Move the track call after db.user.delete; plan and createdAt are already in memory from requireUser().

### F31 · low · reading_goal_updated is sent when the goal didn't change

The settings input starts with the current goal and updateGoal never compares, so pressing Save without editing counts as a change.

- Evidence: `app/actions/settings.ts:15`
- Fix: Skip the update and the event when goal equals user.yearlyGoal.

### F32 · low · Opening the cancel flow isn't tracked

subscription_canceled records the outcome, but no event records a Pro reader opening /settings/cancel. A $pageview funnel can approximate it, but page views depend on consent and are doubled on the first page (F29).

- Evidence: `app/settings/cancel/page.tsx:13`
- Fix: Add subscription_cancel_started, sent when the cancel page opens for a Pro reader, paired with subscription_canceled.
- New events: subscription_cancel_started

### F33 · low · invite_sent says an invite was sent, but nothing reaches the friend

sendInvite only stores the invite: no email or link goes out and there is no way to accept it, and the page says "Invite saved." The event can't be read as the friend being contacted or used for invite-to-signup conversion.

- Evidence: `app/actions/invites.ts:17`; `app/invite/page.tsx:22`
- Fix: Keep the name (a rename needs dual-fire); say in the description that nothing is delivered. When delivery and acceptance are built, add invite_delivered and invite_accepted outcomes.
## 5. Could carry more

| Id | Event | Property | Question it answers |
|---|---|---|---|
| S1 | user_logged_in | plan | Do Pro readers come back more often than Free readers (including those who never accepted cookies)? |
| S2 | checkout_failed | http_status | Do failed checkouts come from bad requests (400), unknown readers (404) or server errors (500)? |
| S3 | payment_succeeded | days_since_signup | How long after signing up do readers upgrade to Pro? |
| S4 | subscription_canceled | detail_char_count | How many cancelling readers explain themselves, and does it differ by reason? (Replaces the typed text.) |
| S5 | review_submitted | char_count | How long are reviews, and do readers who write longer ones come back more? (Replaces the text.) |
| S6 | cta_clicked | destination | How many landing-page clicks go to sign-up, checkout or shelves? |
| S7 | mobile_shelves_fetched | auth_method | How many fetches come from the app (bearer) rather than a browser cookie? |
| S8 | mobile_shelves_fetched | reading_count | Do mobile readers open the app while reading, or only to browse? |
| S9 | onboarding_step_completed | goal_changed | Do readers keep the suggested goal of 12 or set their own? |
| S10 | onboarding_step_completed | is_revisit | How many step completions are readers going back to change an answer? |

## 6. Sent only sometimes

All of these are written in the plan (`only_when`) and were confirmed by the verifier.

| Id | Event.property | Applies when | Why the other paths don't need it |
|---|---|---|---|
| W1 | checkout_failed.card_last4 | reason=invalid_card | Only the invalid-card branch has a card value (the value itself is a problem: F9) |
| W2 | subscription_canceled.detail | the reader typed something in "Anything else?" | The text box is optional except for Other; otherwise it is sent as "" (the property itself should go: F3) |
| W3 | search_performed.genre | a genre filter is set | "Any genre" leaves nothing to send |
| W4 | search_performed.year | a year filter is set | "Any year" leaves nothing to send |
| W5 | search_performed.author | an author filter is set | "Any author" leaves nothing to send |
| W6 | onboarding_step_completed.genres | step_name=genres | Only the genres screen asks for genres |
| W7 | onboarding_step_completed.genre_count | step_name=genres | Only the genres screen has a genre count |
| W8 | onboarding_step_completed.yearly_goal | step_name=goal | Only the goal screen sets the goal |

## 7. Fix plan by product area

1. **Billing (money):**
   - F6: make `checkout_completed` an intent (`checkout_submitted`).
   - F7 and F10: send the outcome as `payment_completed` from the webhook, after the duplicate check and the write, with `status` and `failure_reason`.
   - F8: verify the webhook.
   - F9: drop `card_last4` and fold `checkout_failed` into the outcome.
   - F14 and F15: fix `checkout_started` (lost on full page loads, `amount` sent as text, no `entry_point`).
   - F3: drop the cancel text from `subscription_canceled`.
   - F32: add `subscription_cancel_started`.
2. **Accounts and identity (sign-up):**
   - F1: send `user_signed_up` as `user.id`.
   - F21: call `reset` at logout.
   - F22: take email off identify.
   - F26: carry `plan_intent` through the signup form.
   - F25: add `status` to sign-up and login.
   - F30: send `account_deleted` after the delete.
3. **Onboarding:**
   - F11: move `onboarding_completed` above the redirect.
   - F13: hard-code `step: 2`.
   - F12: handle revisits.
4. **Library (core):**
   - F4 and F20: fix `search_performed` (consent, id, `char_count`, fire only on a real search).
   - F5: sanitise URLs.
   - F16: split adds from moves in `addToShelf`.
   - F18: add the onboarding first book and `genre` on quick add.
   - F19: `book_removed` only on a real delete, with `book_id`.
   - F3: drop review text.
5. **Invites:**
   - F2: remove emails.
   - F17: add `status` and `invite_id`.
   - F33: name what `invite_sent` means.
6. **Reading goals:**
   - F23: flush the job's client and send once per reader and week.
   - F24: no reminder is delivered.
   - F31: skip unchanged goals.
7. **Marketing site and mobile API:**
   - F29: fix the double first `$pageview`.
   - F28: lower-case `cta_clicked.plan` and add the nav Sign up.
   - F27: `platform` from the request.

## 8. Open questions

**Q1. `checkout_completed` is sent on the Pay click. How should checkout be tracked going forward?** (F6, F9, F10)
- a. *(recommended)* Add `checkout_submitted` for the click and `payment_completed` from the webhook as the outcome. Deprecate `checkout_completed` and `checkout_failed` with a 30-day dual-fire.
- b. Keep `checkout_completed`'s name but move it to the webhook, after the payment is written.
- c. Keep it as it is.

**Q2. Refused sign-ups and logins have no user id. Which id should a failed `user_signed_up` or `user_logged_in` be sent with?** (F25)
- a. *(recommended)* Pass the browser's PostHog anonymous id in a hidden form field and send the failure from the server action with it. When the visitor declined cookies there is no id, and the failure isn't sent.
- b. Send failures from the browser on the error redirect instead.
- c. Don't track failed sign-ups and logins.

**Q3. Event naming.** Every Shelfie event is snake_case object_action. The only exception is PostHog's own `$pageview`. Which convention should events follow? (R001)
- a. *(recommended)* snake_case, two words or more, allowing PostHog's `$`-prefixed events (`'^\$?[a-z][a-z0-9]*(_[a-z0-9]+)+$'`).
- b. snake_case, as now (`'^[a-z][a-z0-9]*(_[a-z0-9]+)+$'`), with `$pageview` left as a known exception.

## 9. Items with no data that aren't findings

None listed separately: there was no data at all (see the top). Every event's data checks are *not measured*.

## 10. Tracked but probably not needed

None. Every live event is a core, money, onboarding, identity or funnel event, or it answers a question (`account_deleted`, `reading_goal_updated`, `$pageview`).

## 11. Not tracked, by area

**Proposed (on findings):**
- Billing: `payment_completed` (F10, failed payments) and `subscription_cancel_started` (F32).
- Accounts: `status` and `failure_reason` on `user_signed_up` and `user_logged_in` for refused attempts (F25).
- Marketing site: `cta_clicked` with `cta=nav` for the nav Sign up link (F28).
- Invites: `status` and `failure_reason` on `invite_sent` for refused invites (F17).
- Library: `book_added` with `source=onboarding` for the first book (F18).

**Looked at and not proposed:**

| Area | Action | Why not | Where |
|---|---|---|---|
| accounts | Reader logs out | No product question an event answers. But logout needs an identity reset (posthog.reset in the client): _identity.yaml has no reset key and nothing calls reset, so the next reader on the same browser keeps the previous reader's distinct id until identify runs. | `app/actions/auth.ts:45` |
| billing | Cancel form rejected (no reason picked, or Other without detail) | Validation redirects on a required field (the radio is HTML-required, so the first can't happen from the form); a refusal before the work, which subscription_cancel_started without subscription_canceled already shows as drop-off. | `app/actions/subscription.ts:19` |
| billing | Cancel submitted with no active subscription | Only a stale tab or a second submit reaches it; nothing changes and nobody decides anything from it. | `app/actions/subscription.ts:26` |
| billing | Upgrade to Pro link in settings | Navigation into checkout; checkout_started covers the intent and should carry entry_point=settings instead of its own event. | `app/settings/page.tsx:28` |
| billing | Cancel subscription link in settings | Navigation into the cancel flow; covered by the proposed subscription_cancel_started. | `app/settings/page.tsx:26` |
| billing | Welcome to Pro / subscription canceled confirmation banners | Screen state after an outcome the server already sends; no decision rides on the view. | `app/settings/page.tsx:19` |
| goals | Weekly goal-check job run completes (users checked, number behind) | Job health is ops monitoring, not a product question; per-reader outcomes are already goal_reminder_sent. | `jobs/weekly-goal-check.ts:48` |
| goals | Goal progress shown on /shelves ('N of goal books finished this year') | Screen view with no decision; autocapture page views cover it. | `app/shelves/page.tsx:29` |
| goals | Delivering the goal reminder to the reader (email/notification) | No delivery exists in the code; when one is built it should send the outcome (goal_reminder_sent with status/failure_reason, or rename via deprecation) — raised under goal_reminder_sent.name_accurate. | `jobs/weekly-goal-check.ts:35` |
| invites | Invite refused (email without @, self-invite) | Not a separate event: it belongs on invite_sent as status=failed with failure_reason=invalid_email|self_invite (raised as the invite_sent.properties problem). | `app/actions/invites.ts:14` |
| invites | Opens the invite page / views the list of sent invites | A screen view with no decision; autocapture covers it, and invite_sent with status measures the flow. | `app/invite/page.tsx:6` |
| invites | Clicks the Invite link in the nav | Navigation with one entry point; the invite form cannot be abandoned mid-flow in a way an intent event would reveal beyond page views. | `components/nav.tsx:17` |
| library | Opens a book's page | A screen view with no decision on it; $pageview already covers it, and the actions taken there (add to shelf, review) have their own events. | `app/books/[id]/page.tsx:8` |
| library | Review refused (no rating, or book not on the Finished shelf) | The rating radio is required in the form and the review page redirects away unless the book is finished, so these branches are only reached by a hand-crafted request; no question needs them. | `app/actions/reviews.ts:14` |
| library | Quick add or add to shelf fails (book not found, unknown shelf) | Thrown errors only reachable with a tampered form (ids and shelves come from the page); an error tracker matter, not analytics. | `app/actions/search.ts:13` |
| marketing-site | Visitor clicks 'Log in' in the nav | Marketing-site navigation, not a call into sign-up; the login outcome is user_logged_in on the server. | `components/nav.tsx:29` |
| marketing-site | Visitor accepts or declines cookies | Dismissing a banner; a decline can't be sent (no consent) and an accept only shows as the analytics starting, so the event would answer nothing reliably. | `components/analytics/consent-banner.tsx:15` |
| mobile-api | Unauthorized request refused (401) | An auth refusal on a read endpoint with no known user to attach it to; expired tokens and probes carry no product decision, and it belongs in server logs, not analytics. | `app/api/shelves/route.ts:9` |
| onboarding | Completes the third onboarding screen (first book) with no onboarding_step_completed step 3 | onboarding_completed is this screen's completion event (once moved before the redirect); a step-3 event would double-count the same moment. | `app/actions/onboarding.ts:42` |
| onboarding | Onboarding screen refuses the answer (no genre picked, goal outside 1 to 365, no book picked) | Validation refusals before any work; the browser's required/min/max already block most, and drop-off shows as a missing next step event. Raise later if the drop-off needs explaining. | `app/actions/onboarding.ts:17` |
| onboarding | Signed-in reader lands on an onboarding screen (signup redirect or login resume) | The start is user_signed_up and user_logged_in (resumed_onboarding); screen views carry no decision and $pageview covers them. | `app/actions/auth.ts:42` |
