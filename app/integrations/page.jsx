"use client";

import { useMemo, useState } from "react";
import ProtectedPage from "@/components/ProtectedPage";
import { useAuth } from "@/components/AuthProvider";
import { useData } from "@/components/DataProvider";
import { Badge, Btn, Card, ErrorNote, Loading, OkNote, SectionTitle, Table } from "@/components/ui";
import { APPS } from "@/lib/apps";
import { BOOKING_AMOUNT_UNIT, HANDOFF_MODE } from "@/lib/config";
import { CONTRACT } from "@/lib/contract";
import { fmtDateTime } from "@/lib/dates";
import { runHealthChecks } from "@/lib/health";
import { backfillCleaningStatus } from "@/lib/frontdesk";

const APP_KEYS = { booking: "Room Booking", hub: "Operations Hub", bar: "Bar Counter", housekeeping: "Housekeeping" };

export default function IntegrationsPage() {
  const { user, profile } = useAuth();
  const { bookings, rooms, roomList, charges, orders, tasks, activity, loading } = useData();
  const [open, setOpen] = useState("");
  const [msg, setMsg] = useState({ ok: "", err: "" });

  const checks = useMemo(() => runHealthChecks({ bookings, rooms, roomList, charges, orders, tasks }), [bookings, rooms, roomList, charges, orders, tasks]);
  const failing = checks.filter((c) => !c.ok);

  const systems = useMemo(() => {
    const dayAgo = Date.now() - 86400000;
    return Object.keys(APP_KEYS).map((key) => {
      const events = activity.filter((a) => a.app === key);
      return { key, last: events[0]?.createdAt, day: events.filter((e) => e.createdAt && e.createdAt.getTime() > dayAgo).length };
    });
  }, [activity]);

  async function backfill() {
    setMsg({ ok: "", err: "" });
    try {
      const ids = roomList.filter((r) => !r.cleaningStatus).map((r) => r.id);
      await backfillCleaningStatus({ roomIds: ids, staff: { id: user.uid, name: profile?.name } });
      setMsg({ ok: `${ids.length} rooms set to clean.`, err: "" });
    } catch {
      setMsg({ ok: "", err: "Could not update rooms. Check the Firestore rules." });
    }
  }

  return (
    <ProtectedPage roles={["admin"]} title="Integrations">
      {loading ? (
        <Loading />
      ) : (
        <>
          <SectionTitle>The four systems</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {APPS.map((a) => {
              const s = systems.find((x) => x.key === a.key);
              return (
                <Card key={a.key} className="!p-4">
                  <p className="font-semibold text-slate-800">{a.name}</p>
                  <p className="text-xs text-slate-500">{a.note}</p>
                  <p className="mt-3 text-sm text-slate-600">
                    {s?.last ? <>Last activity {fmtDateTime(s.last)}<br />{s.day} event{s.day === 1 ? "" : "s"} in 24h</> : "No activity logged yet"}
                  </p>
                  <p className="mt-2 text-sm">
                    {a.internal ? <span className="text-slate-500">You are here</span> : a.url ? <a href={a.url} className="text-brand-700 hover:underline">Open app</a> : <span className="text-slate-400">URL not set in .env.local</span>}
                  </p>
                </Card>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-slate-500">Apps that write to activityLog with their app name (booking, hub, bar, housekeeping) show their activity here.</p>

          <div className="mt-8">
            <SectionTitle>Data health</SectionTitle>
            <ErrorNote>{msg.err}</ErrorNote>
            <OkNote>{msg.ok}</OkNote>
            <p className="mb-3 text-sm text-slate-600">
              {failing.length === 0 ? "All checks pass. The four apps agree on IDs, statuses and money." : `${failing.length} of ${checks.length} checks need attention.`}
            </p>
            <div className="space-y-2">
              {checks.map((c) => (
                <Card key={c.id} className="!p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Badge value={c.ok ? "clean" : c.severity === "error" ? "dirty" : "pending"} label={c.ok ? "Pass" : c.severity === "error" ? "Fix" : "Review"} />
                      <span className="text-sm font-medium text-slate-800">{c.title}</span>
                      {!c.ok && <span className="text-xs text-slate-500">{c.items.length} record{c.items.length === 1 ? "" : "s"}</span>}
                    </div>
                    <div className="flex gap-2">
                      {c.id === "room-clean-status" && !c.ok && <Btn onClick={backfill}>Set all to clean</Btn>}
                      {!c.ok && <Btn variant="outline" onClick={() => setOpen(open === c.id ? "" : c.id)}>{open === c.id ? "Hide" : "Details"}</Btn>}
                    </div>
                  </div>
                  {open === c.id && (
                    <div className="mt-3 border-t border-slate-100 pt-3">
                      <p className="mb-2 text-sm text-slate-600">{c.hint}</p>
                      <ul className="max-h-48 space-y-1 overflow-y-auto text-xs text-slate-600">
                        {c.items.slice(0, 50).map((i) => (
                          <li key={i.id}><code className="rounded bg-slate-100 px-1">{i.id}</code> {i.note}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <SectionTitle>Data contract</SectionTitle>
            <Table head={["Collection", "Owner", "Hub does", "Key fields"]}>
              {CONTRACT.map((r) => (
                <tr key={r.collection} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-medium text-slate-800">{r.collection}</td>
                  <td className="px-4 py-2 text-slate-600">{r.owner}</td>
                  <td className="px-4 py-2 text-slate-600">{r.hub}</td>
                  <td className="px-4 py-2 text-xs text-slate-500">{r.fields}</td>
                </tr>
              ))}
            </Table>
          </div>

          <div className="mt-8">
            <SectionTitle>Settings in use</SectionTitle>
            <Card>
              <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                <dt className="text-slate-500">Firebase project</dt><dd className="text-slate-800">{process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}</dd>
                <dt className="text-slate-500">Check-out hand-off (NEXT_PUBLIC_HANDOFF_MODE)</dt><dd className="text-slate-800">{HANDOFF_MODE === "function" ? "Cloud Function" : "Hub does it"}</dd>
                <dt className="text-slate-500">Booking amounts (NEXT_PUBLIC_BOOKING_AMOUNT_UNIT)</dt><dd className="text-slate-800">{BOOKING_AMOUNT_UNIT === "centavo" ? "Centavos" : "Whole pesos"}</dd>
              </dl>
            </Card>
          </div>
        </>
      )}
    </ProtectedPage>
  );
}
