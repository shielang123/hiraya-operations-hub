"use client";

import Link from "next/link";
import { STATUS_LABELS } from "@/lib/config";

// Shared look: white cards with slate borders on a slate-50 page, brand green for actions.
// These are the same classes Phase 1 used, gathered so every module looks identical.
export const inputCls =
  "w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-brand-500 disabled:opacity-60";


const BADGE = {
  "checked-in": "bg-emerald-100 text-emerald-800",
  approved: "bg-sky-100 text-sky-800",
  confirmed: "bg-sky-100 text-sky-800",
  paid: "bg-sky-100 text-sky-800",
  pending: "bg-amber-100 text-amber-800",
  "checked-out": "bg-slate-100 text-slate-700",
  declined: "bg-red-100 text-red-700",
  cancelled: "bg-red-100 text-red-700",
  clean: "bg-emerald-100 text-emerald-800",
  inspected: "bg-emerald-100 text-emerald-800",
  dirty: "bg-red-100 text-red-700",
  cleaning: "bg-amber-100 text-amber-800",
  new: "bg-sky-100 text-sky-800",
  preparing: "bg-amber-100 text-amber-800",
  served: "bg-emerald-100 text-emerald-800",
  voided: "bg-red-100 text-red-700",
  open: "bg-sky-100 text-sky-800",
  "in-progress": "bg-amber-100 text-amber-800",
  done: "bg-emerald-100 text-emerald-800",
  hub: "bg-brand-100 text-brand-700",
  bar: "bg-sky-100 text-sky-800",
  housekeeping: "bg-amber-100 text-amber-800",
  booking: "bg-violet-100 text-violet-800",
};

export function Badge({ value, label, className = "" }) {
  return (
    <span
      className={
        "inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium " +
        (BADGE[value] || "bg-slate-100 text-slate-700") +
        " " +
        className
      }
    >
      {label || STATUS_LABELS[value] || value}
    </span>
  );
}

export function Card({ children, className = "" }) {
  return (
    <div
      className={"rounded-xl border p-5 " + className}
      style={{ background: "var(--hub-card)", borderColor: "var(--hub-border)" }}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ children, right }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-lg font-semibold text-slate-800">{children}</h2>
      {right}
    </div>
  );
}

export function StatCard({ label, value, href, hint, tone }) {
  const body = (
    <>
      <p className="text-sm text-slate-500">{label}</p>
      <p className={"mt-1 text-3xl font-semibold " + (tone === "warn" ? "text-amber-700" : "text-slate-800")}>{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </>
  );
  const cls = "rounded-xl border border-slate-200 bg-white p-5 ";
  return href ? (
    <Link href={href} className={cls + "hover:border-brand-500"}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

const BTN = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-60",
  outline: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-60",
  danger: "border border-red-200 bg-white text-red-700 hover:bg-red-50 disabled:opacity-60",
};

export function Btn({ variant = "primary", className = "", ...props }) {
  return <button className={"rounded-md px-3 py-1.5 text-sm font-medium " + BTN[variant] + " " + className} {...props} />;
}

export function Tabs({ tabs, value, onChange, counts = {} }) {
  return (
    <div className="flex flex-wrap gap-1">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={
            "rounded-md px-3 py-1.5 text-sm " +
            (value === t.key ? "bg-brand-600 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100")
          }
        >
          {t.label}
          {counts[t.key] !== undefined && <span className="ml-2 text-xs opacity-80">{counts[t.key]}</span>}
        </button>
      ))}
    </div>
  );
}

export function ErrorNote({ children }) {
  if (!children) return null;
  return <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{children}</p>;
}

export function OkNote({ children }) {
  if (!children) return null;
  return <p className="mb-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{children}</p>;
}

export function Empty({ children = "Nothing here." }) {
  return <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">{children}</p>;
}

export function Loading({ children = "Loading..." }) {
  return <p className="text-slate-500">{children}</p>;
}

export function Table({ head, children, empty }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            {head.map((h, i) => (
              <th key={i} className={"px-4 py-2 font-medium " + (h.right ? "text-right" : "")}>
                {h.label ?? h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {children}
          {empty && (
            <tr>
              <td colSpan={head.length} className="px-4 py-6 text-center text-slate-500">
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700" aria-label="Close">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <label className="block text-sm">
      <span className="text-slate-700">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
