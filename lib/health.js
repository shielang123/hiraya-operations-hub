// Data-contract checks. They answer one question: "are the four apps still talking about the
// same things?" Each check returns the offending record IDs so an admin can fix them.
import { BOOKING_STATUSES, READY_STATUSES, HANDOFF_MODE } from "./config";

export function runHealthChecks({ bookings, rooms, roomList, charges, orders, tasks }) {
  const bookingIds = new Set(bookings.map((b) => b.id));
  const checks = [];
  const add = (id, title, severity, hint, items) =>
    checks.push({ id, title, severity, hint, items, ok: items.length === 0 });

  add(
    "booking-status",
    "Bookings use the shared status words",
    "warn",
    "Words like confirmed or paid still work in the Hub, but the contract uses approved. Update the booking site when convenient.",
    bookings.filter((b) => !BOOKING_STATUSES.includes(b.status)).map((b) => ({ id: b.id, note: `status "${b.status}"` }))
  );

  add(
    "booking-room",
    "Live bookings point to a real room (roomId)",
    "error",
    "Without roomId the Hub cannot mark the room dirty or create a cleaning task. Store the room's Firestore ID on the booking.",
    bookings
      .filter((b) => [...READY_STATUSES, "checked-in"].includes(b.status))
      .filter((b) => !b.roomId || !rooms[b.roomId])
      .map((b) => ({ id: b.id, note: b.roomId ? `roomId ${b.roomId} not found` : "no roomId" }))
  );

  add(
    "room-clean-status",
    "Every room has a cleaningStatus",
    "warn",
    "Use the fix button to set missing values to clean.",
    roomList.filter((r) => !r.cleaningStatus).map((r) => ({ id: r.id, note: r.name }))
  );

  add(
    "charge-booking",
    "Every charge belongs to a booking",
    "error",
    "A charge with an unknown bookingId never reaches a bill.",
    charges.filter((c) => !bookingIds.has(c.bookingId)).map((c) => ({ id: c.id, note: `bookingId "${c.bookingId}"` }))
  );

  add(
    "charge-centavos",
    "Charge amounts are whole centavos",
    "error",
    "Amounts must be integers (15050 = PHP 150.50). Decimals mean an app saved pesos.",
    charges.filter((c) => !Number.isInteger(c.raw?.amount)).map((c) => ({ id: c.id, note: `amount ${c.raw?.amount}` }))
  );

  const chargeByOrder = new Map(charges.filter((c) => c.orderId).map((c) => [c.orderId, c]));
  add(
    "order-charge",
    "Every room order has its room charge",
    "error",
    "Bar orders charged to a room must save the order and the charge in one batch.",
    orders
      .filter((o) => o.paymentMode === "room" && o.status !== "voided")
      .filter((o) => !chargeByOrder.has(o.id))
      .map((o) => ({ id: o.id, note: "no matching charge" }))
  );

  add(
    "order-void",
    "Voided orders have voided charges",
    "error",
    "Voiding an order must also void its charge, or the guest is billed for it.",
    orders
      .filter((o) => o.status === "voided")
      .filter((o) => chargeByOrder.has(o.id) && !chargeByOrder.get(o.id).voided)
      .map((o) => ({ id: o.id, note: "charge still active" }))
  );

  add(
    "task-room",
    "Housekeeping tasks point to a real room",
    "error",
    "A task for an unknown roomId cannot update the room.",
    tasks.filter((t) => !rooms[t.roomId]).map((t) => ({ id: t.id, note: `roomId "${t.roomId}"` }))
  );

  const weekAgo = Date.now() - 7 * 86400000;
  const taskBookings = new Set(tasks.filter((t) => t.type === "checkout-clean").map((t) => t.bookingId));
  add(
    "checkout-task",
    "Recent check-outs created a cleaning task",
    "warn",
    HANDOFF_MODE === "function"
      ? "The Cloud Function should have created these. Check that it is deployed."
      : "The Hub creates the task at check-out. Bookings checked out before the Hub went live will show here.",
    bookings
      .filter((b) => b.status === "checked-out" && b.roomId && b.checkedOutAt && b.checkedOutAt.getTime() > weekAgo)
      .filter((b) => !taskBookings.has(b.id))
      .map((b) => ({ id: b.id, note: b.guestName }))
  );

  const withTotals = bookings.filter((b) => b.totalCentavos > 0);
  const median = withTotals.map((b) => b.totalCentavos).sort((a, b) => a - b)[Math.floor(withTotals.length / 2)] || 0;
  add(
    "money-unit",
    "Booking totals look like the right money unit",
    "warn",
    "A typical stay under PHP 500 suggests the booking site stores centavos but NEXT_PUBLIC_BOOKING_AMOUNT_UNIT is set to peso (or the reverse).",
    withTotals.length >= 3 && median < 50000 ? [{ id: "median", note: `median stay total looks like ₱${(median / 100).toFixed(2)}` }] : []
  );

  return checks;
}
