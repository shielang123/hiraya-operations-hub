// Lets front desk staff install the Hub on a tablet (Add to Home Screen).
export default function manifest() {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
  return {
    name: "Hiraya Operation Hub",
    short_name: "Hiraya Hub",
    description: "Staff operations for Hiraya Farm Resort",
    start_url: base + "/",
    scope: base + "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#3c7230",
    icons: [
      { src: base + "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: base + "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
