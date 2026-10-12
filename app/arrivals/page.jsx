"use client";

import { useMemo, useState } from "react";
import ProtectedPage from "@/components/ProtectedPage";
import BookingCard from "@/components/BookingCard";
import { useData } from "@/components/DataProvider";
import { Empty, Loading, Tabs, inputCls } from "@/components/ui";

const TABS = [
  { key: "arriving", label: "Arriving today" },
  { key: "departing", label: "Departing today" },
  { key: "inhouse", label: "In house" },
  { key: "upcoming", label: "Upcoming" },
];

export default function ArrivalsPage() {
  const { groups, loading } = useData();
  const [tab, setTab] = useState("arriving");
  const [search, setSearch] = useState("");

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return groups[tab].filter((b) => !q || b.guestName.toLowerCase().includes(q) || String(b.roomLabel).toLowerCase().includes(q));
  }, [groups, tab, search]);

  const counts = Object.fromEntries(TABS.map((t) => [t.key, groups[t.key].length]));

  return (
    <ProtectedPage roles={["admin", "frontdesk"]} title="Arrivals & departures">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Tabs tabs={TABS} value={tab} onChange={setTab} counts={counts} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search guest or room" className={inputCls + " sm:!w-64"} />
      </div>
      {loading ? (
        <Loading>Loading bookings...</Loading>
      ) : shown.length === 0 ? (
        <Empty />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((b) => (
            <BookingCard key={b.id} booking={b} />
          ))}
        </div>
      )}
    </ProtectedPage>
  );
}
