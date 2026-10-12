"use client";

import { useBrand } from "./BrandProvider";
import { DEFAULT_BRAND } from "@/lib/brand";

export default function BrandMark({ compact = false, onDark = false, collapsed = false }) {
  const { brand } = useBrand();
  const name = brand.brandName || DEFAULT_BRAND.brandName;
  const tagline = brand.tagline || DEFAULT_BRAND.tagline;
  const logo = brand.logoUrl || DEFAULT_BRAND.logoUrl;
  const titleCls = onDark ? "text-white" : "text-[color:var(--hub-text)]";
  const tagCls = onDark ? "text-white/70" : "text-[color:var(--hub-muted)]";

  return (
    <div className={"flex min-w-0 items-center " + (compact ? "gap-2.5" : "gap-3")}>
      <img
        src={logo}
        alt=""
        className={
          "shrink-0 rounded-full bg-white object-contain " +
          (collapsed ? "h-10 w-10 p-0.5" : compact ? "h-11 w-11 p-0.5" : "h-12 w-12 p-0.5")
        }
      />
      {!collapsed && (
        <span className="min-w-0 leading-tight">
          <span className={"block truncate font-semibold uppercase tracking-wide " + titleCls + (compact ? " text-sm" : " text-base")}>
            {name.replace(/ farm resort/i, "") || "Hiraya"}
          </span>
          <span className={"block truncate " + tagCls + (compact ? " text-[11px]" : " text-xs")}>{tagline}</span>
        </span>
      )}
    </div>
  );
}
