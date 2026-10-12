/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // For the unified portal (Next.js multi-zones) set NEXT_PUBLIC_BASE_PATH=/hub.
  // Standalone, leave it empty.
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  // Keep the staff app out of search engines
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

module.exports = nextConfig;
