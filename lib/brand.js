const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const BRAND_DOC = { collection: "settings", id: "hub" };

export const DEFAULT_BRAND = {
  appName: "Hiraya Operation Hub",
  brandName: "Hiraya Farm Resort",
  tagline: "Located in the island of Mindoro",
  logoUrl: BASE + "/logo.png",
  heroUrl: BASE + "/hero.jpg",
  overlay: 55,
  sidebarColor: "#1a4a32",
  accentColor: "#5a8c3e",
  pageColor: "#f4efe6",
  address: "",
  phone: "",
  email: "",
};

export function mergeBrand(data) {
  const next = { ...DEFAULT_BRAND, ...(data || {}) };
  if (!next.logoUrl) next.logoUrl = DEFAULT_BRAND.logoUrl;
  if (!next.heroUrl) next.heroUrl = DEFAULT_BRAND.heroUrl;
  next.overlay = Math.min(80, Math.max(0, Number(next.overlay) || 0));
  return next;
}

export function applyBrandVars(brand, dark) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const sidebar = brand.sidebarColor || DEFAULT_BRAND.sidebarColor;
  const accent = brand.accentColor || DEFAULT_BRAND.accentColor;
  const page = dark ? "#10241a" : brand.pageColor || DEFAULT_BRAND.pageColor;
  root.style.setProperty("--hub-sidebar", sidebar);
  root.style.setProperty("--hub-accent", accent);
  root.style.setProperty("--hub-page", page);
  root.style.setProperty("--hub-card", dark ? "#173226" : "#ffffff");
  root.style.setProperty("--hub-border", dark ? "#2a4d3c" : "#e4ddd0");
  root.style.setProperty("--hub-text", dark ? "#e8eee6" : "#1f2a24");
  root.style.setProperty("--hub-muted", dark ? "#a3b8aa" : "#6b7c70");
  root.classList.toggle("dark", !!dark);
}
