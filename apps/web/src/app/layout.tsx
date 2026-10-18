import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

const siteUrl = "https://ogify.online";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Ogify — Open Graph image & website screenshot API", template: "%s | Ogify" },
  description: "Generate Open Graph images, website screenshots, and branded screenshot composites through a developer-friendly API.",
  applicationName: "Ogify",
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Ogify",
    title: "Ogify — Open Graph image & website screenshot API",
    description: "Turn content and public URLs into share-ready PNGs with one API.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Ogify social image rendering API" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ogify — Open Graph image & website screenshot API",
    description: "Turn content and public URLs into share-ready PNGs with one API.",
    images: ["/og-image.png"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Ogify",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    url: siteUrl,
    description: "API for Open Graph images, website screenshots, and branded screenshot composites.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD", description: "Free plan includes 100 renders per month." },
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
