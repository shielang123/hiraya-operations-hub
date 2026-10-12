"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import ProtectedPage from "@/components/ProtectedPage";
import BillTable from "@/components/BillTable";
import { useData } from "@/components/DataProvider";
import { Btn, Empty, Loading } from "@/components/ui";
import { fmtDate } from "@/lib/dates";
import { RESORT_NAME } from "@/lib/config";

export default function BillPage() {
  const { id } = useParams();
  const { bookings, billFor, loading } = useData();
  const booking = bookings.find((b) => b.id === id);

  return (
    <ProtectedPage
      roles={["admin", "frontdesk"]}
      actions={
        <>
          <Link href={`/bookings/${id}`} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100">Back</Link>
          <Btn onClick={() => window.print()}>Print</Btn>
        </>
      }
    >
      {loading ? (
        <Loading />
      ) : !booking ? (
        <Empty>Booking not found.</Empty>
      ) : (
        <div className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-8 print:border-0 print:p-0">
          <h1 className="text-2xl font-semibold text-brand-700">{RESORT_NAME}</h1>
          <p className="text-sm text-slate-500">Guest statement</p>
          <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <dt className="text-slate-500">Guest</dt><dd className="text-slate-800">{booking.guestName}</dd>
            <dt className="text-slate-500">Room</dt><dd className="text-slate-800">{booking.roomLabel}</dd>
            <dt className="text-slate-500">Stay</dt><dd className="text-slate-800">{fmtDate(booking.checkIn)} to {fmtDate(booking.checkOut)}</dd>
            <dt className="text-slate-500">Booking ref</dt><dd className="break-all text-slate-800">{booking.id}</dd>
          </dl>
          <div className="mt-6">
            <BillTable booking={booking} bill={billFor(booking)} showVoided={false} />
          </div>
          <p className="mt-10 text-center text-sm text-slate-500">Thank you for staying at {RESORT_NAME}.</p>
        </div>
      )}
    </ProtectedPage>
  );
}
