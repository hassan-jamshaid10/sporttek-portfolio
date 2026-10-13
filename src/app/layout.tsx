import type { Metadata, Viewport } from "next";
import { Sora } from "next/font/google";
import { JsonLd } from "@/components/json-ld";
import { organizationJsonLd, SEO_KEYWORDS, websiteJsonLd } from "@/lib/seo";
import { SITE } from "@/lib/site";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sora",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#071018",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "SportTek | Sports booking platform Pakistan, padel, cricket, futsal",
    template: "%s | SportTek",
  },
  description:
    "SportTek is Pakistan's sports booking platform. Book padel courts, cricket grounds, futsal turf and more. Find live slots, compare prices, and play.",
  keywords: [...SEO_KEYWORDS],
  applicationName: SITE.name,
  authors: [{ name: SITE.name, url: SITE.url }],
  creator: SITE.name,
  publisher: SITE.name,
  category: "sports",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "SportTek | Book sports courts in Pakistan",
    description:
      "Find, book and play. Padel, cricket, futsal and more on Pakistan's sports booking platform.",
    url: SITE.url,
    siteName: SITE.name,
    locale: "en_PK",
    type: "website",
    images: [
      {
        url: "/brand/sporttek-mark.png",
        width: 512,
        height: 512,
        alt: "SportTek Find, book and play",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SportTek | Sports booking Pakistan",
    description: "Book padel, cricket, futsal and more across Pakistan.",
    images: ["/brand/sporttek-mark.png"],
  },
  icons: {
    icon: "/brand/sporttek-mark.png",
    apple: "/brand/sporttek-mark.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: {
    google: "jOYgsJy_7bEuoWlOrPgUvX_ivDWoqIWwyd4G4UtiisU",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-PK">
      <body className={`${sora.variable} ${sora.className} antialiased`}>
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
        {children}
      </body>
    </html>
  );
}
