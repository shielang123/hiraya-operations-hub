"use client";

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";
import { COLLECTIONS } from "@/lib/config";
import { HUB_ROLES } from "@/lib/roles";
import {
  normalizeActivity,
  normalizeBooking,
  normalizeCharge,
  normalizeOrder,
  normalizePayment,
  normalizeRoom,
  normalizeTask,
} from "@/lib/normalize";
import { computeBill } from "@/lib/billing";
import { groupBookings } from "@/lib/selectors";

const DataContext = createContext(null);

// One live listener per collection, shared by every page. Each has its own loading and error state,
// so a missing permission on one collection never blanks the whole app.
function useLive(name, enabled, normalize, { newest } = {}) {
  const [state, setState] = useState({ data: [], loading: true, error: "" });
  useEffect(() => {
    if (!enabled) {
      setState({ data: [], loading: false, error: "" });
      return;
    }
    let q = collection(db, name);
    if (newest) q = query(q, orderBy("createdAt", "desc"), limit(newest));
    return onSnapshot(
      q,
      (snap) => setState({ data: snap.docs.map((d) => normalize(d.id, d.data())), loading: false, error: "" }),
      (err) => setState({ data: [], loading: false, error: err.message || "Could not load " + name })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, enabled]);
  return state;
}

const rawNormalize = (id, d) => ({ id, ...d });

export function DataProvider({ children }) {
  const { user, role } = useAuth();
  const enabled = !!user && HUB_ROLES.includes(role);

  const bk = useLive(COLLECTIONS.bookings, enabled, normalizeBooking);
  const rm = useLive(COLLECTIONS.rooms, enabled, normalizeRoom);
  const ch = useLive(COLLECTIONS.charges, enabled, normalizeCharge);
  const pay = useLive(COLLECTIONS.payments, enabled, normalizePayment);
  const ord = useLive(COLLECTIONS.orders, enabled, normalizeOrder);
  const menu = useLive(COLLECTIONS.menuItems, enabled, rawNormalize);
  const tk = useLive(COLLECTIONS.housekeepingTasks, enabled, normalizeTask);
  const act = useLive(COLLECTIONS.activityLog, enabled, normalizeActivity, { newest: 300 });
  const stf = useLive(COLLECTIONS.staff, enabled && role === "admin", rawNormalize);

  const rooms = useMemo(() => Object.fromEntries(rm.data.map((r) => [r.id, r])), [rm.data]);
  const roomList = useMemo(() => [...rm.data].sort((a, b) => String(a.name).localeCompare(String(b.name))), [rm.data]);

  const bookings = useMemo(
    () =>
      bk.data
        .map((b) => ({ ...b, roomLabel: (b.roomId && rooms[b.roomId]?.name) || b.roomName || "-" }))
        .sort((a, b) => (a.checkIn?.getTime() ?? 0) - (b.checkIn?.getTime() ?? 0)),
    [bk.data, rooms]
  );

  const chargesByBooking = useMemo(() => group(ch.data), [ch.data]);
  const paymentsByBooking = useMemo(() => group(pay.data), [pay.data]);

  const billFor = useCallback(
    (booking) => computeBill(booking, chargesByBooking[booking.id] || [], paymentsByBooking[booking.id] || []),
    [chargesByBooking, paymentsByBooking]
  );

  const groups = useMemo(() => groupBookings(bookings), [bookings]);
  const staffMap = useMemo(() => Object.fromEntries(stf.data.map((s) => [s.id, s])), [stf.data]);

  const sources = { bk, rm, ch, pay, ord, menu, tk, act };
  const errors = Object.entries({
    bookings: bk.error,
    rooms: rm.error,
    charges: ch.error,
    payments: pay.error,
    orders: ord.error,
    menuItems: menu.error,
    housekeepingTasks: tk.error,
    activityLog: act.error,
  }).filter(([, e]) => e);

  const value = {
    bookings,
    groups,
    rooms,
    roomList,
    charges: ch.data,
    payments: pay.data,
    orders: ord.data,
    menuItems: menu.data,
    tasks: tk.data,
    activity: act.data,
    staffMap,
    billFor,
    chargesByBooking,
    paymentsByBooking,
    loading: bk.loading || rm.loading,
    errors,
    sources,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

function group(list) {
  const m = {};
  list.forEach((x) => (m[x.bookingId] = [...(m[x.bookingId] || []), x]));
  return m;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside DataProvider");
  return ctx;
}
