import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/Providers";
import {
  SITE_AUTHOR,
  SITE_AUTHOR_EMAIL,
  SITE_AUTHOR_URL,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_OG_IMAGE_ALT,
  SITE_OG_IMAGE_PATH,
  SITE_TITLE,
  SITE_URL,
} from "@/lib/site";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [...SITE_KEYWORDS],
  authors: [
    {
      name: SITE_AUTHOR,
      url: SITE_AUTHOR_URL,
    },
  ],
  creator: SITE_AUTHOR,
  publisher: SITE_AUTHOR,
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: SITE_URL,
  },
  category: "technology",
  icons: {
    icon: "/favicon.ico",
    apple: "/logo.svg",
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "en_US",
    type: "website",
    images: [
      {
        url: SITE_OG_IMAGE_PATH,
        width: 1200,
        height: 630,
        alt: SITE_OG_IMAGE_ALT,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    creator: "@arnob78",
    images: [SITE_OG_IMAGE_PATH],
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    "contact:email": SITE_AUTHOR_EMAIL,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      author: {
        "@type": "Person",
        name: SITE_AUTHOR,
        url: SITE_AUTHOR_URL,
        email: SITE_AUTHOR_EMAIL,
      },
    },
    {
      "@type": "SoftwareApplication",
      name: SITE_NAME,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Web",
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      author: {
        "@type": "Person",
        name: SITE_AUTHOR,
        url: SITE_AUTHOR_URL,
        email: SITE_AUTHOR_EMAIL,
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // data-scroll-behavior: App Router Day-1 guardrail (smooth scroll without JS delay).
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body
        className={cn(inter.className, "min-h-screen antialiased")}
        suppressHydrationWarning
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Providers>
          {/* min-h-screen allows landing to scroll; chat route uses its own h-screen layout */}
          <main className="min-h-screen dark text-foreground bg-background">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
