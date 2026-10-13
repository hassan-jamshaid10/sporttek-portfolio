import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { SITE } from "@/lib/site";
import {
  absoluteUrl,
  sportServiceJsonLd,
  type SportLanding,
} from "@/lib/seo";

export function sportLandingMetadata(landing: SportLanding): Metadata {
  const url = absoluteUrl(`/${landing.slug}`);
  return {
    title: { absolute: landing.title },
    description: landing.description,
    keywords: landing.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: landing.title,
      description: landing.description,
      url,
      siteName: SITE.name,
      type: "website",
      locale: "en_PK",
      images: [{ url: "/brand/sporttek-mark.png", width: 512, height: 512, alt: "SportTek" }],
    },
    twitter: {
      card: "summary_large_image",
      title: landing.title,
      description: landing.description,
    },
    robots: { index: true, follow: true },
  };
}

export function SportLandingPage({ landing }: { landing: SportLanding }) {
  return (
    <main className="mx-auto min-h-dvh max-w-3xl px-5 py-10 text-[#F7F8FA] sm:px-8 sm:py-14">
      <JsonLd data={sportServiceJsonLd(landing)} />

      <header className="mb-10 flex items-center justify-between gap-4">
        <Link href="/play" className="flex items-center gap-2.5 font-extrabold tracking-tight">
          <Image src="/brand/sporttek-mark.png" alt="SportTek" width={36} height={36} />
          <span>
            Sport<span className="text-[#65AA2B]">Tek</span>
          </span>
        </Link>
        <Link
          href="/play"
          className="rounded-full bg-[#65AA2B] px-4 py-2 text-sm font-extrabold text-[#071018]"
        >
          Book now
        </Link>
      </header>

      <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#D4E22A]">
        {landing.sport} · Pakistan
      </p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{landing.h1}</h1>
      <p className="mt-4 text-base font-medium leading-relaxed text-white/75 sm:text-lg">
        {landing.intro}
      </p>

      <ul className="mt-8 space-y-3">
        {landing.bullets.map((item) => (
          <li
            key={item}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/90"
          >
            {item}
          </li>
        ))}
      </ul>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/play"
          className="inline-flex h-12 items-center justify-center rounded-full bg-[#65AA2B] px-6 text-sm font-extrabold text-[#071018]"
        >
          Open SportTek booking
        </Link>
        <Link
          href="/sports-booking"
          className="inline-flex h-12 items-center justify-center rounded-full border border-white/20 px-6 text-sm font-extrabold"
        >
          Why SportTek
        </Link>
      </div>

      <section className="mt-14 border-t border-white/10 pt-8 text-sm leading-relaxed text-white/65">
        <h2 className="text-lg font-extrabold text-white">
          Why book {landing.sport.toLowerCase()} on SportTek?
        </h2>
        <p className="mt-3">
          SportTek is built in Pakistan for local venues and players. Search courts, compare
          prices in rupees, and confirm bookings online without calling every turf.
        </p>
        <p className="mt-3">
          Looking for{" "}
          <Link href="/padel" className="font-bold text-[#D4E22A] underline-offset-2 hover:underline">
            padel
          </Link>
          ,{" "}
          <Link href="/cricket" className="font-bold text-[#D4E22A] underline-offset-2 hover:underline">
            cricket
          </Link>
          ,{" "}
          <Link href="/futsal" className="font-bold text-[#D4E22A] underline-offset-2 hover:underline">
            futsal
          </Link>
          , or a full{" "}
          <Link
            href="/sports-booking"
            className="font-bold text-[#D4E22A] underline-offset-2 hover:underline"
          >
            sports booking platform
          </Link>
          ? Start on SportTek.
        </p>
      </section>

      <footer className="mt-16 flex flex-wrap gap-4 text-xs font-semibold text-white/45">
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <a href={SITE.instagramUrl} target="_blank" rel="noopener noreferrer">
          Instagram
        </a>
        <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
      </footer>
    </main>
  );
}
