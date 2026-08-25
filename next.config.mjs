/** @type {import('next').NextConfig} */
// Production guardrails: security headers + immutable hashed Next static assets.
// Mirrors vercel.json so bots cannot freely re-download /_next/static forever.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value:
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  },
];

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

export default nextConfig;
