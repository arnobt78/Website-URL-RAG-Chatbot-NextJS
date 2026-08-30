import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_OG_IMAGE_ALT } from "@/lib/site";

export const alt = SITE_OG_IMAGE_ALT

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "linear-gradient(135deg, #0a0a0f 0%, #0c1929 55%, #0a1628 100%)",
          color: "#f8fafc",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: "22px",
              color: "#7dd3fc",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            RAG Chatbot
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "64px",
              fontWeight: 700,
              lineHeight: 1.1,
              maxWidth: "900px",
              letterSpacing: "-0.02em",
            }}
          >
            {SITE_NAME}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "32px",
              color: "#94a3b8",
              maxWidth: "820px",
              lineHeight: 1.4,
            }}
          >
            Paste a URL · Ingest · Chat with grounded AI answers
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: "16px",
            fontSize: "22px",
            color: "#64748b",
          }}
        >
          <span>Next.js 16</span>
          <span>·</span>
          <span>Upstash Vector</span>
          <span>·</span>
          <span>Multi-Provider LLM</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
