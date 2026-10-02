import Image from "next/image";
import type { ReactNode } from "react";
import { SITE } from "@/lib/site";

export function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <>
      <header className="nav">
        <a className="nav-brand" href="/">
          <Image src="/brand/sporttek-mark.png" alt="" width={40} height={40} priority />
          <span>
            Sport<span>Tek</span>
          </span>
        </a>
        <div className="nav-actions">
          <a className="nav-link" href="/">
            Home
          </a>
        </div>
      </header>

      <main className="legal">
        <p className="eyebrow">Legal</p>
        <h1>{title}</h1>
        <p className="legal-updated">Last updated: {updated}</p>
        <div className="legal-body">{children}</div>
      </main>

      <footer className="footer">
        <div className="footer-brand">
          <Image src="/brand/sporttek-mark.png" alt="" width={28} height={28} />
          <span>
            Sport<span>Tek</span>
          </span>
        </div>
        <div className="footer-links">
          <a href="/privacy">Privacy Policy</a>
          <a href="/terms">Terms of Service</a>
          <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
        </div>
        <p>© {new Date().getFullYear()} SportTek. All rights reserved.</p>
      </footer>
    </>
  );
}
