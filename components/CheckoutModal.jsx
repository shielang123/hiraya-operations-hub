"use client";

import { useState } from "react";
import { Btn, ErrorNote, Modal, inputCls } from "./ui";
import BillTable from "./BillTable";
import PaymentForm from "./PaymentForm";
import { useAuth } from "./AuthProvider";
import { useData } from "./DataProvider";
import { checkOutBooking } from "@/lib/frontdesk";
import { formatPHP } from "@/lib/money";

// Check-out is blocked until the balance is settled. An admin can override with a written reason.
export default function CheckoutModal({ booking, onClose }) {
  const { user, profile, role } = useAuth();
  const { billFor } = useData();
  const bill = billFor(booking);
  const [override, setOverride] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const settled = bill.balance <= 0;
  const canOverride = role === "admin";
  const ready = settled || (override && reason.trim().length >= 3);

  async function confirm() {
    setBusy(true);
    setError("");
    try {
      await checkOutBooking({
        booking,
        balance: bill.balance,
        overrideReason: !settled && override ? reason.trim() : "",
        staff: { id: user.uid, name: profile?.name },
      });
      onClose();
    } catch {
      setError("Could not check out. Check the Firestore rules.");
      setBusy(false);
    }
  }

  return (
    <Modal title={`Check out ${booking.guestName}`} onClose={onClose}>
      <BillTable booking={booking} bill={bill} showVoided={false} />
      {!settled && (
        <div className="mt-5 space-y-3 border-t border-slate-200 pt-4">
          <p className="text-sm text-amber-700">Balance of {formatPHP(bill.balance)} must be settled before check-out.</p>
          <PaymentForm key={bill.hubPaid} booking={booking} balance={bill.balance} />
          {canOverride && (
            <div className="rounded-md bg-slate-50 p-3">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={override} onChange={(e) => setOverride(e.target.checked)} />
                Admin override: check out with an unpaid balance
              </label>
              {override && (
                <input className={inputCls + " mt-2"} placeholder="Reason (required)" value={reason} onChange={(e) => setReason(e.target.value)} />
              )}
            </div>
          )}
        </div>
      )}
      <ErrorNote>{error}</ErrorNote>
      <div className="mt-5 flex justify-end gap-2">
        <Btn variant="outline" onClick={onClose}>
          Cancel
        </Btn>
        <Btn onClick={confirm} disabled={!ready || busy}>
          {busy ? "Checking out..." : "Confirm check-out"}
        </Btn>
      </div>
    </Modal>
  );
}
