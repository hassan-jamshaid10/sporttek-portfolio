"use client";

import { Copy, RefreshCw, Upload } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { BrandLoader } from "@/components/play/brand-loader";
import { Button } from "@/components/ui/button";
import { ApiError, apiFetch, backendApi } from "@/lib/api";
import { messageForCode } from "@/lib/auth-messages";
import { formatCountdown, rejectReasonCopy } from "@/lib/deposit";
import { moneyDisplay } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DepositInstructions } from "@/lib/types";

export function DepositPanel({
  bookingId,
  onUpdated,
  compact = false,
}: {
  bookingId: string;
  onUpdated?: () => void;
  compact?: boolean;
}) {
  const [info, setInfo] = useState<DepositInstructions | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [retryFile, setRetryFile] = useState<File | null>(null);

  const load = useCallback(async () => {
    setLoading((prev) => (info == null ? true : prev));
    setError(null);
    try {
      const body = await apiFetch<DepositInstructions>(
        backendApi(`api/v1/bookings/${bookingId}/deposit-instructions`),
      );
      setInfo(body);
    } catch (err) {
      const api = err as ApiError;
      setError(messageForCode(api.messageCode, api.message, api.fields));
      if (!info) setInfo(null);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!info?.heldUntil) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [info?.heldUntil]);

  async function copy(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      /* ignore */
    }
  }

  async function upload(file: File) {
    if (!info?.canUpload) return;
    setUploading(true);
    setProgress(0);
    setError(null);
    setRetryFile(file);
    try {
      // Fake progress while browser upload runs (Fetch has no progress API without XHR).
      const tick = window.setInterval(() => {
        setProgress((p) => (p > 0.9 ? p : p + 0.08));
      }, 120);
      const form = new FormData();
      form.append("file", file);
      if (info.depositAmount?.paisa != null) {
        form.append("claimedAmountPaisa", String(info.depositAmount.paisa));
      }
      if (info.reference) form.append("claimedReference", info.reference);
      form.append("attemptKey", crypto.randomUUID());
      await apiFetch(backendApi(`api/v1/bookings/${bookingId}/deposit-proof`), {
        method: "POST",
        body: form,
      });
      window.clearInterval(tick);
      setProgress(1);
      setRetryFile(null);
      await load();
      onUpdated?.();
    } catch (err) {
      const api = err as ApiError;
      setError(messageForCode(api.messageCode, api.message, api.fields));
    } finally {
      setUploading(false);
    }
  }

  if (loading && !info) {
    return <BrandLoader label="Loading deposit" variant="inline" />;
  }

  if (!info) {
    return error ? (
      <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 dark:bg-amber-950/50 dark:text-amber-100">
        {error}
      </div>
    ) : null;
  }

  const submitted = info.paymentStatus === "PROOF_SUBMITTED";
  const confirmed = info.paymentStatus === "DEPOSIT_CONFIRMED";
  const rejected = info.lastProofStatus === "REJECTED" && Boolean(info.canUpload);
  const remainingMs = info.heldUntil
    ? new Date(info.heldUntil).getTime() - now
    : null;

  const title = confirmed
    ? "Deposit confirmed. Pay the remaining balance at the venue."
    : submitted
      ? "Screenshot received. The venue is checking the transfer."
      : rejected
        ? "The venue could not match that screenshot"
        : "Pay the deposit to keep this slot";

  const body = submitted
    ? "Your slot stays held until they confirm. You do not need to transfer again."
    : rejected
      ? rejectReasonCopy(info.lastRejectionReason)
      : "Transfer from your banking app, then upload a screenshot.";

  return (
    <section
      className={cn(
        "rounded-[22px] border border-black/[0.06] bg-white dark:border-white/10 dark:bg-[#1C3145]",
        compact ? "p-4" : "p-5 sm:p-6",
      )}
    >
      <h2 className="text-base font-extrabold leading-snug text-[#17354F] dark:text-white sm:text-lg">
        {title}
      </h2>
      <p className="mt-1.5 text-sm font-semibold leading-relaxed text-neutral-500 dark:text-white/55">
        {body}
      </p>

      {!submitted && remainingMs != null && remainingMs > 0 ? (
        <p className="mt-2.5 text-sm font-extrabold text-[#4F8F38] dark:text-[#D4E22A]">
          Hold expires in {formatCountdown(remainingMs)}
        </p>
      ) : null}

      <div className="mt-4 rounded-2xl bg-gradient-to-br from-[#E8F4DC] to-[#DCECE8] p-4 dark:from-[#1E3A24] dark:to-[#243B54]">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-500 dark:text-white/50">
          Transfer exactly this amount
        </p>
        <p className="mt-0.5 text-3xl font-black tracking-tight text-[#4F8F38] dark:text-[#D4E22A]">
          {moneyDisplay(info.depositAmount)}
        </p>
        {info.balanceDue ? (
          <p className="mt-1 text-xs font-bold text-neutral-600 dark:text-white/60">
            Balance due at the venue: {moneyDisplay(info.balanceDue)}
          </p>
        ) : null}
      </div>

      <div className="mt-3 space-y-1">
        {info.accountTitle ? (
          <CopyRow
            label="Account title"
            value={info.accountTitle}
            copied={copied === "Account title"}
            onCopy={() => void copy("Account title", info.accountTitle!)}
          />
        ) : null}
        {info.bankName ? (
          <CopyRow
            label="Bank"
            value={info.bankName}
            copied={copied === "Bank"}
            onCopy={() => void copy("Bank", info.bankName!)}
          />
        ) : null}
        {info.accountNumberMasked ? (
          <CopyRow
            label="Account number"
            value={info.accountNumberMasked}
            copied={copied === "Account number"}
            onCopy={() => void copy("Account number", info.accountNumberMasked!)}
          />
        ) : null}
        {info.iban ? (
          <CopyRow
            label="IBAN"
            value={info.iban}
            copied={copied === "IBAN"}
            onCopy={() => void copy("IBAN", info.iban!)}
          />
        ) : null}
        {info.raastId ? (
          <CopyRow
            label="Raast ID"
            value={info.raastId}
            copied={copied === "Raast ID"}
            onCopy={() => void copy("Raast ID", info.raastId!)}
          />
        ) : null}
        {info.reference ? (
          <CopyRow
            label="Put this in the transfer note"
            value={info.reference}
            copied={copied === "Reference"}
            onCopy={() => void copy("Reference", info.reference!)}
          />
        ) : null}
      </div>

      {info.instructions ? (
        <p className="mt-3 text-sm font-semibold leading-relaxed text-neutral-500 dark:text-white/55">
          {info.instructions}
        </p>
      ) : null}

      {error ? (
        <p className="mt-3 text-sm font-bold leading-relaxed text-red-700 dark:text-red-300">
          {error}
        </p>
      ) : null}

      {info.canUpload && !confirmed ? (
        <div className="mt-4">
          {uploading ? (
            <div>
              <p className="text-xs font-bold text-neutral-500 dark:text-white/55">
                Uploading screenshot…
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E6F0E1] dark:bg-[#243B54]">
                <div
                  className="h-full rounded-full bg-[#4F8F38] transition-all"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
            </div>
          ) : (
            <label className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#4F8F38] to-[#66AB27] text-sm font-extrabold text-white shadow-[0_8px_18px_rgba(79,143,56,0.28)] transition hover:from-[#458032] hover:to-[#5a9826]">
              {retryFile && error ? <RefreshCw size={18} /> : <Upload size={18} />}
              {retryFile && error
                ? "Retry upload"
                : rejected
                  ? "Upload a new screenshot"
                  : "Upload screenshot"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void upload(file);
                  e.target.value = "";
                }}
              />
            </label>
          )}
        </div>
      ) : null}

      {submitted ? (
        <Button
          type="button"
          variant="outline"
          className="mt-3 h-11 w-full rounded-xl"
          onClick={() => void load()}
        >
          Refresh status
        </Button>
      ) : null}
    </section>
  );
}

function CopyRow({
  label,
  value,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl px-1 py-2">
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-400 dark:text-white/45">
          {label}
        </p>
        <p className="truncate text-sm font-extrabold text-[#17354F] dark:text-white">{value}</p>
      </div>
      <button
        type="button"
        onClick={onCopy}
        className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-extrabold text-[#4F8F38] hover:bg-neutral-50 dark:text-[#D4E22A] dark:hover:bg-white/10"
      >
        <Copy size={13} />
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
