// Server-side hand-offs between the four Hiraya apps (needs the Firebase Blaze plan).
// Deploy:  firebase deploy --only functions
// Then set NEXT_PUBLIC_HANDOFF_MODE=function in the Hub so it stops doing the check-out step itself.
const { onDocumentUpdated, onDocumentWritten } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

initializeApp();

// 1. Check-out hand-off: booking -> checked-out creates one cleaning task and marks the room dirty.
//    Safe to run twice: it skips if a task for this booking already exists.
exports.onCheckout = onDocumentUpdated("bookings/{bookingId}", async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();
  if (before.status === "checked-out" || after.status !== "checked-out") return;
  if (!after.roomId) return;

  const db = getFirestore();
  const existing = await db
    .collection("housekeepingTasks")
    .where("bookingId", "==", event.params.bookingId)
    .where("type", "==", "checkout-clean")
    .limit(1)
    .get();
  if (!existing.empty) return;

  const batch = db.batch();
  batch.set(db.collection("housekeepingTasks").doc(), {
    roomId: after.roomId,
    bookingId: event.params.bookingId,
    type: "checkout-clean",
    status: "open",
    assignedTo: null,
    createdAt: FieldValue.serverTimestamp(),
  });
  batch.update(db.doc(`rooms/${after.roomId}`), { cleaningStatus: "dirty" });
  batch.set(db.collection("activityLog").doc(), {
    app: "hub",
    action: "cleaning-task-created",
    refId: event.params.bookingId,
    staffId: "system",
    staffName: "Cloud Function",
    detail: after.guestName || "",
    createdAt: FieldValue.serverTimestamp(),
  });
  await batch.commit();
});

// 2. Roles as custom claims: copies staff/{uid}.role into the login token so rules can use
//    request.auth.token.role instead of reading the staff document on every request.
//    Staff must sign out and in once for a changed role to apply.
exports.syncRoleClaims = onDocumentWritten("staff/{uid}", async (event) => {
  const uid = event.params.uid;
  const after = event.data.after.exists ? event.data.after.data() : null;
  const role = after && after.active !== false ? after.role : null;
  await getAuth().setCustomUserClaims(uid, role ? { role } : {});
});
