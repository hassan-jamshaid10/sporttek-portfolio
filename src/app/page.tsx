import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin } from "lucide-react";
import { InstagramIcon } from "@/components/InstagramIcon";
import { QueryForm } from "@/components/QueryForm";
import { SITE } from "@/lib/site";

const PILLARS = [
  {
    title: "Players",
    copy: "Find a court near you, compare slots, and book in a few taps. Padel, futsal, cricket, and more.",
  },
  {
    title: "Venue owners",
    copy: "Run hours, prices, and bookings from one panel. WhatsApp alerts when a court is taken.",
  },
  {
    title: "Pakistan first",
    copy: "Built in Lahore for local turf culture — rupees, WhatsApp login, and courts that run past midnight.",
  },
];

export default function HomePage() {
  return (
    <>
      <header className="nav">
        <a className="nav-brand" href="#top">
          <Image src="/brand/sporttek-mark.png" alt="" width={40} height={40} priority />
          <span>
            Sport<span>Tek</span>
          </span>
        </a>
        <div className="nav-actions">
          <span className="soon-pill">Launching soon</span>
          <a className="nav-link" href="#query">
            Send a query
          </a>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">Sports venue booking · Pakistan</p>
            <h1>
              Courts, slots, and
              <em> a cleaner way to play.</em>
            </h1>
            <p className="lede">
              {SITE.tagline}. SportTek connects players with turf owners — discover, compare, and
              book, while venues manage the night from one panel.
            </p>
            <div className="hero-cta">
              <a className="btn-primary" href="#query">
                Talk to us
              </a>
              <a className="btn-ghost" href={SITE.instagramUrl} target="_blank" rel="noopener noreferrer">
                <InstagramIcon size={18} />
                @{SITE.instagramHandle}
              </a>
            </div>
          </div>
          <div className="hero-mark" aria-hidden="true">
            <div className="hero-orb" />
            <Image
              src="/brand/sporttek-mark.png"
              alt="SportTek"
              width={420}
              height={420}
              priority
              className="hero-logo"
            />
          </div>
        </section>

        <section className="soon" aria-labelledby="soon-heading">
          <p className="eyebrow">Coming to your city</p>
          <h2 id="soon-heading">Launching soon</h2>
          <p className="lede lede-center">
            We are finishing the player app and venue panel. Follow along, or send a query if you
            run a court — or just want first access.
          </p>
          <div className="contact-cards">
            <a className="contact-card" href={SITE.instagramUrl} target="_blank" rel="noopener noreferrer">
              <InstagramIcon size={22} />
              <div>
                <strong>Instagram</strong>
                <span>@{SITE.instagramHandle}</span>
              </div>
            </a>
            <a className="contact-card" href={`mailto:${SITE.email}`}>
              <Mail size={22} />
              <div>
                <strong>Email</strong>
                <span>{SITE.email}</span>
              </div>
            </a>
            <div className="contact-card contact-card--static">
              <MapPin size={22} />
              <div>
                <strong>Based in</strong>
                <span>Lahore, Pakistan</span>
              </div>
            </div>
          </div>
        </section>

        <section className="pillars">
          {PILLARS.map((item) => (
            <article key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </article>
          ))}
        </section>

        <section className="query" id="query">
          <div className="query-intro">
            <p className="eyebrow">Queries</p>
            <h2>Tell us what you need</h2>
            <p className="lede">
              Players, owners, and partners — write to us. Messages go to {SITE.email}.
            </p>
          </div>
          <QueryForm />
        </section>
      </main>

      <footer className="footer">
        <div className="footer-brand">
          <Image src="/brand/sporttek-mark.png" alt="" width={28} height={28} />
          <span>
            Sport<span>Tek</span>
          </span>
        </div>
        <div className="footer-links">
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
          <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
        </div>
        <p>© {new Date().getFullYear()} SportTek. All rights reserved.</p>
      </footer>
    </>
  );
}
