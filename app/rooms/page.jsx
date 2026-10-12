"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import ProtectedPage from "@/components/ProtectedPage";
import { useData } from "@/components/DataProvider";
import { Badge, Card, Loading, Tabs } from "@/components/ui";
import { fmtDate, startOfDayLocal } from "@/lib/dates";
import { ROOM_STATUSES, STATUS_LABELS } from "@/lib/config";
import { isReady } from "@/lib/selectors";

// Read-only. Cleaning is changed in the Housekeeping app; this view shows the result live.
export default function RoomsPage() {
  const { roomList, bookings, tasks, loading } = useData();
  const [filter, setFilter] = useState("all");

  const rows = useMemo(() => {
    const today = startOfDayLocal(new Date());
    return roomList.map((r) => {
      const guest = bookings.find((b) => b.roomId === r.id && b.status === "checked-in");
      const next = bookings
        .filter((b) => b.roomId === r.id && isReady(b) && b.checkIn && startOfDayLocal(b.checkIn) >= today)
        .sort((a, b) => a.checkIn - b.checkIn)[0];
      const task = tasks.find((t) => t.roomId === r.id && ["open", "in-progress"].includes(t.status));
      return { room: r, guest, next, task };
    });
  }, [roomList, bookings, tasks]);

  const counts = { all: rows.length };
  ROOM_STATUSES.forEach((s) => (counts[s] = rows.filter((x) => x.room.cleaningStatus === s).length));
  const shown = rows.filter((x) => filter === "all" || x.room.cleaningStatus === filter);

  return (
    <ProtectedPage roles={["admin", "frontdesk"]} title="Rooms">
      <div className="mb-4">
        <Tabs
          value={filter}
          onChange={setFilter}
          counts={counts}
          tabs={[{ key: "all", label: "All rooms" }, ...ROOM_STATUSES.map((s) => ({ key: s, label: STATUS_LABELS[s] }))]}
        />
      </div>
      {loading ? (
        <Loading />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shown.map(({ room, guest, next, task }) => (
            <Card key={room.id} className="!p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-slate-800">{room.name}</p>
                  {room.type && <p className="text-xs text-slate-500">{room.type}</p>}
                </div>
                {room.cleaningStatus ? <Badge value={room.cleaningStatus} /> : <Badge value="pending" label="Not set" />}
              </div>
              <dl className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Guest</dt>
                  <dd className="text-right text-slate-800">
                    {guest ? <Link href={`/bookings/${guest.id}`} className="text-brand-700 hover:underline">{guest.guestName}</Link> : "Vacant"}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Next arrival</dt>
                  <dd className="text-right text-slate-800">
                    {next ? <Link href={`/bookings/${next.id}`} className="text-brand-700 hover:underline">{fmtDate(next.checkIn)}</Link> : "-"}
                  </dd>
                </div>
                {task && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Task</dt>
                    <dd><Badge value={task.status} label={`${task.type.replace(/-/g, " ")}, ${STATUS_LABELS[task.status]}`} /></dd>
                  </div>
                )}
              </dl>
            </Card>
          ))}
          {shown.length === 0 && <p className="text-sm text-slate-500">No rooms in this view.</p>}
        </div>
      )}
      <p className="mt-6 text-sm text-slate-500">Cleaning status is updated in the Housekeeping app and appears here live.</p>
    </ProtectedPage>
  );
}
