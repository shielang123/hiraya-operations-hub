"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import ProtectedPage from "@/components/ProtectedPage";
import BookingActions from "@/components/BookingActions";
import BillTable from "@/components/BillTable";
import ChargeForm from "@/components/ChargeForm";
import PaymentForm from "@/components/PaymentForm";
import { useAuth } from "@/components/AuthProvider";
import { useData } from "@/components/DataProvider";
import { Badge, Btn, Card, Empty, ErrorNote, Loading, SectionTitle, inputCls } from "@/components/ui";
import { fmtDate, fmtDateTime } from "@/lib/dates";
import { voidCharge, saveStaffNote } from "@/lib/frontdesk";

export default function BookingDetailPage() {
  const { id } = useParams();
  const { user, profile, role } = useAuth();
  const { bookings, rooms, billFor, activity, orders, tasks, loading } = useData();
  const booking = bookings.find((b) => b.id === id);
  const [note, setNote] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (booking) setNote(booking.staffNote || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking?.id]);

  if (loading) return <ProtectedPage roles={["admin", "frontdesk"]} title="Booking"><Loading /></ProtectedPage>;
  if (!booking)
    return (
      <ProtectedPage roles={["admin", "frontdesk"]} title="Booking">
        <Empty>Booking not found. <Link href="/bookings" className="text-brand-700">Back to bookings</Link></Empty>
      </ProtectedPage>
    );

  const bill = billFor(booking);
  const room = booking.roomId ? rooms[booking.roomId] : null;
  const canCharge = booking.status === "checked-in";
  const staff = { id: user.uid, name: profile?.name };
  const myOrders = orders.filter((o) => o.bookingId === booking.id);
  const myTasks = tasks.filter((t) => t.bookingId === booking.id);
  const timeline = activity.filter((a) => a.refId === booking.id || myOrders.some((o) => o.id === a.refId));

  async function onVoid(charge) {
    const reason = window.prompt("Reason for voiding this charge:");
    if (!reason || reason.trim().length < 3) return;
    setError("");
    try {
      await voidCharge({ charge, reason: reason.trim(), staff });
    } catch {
      setError("Could not void the charge. Check the Firestore rules.");
    }
  }

  async function saveNote() {
    try {
      await saveStaffNote({ booking, note });
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 2000);
    } catch {
      setError("Could not save the note.");
    }
  }

  return (
    <ProtectedPage
      roles={["admin", "frontdesk"]}
      title={booking.guestName}
      actions={<Link href={`/bookings/${booking.id}/bill`} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100">Printable bill</Link>}
    >
      <ErrorNote>{error}</ErrorNote>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Badge value={booking.status} />
        {room?.cleaningStatus && <Badge value={room.cleaningStatus} label={`Room ${room.cleaningStatus}`} />}
        <BookingActions booking={booking} showOpen={false} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <SectionTitle>Guest bill</SectionTitle>
            <BillTable booking={booking} bill={bill} onVoid={onVoid} canVoid={(c) => c.source !== "bar" || role === "admin"} />
            <p className="mt-3 text-xs text-slate-500">
              Bar charges can only be voided by an admin. Void the order in the Bar Counter first so the two stay in step.
            </p>
          </Card>

          {canCharge && (
            <Card>
              <SectionTitle>Add a charge</SectionTitle>
              <ChargeForm booking={booking} />
            </Card>
          )}

          {["checked-in", "checked-out"].includes(booking.status) && (
            <Card>
              <SectionTitle>Record a payment</SectionTitle>
              <PaymentForm key={bill.hubPaid} booking={booking} balance={bill.balance} />
            </Card>
          )}

          {myOrders.length > 0 && (
            <Card>
              <SectionTitle>Bar orders for this stay</SectionTitle>
              <ul className="divide-y divide-slate-100 text-sm">
                {myOrders.map((o) => (
                  <li key={o.id} className="flex items-center justify-between py-2">
                    <span className="text-slate-700">{o.items.map((i) => `${i.qty}x ${i.name}`).join(", ") || "Order"}</span>
                    <Badge value={o.status} />
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <SectionTitle>Stay</SectionTitle>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
              <dt className="text-slate-500">Room</dt><dd className="text-slate-800">{booking.roomLabel}</dd>
              <dt className="text-slate-500">Check-in</dt><dd className="text-slate-800">{fmtDate(booking.checkIn)}</dd>
              <dt className="text-slate-500">Check-out</dt><dd className="text-slate-800">{fmtDate(booking.checkOut)}</dd>
              <dt className="text-slate-500">Nights</dt><dd className="text-slate-800">{booking.nights || "-"}</dd>
              {booking.guests ? (<><dt className="text-slate-500">Guests</dt><dd className="text-slate-800">{booking.guests}</dd></>) : null}
              {booking.checkedInAt && (<><dt className="text-slate-500">Arrived</dt><dd className="text-slate-800">{fmtDateTime(booking.checkedInAt)}</dd></>)}
              {booking.checkedOutAt && (<><dt className="text-slate-500">Left</dt><dd className="text-slate-800">{fmtDateTime(booking.checkedOutAt)}</dd></>)}
            </dl>
          </Card>

          <Card>
            <SectionTitle>Guest</SectionTitle>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
              <dt className="text-slate-500">Email</dt><dd className="break-all text-slate-800">{booking.email || "-"}</dd>
              <dt className="text-slate-500">Phone</dt><dd className="text-slate-800">{booking.phone || "-"}</dd>
            </dl>
            {booking.request && <p className="mt-3 rounded-md bg-slate-50 p-3 text-sm text-slate-700">{String(booking.request)}</p>}
          </Card>

          <Card>
            <SectionTitle>Staff note</SectionTitle>
            <textarea className={inputCls} rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Allergies, late arrival, special setup..." />
            <div className="mt-2 flex items-center gap-3">
              <Btn onClick={saveNote} disabled={note === (booking.staffNote || "")}>Save note</Btn>
              {noteSaved && <span className="text-sm text-emerald-700">Saved</span>}
            </div>
          </Card>

          <Card>
            <SectionTitle>History</SectionTitle>
            {timeline.length === 0 && myTasks.length === 0 ? (
              <p className="text-sm text-slate-500">No activity yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {timeline.slice(0, 12).map((a) => (
                  <li key={a.id} className="flex items-start justify-between gap-2">
                    <span className="text-slate-700"><Badge value={a.app} /> <span className="ml-1">{a.action.replace(/-/g, " ")}</span></span>
                    <span className="whitespace-nowrap text-xs text-slate-500">{fmtDateTime(a.createdAt)}</span>
                  </li>
                ))}
                {myTasks.map((t) => (
                  <li key={t.id} className="flex items-start justify-between gap-2">
                    <span className="text-slate-700"><Badge value="housekeeping" /> <span className="ml-1">cleaning task</span> <Badge value={t.status} /></span>
                    <span className="whitespace-nowrap text-xs text-slate-500">{fmtDateTime(t.doneAt || t.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </ProtectedPage>
  );
}
