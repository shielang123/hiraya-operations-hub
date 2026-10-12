"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import ProtectedPage from "@/components/ProtectedPage";
import { useData } from "@/components/DataProvider";
import { Badge, Loading, Table, Tabs } from "@/components/ui";
import { fmtDateTime } from "@/lib/dates";

const TABS = [
  { key: "all", label: "All apps" },
  { key: "hub", label: "Hub" },
  { key: "bar", label: "Bar Counter" },
  { key: "housekeeping", label: "Housekeeping" },
  { key: "booking", label: "Room Booking" },
];

// Live feed of activityLog: every cross-app change, newest first (latest 300 kept in memory).
export default function ActivityPage() {
  const { activity, staffMap, bookings, loading } = useData();
  const [app, setApp] = useState("all");
  const rows = useMemo(() => activity.filter((a) => app === "all" || a.app === app), [activity, app]);
  const bookingIds = useMemo(() => new Set(bookings.map((b) => b.id)), [bookings]);

  return (
    <ProtectedPage roles={["admin", "frontdesk"]} title="Activity">
      <div className="mb-4"><Tabs tabs={TABS} value={app} onChange={setApp} /></div>
      {loading ? (
        <Loading />
      ) : (
        <Table head={["When", "App", "Action", "Detail", "Staff"]} empty={rows.length === 0 ? "No activity yet." : null}>
          {rows.map((a) => (
            <tr key={a.id} className="border-t border-slate-100">
              <td className="whitespace-nowrap px-4 py-2 text-slate-600">{fmtDateTime(a.createdAt)}</td>
              <td className="px-4 py-2"><Badge value={a.app} /></td>
              <td className="px-4 py-2 text-slate-800">{a.action.replace(/-/g, " ")}</td>
              <td className="px-4 py-2 text-slate-600">
                {bookingIds.has(a.refId) ? <Link href={`/bookings/${a.refId}`} className="text-brand-700 hover:underline">{a.detail || "Booking"}</Link> : a.detail || (a.refId ? a.refId.slice(0, 8) : "-")}
              </td>
              <td className="px-4 py-2 text-slate-600">{a.staffName || staffMap[a.staffId]?.name || (a.staffId ? a.staffId.slice(0, 6) : "-")}</td>
            </tr>
          ))}
        </Table>
      )}
    </ProtectedPage>
  );
}
