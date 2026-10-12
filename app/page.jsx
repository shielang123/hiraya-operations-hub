"use client";

import Link from "next/link";
import { useMemo } from "react";
import { subDays } from "date-fns";
import ProtectedPage from "@/components/ProtectedPage";
import BookingCard from "@/components/BookingCard";
import { CategoryChart } from "@/components/Charts";
import { useData } from "@/components/DataProvider";
import { Card, Loading, SectionTitle, StatCard } from "@/components/ui";
import { formatPHP } from "@/lib/money";
import { isLateArrival, isOverdueDeparture } from "@/lib/selectors";
import { startOfDayLocal } from "@/lib/dates";
import { format } from "date-fns";

export default function DashboardPage() {
  const { bookings, groups, rooms, roomList, charges, tasks, billFor, loading } = useData();

  const stats = useMemo(() => {
    const occupiedRooms = new Set(groups.inhouse.map((b) => b.roomId).filter(Boolean));
    const occ = roomList.length ? Math.round(((occupiedRooms.size || groups.inhouse.length) / roomList.length) * 100) + "%" : "-";
    return {
      occ,
      toClean: roomList.filter((r) => r.cleaningStatus === "dirty").length,
      openTasks: tasks.filter((t) => ["open", "in-progress"].includes(t.status)).length,
    };
  }, [groups, roomList, tasks]);

  const attention = useMemo(() => {
    const items = [];
    groups.arriving.forEach((b) => {
      const r = b.roomId ? rooms[b.roomId] : null;
      if (r && ["dirty", "cleaning"].includes(r.cleaningStatus))
        items.push({ id: "r" + b.id, text: `${b.guestName} arrives but ${r.name} is ${r.cleaningStatus}`, href: `/bookings/${b.id}` });
      if (isLateArrival(b)) items.push({ id: "l" + b.id, text: `${b.guestName} was due before today and has not checked in`, href: `/bookings/${b.id}` });
    });
    groups.departing.forEach((b) => {
      const bal = billFor(b).balance;
      if (bal > 0) items.push({ id: "b" + b.id, text: `${b.guestName} departs with ${formatPHP(bal)} unpaid`, href: `/bookings/${b.id}` });
      if (isOverdueDeparture(b)) items.push({ id: "o" + b.id, text: `${b.guestName} is past the check-out date`, href: `/bookings/${b.id}` });
    });
    if (groups.pending.length)
      items.push({ id: "p", text: `${groups.pending.length} booking${groups.pending.length > 1 ? "s" : ""} waiting for approval on the booking site`, href: "/bookings" });
    return items;
  }, [groups, rooms, billFor]);

  const chartData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => startOfDayLocal(subDays(new Date(), 6 - i)));
    return days.map((d) => {
      const row = { label: format(d, "EEE d"), food: 0, activity: 0, damage: 0, other: 0 };
      charges.forEach((c) => {
        if (!c.voided && c.createdAt && startOfDayLocal(c.createdAt).getTime() === d.getTime()) row[c.category] = (row[c.category] || 0) + c.amount;
      });
      return row;
    });
  }, [charges]);

  return (
    <ProtectedPage roles={["admin", "frontdesk"]} title="Today at Hiraya Farm Resort">
      {loading ? (
        <Loading />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard label="Arriving today" value={groups.arriving.length} href="/arrivals" />
            <StatCard label="Departing today" value={groups.departing.length} href="/arrivals" />
            <StatCard label="Guests in house" value={groups.inhouse.length} href="/arrivals" />
            <StatCard label="Occupancy" value={stats.occ} href="/rooms" />
            <StatCard label="Rooms to clean" value={stats.toClean} href="/rooms" hint={`${stats.openTasks} open task${stats.openTasks === 1 ? "" : "s"}`} />
            <StatCard label="Pending approval" value={groups.pending.length} href="/bookings" />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <SectionTitle>Needs attention</SectionTitle>
              <Card className="!p-0">
                {attention.length === 0 ? (
                  <p className="p-5 text-sm text-slate-500">All clear. Nothing needs the front desk right now.</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {attention.map((a) => (
                      <li key={a.id}>
                        <Link href={a.href} className="flex items-center justify-between gap-3 px-5 py-3 text-sm text-slate-700 hover:bg-slate-50">
                          <span>{a.text}</span>
                          <span className="text-brand-700">Open</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
            <div>
              <SectionTitle>Extra charges, last 7 days</SectionTitle>
              <Card>
                <CategoryChart data={chartData} />
              </Card>
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <div>
              <SectionTitle right={<Link href="/arrivals" className="text-sm text-brand-700">See all</Link>}>Arriving</SectionTitle>
              <div className="grid gap-4">
                {groups.arriving.slice(0, 4).map((b) => <BookingCard key={b.id} booking={b} />)}
                {groups.arriving.length === 0 && <p className="text-sm text-slate-500">No arrivals today.</p>}
              </div>
            </div>
            <div>
              <SectionTitle right={<Link href="/arrivals" className="text-sm text-brand-700">See all</Link>}>Departing</SectionTitle>
              <div className="grid gap-4">
                {groups.departing.slice(0, 4).map((b) => <BookingCard key={b.id} booking={b} />)}
                {groups.departing.length === 0 && <p className="text-sm text-slate-500">No departures today.</p>}
              </div>
            </div>
          </div>
        </>
      )}
    </ProtectedPage>
  );
}
