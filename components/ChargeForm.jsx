"use client";

import { useState } from "react";
import { Btn, ErrorNote, inputCls } from "./ui";
import { useAuth } from "./AuthProvider";
import { addCharge } from "@/lib/frontdesk";
import { toCentavos } from "@/lib/money";
import { CHARGE_CATEGORIES } from "@/lib/config";

export default function ChargeForm({ booking }) {
  const { user, profile } = useAuth();
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("food");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    const cents = toCentavos(amount);
    if (cents <= 0) return setError("Enter an amount above zero.");
    setBusy(true);
    setError("");
    try {
      await addCharge({ booking, description: description.trim(), category, amount: cents, staff: { id: user.uid, name: profile?.name } });
      setDescription("");
      setAmount("");
    } catch {
      setError("Could not save the charge. Check the Firestore rules.");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="grid gap-2 sm:grid-cols-5">
      <input required className={inputCls + " sm:col-span-2"} placeholder="Description (e.g. Kayak rental)" value={description} onChange={(e) => setDescription(e.target.value)} />
      <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
        {CHARGE_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c[0].toUpperCase() + c.slice(1)}
          </option>
        ))}
      </select>
      <input required className={inputCls} type="number" step="0.01" min="0" placeholder="Amount ₱" value={amount} onChange={(e) => setAmount(e.target.value)} />
      <Btn type="submit" disabled={busy}>
        {busy ? "Saving..." : "Add charge"}
      </Btn>
      {error && (
        <div className="sm:col-span-5">
          <ErrorNote>{error}</ErrorNote>
        </div>
      )}
    </form>
  );
}
