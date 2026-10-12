"use client";

import { fmtDate } from "@/lib/dates";
import { formatPHP } from "@/lib/money";
import { isLateArrival, isOverdueDeparture } from "@/lib/selectors";
import { useData } from "./DataProvider";
import { Badge } from "./ui";
import BookingActions from "./BookingActions";

export default function BookingCard({ booking }) {
  const b = booking;
  const { rooms, billFor } = useData();
  const room = b.roomId ? rooms[b.roomId] : null;
  const bill = billFor(b);
  const late = isLateArrival(b);
  const overdue = isOverdueDeparture(b);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-slate-800">{b.guestName}</p>
          <p className="text-sm text-slate-500">{b.roomLabel}</p>
        </div>
        <Badge value={b.status} />
      </div>

      {(late || overdue || (room && ["dirty", "cleaning"].includes(room.cleaningStatus) && b.status !== "checked-in")) && (
        <div className="mt-2 flex flex-wrap gap-1">
          {late && <Badge value="pending" label="Late arrival" />}
          {overdue && <Badge value="dirty" label="Past check-out date" />}
          {room && ["dirty", "cleaning"].includes(room.cleaningStatus) && b.status !== "checked-in" && (
            <Badge value={room.cleaningStatus} label={`Room ${room.cleaningStatus}`} />
          )}
        </div>
      )}

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <dt className="text-slate-500">Check-in</dt>
        <dd className="text-slate-800">{fmtDate(b.checkIn)}</dd>
        <dt className="text-slate-500">Check-out</dt>
        <dd className="text-slate-800">{fmtDate(b.checkOut)}</dd>
        {b.guests ? (
          <>
            <dt className="text-slate-500">Guests</dt>
            <dd className="text-slate-800">{b.guests}</dd>
          </>
        ) : null}
        {b.phone ? (
          <>
            <dt className="text-slate-500">Phone</dt>
            <dd className="text-slate-800">{b.phone}</dd>
          </>
        ) : null}
        {b.status === "checked-in" && (
          <>
            <dt className="text-slate-500">Balance</dt>
            <dd className={bill.balance > 0 ? "font-medium text-amber-700" : "text-emerald-700"}>{formatPHP(bill.balance)}</dd>
          </>
        )}
      </dl>
      <div className="mt-4">
        <BookingActions booking={b} />
      </div>
    </div>
  );
}
