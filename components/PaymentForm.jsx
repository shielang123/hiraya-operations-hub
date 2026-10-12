"use client";

import { useState } from "react";
import { Btn, ErrorNote, inputCls } from "./ui";
import { useAuth } from "./AuthProvider";
import { recordPayment } from "@/lib/frontdesk";
import { toCentavos } from "@/lib/money";
import { PAYMENT_METHODS } from "@/lib/config";

export default function PaymentForm({ booking, balance }) {
  const { user, profile } = useAuth();
  const [amount, setAmount] = useState(balance > 0 ? (balance / 100).toFixed(2) : "");
  const [method, setMethod] = useState("cash");
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    const cents = toCentavos(amount);
    if (cents <= 0) return setError("Enter an amount above zero.");
    setBusy(true);
    setError("");
    try {
      await recordPayment({ booking, amount: cents, method, reference: reference.trim(), staff: { id: user.uid, name: profile?.name } });
      setAmount("");
      setReference("");
    } catch {
      setError("Could not save the payment. Check the Firestore rules.");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="grid gap-2 sm:grid-cols-5">
      <input className={inputCls + " sm:col-span-1"} type="number" step="0.01" min="0" placeholder="Amount ₱" value={amount} onChange={(e) => setAmount(e.target.value)} />
      <select className={inputCls} value={method} onChange={(e) => setMethod(e.target.value)}>
        {PAYMENT_METHODS.map((m) => (
          <option key={m} value={m}>
            {m === "gcash" ? "GCash" : m[0].toUpperCase() + m.slice(1)}
          </option>
        ))}
      </select>
      <input className={inputCls + " sm:col-span-2"} placeholder="Reference (optional)" value={reference} onChange={(e) => setReference(e.target.value)} />
      <Btn type="submit" disabled={busy}>
        {busy ? "Saving..." : "Record payment"}
      </Btn>
      {error && (
        <div className="sm:col-span-5">
          <ErrorNote>{error}</ErrorNote>
        </div>
      )}
    </form>
  );
}
