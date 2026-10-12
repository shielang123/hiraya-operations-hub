// Registry of the four systems. Set the URLs in .env.local; apps without a URL are hidden.
// With the unified portal (Next.js multi-zones) the URLs are simply /hub, /bar, /housekeeping.
export const APPS = [
  { key: "booking", name: "Room Booking", note: "Guest bookings, approvals, PayMongo", url: process.env.NEXT_PUBLIC_BOOKING_URL || "", roles: ["admin"] },
  { key: "hub", name: "Operations Hub", note: "Front desk, bills, owner view", url: "/", roles: ["admin", "frontdesk"], internal: true },
  { key: "bar", name: "Bar Counter", note: "Menu, orders, charge to room", url: process.env.NEXT_PUBLIC_BAR_URL || "", roles: ["admin", "bar"] },
  { key: "housekeeping", name: "Housekeeping", note: "Cleaning tasks and inspection", url: process.env.NEXT_PUBLIC_HOUSEKEEPING_URL || "", roles: ["admin", "housekeeping"] },
];

export function appsForRole(role) {
  return APPS.filter((a) => a.roles.includes(role) && a.url);
}
