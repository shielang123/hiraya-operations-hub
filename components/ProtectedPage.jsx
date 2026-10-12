"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { useData } from "./DataProvider";
import { canAccess } from "@/lib/roles";
import { appsForRole } from "@/lib/apps";
import Shell from "./Shell";
import { ErrorNote } from "./ui";

// Wrap every staff page in this. It sends signed-out visitors to /login, shows an access message
// (with links to the person's own app) when the role is not allowed, and surfaces any collection
// the Firestore rules refused to read.
export default function ProtectedPage({ roles, title, actions, children }) {
  const { user, role, loading } = useAuth();
  const { errors } = useData();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center text-slate-500">Loading...</div>;
  }

  const allowed = canAccess(role, roles);
  const myApps = appsForRole(role).filter((a) => !a.internal);

  return (
    <Shell>
      {allowed ? (
        <>
          {(title || actions) && (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-2xl font-semibold text-slate-800">{title}</h1>
              <div className="no-print flex gap-2">{actions}</div>
            </div>
          )}
          {errors.length > 0 && (
            <ErrorNote>
              Could not read: {errors.map(([n]) => n).join(", ")}. If this mentions permissions, update the Firestore
              rules (see README).
            </ErrorNote>
          )}
          {children}
        </>
      ) : (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-800">
          <p>Your role does not have access to this page.</p>
          {myApps.length > 0 && (
            <p className="mt-3 text-sm">
              Your app:{" "}
              {myApps.map((a) => (
                <a key={a.key} href={a.url} className="mr-3 font-medium underline">
                  {a.name}
                </a>
              ))}
            </p>
          )}
        </div>
      )}
    </Shell>
  );
}
