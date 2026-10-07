import type { NextConfig } from "next";

/**
 * 대표 도메인(canonical host)은 NEXT_PUBLIC_SITE_URL 하나로 정한다.
 * - 대표가 apex(예: hwangjin.kr)면 www.hwangjin.kr → hwangjin.kr 로 301
 * - 대표가 www 면 그 반대로 301
 * Vercel 도메인 설정에서도 같은 방향으로 리다이렉트를 걸어두면 이중으로 안전하다.
 */
function canonicalHostRedirects() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  if (!raw) return [];
  let host: string;
  try {
    host = new URL(raw).host;
  } catch {
    return [];
  }
  if (host.startsWith("localhost") || host.endsWith(".vercel.app")) return [];
  const alt = host.startsWith("www.") ? host.slice(4) : `www.${host}`;
  return [
    {
      source: "/:path*",
      has: [{ type: "host" as const, value: alt }],
      destination: `https://${host}/:path*`,
      permanent: true,
    },
  ];
}

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // OG 이미지 라우트가 런타임에 읽는 폰트를 배포 번들에 포함시킨다.
  outputFileTracingIncludes: {
    "/og-image": ["./src/assets/fonts/**"],
    "/opengraph-image": ["./src/assets/fonts/**"],
    "/twitter-image": ["./src/assets/fonts/**"],
    "/check/opengraph-image": ["./src/assets/fonts/**"],
    "/check/twitter-image": ["./src/assets/fonts/**"],
  },
  async redirects() {
    return canonicalHostRedirects();
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/fonts/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
