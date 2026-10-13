import { SITE } from "@/lib/site";

/** Primary search phrases SportTek should compete for in Pakistan. */
export const SEO_KEYWORDS = [
  "SportTek",
  "Sport Tek",
  "sporttek.pk",
  "sports booking Pakistan",
  "sports booking platform",
  "book sports courts Pakistan",
  "padel Pakistan",
  "padel Lahore",
  "padel Karachi",
  "padel Islamabad",
  "book padel court",
  "cricket nets Pakistan",
  "book cricket ground",
  "futsal Pakistan",
  "book futsal court",
  "turf booking Pakistan",
  "court booking app Pakistan",
  "online sports booking",
  "play padel near me",
] as const;

export type SportLanding = {
  slug: string;
  sport: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  bullets: string[];
  keywords: string[];
};

export const SPORT_LANDINGS: SportLanding[] = [
  {
    slug: "padel",
    sport: "Padel",
    title: "Book padel courts in Pakistan | SportTek",
    description:
      "Find and book padel courts across Pakistan on SportTek. Compare slots, prices, and venues in Lahore, Karachi, Islamabad and more.",
    h1: "Book padel courts in Pakistan",
    intro:
      "SportTek is Pakistan's padel booking platform. Browse live availability, lock a court in a few taps, and play the same day.",
    bullets: [
      "Live padel slots near you",
      "Transparent prices in PKR",
      "Instant booking confirmation",
      "Venues in major cities across Pakistan",
    ],
    keywords: [
      "padel Pakistan",
      "padel Lahore",
      "padel Karachi",
      "book padel court",
      "padel booking",
      "SportTek padel",
    ],
  },
  {
    slug: "cricket",
    sport: "Cricket",
    title: "Book cricket grounds and nets in Pakistan | SportTek",
    description:
      "Book cricket nets and turf grounds in Pakistan with SportTek. Check availability, compare venues, and reserve your slot online.",
    h1: "Book cricket grounds in Pakistan",
    intro:
      "From nets practice to full turf bookings, SportTek helps you find cricket venues and lock a time that works.",
    bullets: [
      "Cricket nets and turf listings",
      "Hourly slots with clear pricing",
      "Book for evening and weekend matches",
      "Same SportTek booking flow as the app",
    ],
    keywords: [
      "cricket booking Pakistan",
      "book cricket ground",
      "cricket nets Pakistan",
      "turf cricket booking",
      "SportTek cricket",
    ],
  },
  {
    slug: "futsal",
    sport: "Futsal",
    title: "Book futsal courts in Pakistan | SportTek",
    description:
      "Book futsal and 5-a-side courts across Pakistan on SportTek. See open slots, prices, and confirm your game online.",
    h1: "Book futsal courts in Pakistan",
    intro:
      "Need a court tonight? SportTek lists futsal venues with live availability so your squad can book without phone tag.",
    bullets: [
      "Futsal and 5-a-side courts",
      "Night slots and weekend games",
      "Pay-at-venue or deposit options where offered",
      "Alerts when preferred slots open",
    ],
    keywords: [
      "futsal Pakistan",
      "book futsal court",
      "futsal Lahore",
      "5-a-side booking Pakistan",
      "SportTek futsal",
    ],
  },
  {
    slug: "sports-booking",
    sport: "Sports",
    title: "Sports booking platform Pakistan | SportTek",
    description:
      "SportTek is the sports booking platform for Pakistan. Book padel, cricket, futsal and more. Find courts, compare prices, play.",
    h1: "Pakistan's sports booking platform",
    intro:
      "SportTek connects players with turf owners. One place to discover venues, book courts, and manage your games.",
    bullets: [
      "Multi-sport court booking",
      "Player web app and venue panel",
      "Built for Pakistani payments and WhatsApp habits",
      "Live inventory from venues on SportTek",
    ],
    keywords: [
      "sports booking platform",
      "sports booking Pakistan",
      "online sports booking",
      "court booking Pakistan",
      "SportTek",
    ],
  },
];

export function absoluteUrl(path = "/") {
  const base = SITE.url.replace(/\/$/, "");
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: SITE.url,
    email: SITE.email,
    logo: absoluteUrl("/brand/sporttek-mark.png"),
    sameAs: [SITE.instagramUrl],
    description:
      "SportTek is a sports booking platform in Pakistan for padel, cricket, futsal and more.",
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.url,
    description: SITE.tagline,
    potentialAction: {
      "@type": "SearchAction",
      target: `${absoluteUrl("/play")}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function sportServiceJsonLd(landing: SportLanding) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: landing.h1,
    serviceType: `${landing.sport} court booking`,
    provider: {
      "@type": "Organization",
      name: SITE.name,
      url: SITE.url,
    },
    areaServed: {
      "@type": "Country",
      name: "Pakistan",
    },
    url: absoluteUrl(`/${landing.slug}`),
    description: landing.description,
  };
}
