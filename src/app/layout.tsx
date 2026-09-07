import type { Metadata, Viewport } from "next";
import { Sora } from "next/font/google";
import "./globals.css";
import { SITE } from "@/lib/site";

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
    default: "SportTek — Find, book and play",
    template: "%s | SportTek",
  },
  description:
    "SportTek is launching soon. Book sports courts in Pakistan — padel, futsal, cricket — and run venues from one panel.",
  openGraph: {
    title: "SportTek — launching soon",
    description: "Find, book and play. Courts across Pakistan.",
    url: SITE.url,
    siteName: SITE.name,
    images: [{ url: "/og.png", width: 1024, height: 1024, alt: "SportTek" }],
    type: "website",
  },
  icons: {
    icon: "/brand/sporttek-mark.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sora.variable} antialiased`}>{children}</body>
    </html>
  );
}
