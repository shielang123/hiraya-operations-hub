"use client";

import Link from "next/link";
import { useState } from "react";
import { Btn, ErrorNote } from "./ui";
import CheckoutModal from "./CheckoutModal";
import { useAuth } from "./AuthProvider";
import { useData } from "./DataProvider";
import { checkInBooking } from "@/lib/frontdesk";
import { isReady } from "@/lib/selectors";
import { startOfDayLocal } from "@/lib/dates";

export default function BookingActions({ booking, showOpen = true }) {
  const { user, profile } = useAuth();
  const { rooms } = useData();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [checkout, setCheckout] = useState(false);

  const canCheckIn = isReady(booking) && booking.checkIn && startOfDayLocal(booking.checkIn) <= startOfDayLocal(new Date());
  const room = booking.roomId ? rooms[booking.roomId] : null;

  async function doCheckIn() {
    if (room && ["dirty", "cleaning"].includes(room.cleaningStatus)) {
      const ok = window.confirm(`${room.name} is still marked "${room.cleaningStatus}". Check the guest in anyway?`);
      if (!ok) return;
    }
    setBusy(true);
    setError("");
    try {
      await checkInBooking({ booking, staff: { id: user.uid, name: profile?.name } });
    } catch {
      setError("Could not check in. Check the Firestore rules.");
    }
    setBusy(false);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {canCheckIn && (
          <Btn onClick={doCheckIn} disabled={busy}>
            {busy ? "Checking in..." : "Check in"}
          </Btn>
        )}
        {booking.status === "checked-in" && <Btn onClick={() => setCheckout(true)}>Check out</Btn>}
        {showOpen && (
          <Link href={`/bookings/${booking.id}`} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100">
            Open
          </Link>
        )}
      </div>
      {error && <div className="mt-2"><ErrorNote>{error}</ErrorNote></div>}
      {checkout && <CheckoutModal booking={booking} onClose={() => setCheckout(false)} />}
    </div>
  );
}
