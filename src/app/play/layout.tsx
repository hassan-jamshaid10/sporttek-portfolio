import type { Metadata } from "next";
import { Sora } from "next/font/google";
import { PlayFrame } from "@/components/play/play-frame";
import "./play.css";
import "./brand-loader.css";

/** Same Sora setup as sporttek-panel auth (weights used across panel UI). */
const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Book sports courts in Pakistan",
  description:
    "Book padel, cricket, futsal and more on SportTek. Live slots, transparent PKR prices, instant confirmation across Pakistan.",
  keywords: [
    "SportTek",
    "book sports courts Pakistan",
    "padel booking",
    "cricket booking",
    "futsal booking",
    "sports booking platform",
  ],
  alternates: { canonical: "https://sporttek.pk/play" },
  openGraph: {
    title: "Book courts on SportTek",
    description: "Find a court near you and book in minutes.",
    url: "https://sporttek.pk/play",
  },
  robots: { index: true, follow: true },
};

/** Apply stored /play theme before paint (mirrors sporttek-panel THEME_BOOT). */
const PLAY_THEME_BOOT = `(function(){try{var t=localStorage.getItem("sporttek.play.theme");document.documentElement.classList.toggle("dark",t==="dark");}catch(e){}})();`;

export default function PlayLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${sora.className} min-h-dvh`}>
      <script dangerouslySetInnerHTML={{ __html: PLAY_THEME_BOOT }} />
      <PlayFrame>{children}</PlayFrame>
    </div>
  );
}
