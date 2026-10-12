export const ROLES = ["admin", "frontdesk", "bar", "housekeeping"];

export const ROLE_LABELS = {
  admin: "Admin",
  frontdesk: "Front desk",
  bar: "Bar counter",
  housekeeping: "Housekeeping",
};

// Roles that may use the Hub. Bar and housekeeping staff use their own apps.
export const HUB_ROLES = ["admin", "frontdesk"];

// Pages in the Hub and which roles may open them.
// section: "main" stays in the left sidebar; "settings" lives under Settings.
export const NAV_ITEMS = [
  { href: "/", label: "Dashboard", roles: ["admin", "frontdesk"], section: "main" },
  { href: "/arrivals", label: "Arrivals & departures", roles: ["admin", "frontdesk"], section: "main" },
  { href: "/bookings", label: "Bookings", roles: ["admin", "frontdesk"], section: "main" },
  { href: "/rooms", label: "Rooms", roles: ["admin", "frontdesk"], section: "main" },
  { href: "/charges", label: "Charges", roles: ["admin", "frontdesk"], section: "main" },
  { href: "/bar-sales", label: "Bar sales", roles: ["admin", "frontdesk"], section: "main" },
  { href: "/owner", label: "Owner view", roles: ["admin"], section: "main" },
  { href: "/settings/brand", label: "Brand settings", note: "Logo, colors, and resort content", roles: ["admin"], section: "settings" },
  { href: "/activity", label: "Activity", note: "Cross-app event log", roles: ["admin", "frontdesk"], section: "settings" },
  { href: "/integrations", label: "Integrations", note: "Health checks and connected systems", roles: ["admin"], section: "settings" },
  { href: "/staff", label: "Staff", note: "Logins and roles", roles: ["admin"], section: "settings" },
];

export function canAccess(role, allowedRoles) {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  return allowedRoles.includes(role);
}
