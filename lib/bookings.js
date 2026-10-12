import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "./firebase";
import { ACTIVE_STATUSES, COLLECTIONS } from "./config";
import { normalizeBooking, normalizeRoom } from "./normalize";

export { normalizeBooking };

// Live list of bookings that are approved or in house. Sorted in the browser,
// so Firestore does not ask for a composite index.
export function listenToActiveBookings(onData, onError) {
  const q = query(collection(db, COLLECTIONS.bookings), where("status", "in", ACTIVE_STATUSES));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => normalizeBooking(d.id, d.data()));
      list.sort((a, b) => (a.checkIn?.getTime() ?? 0) - (b.checkIn?.getTime() ?? 0));
      onData(list);
    },
    onError
  );
}

export function listenToRooms(onData, onError) {
  return onSnapshot(
    collection(db, COLLECTIONS.rooms),
    (snap) => {
      const map = {};
      snap.docs.forEach((d) => (map[d.id] = normalizeRoom(d.id, d.data())));
      onData(map);
    },
    onError
  );
}
