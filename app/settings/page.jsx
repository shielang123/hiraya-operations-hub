"use client";

import Link from "next/link";
import ProtectedPage from "@/components/ProtectedPage";
import { Card } from "@/components/ui";
import { useAuth } from "@/components/AuthProvider";
import { NAV_ITEMS, canAccess } from "@/lib/roles";
import { appsForRole } from "@/lib/apps";

export default function SettingsPage() {
  const { role } = useAuth();
  const items = NAV_ITEMS.filter((i) => i.section === "settings" && canAccess(role, i.roles));
  const apps = appsForRole(role).filter((a) => !a.internal);

  return (
    <ProtectedPage roles={["admin", "frontdesk"]} title="Settings">
      <p className="mb-6 text-sm text-slate-500">Admin tools and other connected apps. Daily operations stay in the sidebar.</p>

      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((i) => (
          <Link key={i.href} href={i.href} className="block">
            <Card className="h-full hover:border-brand-500">
              <p className="font-medium text-slate-800">{i.label}</p>
              <p className="mt-1 text-sm text-slate-500">{i.note}</p>
            </Card>
          </Link>
        ))}
      </div>

      {apps.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-semibold text-slate-800">Other apps</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {apps.map((a) => (
              <a key={a.key} href={a.url} className="block">
                <Card className="h-full hover:border-brand-500">
                  <p className="font-medium text-slate-800">{a.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{a.note}</p>
                </Card>
              </a>
            ))}
          </div>
        </div>
      )}
    </ProtectedPage>
  );
}
