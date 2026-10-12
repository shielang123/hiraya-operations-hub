"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import ProtectedPage from "@/components/ProtectedPage";
import { useAuth } from "@/components/AuthProvider";
import { useData } from "@/components/DataProvider";
import { Badge, Btn, ErrorNote, Loading, StatCard, Table, inputCls } from "@/components/ui";
import { CHARGE_CATEGORIES } from "@/lib/config";
import { fmtDateTime } from "@/lib/dates";
import { formatPHP } from "@/lib/money";
import { downloadCsv } from "@/lib/csv";
import { voidCharge } from "@/lib/frontdesk";

export default function ChargesPage() {
  const { user, profile, role } = useAuth();
  const { charges, bookings, loading } = useData();
  const [source, setSource] = useState("all");
  const [category, setCategory] = useState("all");
  const [showVoided, setShowVoided] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const byId = useMemo(() => Object.fromEntries(bookings.map((b) => [b.id, b])), [bookings]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return charges
      .filter((c) => showVoided || !c.voided)
      .filter((c) => source === "all" || c.source === source)
      .filter((c) => category === "all" || c.category === category)
      .filter((c) => !q || c.description.toLowerCase().includes(q) || String(byId[c.bookingId]?.guestName || "").toLowerCase().includes(q))
      .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  }, [charges, source, category, showVoided, search, byId]);

  const total = rows.filter((c) => !c.voided).reduce((s, c) => s + c.amount, 0);

  async function onVoid(c) {
    const reason = window.prompt("Reason for voiding this charge:");
    if (!reason || reason.trim().length < 3) return;
    setError("");
    try {
      await voidCharge({ charge: c, reason: reason.trim(), staff: { id: user.uid, name: profile?.name } });
    } catch {
      setError("Could not void the charge. Check the Firestore rules.");
    }
  }

  function exportCsv() {
    downloadCsv(
      "hiraya-charges.csv",
      rows.map((c) => ({
        chargeId: c.id,
        bookingId: c.bookingId,
        guest: byId[c.bookingId]?.guestName || "",
        source: c.source,
        category: c.category,
        description: c.description,
        amountPHP: (c.amount / 100).toFixed(2),
        voided: c.voided ? "yes" : "no",
        voidReason: c.voidReason,
        createdAt: c.createdAt ? c.createdAt.toISOString() : "",
      }))
    );
  }

  return (
    <ProtectedPage roles={["admin", "frontdesk"]} title="Charges" actions={<Btn variant="outline" onClick={exportCsv}>Export CSV</Btn>}>
      <ErrorNote>{error}</ErrorNote>
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <StatCard label="Shown charges" value={rows.length} />
        <StatCard label="Total (not voided)" value={formatPHP(total)} />
        <StatCard label="Bar room charges" value={formatPHP(rows.filter((c) => c.source === "bar" && !c.voided).reduce((s, c) => s + c.amount, 0))} />
      </div>
      <div className="mb-4 flex flex-wrap gap-3">
        <select className={inputCls + " sm:!w-40"} value={source} onChange={(e) => setSource(e.target.value)}>
          <option value="all">All sources</option>
          <option value="hub">Front desk</option>
          <option value="bar">Bar Counter</option>
        </select>
        <select className={inputCls + " sm:!w-40"} value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">All categories</option>
          {CHARGE_CATEGORIES.map((c) => <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>)}
        </select>
        <input className={inputCls + " sm:!w-64"} placeholder="Search guest or description" value={search} onChange={(e) => setSearch(e.target.value)} />
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={showVoided} onChange={(e) => setShowVoided(e.target.checked)} /> Show voided
        </label>
      </div>
      {loading ? (
        <Loading />
      ) : (
        <Table head={["When", "Guest", "Description", "Source", "Category", { label: "Amount", right: true }, ""]} empty={rows.length === 0 ? "No charges." : null}>
          {rows.slice(0, 300).map((c) => (
            <tr key={c.id} className={"border-t border-slate-100 " + (c.voided ? "text-slate-400" : "")}>
              <td className="whitespace-nowrap px-4 py-2">{fmtDateTime(c.createdAt)}</td>
              <td className="px-4 py-2">
                {byId[c.bookingId] ? <Link href={`/bookings/${c.bookingId}`} className="text-brand-700 hover:underline">{byId[c.bookingId].guestName}</Link> : <span className="text-red-600">Unknown booking</span>}
              </td>
              <td className={"px-4 py-2 " + (c.voided ? "line-through" : "text-slate-800")}>{c.description}</td>
              <td className="px-4 py-2"><Badge value={c.source} label={c.source === "bar" ? "Bar" : "Front desk"} /></td>
              <td className="px-4 py-2 capitalize">{c.category}</td>
              <td className="px-4 py-2 text-right">{formatPHP(c.amount)}</td>
              <td className="px-4 py-2 text-right">
                {c.voided ? <span className="text-xs">{c.voidReason}</span> : (c.source !== "bar" || role === "admin") && <Btn variant="danger" className="!px-2 !py-0.5 text-xs" onClick={() => onVoid(c)}>Void</Btn>}
              </td>
            </tr>
          ))}
        </Table>
      )}
    </ProtectedPage>
  );
}
