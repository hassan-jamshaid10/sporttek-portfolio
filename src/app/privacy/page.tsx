import type { Metadata } from "next";
import { LegalShell } from "@/components/LegalShell";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How SportTek collects, uses, and protects your information.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" updated="2 October 2026">
      <p>
        This Privacy Policy explains how {SITE.name} (&quot;SportTek&quot;, &quot;we&quot;, &quot;us&quot;)
        handles information when you use {SITE.url}, our mobile app, venue panel, and related
        services (the &quot;Services&quot;).
      </p>

      <h2>1. Who we are</h2>
      <p>
        SportTek is operated from Lahore, Pakistan. Contact:{" "}
        <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
      </p>

      <h2>2. Information we collect</h2>
      <ul>
        <li>
          <strong>Account data:</strong> phone number (E.164), name, and profile details you
          provide when signing in with OTP or using the Services.
        </li>
        <li>
          <strong>Booking data:</strong> venue, court, time, price, payment or deposit status,
          and related messages.
        </li>
        <li>
          <strong>Venue operator data:</strong> arena profile, hours, pricing, photos, staff
          access, bank details for payouts or deposits, and Google Calendar connection if you
          choose to connect.
        </li>
        <li>
          <strong>Device and usage:</strong> app version, device tokens for push notifications,
          approximate location when you search nearby venues, and basic logs needed to run and
          secure the Services.
        </li>
        <li>
          <strong>Communications:</strong> WhatsApp/email queries, support messages, and
          feedback you send us.
        </li>
      </ul>

      <h2>3. How we use information</h2>
      <ul>
        <li>Create and secure accounts (OTP login).</li>
        <li>Process bookings, cancellations, deposits, and venue operations.</li>
        <li>Send transactional alerts (booking confirmed, reminders, deposit updates).</li>
        <li>Improve availability, discovery, and product reliability.</li>
        <li>Comply with law and prevent fraud or abuse.</li>
      </ul>

      <h2>4. Sharing</h2>
      <p>We do not sell your personal data. We share only as needed:</p>
      <ul>
        <li>With the venue you book (name, phone, booking details) so they can host you.</li>
        <li>
          With infrastructure providers (hosting, storage, messaging, maps, analytics, payment
          partners) under contracts that limit use to providing the Services.
        </li>
        <li>When required by law or to protect SportTek, users, or the public.</li>
      </ul>
      <p>
        If you connect Google Calendar, SportTek may create or update calendar events for your
        venue bookings and, for owners who reconnect with email permission, send weekly
        analytics to that Google account. You can disconnect anytime in Settings.
      </p>

      <h2>5. Retention</h2>
      <p>
        We keep account and booking records as long as needed to operate the Services, resolve
        disputes, and meet legal requirements. You may request deletion of your account; some
        records may be retained where required (for example completed bookings or financial
        logs).
      </p>

      <h2>6. Security</h2>
      <p>
        We use industry-standard measures (encrypted transport, access controls, hashed or
        encrypted secrets where applicable). No method is 100% secure; please protect your
        device and OTP codes.
      </p>

      <h2>7. Your choices</h2>
      <ul>
        <li>Update profile details in the app or panel.</li>
        <li>Control notification preferences where offered.</li>
        <li>Disconnect Google integrations.</li>
        <li>
          Contact us at <a href={`mailto:${SITE.email}`}>{SITE.email}</a> for access,
          correction, or deletion requests.
        </li>
      </ul>

      <h2>8. Children</h2>
      <p>
        The Services are not directed at children under 13. If you believe we collected data
        from a child, contact us and we will delete it.
      </p>

      <h2>9. Changes</h2>
      <p>
        We may update this policy. The &quot;Last updated&quot; date will change. Continued use
        after updates means you accept the revised policy.
      </p>

      <h2>10. Contact</h2>
      <p>
        Questions: <a href={`mailto:${SITE.email}`}>{SITE.email}</a> · {SITE.url}
      </p>
    </LegalShell>
  );
}
