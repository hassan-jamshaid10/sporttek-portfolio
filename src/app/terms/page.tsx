import type { Metadata } from "next";
import { LegalShell } from "@/components/LegalShell";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms governing use of SportTek apps, panel, and website.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalShell title="Terms of Service" updated="2 October 2026">
      <p>
        These Terms of Service (&quot;Terms&quot;) govern your use of {SITE.name} at{" "}
        {SITE.url}, our player app, venue panel, and related services (the &quot;Services&quot;).
        By using the Services you agree to these Terms.
      </p>

      <h2>1. The Services</h2>
      <p>
        SportTek helps players discover and book sports courts in Pakistan and helps venue
        owners manage schedules, pricing, bookings, deals, and related operations. Features may
        change as we launch and improve the product.
      </p>

      <h2>2. Accounts</h2>
      <ul>
        <li>You must provide accurate phone and profile information.</li>
        <li>You are responsible for OTP codes and activity on your account.</li>
        <li>Venue staff must only access arenas they are authorised to manage.</li>
        <li>We may suspend accounts that abuse, fraud, or harm the platform.</li>
      </ul>

      <h2>3. Bookings and payments</h2>
      <ul>
        <li>
          A booking is an agreement between you and the venue. SportTek facilitates discovery,
          holds, and status updates.
        </li>
        <li>
          Prices, deposits, cancellation rules, and refunds follow the venue&apos;s settings and
          any on-screen confirmation at booking time.
        </li>
        <li>
          Pay-at-venue, deposit proofs, and online payment (when enabled) must be completed as
          instructed. False deposit proofs may lead to cancellation or bans.
        </li>
        <li>
          SportTek is not liable for venue no-shows, facility condition, or disputes beyond
          facilitating communication and status tools we provide.
        </li>
      </ul>

      <h2>4. Venue operators</h2>
      <ul>
        <li>You warrant you have rights to list the arena and set prices and hours.</li>
        <li>You must keep schedule, blocks, and pricing accurate.</li>
        <li>
          Optional Google Calendar sync is one-way (SportTek → Google) for connected accounts;
          weekly analytics email requires reconnecting with Gmail permission.
        </li>
        <li>Go-live and listing visibility may require SportTek review.</li>
      </ul>

      <h2>5. Acceptable use</h2>
      <p>You must not:</p>
      <ul>
        <li>Scrape, attack, or reverse engineer the Services unlawfully.</li>
        <li>Harass players or staff, or post illegal content.</li>
        <li>Use the Services to spam or market player phone numbers off-platform.</li>
        <li>Interfere with availability, payments, or other users&apos; bookings.</li>
      </ul>

      <h2>6. Intellectual property</h2>
      <p>
        SportTek branding, software, and content are owned by us or our licensors. You may not
        copy or reuse them except as needed to use the Services. Venue photos and names remain
        with their owners; you grant us a licence to display them on the Services.
      </p>

      <h2>7. Disclaimers</h2>
      <p>
        The Services are provided &quot;as is&quot; during launch. We do not guarantee
        uninterrupted uptime, perfect availability data, or that every court listing is always
        correct. To the fullest extent allowed by Pakistani law, SportTek is not liable for
        indirect or consequential losses arising from bookings or venue operations.
      </p>

      <h2>8. Limitation of liability</h2>
      <p>
        Our total liability for any claim relating to the Services is limited to the fees you
        paid to SportTek (if any) for the three months before the claim, or PKR 5,000,
        whichever is greater, except where liability cannot be limited by law.
      </p>

      <h2>9. Termination</h2>
      <p>
        You may stop using the Services anytime. We may suspend or terminate access for Terms
        breaches or risk to the platform. Provisions that should survive (IP, liability,
        disputes) remain in effect.
      </p>

      <h2>10. Changes</h2>
      <p>
        We may update these Terms. The &quot;Last updated&quot; date will change. Continued use
        after changes means you accept the new Terms.
      </p>

      <h2>11. Governing law</h2>
      <p>
        These Terms are governed by the laws of Pakistan. Courts in Lahore have exclusive
        jurisdiction, without prejudice to mandatory consumer protections.
      </p>

      <h2>12. Contact</h2>
      <p>
        <a href={`mailto:${SITE.email}`}>{SITE.email}</a> · {SITE.url}
      </p>
      <p>
        See also our <a href="/privacy">Privacy Policy</a>.
      </p>
    </LegalShell>
  );
}
