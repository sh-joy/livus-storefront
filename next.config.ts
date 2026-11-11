import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Let phones/tablets on the local network load the dev server (e.g. http://192.168.x.x:3000)
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.16.*.*", "*.local"],
  images: {
    formats: ["image/avif", "image/webp"],
    // Phone-first breakpoints (360–430px CSS wide phones at 2–3x DPR), up to large desktops.
    deviceSizes: [360, 414, 640, 750, 828, 1080, 1200, 1600, 1920, 2560],
    imageSizes: [64, 96, 128, 180, 256, 320],
    qualities: [75],
    // 31 days: product photo URLs are unique per upload, so long caching is safe.
    minimumCacheTTL: 2678400,
    // Keep in sync with src/components/storefront/SmartImage.tsx
    remotePatterns: [
      { protocol: "https", hostname: "cdn.gentlepark.com", port: "", pathname: "/**", search: "" },
      {
        protocol: "https",
        hostname: "**.public.blob.vercel-storage.com",
        port: "",
        pathname: "/**",
        search: "",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
