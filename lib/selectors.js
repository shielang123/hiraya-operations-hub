import { startOfDayLocal } from "./dates";
import { READY_STATUSES } from "./config";

export const isReady = (b) => READY_STATUSES.includes(b.status);

// Splits bookings into the working lists the front desk needs.
export function groupBookings(bookings, now = new Date()) {
  const today = startOfDayLocal(now);
  const day = (d) => (d ? startOfDayLocal(d) : null);
  const g = { arriving: [], departing: [], inhouse: [], upcoming: [], pending: [] };
  for (const b of bookings) {
    const ci = day(b.checkIn);
    const co = day(b.checkOut);
    if (isReady(b)) {
      if (ci && ci <= today && (!co || co >= today)) g.arriving.push(b);
      else if (ci && ci > today) g.upcoming.push(b);
    } else if (b.status === "checked-in") {
      g.inhouse.push(b);
      if (co && co <= today) g.departing.push(b);
    } else if (b.status === "pending") {
      g.pending.push(b);
    }
  }
  return g;
}

export const isLateArrival = (b, now = new Date()) =>
  isReady(b) && b.checkIn && startOfDayLocal(b.checkIn) < startOfDayLocal(now);

export const isOverdueDeparture = (b, now = new Date()) =>
  b.status === "checked-in" && b.checkOut && startOfDayLocal(b.checkOut) < startOfDayLocal(now);

// Share of rooms occupied on a given day (checked-in or approved stays that cover the night)
export function occupancyOn(bookings, totalRooms, date) {
  if (!totalRooms) return 0;
  const d = startOfDayLocal(date);
  const rooms = new Set();
  let anon = 0;
  for (const b of bookings) {
    if (!(isReady(b) || b.status === "checked-in")) continue;
    if (!b.checkIn || !b.checkOut) continue;
    if (startOfDayLocal(b.checkIn) <= d && d < startOfDayLocal(b.checkOut)) {
      if (b.roomId) rooms.add(b.roomId);
      else anon += 1;
    }
  }
  return Math.min(100, Math.round(((rooms.size + anon) / totalRooms) * 100));
}

export function inRange(date, from, to) {
  return !!date && date >= from && date <= to;
}
