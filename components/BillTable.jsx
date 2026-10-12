"use client";

import { Badge, Btn } from "./ui";
import { formatPHP } from "@/lib/money";
import { fmtDateTime } from "@/lib/dates";

// The guest bill: room, extras (from Hub and Bar Counter), payments, balance.
export default function BillTable({ booking, bill, onVoid, canVoid, showVoided = true }) {
  const lines = bill.charges.filter((c) => showVoided || !c.voided);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <tbody>
          <tr className="border-b border-slate-100">
            <td className="py-2 text-slate-800">
              Room{booking.roomLabel && booking.roomLabel !== "-" ? ` (${booking.roomLabel})` : ""}
              {booking.nights ? `, ${booking.nights} night${booking.nights > 1 ? "s" : ""}` : ""}
            </td>
            <td />
            <td className="py-2 text-right text-slate-800">{formatPHP(bill.room)}</td>
            <td />
          </tr>
          {lines.map((c) => (
            <tr key={c.id} className={"border-b border-slate-100 " + (c.voided ? "text-slate-400" : "text-slate-800")}>
              <td className="py-2">
                <span className={c.voided ? "line-through" : ""}>{c.description}</span>
                <span className="ml-2 text-xs text-slate-500">{fmtDateTime(c.createdAt)}</span>
                {c.voided && c.voidReason && <span className="ml-2 text-xs">({c.voidReason})</span>}
              </td>
              <td className="py-2">
                <Badge value={c.source} label={c.source === "bar" ? "Bar" : c.source === "hub" ? "Front desk" : c.source} />
              </td>
              <td className={"py-2 text-right " + (c.voided ? "line-through" : "")}>{formatPHP(c.amount)}</td>
              <td className="py-2 pl-2 text-right">
                {!c.voided && onVoid && (canVoid ? canVoid(c) : true) && (
                  <Btn variant="danger" className="!px-2 !py-0.5 text-xs" onClick={() => onVoid(c)}>
                    Void
                  </Btn>
                )}
              </td>
            </tr>
          ))}
          <tr>
            <td className="pt-3 font-medium text-slate-800">Total</td>
            <td />
            <td className="pt-3 text-right font-medium text-slate-800">{formatPHP(bill.total)}</td>
            <td />
          </tr>
          {bill.onlinePaid > 0 && (
            <tr className="text-slate-600">
              <td className="py-1">Paid online (booking site)</td>
              <td />
              <td className="py-1 text-right">-{formatPHP(bill.onlinePaid)}</td>
              <td />
            </tr>
          )}
          {bill.payments.map((p) => (
            <tr key={p.id} className="text-slate-600">
              <td className="py-1">
                Payment, {p.method}
                {p.reference ? ` (${p.reference})` : ""}
                <span className="ml-2 text-xs text-slate-500">{fmtDateTime(p.createdAt)}</span>
              </td>
              <td />
              <td className="py-1 text-right">-{formatPHP(p.amount)}</td>
              <td />
            </tr>
          ))}
          <tr className="border-t border-slate-300">
            <td className="pt-3 text-base font-semibold text-slate-800">Balance due</td>
            <td />
            <td className={"pt-3 text-right text-base font-semibold " + (bill.balance > 0 ? "text-amber-700" : "text-emerald-700")}>
              {formatPHP(bill.balance)}
            </td>
            <td />
          </tr>
        </tbody>
      </table>
    </div>
  );
}
