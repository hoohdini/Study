import type { NextConfig } from "next";

const csp = [
  "default-src 'self'",
  "img-src 'self' data: blob:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self'",
  "connect-src 'self'",
  "font-src 'self' data:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  // Admin login uses a plain HTML form POST. During local/docker setups it's easy to end up on
  // `http://localhost:3000` while posting to `https://localhost` behind nginx, which violates a
  // strict `form-action 'self'`. Keep this permissive enough for same-host dev, without opening random domains.
  "form-action 'self' http://localhost:3000 https://localhost",
].join("; ");

const securityHeadersBase = [
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
] as const;

const nextConfig: NextConfig = {
  poweredByHeader: false,
  typedRoutes: true,
  async headers() {
    // `next dev` + Turbopack은 인라인 스크립트·전용 청크를 쓰므로 `script-src 'self'`만으로는
    // 브라우저가 CSP 위반으로 막습니다. 운영(`next start` / Docker)에서만 엄격한 CSP·HSTS를 붙입니다.
    if (process.env.NODE_ENV !== "production") {
      return [{ source: "/(.*)", headers: [...securityHeadersBase] }];
    }

    return [
      {
        source: "/(.*)",
        headers: [
          ...securityHeadersBase,
          { key: "Content-Security-Policy", value: csp },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
