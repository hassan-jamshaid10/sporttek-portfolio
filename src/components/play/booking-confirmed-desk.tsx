"use client";

import Link from "next/link";
import { Camera, Check, Copy } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { BrandLoader } from "@/components/play/brand-loader";
import { DepositPanel } from "@/components/play/deposit-panel";
import { Button } from "@/components/ui/button";
import { apiFetch, backendApi } from "@/lib/api";
import { depositPaisa, formatPkrFromPaisa } from "@/lib/deposit";
import { formatDate, formatTime, moneyDisplay } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { BookingRow } from "@/lib/types";

export function BookingConfirmedDesk({
  bookingId,
  initialRef,
  forceDeposit,
}: {
  bookingId: string;
  initialRef?: string;
  forceDeposit?: boolean;
}) {
  const [booking, setBooking] = useState<BookingRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(
    async (silent = false) => {
      try {
        const body = await apiFetch<BookingRow>(backendApi(`api/v1/me/bookings/${bookingId}`));
        setBooking(body);
        setError(null);
      } catch (err) {
        if (!silent) {
          setError(err instanceof Error ? err.message : "Could not load booking.");
          if (initialRef) {
            setBooking({
              id: bookingId,
              reference: initialRef,
              status: forceDeposit ? "HELD" : "CONFIRMED",
              paymentMethod: forceDeposit ? "BANK_TRANSFER_DEPOSIT" : "PAY_AT_VENUE",
              paymentStatus: forceDeposit ? "PENDING_PROOF" : "NOT_REQUIRED",
            });
          }
        }
      }
    },
    [bookingId, initialRef, forceDeposit],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const isDeposit = booking?.paymentMethod === "BANK_TRANSFER_DEPOSIT" || forceDeposit;
  const cancelled =
    booking?.status === "CANCELLED_BY_PLAYER" || booking?.status === "CANCELLED_BY_VENUE";
  const proofSubmitted = booking?.paymentStatus === "PROOF_SUBMITTED";
  const depositConfirmed = booking?.paymentStatus === "DEPOSIT_CONFIRMED";
  const awaitingVenueReview = Boolean(isDeposit && proofSubmitted);
  const needsDepositUpload =
    Boolean(isDeposit) &&
    !cancelled &&
    booking?.status === "HELD" &&
    !proofSubmitted &&
    !depositConfirmed;

  const title = cancelled
    ? "Booking cancelled"
    : awaitingVenueReview
      ? "Booking on hold"
      : needsDepositUpload
        ? "Pay the deposit to keep this slot"
        : "You are booked";

  const subtitle = cancelled
    ? booking?.status === "CANCELLED_BY_VENUE"
      ? "The venue cancelled this booking."
      : "This booking was cancelled."
    : awaitingVenueReview
      ? "You'll get confirmation from the venue shortly. Your slot stays reserved while they check the transfer."
      : needsDepositUpload
        ? "Transfer from your banking app, then upload a screenshot."
        : "Court locked. Show this at the desk.";

  const pricePaisa = booking?.price?.paisa;
  let displayPrice = moneyDisplay(booking?.price);
  let priceLabel = "Amount due";
  let depositPaid: string | null = null;
  let balanceDue: string | null = null;
  if (isDeposit && (proofSubmitted || depositConfirmed) && pricePaisa != null) {
    const dep = depositPaisa(pricePaisa);
    depositPaid = formatPkrFromPaisa(dep);
    balanceDue = formatPkrFromPaisa(pricePaisa - dep);
    displayPrice = balanceDue;
    priceLabel = "Balance due at venue";
  }

  async function copyRef() {
    if (!booking?.reference) return;
    try {
      await navigator.clipboard.writeText(booking.reference);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }

  if (!booking && !error) {
    return <BrandLoader label="Loading booking" variant="inline" />;
  }

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#E8F2DE] via-white to-[#DCE8F2] dark:from-[#0B1620] dark:via-[#0F1C28] dark:to-[#122636]" />
      <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#65AA2B]/15 dark:bg-[#65AA2B]/10" />
      <div className="pointer-events-none absolute bottom-24 -left-16 h-44 w-44 rounded-full bg-[#D4E22A]/20 dark:bg-[#D4E22A]/10" />

      <div className="relative mx-auto w-full max-w-[640px] px-4 py-8 sm:px-8 sm:py-12">
        {error && !booking ? (
          <div className="rounded-2xl bg-amber-50 px-4 py-3.5 text-sm font-semibold text-amber-900 sm:px-5 sm:py-4 sm:text-base">
            {error}
          </div>
        ) : null}

        <div className="flex flex-col items-center text-center">
          <div
            className={cn(
              "flex h-16 w-16 items-center justify-center rounded-full shadow-[0_12px_28px_rgba(79,143,56,0.35)] sm:h-[84px] sm:w-[84px]",
              cancelled
                ? "bg-gradient-to-br from-[#17354F] to-[#1F4A6B]"
                : "bg-gradient-to-br from-[#4F8F38] to-[#66AB27]",
            )}
          >
            {cancelled ? (
              <span className="text-3xl font-black text-white sm:text-4xl">×</span>
            ) : (
              <Check className="h-9 w-9 text-white sm:h-[46px] sm:w-[46px]" strokeWidth={3} />
            )}
          </div>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-[#17354F] dark:text-white sm:text-3xl">
            {title}
          </h1>
          <p className="mt-2 max-w-md px-1 text-sm font-semibold leading-relaxed text-neutral-500 dark:text-white/55">
            {subtitle}
          </p>
        </div>

        {/* Ticket */}
        <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-[0_14px_36px_rgba(23,53,79,0.14)] sm:mt-8 sm:rounded-3xl dark:bg-[#17354F]">
          <div className="border-b border-dashed border-black/10 px-4 py-4 sm:px-6 sm:py-5 dark:border-white/15">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-neutral-400 dark:text-white/45">
              Reference
            </p>
            <p className="mt-1 break-all font-mono text-xl font-black tracking-wide text-[#17354F] dark:text-white sm:text-2xl">
              {booking?.reference ?? "—"}
            </p>
            {(awaitingVenueReview || needsDepositUpload) && (
              <span className="mt-2 inline-flex rounded-lg bg-amber-100 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-amber-900 dark:bg-amber-950/50 dark:text-amber-100">
                On hold
              </span>
            )}
          </div>
          <div className="space-y-3 px-4 py-4 sm:px-6 sm:py-5">
            <TicketRow label="Venue" value={booking?.venueName ?? "—"} />
            <TicketRow label="Court" value={booking?.courtName ?? "—"} />
            <TicketRow
              label="When"
              value={[
                formatDate(booking?.startAt),
                booking?.startAt
                  ? `${formatTime(booking.startAt)}${booking.endAt ? ` – ${formatTime(booking.endAt)}` : ""}`
                  : null,
                booking?.durationMinutes ? `${booking.durationMinutes} min` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            />
            {depositPaid ? (
              <TicketRow label="Deposit paid" value={depositPaid} accent />
            ) : null}
            <TicketRow label={priceLabel} value={displayPrice} accent />
            {isDeposit && !cancelled ? (
              <p className="pt-1 text-xs font-semibold text-neutral-500 dark:text-white/50">
                Paid via bank transfer
              </p>
            ) : !isDeposit && !cancelled ? (
              <p className="pt-1 text-xs font-semibold text-neutral-500 dark:text-white/50">
                Pay this at the venue.
              </p>
            ) : null}
          </div>
        </div>

        {awaitingVenueReview ? (
          <div className="mt-4 flex gap-3 rounded-2xl border border-[#65AA2B]/35 bg-[#E8F4DC] p-4 dark:border-[#314E6A] dark:bg-[#1C3145]">
            <div className="mt-0.5 h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-[#4F8F38] border-t-transparent dark:border-[#D4E22A] dark:border-t-transparent" />
            <div>
              <p className="text-sm font-extrabold text-[#4F8F38] dark:text-[#D4E22A]">
                Waiting for venue confirmation
              </p>
              <p className="mt-0.5 text-xs font-semibold leading-relaxed text-neutral-600 dark:text-white/55">
                Your payment screenshot is with the venue. You&apos;ll be notified once they confirm.
              </p>
            </div>
          </div>
        ) : null}

        {needsDepositUpload && bookingId ? (
          <div className="mt-4">
            <DepositPanel bookingId={bookingId} onUpdated={() => void load(true)} />
          </div>
        ) : null}

        {!awaitingVenueReview ? (
          <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs font-semibold text-neutral-500 dark:text-white/50">
            <Camera size={14} />
            Screenshot this page or copy the reference for the desk.
          </p>
        ) : null}

        <div className="mt-6 space-y-2.5 sm:space-y-3">
          <Button
            type="button"
            className="h-12 w-full rounded-2xl bg-gradient-to-br from-[#4F8F38] to-[#66AB27] text-sm font-bold text-white sm:h-14 sm:text-base"
            onClick={() => void copyRef()}
          >
            <Copy size={18} />
            {copied ? "Copied" : "Copy reference"}
          </Button>
          <div className="grid grid-cols-1 gap-2.5 min-[420px]:grid-cols-2">
            <Button asChild variant="outline" className="h-11 w-full min-w-0 rounded-xl sm:h-12">
              <Link href="/play/bookings">All bookings</Link>
            </Button>
            <Button asChild variant="outline" className="h-11 w-full min-w-0 rounded-xl sm:h-12">
              <Link href="/play">Done</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TicketRow({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 sm:gap-4">
      <span className="shrink-0 text-[11px] font-bold uppercase tracking-wide text-neutral-400 dark:text-white/45 sm:text-xs">
        {label}
      </span>
      <span
        className={cn(
          "min-w-0 max-w-[70%] break-words text-right text-sm font-extrabold",
          accent
            ? "text-[#4F8F38] dark:text-[#D4E22A]"
            : "text-[#17354F] dark:text-white",
        )}
      >
        {value}
      </span>
    </div>
  );
}
