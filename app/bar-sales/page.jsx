"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { startOfDay, subDays } from "date-fns";
import ProtectedPage from "@/components/ProtectedPage";
import { useData } from "@/components/DataProvider";
import { Badge, Btn, Card, Loading, SectionTitle, StatCard, Table, Tabs } from "@/components/ui";
import { fmtDateTime } from "@/lib/dates";
import { formatPHP } from "@/lib/money";
import { downloadCsv } from "@/lib/csv";

const RANGES = [
  { key: "1", label: "Today" },
  { key: "7", label: "7 days" },
  { key: "30", label: "30 days" },
];

const MODE_LABEL = { room: "Charged to room", cash: "Cash", gcash: "GCash", table: "Table (unpaid)" };

// Read-only view of what the Bar Counter app sells. Orders are created there, never here.
export default function BarSalesPage() {
  const { orders, menuItems, charges, bookings, loading } = useData();
  const [range, setRange] = useState("7");

  const data = useMemo(() => {
    const from = startOfDay(subDays(new Date(), Number(range) - 1));
    const list = orders.filter((o) => o.createdAt && o.createdAt >= from).sort((a, b) => b.createdAt - a.createdAt);
    const live = list.filter((o) => o.status !== "voided");
    const catOf = Object.fromEntries(menuItems.map((m) => [m.id, m.category]));
    const byMode = {};
    const byCat = {};
    const top = {};
    live.forEach((o) => {
      byMode[o.paymentMode] = (byMode[o.paymentMode] || 0) + o.total;
      o.items.forEach((i) => {
        const cat = i.category || catOf[i.itemId] || "other";
        byCat[cat] = (byCat[cat] || 0) + i.price * i.qty;
        top[i.name] = top[i.name] || { name: i.name, qty: 0, sales: 0 };
        top[i.name].qty += i.qty;
        top[i.name].sales += i.price * i.qty;
      });
    });
    return {
      list,
      total: live.reduce((s, o) => s + o.total, 0),
      count: live.length,
      voided: list.length - live.length,
      byMode,
      byCat,
      top: Object.values(top).sort((a, b) => b.sales - a.sales).slice(0, 6),
    };
  }, [orders, menuItems, range]);

  // Room charges from bar orders for guests still in house: money waiting to be settled at check-out
  const pending = useMemo(() => {
    const inHouse = new Set(bookings.filter((b) => b.status === "checked-in").map((b) => b.id));
    const m = {};
    charges.filter((c) => c.source === "bar" && !c.voided && inHouse.has(c.bookingId)).forEach((c) => (m[c.bookingId] = (m[c.bookingId] || 0) + c.amount));
    return Object.entries(m).map(([id, amount]) => ({ booking: bookings.find((b) => b.id === id), amount })).filter((x) => x.booking);
  }, [charges, bookings]);

  const bookingName = (id) => bookings.find((b) => b.id === id)?.guestName || "-";

  function exportCsv() {
    downloadCsv(
      "hiraya-bar-orders.csv",
      data.list.map((o) => ({
        orderId: o.id,
        when: o.createdAt ? o.createdAt.toISOString() : "",
        status: o.status,
        paymentMode: o.paymentMode,
        bookingId: o.bookingId,
        items: o.items.map((i) => `${i.qty}x ${i.name}`).join("; "),
        totalPHP: (o.total / 100).toFixed(2),
      }))
    );
  }

  return (
    <ProtectedPage roles={["admin", "frontdesk"]} title="Bar sales" actions={<Btn variant="outline" onClick={exportCsv}>Export CSV</Btn>}>
      <div className="mb-4"><Tabs tabs={RANGES} value={range} onChange={setRange} /></div>
      {loading ? (
        <Loading />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Sales" value={formatPHP(data.total)} />
            <StatCard label="Orders" value={data.count} hint={data.voided ? `${data.voided} voided` : undefined} />
            <StatCard label="Charged to rooms" value={formatPHP(data.byMode.room || 0)} />
            <StatCard label="To settle at check-out" value={formatPHP(pending.reduce((s, x) => s + x.amount, 0))} hint={`${pending.length} room${pending.length === 1 ? "" : "s"} in house`} />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <Card>
              <SectionTitle>By payment mode</SectionTitle>
              <ul className="space-y-2 text-sm">
                {Object.entries(data.byMode).map(([k, v]) => (
                  <li key={k} className="flex justify-between"><span className="text-slate-600">{MODE_LABEL[k] || k}</span><span className="text-slate-800">{formatPHP(v)}</span></li>
                ))}
                {Object.keys(data.byMode).length === 0 && <li className="text-slate-500">No sales yet.</li>}
              </ul>
            </Card>
            <Card>
              <SectionTitle>By category</SectionTitle>
              <ul className="space-y-2 text-sm">
                {Object.entries(data.byCat).map(([k, v]) => (
                  <li key={k} className="flex justify-between"><span className="capitalize text-slate-600">{k}</span><span className="text-slate-800">{formatPHP(v)}</span></li>
                ))}
                {Object.keys(data.byCat).length === 0 && <li className="text-slate-500">No sales yet.</li>}
              </ul>
            </Card>
            <Card>
              <SectionTitle>Top items</SectionTitle>
              <ul className="space-y-2 text-sm">
                {data.top.map((t) => (
                  <li key={t.name} className="flex justify-between"><span className="text-slate-600">{t.name} <span className="text-xs text-slate-400">x{t.qty}</span></span><span className="text-slate-800">{formatPHP(t.sales)}</span></li>
                ))}
                {data.top.length === 0 && <li className="text-slate-500">No sales yet.</li>}
              </ul>
            </Card>
          </div>

          {pending.length > 0 && (
            <div className="mt-8">
              <SectionTitle>Room charges waiting for check-out</SectionTitle>
              <Table head={["Guest", "Room", { label: "Bar charges", right: true }]}>
                {pending.map(({ booking, amount }) => (
                  <tr key={booking.id} className="border-t border-slate-100">
                    <td className="px-4 py-2"><Link href={`/bookings/${booking.id}`} className="text-brand-700 hover:underline">{booking.guestName}</Link></td>
                    <td className="px-4 py-2 text-slate-600">{booking.roomLabel}</td>
                    <td className="px-4 py-2 text-right">{formatPHP(amount)}</td>
                  </tr>
                ))}
              </Table>
            </div>
          )}

          <div className="mt-8">
            <SectionTitle>Orders</SectionTitle>
            <Table head={["When", "Items", "Mode", "Status", { label: "Total", right: true }]} empty={data.list.length === 0 ? "No orders in this period." : null}>
              {data.list.slice(0, 100).map((o) => (
                <tr key={o.id} className="border-t border-slate-100">
                  <td className="whitespace-nowrap px-4 py-2">{fmtDateTime(o.createdAt)}</td>
                  <td className="px-4 py-2 text-slate-700">{o.items.map((i) => `${i.qty}x ${i.name}`).join(", ")}</td>
                  <td className="px-4 py-2 text-slate-600">{MODE_LABEL[o.paymentMode] || o.paymentMode}{o.bookingId ? `: ${bookingName(o.bookingId)}` : ""}</td>
                  <td className="px-4 py-2"><Badge value={o.status} /></td>
                  <td className="px-4 py-2 text-right">{formatPHP(o.total)}</td>
                </tr>
              ))}
            </Table>
          </div>
        </>
      )}
    </ProtectedPage>
  );
}
