// Every write the Hub makes. Each one is a single batch (all or nothing) and adds a line to
// activityLog, so the other apps and the owner feed always see it.
import { collection, doc, serverTimestamp, writeBatch } from "firebase/firestore";
import { db } from "./firebase";
import { COLLECTIONS, HANDOFF_MODE } from "./config";
import { addActivity } from "./activity";

const staffRef = (staff) => ({ id: staff.id, name: staff.name });

export async function checkInBooking({ booking, staff }) {
  const batch = writeBatch(db);
  batch.update(doc(db, COLLECTIONS.bookings, booking.id), {
    status: "checked-in",
    checkedInAt: serverTimestamp(),
    checkedInBy: staff.id,
    updatedAt: serverTimestamp(),
  });
  addActivity(batch, { action: "check-in", refId: booking.id, staff: staffRef(staff), detail: booking.guestName });
  await batch.commit();
}

export async function checkOutBooking({ booking, balance, overrideReason = "", staff }) {
  const batch = writeBatch(db);
  const patch = {
    status: "checked-out",
    checkedOutAt: serverTimestamp(),
    checkedOutBy: staff.id,
    balanceAtCheckout: balance,
    updatedAt: serverTimestamp(),
  };
  if (overrideReason) patch.overrideReason = overrideReason;
  batch.update(doc(db, COLLECTIONS.bookings, booking.id), patch);

  // Hand-off to Housekeeping. In "function" mode the Cloud Function does this instead.
  if (HANDOFF_MODE === "client" && booking.roomId) {
    batch.set(doc(collection(db, COLLECTIONS.housekeepingTasks)), {
      roomId: booking.roomId,
      bookingId: booking.id,
      type: "checkout-clean",
      status: "open",
      assignedTo: null,
      createdAt: serverTimestamp(),
    });
    batch.update(doc(db, COLLECTIONS.rooms, booking.roomId), { cleaningStatus: "dirty" });
  }
  addActivity(batch, {
    action: overrideReason ? "check-out-override" : "check-out",
    refId: booking.id,
    staff: staffRef(staff),
    detail: overrideReason ? `${booking.guestName}: ${overrideReason}` : booking.guestName,
  });
  await batch.commit();
}

export async function addCharge({ booking, description, category, amount, staff }) {
  const batch = writeBatch(db);
  const ref = doc(collection(db, COLLECTIONS.charges));
  batch.set(ref, {
    bookingId: booking.id,
    source: "hub",
    category,
    description,
    amount,
    voided: false,
    createdBy: staff.id,
    createdAt: serverTimestamp(),
  });
  addActivity(batch, { action: "charge-added", refId: ref.id, staff: staffRef(staff), detail: `${booking.guestName}: ${description}` });
  await batch.commit();
}

// Never deleted: the charge stays with voided: true and a reason.
export async function voidCharge({ charge, reason, staff }) {
  const batch = writeBatch(db);
  batch.update(doc(db, COLLECTIONS.charges, charge.id), {
    voided: true,
    voidReason: reason,
    voidedBy: staff.id,
    voidedAt: serverTimestamp(),
  });
  addActivity(batch, { action: "charge-voided", refId: charge.id, staff: staffRef(staff), detail: reason });
  await batch.commit();
}

export async function recordPayment({ booking, amount, method, reference, staff }) {
  const batch = writeBatch(db);
  const ref = doc(collection(db, COLLECTIONS.payments));
  batch.set(ref, {
    bookingId: booking.id,
    amount,
    method,
    reference: reference || "",
    createdBy: staff.id,
    createdAt: serverTimestamp(),
  });
  addActivity(batch, { action: "payment-recorded", refId: booking.id, staff: staffRef(staff), detail: `${booking.guestName} (${method})` });
  await batch.commit();
}

export async function saveStaffNote({ booking, note }) {
  const batch = writeBatch(db);
  batch.update(doc(db, COLLECTIONS.bookings, booking.id), { staffNote: note, updatedAt: serverTimestamp() });
  await batch.commit();
}

// Admin tool on the Integrations page: gives every room without a cleaningStatus the default "clean".
export async function backfillCleaningStatus({ roomIds, staff }) {
  const batch = writeBatch(db);
  roomIds.forEach((id) => batch.update(doc(db, COLLECTIONS.rooms, id), { cleaningStatus: "clean" }));
  addActivity(batch, { action: "rooms-backfilled", refId: "", staff: staffRef(staff), detail: `${roomIds.length} rooms set to clean` });
  await batch.commit();
}
