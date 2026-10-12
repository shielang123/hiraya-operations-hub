"use client";

import { useEffect, useState } from "react";
import { initializeApp, getApps, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { collection, doc, onSnapshot, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import ProtectedPage from "@/components/ProtectedPage";
import { useAuth } from "@/components/AuthProvider";
import { db, firebaseConfig } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/config";
import { ROLES, ROLE_LABELS } from "@/lib/roles";

// Creates a login without signing the admin out: a second, temporary Firebase app is used
// only for the sign-up, then discarded.
async function createStaffLogin(email, password) {
  const name = "staff-signup-" + Date.now();
  const secondary = initializeApp(firebaseConfig, name);
  try {
    const cred = await createUserWithEmailAndPassword(getAuth(secondary), email, password);
    await signOut(getAuth(secondary));
    return cred.user.uid;
  } finally {
    await deleteApp(secondary);
  }
}

export default function StaffPage() {
  const { user } = useAuth();
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "frontdesk" });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, COLLECTIONS.staff),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => String(a.name).localeCompare(String(b.name)));
        setStaff(list);
      },
      () => {}
    );
    return unsub;
  }, []);

  async function addStaff(e) {
    e.preventDefault();
    setBusy(true);
    setMessage({ type: "", text: "" });
    try {
      const uid = await createStaffLogin(form.email.trim(), form.password);
      await setDoc(doc(db, COLLECTIONS.staff, uid), {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        active: true,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
      });
      setForm({ name: "", email: "", password: "", role: "frontdesk" });
      setMessage({ type: "ok", text: "Staff account created." });
    } catch (err) {
      const code = err?.code || "";
      let text = "Could not create the account.";
      if (code.includes("email-already-in-use")) {
        text = "That email already has a login. Add its staff document by hand in Firestore.";
      } else if (code.includes("weak-password")) {
        text = "Password must be at least 6 characters.";
      } else if (code.includes("permission-denied")) {
        text = "Firestore rules blocked this. Check the staff rules in the README.";
      }
      setMessage({ type: "error", text });
    }
    setBusy(false);
  }

  async function updateStaff(id, patch) {
    try {
      await updateDoc(doc(db, COLLECTIONS.staff, id), patch);
    } catch {
      setMessage({ type: "error", text: "Could not update. Check the Firestore rules." });
    }
  }

  return (
    <ProtectedPage roles={["admin"]} title="Staff">
      <form
        onSubmit={addStaff}
        className="mb-8 grid gap-3 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-5"
      >
        <input
          required
          placeholder="Full name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          required
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          required
          type="password"
          minLength={6}
          placeholder="Temporary password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {busy ? "Adding..." : "Add staff"}
        </button>
      </form>

      {message.text && (
        <p
          className={
            "mb-4 rounded-md px-3 py-2 text-sm " +
            (message.type === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")
          }
        >
          {message.text}
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Email</th>
              <th className="px-4 py-2 font-medium">Role</th>
              <th className="px-4 py-2 font-medium">Active</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => {
              const isMe = s.id === user?.uid;
              return (
                <tr key={s.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 text-slate-800">{s.name || "-"}</td>
                  <td className="px-4 py-2 text-slate-600">{s.email || "-"}</td>
                  <td className="px-4 py-2">
                    <select
                      value={s.role}
                      disabled={isMe}
                      onChange={(e) => updateStaff(s.id, { role: e.target.value })}
                      className="rounded-md border border-slate-300 px-2 py-1 disabled:bg-slate-100"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="checkbox"
                      checked={s.active !== false}
                      disabled={isMe}
                      onChange={(e) => updateStaff(s.id, { active: e.target.checked })}
                    />
                  </td>
                </tr>
              );
            })}
            {staff.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                  No staff yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </ProtectedPage>
  );
}
