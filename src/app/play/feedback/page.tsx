"use client";

import Link from "next/link";
import { Star, Upload } from "lucide-react";
import { useState } from "react";
import { BrandLoader } from "@/components/play/brand-loader";
import { Button } from "@/components/ui/button";
import { ApiError, apiFetch, backendApi } from "@/lib/api";
import { messageForCode } from "@/lib/auth-messages";
import { cn } from "@/lib/utils";

const CATEGORIES = ["General", "Bug", "Venue", "Booking", "Payment", "Other"] as const;

export default function FeedbackPage() {
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit() {
    const text = message.trim();
    if (!text) {
      setError("Please enter a message.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("message", text);
      if (category) form.append("category", category);
      if (rating != null) form.append("rating", String(rating));
      if (file) form.append("file", file);
      await apiFetch(backendApi("api/v1/feedback"), { method: "POST", body: form });
      setDone(true);
      setMessage("");
      setCategory(null);
      setRating(null);
      setFile(null);
    } catch (err) {
      const api = err as ApiError;
      setError(messageForCode(api.messageCode, api.message, api.fields));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-[960px] space-y-8">
      {busy ? <BrandLoader label="Sending feedback" /> : null}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#17354F] dark:text-white sm:text-4xl">
            Feedback
          </h1>
          <p className="mt-1.5 text-base font-medium text-neutral-500 dark:text-white/55">
            Tell us what to improve: bugs, venues, bookings, or anything else.
          </p>
        </div>
        <Button asChild variant="outline" className="h-11 rounded-xl">
          <Link href="/play/profile">Back to profile</Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-start">
        <section className="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-[0_12px_32px_rgba(23,53,79,0.08)] dark:border-white/10 dark:bg-[#17354F] sm:p-8">
          {done ? (
            <div className="py-10 text-center">
              <p className="text-2xl font-extrabold text-[#4F8F38] dark:text-[#D4E22A]">
                Thanks, feedback received
              </p>
              <p className="mt-2 text-sm font-semibold text-neutral-500 dark:text-white/55">
                We read every message from players.
              </p>
              <Button
                type="button"
                className="mt-6 rounded-xl"
                onClick={() => setDone(false)}
              >
                Send another
              </Button>
            </div>
          ) : (
            <>
              <label className="text-xs font-extrabold uppercase tracking-wide text-neutral-400">
                Message
              </label>
              <textarea
                className="mt-2 min-h-[160px] w-full rounded-2xl border border-black/10 bg-neutral-50 px-4 py-3 text-sm font-semibold text-[#17354F] outline-none focus:border-[#65AA2B] dark:border-white/15 dark:bg-[#0F1C28] dark:text-white"
                placeholder="Tell us what you think…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />

              <p className="mb-2 mt-6 text-xs font-extrabold uppercase tracking-wide text-neutral-400">
                Category
              </p>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={cn(
                      "rounded-full px-3.5 py-2 text-xs font-bold",
                      category === c
                        ? "bg-[#17354F] text-white dark:bg-[#65AA2B] dark:text-[#071018]"
                        : "bg-neutral-100 text-[#17354F] dark:bg-white/10 dark:text-white",
                    )}
                    onClick={() => setCategory((prev) => (prev === c ? null : c))}
                  >
                    {c}
                  </button>
                ))}
              </div>

              <p className="mb-2 mt-6 text-xs font-extrabold uppercase tracking-wide text-neutral-400">
                Rating
              </p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className="rounded-lg p-1.5 hover:bg-neutral-100 dark:hover:bg-white/10"
                    onClick={() => setRating((prev) => (prev === n ? null : n))}
                    aria-label={`${n} stars`}
                  >
                    <Star
                      size={26}
                      className={cn(
                        rating != null && n <= rating
                          ? "fill-[#65AA2B] text-[#65AA2B]"
                          : "text-neutral-300 dark:text-white/30",
                      )}
                    />
                  </button>
                ))}
              </div>

              <label className="mt-6 flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-black/15 text-sm font-bold text-[#17354F] dark:border-white/20 dark:text-white">
                <Upload size={16} />
                {file ? file.name : "Attach image (optional)"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </label>

              {error ? (
                <p className="mt-4 text-sm font-bold text-red-700 dark:text-red-300">{error}</p>
              ) : null}

              <Button
                type="button"
                className="mt-6 h-12 w-full rounded-xl bg-gradient-to-br from-[#4F8F38] to-[#66AB27] text-white sm:w-auto sm:min-w-[200px]"
                disabled={busy}
                onClick={() => void submit()}
              >
                Send feedback
              </Button>
            </>
          )}
        </section>

        <aside className="rounded-3xl border border-black/[0.06] bg-gradient-to-br from-[#E8F4DC] to-[#DCE8F2] p-6 dark:border-white/10 dark:from-[#1E3A24] dark:to-[#1C3145] sm:p-7">
          <h2 className="text-lg font-extrabold text-[#17354F] dark:text-white">
            What helps most
          </h2>
          <ul className="mt-4 space-y-3 text-sm font-semibold leading-relaxed text-neutral-600 dark:text-white/70">
            <li>Steps to reproduce a bug, if you hit one.</li>
            <li>Venue name and city when reporting a listing issue.</li>
            <li>Booking reference for payment or deposit problems.</li>
            <li>Screenshots are optional, but very useful.</li>
          </ul>
          <Button asChild variant="outline" className="mt-6 h-11 w-full rounded-xl bg-white/70 dark:bg-white/5">
            <Link href="/play/alerts">Manage slot alerts</Link>
          </Button>
        </aside>
      </div>
    </div>
  );
}
