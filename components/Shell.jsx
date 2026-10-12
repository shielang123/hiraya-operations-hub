"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import { useBrand } from "./BrandProvider";
import BrandMark from "./BrandMark";
import { NAV_ITEMS, ROLE_LABELS, canAccess } from "@/lib/roles";

function isActive(pathname, href) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function Icon({ name }) {
  const p = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (name) {
    case "home":
      return <svg {...p}><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" /></svg>;
    case "calendar":
      return <svg {...p}><rect x="4" y="5" width="16" height="16" rx="2" /><path d="M8 3v4M16 3v4M4 11h16" /></svg>;
    case "book":
      return <svg {...p}><path d="M5 5a3 3 0 0 1 3-2h11v16H8a3 3 0 0 0-3 3z" /><path d="M8 3a3 3 0 0 0-3 3v14" /></svg>;
    case "bed":
      return <svg {...p}><path d="M3 18v-5a3 3 0 0 1 3-3h13v8" /><path d="M3 18h18M7 10V8a2 2 0 0 1 2-2h3" /></svg>;
    case "tag":
      return <svg {...p}><path d="M12 3 4 12l8 9 8-9-8-9z" /><circle cx="12" cy="12" r="1.5" /></svg>;
    case "cup":
      return <svg {...p}><path d="M5 7h11v7a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z" /><path d="M16 8h2.5a2.5 2.5 0 0 1 0 5H16" /></svg>;
    case "chart":
      return <svg {...p}><path d="M4 19V9M10 19V5M16 19v-7M22 19H2" /></svg>;
    case "gear":
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3v2M12 19v2M5 12H3M21 12h-2M6.2 6.2l1.4 1.4M16.4 16.4l1.4 1.4M17.8 6.2l-1.4 1.4M7.6 16.4l-1.4 1.4" />
        </svg>
      );
    default:
      return <svg {...p}><circle cx="12" cy="12" r="8" /></svg>;
  }
}

const ICONS = {
  "/": "home",
  "/arrivals": "calendar",
  "/bookings": "book",
  "/rooms": "bed",
  "/charges": "tag",
  "/bar-sales": "cup",
  "/owner": "chart",
  "/settings": "gear",
};

function NavLink({ href, label, active, onClick, collapsed, icon }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition " +
        (collapsed ? "justify-center " : "") +
        (active ? "bg-white/15 font-medium text-white" : "text-white/80 hover:bg-white/10 hover:text-white")
      }
    >
      <span className="shrink-0 opacity-90">
        <Icon name={icon} />
      </span>
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

function SidebarNav({ onNavigate, collapsed, onToggle }) {
  const { profile, role, logout } = useAuth();
  const { brand, dark, setDark } = useBrand();
  const pathname = usePathname();
  const mainItems = NAV_ITEMS.filter((i) => i.section === "main" && canAccess(role, i.roles));
  const settingsItems = NAV_ITEMS.filter((i) => i.section === "settings" && canAccess(role, i.roles));
  const settingsActive =
    pathname.startsWith("/settings") || settingsItems.some((i) => isActive(pathname, i.href));

  return (
    <div className="flex h-full flex-col text-white" style={{ background: "var(--hub-sidebar)" }}>
      <div className="relative border-b border-white/10 px-3 py-4">
        <BrandMark compact onDark collapsed={collapsed} />
        <button
          type="button"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={onToggle}
          className="absolute -right-3 top-5 hidden h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-[var(--hub-sidebar)] text-white lg:flex"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d={collapsed ? "M9 6l6 6-6 6" : "M15 6l-6 6 6 6"} />
          </svg>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {mainItems.map((i) => (
            <NavLink
              key={i.href}
              href={i.href}
              label={i.label}
              icon={ICONS[i.href]}
              active={isActive(pathname, i.href)}
              onClick={onNavigate}
              collapsed={collapsed}
            />
          ))}
        </div>
      </nav>

      <div className="space-y-2 border-t border-white/10 px-3 py-3">
        {settingsItems.length > 0 && (
          <NavLink
            href="/settings"
            label="Settings"
            icon="gear"
            active={settingsActive}
            onClick={onNavigate}
            collapsed={collapsed}
          />
        )}
        {!collapsed && (
          <p className="px-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-white/45">Signed in as</p>
        )}
        <p className={"truncate px-1 text-sm font-medium text-white " + (collapsed ? "text-center text-xs" : "")}>
          {collapsed ? (profile?.name || "Staff").slice(0, 1) : profile?.name || "Staff"}
        </p>
        {!collapsed && <p className="px-1 text-xs text-white/60">{ROLE_LABELS[role] || role}</p>}
        <button
          type="button"
          onClick={() => setDark(!dark)}
          className={
            "flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/15 " +
            (collapsed ? "" : "")
          }
          title="Dark mode"
        >
          {collapsed ? "◑" : dark ? "Light mode" : "Dark mode"}
        </button>
        <button
          type="button"
          onClick={logout}
          className="w-full rounded-xl bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          {collapsed ? "⎋" : "Logout"}
        </button>
        {!collapsed && (
          <p className="px-1 pb-1 text-center text-[10px] text-white/40">{brand.appName}</p>
        )}
      </div>
    </div>
  );
}

export default function Shell({ children }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const onDashboard = pathname === "/";
  const sideW = collapsed ? "lg:pl-20" : "lg:pl-72";
  const asideW = collapsed ? "lg:w-20" : "lg:w-72";

  useEffect(() => {
    setCollapsed(window.localStorage.getItem("hub-sidebar-collapsed") === "1");
  }, []);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    window.localStorage.setItem("hub-sidebar-collapsed", next ? "1" : "0");
  }

  return (
    <div className={"min-h-screen " + sideW} style={{ background: "var(--hub-page)" }}>
      <aside className={"no-print fixed inset-y-0 left-0 z-40 hidden lg:flex lg:flex-col " + asideW}>
        <SidebarNav collapsed={collapsed} onToggle={toggleCollapsed} />
      </aside>

      {open && (
        <div className="no-print fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-slate-900/40" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-72 shadow-xl">
            <SidebarNav onNavigate={() => setOpen(false)} collapsed={false} onToggle={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <header
        className="no-print sticky top-0 z-30 flex items-center gap-3 px-4 py-3 lg:hidden"
        style={{ background: "var(--hub-sidebar)" }}
      >
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setOpen(true)}
          className="rounded-md border border-white/20 p-2 text-white"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
        <BrandMark compact onDark />
        {!onDashboard && (
          <Link
            href="/"
            aria-label="Back to dashboard"
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white"
          >
            <XIcon />
          </Link>
        )}
      </header>

      {!onDashboard && (
        <Link
          href="/"
          aria-label="Back to dashboard"
          className="no-print fixed right-5 top-5 z-40 hidden h-10 w-10 items-center justify-center rounded-full border bg-[var(--hub-card)] text-[color:var(--hub-text)] shadow-sm hover:bg-red-50 hover:text-red-700 lg:flex"
          style={{ borderColor: "var(--hub-border)" }}
        >
          <XIcon />
        </Link>
      )}

      <main className="mx-auto max-w-7xl px-4 py-8 lg:pr-16">{children}</main>
    </div>
  );
}

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
