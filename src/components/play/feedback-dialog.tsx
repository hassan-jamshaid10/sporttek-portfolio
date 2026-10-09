"use client";

import { Star, Upload, X } from "lucide-react";
import { useState } from "react";
import { BrandLoader } from "@/components/play/brand-loader";
import { Button } from "@/components/ui/button";
import { ApiError, apiFetch, backendApi } from "@/lib/api";
import { messageForCode } from "@/lib/auth-messages";
import { cn } from "@/lib/utils";

const CATEGORIES = ["General", "Bug", "Venue", "Booking", "Payment", "Other"] as const;

export function FeedbackDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!open) return null;

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
      window.setTimeout(() => {
        setDone(false);
        setMessage("");
        setCategory(null);
        setRating(null);
        setFile(null);
        onClose();
      }, 1400);
    } catch (err) {
      const api = err as ApiError;
      setError(messageForCode(api.messageCode, api.message, api.fields));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-[#0F1C28]/55 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-title"
      onClick={onClose}
    >
      {busy ? <BrandLoader label="Sending feedback" /> : null}
      <div
        className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-[28px] bg-white p-5 shadow-[0_-8px_40px_rgba(23,53,79,0.28)] dark:bg-[#152636] sm:rounded-[28px] sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {done ? (
          <div className="py-10 text-center">
            <p className="text-lg font-extrabold text-[#4F8F38] dark:text-[#D4E22A]">
              Thanks! Feedback received.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2
                  id="feedback-title"
                  className="text-lg font-extrabold text-[#17354F] dark:text-white"
                >
                  Give feedback
                </h2>
                <p className="mt-0.5 text-sm font-semibold text-neutral-500 dark:text-white/55">
                  Tell us what to improve.
                </p>
              </div>
              <button
                type="button"
                className="rounded-full p-2 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/10"
                onClick={onClose}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <label className="text-xs font-extrabold uppercase tracking-wide text-neutral-400">
              Message
            </label>
            <textarea
              className="mt-2 min-h-[110px] w-full rounded-xl border border-black/10 bg-neutral-50 px-3 py-2.5 text-sm font-semibold text-[#17354F] outline-none focus:border-[#65AA2B] dark:border-white/15 dark:bg-[#0F1C28] dark:text-white"
              placeholder="Tell us what you think…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />

            <p className="mb-2 mt-4 text-xs font-extrabold uppercase tracking-wide text-neutral-400">
              Category
            </p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-bold",
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

            <p className="mb-2 mt-4 text-xs font-extrabold uppercase tracking-wide text-neutral-400">
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
                    size={22}
                    className={cn(
                      rating != null && n <= rating
                        ? "fill-[#65AA2B] text-[#65AA2B]"
                        : "text-neutral-300 dark:text-white/30",
                    )}
                  />
                </button>
              ))}
            </div>

            <label className="mt-4 flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-black/15 text-sm font-bold text-[#17354F] dark:border-white/20 dark:text-white">
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
              <p className="mt-3 text-sm font-bold text-red-700 dark:text-red-300">{error}</p>
            ) : null}

            <Button
              type="button"
              className="mt-5 h-12 w-full rounded-xl bg-gradient-to-br from-[#4F8F38] to-[#66AB27] text-white"
              disabled={busy}
              onClick={() => void submit()}
            >
              Send feedback
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
