"use client";

import { useMemo, useState } from "react";
import { addDays, format, startOfDay, subDays } from "date-fns";
import ProtectedPage from "@/components/ProtectedPage";
import { OccupancyChart, RevenueChart } from "@/components/Charts";
import { useData } from "@/components/DataProvider";
import { Badge, Card, Loading, SectionTitle, StatCard, Tabs } from "@/components/ui";
import { formatPHP } from "@/lib/money";
import { fmtDateTime } from "@/lib/dates";
import { occupancyOn } from "@/lib/selectors";

const RANGES = [
  { key: "7", label: "7 days" },
  { key: "14", label: "14 days" },
  { key: "30", label: "30 days" },
];

// Combines all four systems: bookings revenue, extras, bar sales, occupancy and housekeeping speed.
export default function OwnerPage() {
  const { bookings, roomList, charges, orders, tasks, activity, loading } = useData();
  const [range, setRange] = useState("7");

  const m = useMemo(() => {
    const n = Number(range);
    const days = Array.from({ length: n }, (_, i) => startOfDay(subDays(new Date(), n - 1 - i)));
    const key = (d) => (d ? startOfDay(d).getTime() : 0);
    const rows = days.map((d) => ({ t: d.getTime(), label: format(d, n > 14 ? "d" : "EEE d"), room: 0, extras: 0, bar: 0 }));
    const idx = Object.fromEntries(rows.map((r, i) => [r.t, i]));
    // Room revenue is counted on the check-in date of stays that have started
    bookings.filter((b) => ["checked-in", "checked-out"].includes(b.status)).forEach((b) => {
      const i = idx[key(b.checkedInAt || b.checkIn)];
      if (i !== undefined) rows[i].room += b.totalCentavos;
    });
    // Bar charges are already inside orders, so only front-desk charges count as extras here
    charges.filter((c) => !c.voided && c.source !== "bar").forEach((c) => {
      const i = idx[key(c.createdAt)];
      if (i !== undefined) rows[i].extras += c.amount;
    });
    orders.filter((o) => o.status !== "voided").forEach((o) => {
      const i = idx[key(o.createdAt)];
      if (i !== undefined) rows[i].bar += o.total;
    });
    const sum = (f) => rows.reduce((s, r) => s + r[f], 0);

    const from = days[0];
    const done = tasks.filter((t) => t.doneAt && t.doneAt >= from);
    const avg = (arr) => (arr.length ? Math.round(arr.reduce((s, x) => s + x, 0) / arr.length) : null);
    const cleaning = avg(done.filter((t) => t.startedAt).map((t) => (t.doneAt - t.startedAt) / 60000));
    const turnaround = avg(done.filter((t) => t.createdAt && t.type === "checkout-clean").map((t) => (t.doneAt - t.createdAt) / 60000));

    const today = new Date();
    const forecast = Array.from({ length: 14 }, (_, i) => {
      const d = addDays(today, i);
      return { label: format(d, "d MMM"), pct: occupancyOn(bookings, roomList.length, d) };
    });

    return {
      rows,
      room: sum("room"),
      extras: sum("extras"),
      bar: sum("bar"),
      cleaning,
      turnaround,
      doneCount: done.length,
      forecast,
      tonight: forecast[0].pct,
      dirty: roomList.filter((r) => r.cleaningStatus === "dirty").length,
      open: tasks.filter((t) => ["open", "in-progress"].includes(t.status)).length,
    };
  }, [bookings, roomList, charges, orders, tasks, range]);

  const fmtMin = (v) => (v === null ? "-" : v >= 90 ? `${Math.floor(v / 60)}h ${v % 60}m` : `${v} min`);
  const total = m.room + m.extras + m.bar;

  return (
    <ProtectedPage roles={["admin"]} title="Owner view">
      <div className="mb-4"><Tabs tabs={RANGES} value={range} onChange={setRange} /></div>
      {loading ? (
        <Loading />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total revenue" value={formatPHP(total)} />
            <StatCard label="Rooms" value={formatPHP(m.room)} hint="By check-in date" />
            <StatCard label="Extras (front desk)" value={formatPHP(m.extras)} />
            <StatCard label="Bar sales" value={formatPHP(m.bar)} />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Occupancy tonight" value={m.tonight + "%"} />
            <StatCard label="Rooms waiting to be cleaned" value={m.dirty} hint={`${m.open} open task${m.open === 1 ? "" : "s"}`} tone={m.dirty > 0 ? "warn" : undefined} />
            <StatCard label="Avg cleaning time" value={fmtMin(m.cleaning)} hint={`${m.doneCount} tasks finished`} />
            <StatCard label="Avg check-out to ready" value={fmtMin(m.turnaround)} />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div>
              <SectionTitle>Revenue by day</SectionTitle>
              <Card><RevenueChart data={m.rows} /></Card>
            </div>
            <div>
              <SectionTitle>Occupancy, next 14 days</SectionTitle>
              <Card><OccupancyChart data={m.forecast} /></Card>
            </div>
          </div>

          <div className="mt-8">
            <SectionTitle>Live across the resort</SectionTitle>
            <Card className="!p-0">
              <ul className="divide-y divide-slate-100">
                {activity.slice(0, 10).map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                    <span className="text-slate-700"><Badge value={a.app} /> <span className="ml-2">{a.action.replace(/-/g, " ")}</span> {a.detail && <span className="text-slate-500">: {a.detail}</span>}</span>
                    <span className="whitespace-nowrap text-xs text-slate-500">{fmtDateTime(a.createdAt)}</span>
                  </li>
                ))}
                {activity.length === 0 && <li className="px-5 py-4 text-sm text-slate-500">No activity yet.</li>}
              </ul>
            </Card>
          </div>
        </>
      )}
    </ProtectedPage>
  );
}
