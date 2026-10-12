"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import ProtectedPage from "@/components/ProtectedPage";
import { useData } from "@/components/DataProvider";
import { Badge, Btn, Loading, Table, inputCls } from "@/components/ui";
import { BOOKING_STATUSES, STATUS_LABELS } from "@/lib/config";
import { fmtDate } from "@/lib/dates";
import { formatPHP } from "@/lib/money";
import { downloadCsv } from "@/lib/csv";

const PAGE = 100;

export default function BookingsPage() {
  const { bookings, billFor, loading } = useData();
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(PAGE);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...bookings]
      .filter((b) => status === "all" || b.status === status)
      .filter((b) => !q || [b.guestName, b.roomLabel, b.email, b.phone, b.id].some((v) => String(v || "").toLowerCase().includes(q)))
      .sort((a, b) => (b.checkIn?.getTime() ?? 0) - (a.checkIn?.getTime() ?? 0));
  }, [bookings, status, search]);

  function exportCsv() {
    downloadCsv(
      "hiraya-bookings.csv",
      rows.map((b) => {
        const bill = billFor(b);
        return {
          bookingId: b.id,
          guest: b.guestName,
          email: b.email,
          phone: b.phone,
          room: b.roomLabel,
          checkIn: fmtDate(b.checkIn),
          checkOut: fmtDate(b.checkOut),
          status: b.status,
          roomTotalPHP: (bill.room / 100).toFixed(2),
          extrasPHP: (bill.extras / 100).toFixed(2),
          paidPHP: (bill.paid / 100).toFixed(2),
          balancePHP: (bill.balance / 100).toFixed(2),
        };
      })
    );
  }

  return (
    <ProtectedPage roles={["admin", "frontdesk"]} title="Bookings" actions={<Btn variant="outline" onClick={exportCsv}>Export CSV</Btn>}>
      <div className="mb-4 flex flex-wrap gap-3">
        <select className={inputCls + " sm:!w-48"} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          {BOOKING_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <input className={inputCls + " sm:!w-72"} placeholder="Search guest, room, email, phone or ID" value={search} onChange={(e) => setSearch(e.target.value)} />
        <p className="self-center text-sm text-slate-500">{rows.length} bookings</p>
      </div>
      {loading ? (
        <Loading />
      ) : (
        <>
          <Table
            head={["Guest", "Room", "Stay", "Status", { label: "Total", right: true }, { label: "Balance", right: true }, ""]}
            empty={rows.length === 0 ? "No bookings match." : null}
          >
            {rows.slice(0, limit).map((b) => {
              const bill = billFor(b);
              const active = b.status === "checked-in";
              return (
                <tr key={b.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 text-slate-800">{b.guestName}</td>
                  <td className="px-4 py-2 text-slate-600">{b.roomLabel}</td>
                  <td className="whitespace-nowrap px-4 py-2 text-slate-600">
                    {fmtDate(b.checkIn)} to {fmtDate(b.checkOut)}
                  </td>
                  <td className="px-4 py-2"><Badge value={b.status} /></td>
                  <td className="px-4 py-2 text-right text-slate-800">{formatPHP(bill.total)}</td>
                  <td className={"px-4 py-2 text-right " + (active && bill.balance > 0 ? "font-medium text-amber-700" : "text-slate-500")}>
                    {["checked-in", "checked-out"].includes(b.status) ? formatPHP(bill.balance) : "-"}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link href={`/bookings/${b.id}`} className="text-brand-700 hover:underline">Open</Link>
                  </td>
                </tr>
              );
            })}
          </Table>
          {rows.length > limit && (
            <div className="mt-4 text-center">
              <Btn variant="outline" onClick={() => setLimit(limit + PAGE)}>Show more</Btn>
            </div>
          )}
        </>
      )}
    </ProtectedPage>
  );
}
