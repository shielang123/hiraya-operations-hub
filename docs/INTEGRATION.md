# Connecting the other systems to the Hub

Everything below is already implemented on the Hub side. These are the exact documents the other
apps must write for the Hub to pick them up.

## Rules every app follows
- Same Firestore IDs: `bookingId` and `roomId` are document IDs, never names.
- Money in whole centavos (15050 = PHP 150.50). Timestamps with `serverTimestamp()`.
- Statuses: bookings `pending, approved, checked-in, checked-out, declined, cancelled`;
  rooms `clean, dirty, cleaning, inspected`; orders `new, preparing, served, paid, voided`;
  tasks `open, in-progress, done, inspected`.
- Soft delete only (`voided: true`). Every change that crosses apps appends to `activityLog`.

## Room Booking (existing site)
- Store `roomId` (the `rooms` document ID) on every booking. The Hub shows a "Fix" on Integrations
  without it, and cannot mark the room dirty.
- Write `status: "approved"` on approval. Older words `confirmed` and `paid` still work in the Hub.
- Add `checked-in` and `checked-out` to any code that filters bookings by status.
- Optional: write `amountPaid` after PayMongo succeeds so the bill shows the online payment.
- Optional: append to `activityLog` with `app: "booking"` on approve, decline, cancel.

## Bar Counter
Save the order and its room charge in one batch (the Hub reads both):

```js
batch.set(orderRef,  { items: [{ name, qty, price, category }], total, paymentMode: "room",
                       status: "new", bookingId, roomId, createdBy, createdAt: serverTimestamp() });
batch.set(chargeRef, { bookingId, source: "bar", orderId: orderRef.id, category: "food",
                       description: "Bar order", amount: total, voided: false,
                       createdBy, createdAt: serverTimestamp() });
batch.set(logRef,    { app: "bar", action: "room-charge", refId: orderRef.id, staffId,
                       staffName, detail: guestName, createdAt: serverTimestamp() });
```
- Only offer bookings with `status == "checked-in"` for a room charge.
- To void: set `status: "voided"` on the order and `voided: true` on the charge, in one batch.
- `paymentMode` values the Hub understands: `room`, `cash`, `gcash`, `table`.

## Housekeeping
- Tasks: `housekeepingTasks` with `roomId, bookingId, type, status, assignedTo, createdAt`.
  The Hub (or the Cloud Function) creates the `checkout-clean` task at check-out.
- When a task changes, update the room in the same batch: `rooms/{roomId}.cleaningStatus`
  and set `startedAt` / `doneAt` on the task. The Hub's Owner view uses these for cleaning times.
- Append to `activityLog` with `app: "housekeeping"`.

## One login across apps (unified portal)
1. Give each app a base path: Hub `NEXT_PUBLIC_BASE_PATH=/hub`; Bar `/bar`; Housekeeping `/housekeeping`.
2. Deploy each as its own Vercel project.
3. In a small portal app, add `rewrites()` in `next.config.js` that forward `/hub/:path*`,
   `/bar/:path*`, `/housekeeping/:path*` to each project's URL.
4. Serve the portal at `ops.yourdomain.com`; authorize only that domain in Firebase Authentication.
   One origin means Firebase Auth keeps staff signed in across apps (all apps use the same Firebase config).
5. In each app set `NEXT_PUBLIC_BAR_URL=/bar` etc. so "Switch app" shows links.

## Adding a fifth system later (events, inventory, POS)
1. Add its collection names to `lib/config.js` and its row to `lib/contract.js`.
2. Add a normalizer in `lib/normalize.js` and a `useLive(...)` line in `components/DataProvider.jsx`.
3. Add a check to `lib/health.js` and rules to the rules file.
4. Add an entry to `lib/apps.js` and a page to `app/` plus `lib/roles.js` NAV_ITEMS.
