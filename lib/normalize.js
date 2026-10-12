// Adapters: every record read from Firestore passes through here, so the screens only ever
// see one shape. If another app names a field differently, add the alias here, once.
import { differenceInCalendarDays } from "date-fns";
import { toDate } from "./dates";
import { BOOKING_AMOUNT_UNIT } from "./config";

export function pick(data, names, fallback = "") {
  for (const n of names) {
    if (data[n] !== undefined && data[n] !== null && data[n] !== "") return data[n];
  }
  return fallback;
}

const toInt = (v) => (Number.isFinite(Number(v)) ? Math.round(Number(v)) : 0);

export function bookingAmountToCentavos(v) {
  const n = Number(v) || 0;
  return BOOKING_AMOUNT_UNIT === "centavo" ? Math.round(n) : Math.round(n * 100);
}

export function normalizeBooking(id, data) {
  const checkIn = toDate(pick(data, ["checkIn", "checkInDate", "startDate", "arrivalDate"], null));
  const checkOut = toDate(pick(data, ["checkOut", "checkOutDate", "endDate", "departureDate"], null));
  const total = pick(data, ["totalAmount", "total", "totalPrice", "amount"], 0);
  const payStatus = String(pick(data, ["paymentStatus", "payment_status", "paymongoStatus"], "")).toLowerCase();
  const paidField = pick(data, ["amountPaid", "paidAmount", "downPayment", "depositPaid"], null);
  const totalCentavos = bookingAmountToCentavos(total);
  let onlinePaid = 0;
  if (paidField !== null) onlinePaid = bookingAmountToCentavos(paidField);
  else if (["paid", "succeeded", "success"].includes(payStatus)) onlinePaid = totalCentavos;

  return {
    id,
    guestName: pick(data, ["guestName", "name", "fullName", "customerName"], "Guest"),
    email: pick(data, ["email", "guestEmail"]),
    phone: pick(data, ["phone", "contactNumber", "guestPhone", "mobile"]),
    roomId: pick(data, ["roomId", "room_id"]),
    roomName: pick(data, ["roomName", "roomType", "room", "accommodation"]),
    guests: pick(data, ["guests", "guestCount", "pax", "numberOfGuests"], null),
    checkIn,
    checkOut,
    nights: checkIn && checkOut ? Math.max(0, differenceInCalendarDays(checkOut, checkIn)) : 0,
    status: pick(data, ["status"], "pending"),
    totalCentavos,
    onlinePaid,
    paymentStatus: payStatus,
    request: pick(data, ["specialRequests", "notes", "message", "remarks"]),
    staffNote: data.staffNote || "",
    checkedInAt: toDate(data.checkedInAt),
    checkedOutAt: toDate(data.checkedOutAt),
    createdAt: toDate(data.createdAt),
    raw: data,
  };
}

export function normalizeRoom(id, data) {
  return {
    id,
    ...data,
    name: pick(data, ["name", "roomName", "title"], id),
    type: pick(data, ["type", "category"]),
    cleaningStatus: data.cleaningStatus || null,
  };
}

export function normalizeCharge(id, data) {
  return {
    id,
    bookingId: data.bookingId || "",
    source: data.source || "hub",
    category: data.category || "other",
    description: data.description || "Charge",
    amount: toInt(data.amount),
    voided: data.voided === true,
    voidReason: data.voidReason || "",
    orderId: data.orderId || "",
    createdBy: data.createdBy || "",
    createdAt: toDate(data.createdAt),
    raw: data,
  };
}

export function normalizePayment(id, data) {
  return {
    id,
    bookingId: data.bookingId || "",
    amount: toInt(data.amount),
    method: data.method || "cash",
    reference: data.reference || "",
    createdBy: data.createdBy || "",
    createdAt: toDate(data.createdAt),
  };
}

export function normalizeOrder(id, data) {
  const items = (Array.isArray(data.items) ? data.items : []).map((i) => ({
    name: pick(i, ["name", "itemName", "title"], "Item"),
    qty: Number(pick(i, ["qty", "quantity"], 1)) || 1,
    price: toInt(pick(i, ["price", "unitPrice"], 0)),
    category: i.category || "",
    itemId: i.itemId || i.id || "",
  }));
  return {
    id,
    items,
    total: toInt(data.total),
    paymentMode: data.paymentMode || "table",
    status: data.status || "new",
    bookingId: data.bookingId || "",
    roomId: data.roomId || "",
    createdBy: data.createdBy || "",
    createdAt: toDate(data.createdAt),
  };
}

export function normalizeTask(id, data) {
  return {
    id,
    roomId: data.roomId || "",
    bookingId: data.bookingId || "",
    type: data.type || "checkout-clean",
    status: data.status || "open",
    assignedTo: data.assignedTo || null,
    note: data.note || "",
    createdAt: toDate(data.createdAt),
    startedAt: toDate(data.startedAt),
    doneAt: toDate(data.doneAt),
  };
}

export function normalizeActivity(id, data) {
  return {
    id,
    app: data.app || "unknown",
    action: data.action || "",
    refId: data.refId || "",
    staffId: data.staffId || "",
    staffName: data.staffName || "",
    detail: data.detail || "",
    createdAt: toDate(data.createdAt),
  };
}
