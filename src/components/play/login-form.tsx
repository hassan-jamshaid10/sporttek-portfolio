"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandLoader } from "@/components/play/brand-loader";
import { messageForCode } from "@/lib/auth-messages";

const PENDING_KEY = "sporttek_otp";

type Pending = {
  requestId: string;
  phone: string;
  expiresAt: string;
  resendAt: string;
  next: string;
};

type Step = "phone" | "code";

function loadPending(): Pending | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(PENDING_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Pending;
    if (new Date(parsed.expiresAt).getTime() > Date.now()) return parsed;
    sessionStorage.removeItem(PENDING_KEY);
    return null;
  } catch {
    return null;
  }
}

function mmss(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = String(Math.floor(total / 60)).padStart(2, "0");
  const seconds = String(total % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function PlayLoginForm({ next = "/play" }: { next?: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [pending, setPending] = useState<Pending | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [busyLabel, setBusyLabel] = useState("Working");
  const [, setTick] = useState(0);

  useEffect(() => {
    const restored = loadPending();
    if (!restored) return;
    setPending(restored);
    setPhone(restored.phone);
    setStep("code");
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  async function readError(response: Response): Promise<string> {
    const text = await response.text();
    if (!text.trim()) {
      return messageForCode("ST-008", `Sign-in failed (${response.status}).`);
    }
    try {
      const body = JSON.parse(text) as {
        messageCode?: string;
        description?: string;
        fields?: Record<string, string>;
      };
      return messageForCode(body.messageCode, body.description, body.fields);
    } catch {
      return messageForCode("ST-008", text.slice(0, 160));
    }
  }

  async function requestCode() {
    setBusy(true);
    setBusyLabel("Sending SMS code");
    setError(null);
    try {
      const response = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      if (!response.ok) {
        setError(await readError(response));
        return;
      }
      const raw = await response.text();
      let body: {
        requestId?: string;
        expiresInSeconds?: number;
        resendAllowedInSeconds?: number;
      };
      try {
        body = JSON.parse(raw) as typeof body;
      } catch {
        setError(messageForCode("ST-008", "Could not start sign-in."));
        return;
      }
      if (!body.requestId) {
        setError(messageForCode("ST-008", "Could not start sign-in."));
        return;
      }
      const now = Date.now();
      const nextPending: Pending = {
        requestId: body.requestId,
        phone: phone.trim(),
        expiresAt: new Date(now + (body.expiresInSeconds ?? 300) * 1000).toISOString(),
        resendAt: new Date(now + (body.resendAllowedInSeconds ?? 30) * 1000).toISOString(),
        next,
      };
      sessionStorage.setItem(PENDING_KEY, JSON.stringify(nextPending));
      setPending(nextPending);
      setCode("");
      setStep("code");
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    if (!pending) {
      setStep("phone");
      return;
    }
    setBusy(true);
    setBusyLabel("Checking code");
    setError(null);
    try {
      const response = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: pending.requestId,
          code: code.trim(),
          platform: "WEB",
        }),
      });
      if (!response.ok) {
        setError(await readError(response));
        return;
      }
      sessionStorage.removeItem(PENDING_KEY);
      // Drop stale logged-out cache so AppShell picks up the new session.
      const { clearPlayMe } = await import("@/lib/play-me");
      clearPlayMe();
      setBusyLabel("Opening SportTek");
      router.replace(pending.next || next);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const expired = pending ? new Date(pending.expiresAt).getTime() <= Date.now() : false;
  const resendReady = pending ? new Date(pending.resendAt).getTime() <= Date.now() : false;
  const untilExpiry = pending ? new Date(pending.expiresAt).getTime() - Date.now() : 0;
  const untilResend = pending ? new Date(pending.resendAt).getTime() - Date.now() : 0;

  return (
    <main className="login-form">
      {busy ? <BrandLoader label={busyLabel} /> : null}

      <div className="login-brand">
        <Image
          className="login-logo"
          src="/brand/sporttek-mark.png"
          alt=""
          width={76}
          height={76}
          priority
          aria-hidden
        />
        <div>
          <h1 className="login-wordmark" aria-label="SportTek">
            Sport<span>Tek</span>
          </h1>
          <p className="login-kicker">play</p>
        </div>
      </div>

      {step === "phone" ? (
        <>
          <p className="login-lead">Sign in to book and play.</p>
          <p className="login-copy">We will send a 6-digit code by SMS.</p>
          <div className="login-field">
            <label htmlFor="phone">Mobile number</label>
            <input
              id="phone"
              className="login-field__control"
              inputMode="tel"
              autoComplete="tel"
              placeholder="0300 1234567"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </div>
          {error ? <p className="login-error">{error}</p> : null}
          <button
            type="button"
            className="login-cta"
            disabled={busy || phone.trim().length < 10}
            onClick={() => void requestCode()}
          >
            Send code
          </button>
          <Link href="/play" className="login-alt" style={{ display: "inline-block" }}>
            Browse without signing in
          </Link>
        </>
      ) : (
        <>
          <p className="login-lead">Enter the code from your SMS.</p>
          <p className="login-meta">
            Sent to <strong>{pending?.phone}</strong>
          </p>
          <div className="login-field">
            <label htmlFor="code">6-digit code</label>
            <input
              id="code"
              className="login-field__control"
              style={{ letterSpacing: "0.35em" }}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            />
          </div>
          <p className="login-meta">
            {expired ? "This code has expired. Request a new one." : `Code expires in ${mmss(untilExpiry)}`}
          </p>
          {!resendReady ? <p className="login-meta">Resend in {mmss(untilResend)}</p> : null}
          {error ? <p className="login-error">{error}</p> : null}
          <button
            type="button"
            className="login-cta"
            disabled={busy || expired || code.length < 4}
            onClick={() => void verify()}
          >
            Verify
          </button>
          <button
            type="button"
            className="login-ghost"
            disabled={busy || !resendReady}
            onClick={() => void requestCode()}
          >
            Resend code
          </button>
          <button
            type="button"
            className="login-alt"
            onClick={() => {
              sessionStorage.removeItem(PENDING_KEY);
              setPending(null);
              setStep("phone");
              setError(null);
            }}
          >
            Use a different number
          </button>
        </>
      )}
    </main>
  );
}
