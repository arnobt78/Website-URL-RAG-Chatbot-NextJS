import type { Metadata } from "next";

/** Chat catch-all routes stay full-viewport; landing page scrolls independently. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return <div className="h-screen overflow-hidden">{children}</div>;
}
