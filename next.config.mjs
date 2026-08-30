/** @type {import('next').NextConfig} */
// Production guardrails: security headers + immutable hashed Next static assets.
// Mirrors vercel.json so bots cannot freely re-download /_next/static forever.
import { withSentryConfig } from "@sentry/nextjs";

function buildContentSecurityPolicy() {
  const isDev = process.env.NODE_ENV !== "production";
  const scriptSrc = isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline'";
  const connectSrc = isDev ? "connect-src 'self' ws: wss:" : "connect-src 'self'";

  return [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    connectSrc,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: buildContentSecurityPolicy(),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep wasm-heavy tokenizers external so Turbopack does not drop tiktoken_bg.wasm.
  serverExternalPackages: [
    "@upstash/rag-chat",
    "tiktoken",
    "js-tiktoken",
    "@langchain/core",
    "@langchain/community",
    "@langchain/classic",
    "langchain",
    "llamaindex",
    "langfuse",
    "langfuse-core",
  ],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // Content-hashed bundles — long-lived immutable cache (Day-1 Vercel guardrail).
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN?.trim();
const sentryOrg = process.env.SENTRY_ORG?.trim();
const sentryProject = process.env.SENTRY_PROJECT?.trim();
const canUploadSourceMaps = Boolean(sentryAuthToken && sentryOrg && sentryProject);

export default withSentryConfig(nextConfig, {
  org: sentryOrg,
  project: sentryProject,
  authToken: canUploadSourceMaps ? sentryAuthToken : undefined,
  tunnelRoute: "/api/monitoring",
  silent: true,
  telemetry: false,
  widenClientFileUpload: true,
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
    disable: !canUploadSourceMaps,
  },
  bundleSizeOptimizations: {
    excludeDebugStatements: true,
  },
});
