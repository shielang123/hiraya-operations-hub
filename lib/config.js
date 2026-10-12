// ---------------------------------------------------------------------------------------------
// ONE place for everything the four Hiraya apps must agree on (the "data contract").
// If you move to a monorepo, this file moves to packages/shared unchanged.
// ---------------------------------------------------------------------------------------------

// Collection names. If the booking repo uses different names, change them here only.
export const COLLECTIONS = {
  bookings: "bookings",
  rooms: "rooms",
  staff: "staff",
  charges: "charges",
  payments: "payments",
  orders: "orders",
  menuItems: "menuItems",
  housekeepingTasks: "housekeepingTasks",
  activityLog: "activityLog",
  settings: "settings",
};

// Status vocabulary (shared by all apps)
export const BOOKING_STATUSES = ["pending", "approved", "checked-in", "checked-out", "declined", "cancelled"];
export const ROOM_STATUSES = ["clean", "dirty", "cleaning", "inspected"];
export const ORDER_STATUSES = ["new", "preparing", "served", "paid", "voided"];
export const TASK_STATUSES = ["open", "in-progress", "done", "inspected"];
export const CHARGE_CATEGORIES = ["food", "activity", "damage", "other"];
export const PAYMENT_METHODS = ["cash", "gcash", "card", "bank"];

// Older booking-site words that mean "approved". Treated as approved by the Hub.
export const READY_STATUSES = ["approved", "confirmed", "paid"];
export const ACTIVE_STATUSES = [...READY_STATUSES, "checked-in"];

export const STATUS_LABELS = {
  approved: "Approved",
  confirmed: "Confirmed",
  paid: "Paid",
  "checked-in": "Checked in",
  "checked-out": "Checked out",
  pending: "Pending",
  declined: "Declined",
  cancelled: "Cancelled",
  clean: "Clean",
  dirty: "Dirty",
  cleaning: "Cleaning",
  inspected: "Inspected",
  new: "New",
  preparing: "Preparing",
  served: "Served",
  voided: "Voided",
  open: "Open",
  "in-progress": "In progress",
  done: "Done",
};

// How the cross-app check-out hand-off is done:
//   "client"   : the Hub creates the cleaning task and marks the room dirty itself (works on the free plan)
//   "function" : the Cloud Function in /functions does it (Blaze plan). Set this once it is deployed,
//                otherwise every check-out would create the task twice.
export const HANDOFF_MODE = process.env.NEXT_PUBLIC_HANDOFF_MODE || "client";

// What unit the booking site stores totalAmount in. The data contract says "centavo", but a booking
// site built earlier often stores whole pesos. Check one booking and set this to match.
export const BOOKING_AMOUNT_UNIT = process.env.NEXT_PUBLIC_BOOKING_AMOUNT_UNIT || "peso";

export const RESORT_NAME = process.env.NEXT_PUBLIC_RESORT_NAME || "Hiraya Farm Resort";
