import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  devIndicators: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/(icon.svg|favicon.ico|manifest.webmanifest|logo.jpg|hippocrates-og.png|hippocrates-android-device.jpg)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        source: "/HIPPOCRATES.apk",
        headers: [
          {
            key: "Content-Type",
            value: "application/vnd.android.package-archive",
          },
          {
            key: "Content-Disposition",
            value: 'attachment; filename="Hippocrates.apk"',
          },
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        // Enforce noindex headers on exact admin and settings routes
        source: "/:path(admin|settings)",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noarchive",
          },
        ],
      },
      {
        // Enforce noindex headers on subpaths of admin, settings, and all API endpoints
        source: "/:path(admin|settings|api)/:subpath*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noarchive",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/opengraph-image",
        destination: "/hippocrates-og.png",
        permanent: true,
      },
      {
        source: "/download",
        destination: "/get-started",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "hippocrates-beta.vercel.app" }],
        destination: "https://www.hippocrates.in/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
