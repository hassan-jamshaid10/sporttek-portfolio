"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  CheckCircle2,
  ChevronLeft,
  Store,
  Tag,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DepositUploadDialog } from "@/components/play/deposit-upload-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError, apiFetch, backendApi, publicApi } from "@/lib/api";
import { messageForCode } from "@/lib/auth-messages";
import { depositPaisa, formatPkrFromPaisa } from "@/lib/deposit";
import {
  formatDate,
  formatTime,
  moneyDisplay,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import type { BookingQuote, Money, PaymentMethod } from "@/lib/types";

async function fetchQuote(body: {
  courtId: string;
  startAt: string;
  durationMinutes: number;
  promoCode?: string;
}): Promise<BookingQuote> {
  // Quote is public — prefer public proxy so a session glitch does not block pricing.
  try {
    return await apiFetch<BookingQuote>(publicApi("api/v1/bookings/quote"), {
      method: "POST",
      json: body,
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) throw err;
    return apiFetch<BookingQuote>(backendApi("api/v1/bookings/quote"), {
      method: "POST",
      json: body,
    });
  }
}

export function CheckoutDesk({
  venueId,
  courtId,
  startAt,
  durationMinutes,
  courtName,
  priceLabel,
  listPriceLabel,
  pricePaisa,
  promoCode: initialPromo,
  venueNameHint,
}: {
  venueId: string;
  courtId: string;
  startAt: string;
  durationMinutes: number;
  courtName: string;
  priceLabel?: string;
  listPriceLabel?: string;
  pricePaisa?: number;
  promoCode?: string;
  venueNameHint?: string;
}) {
  const router = useRouter();
  const [quote, setQuote] = useState<BookingQuote | null>(null);
  const [baseQuote, setBaseQuote] = useState<BookingQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [quoteNote, setQuoteNote] = useState<string | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("PAY_AT_VENUE");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [depositBookingId, setDepositBookingId] = useState<string | null>(null);

  const [promoInput, setPromoInput] = useState(initialPromo?.trim() ?? "");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [applyingPromo, setApplyingPromo] = useState(false);

  const idempotencyKey = useMemo(() => crypto.randomUUID(), []);
  const fallbackPrice: Money | undefined =
    priceLabel || pricePaisa != null
      ? { display: priceLabel, paisa: pricePaisa }
      : undefined;
  const fallbackList: Money | undefined = listPriceLabel
    ? { display: listPriceLabel }
    : undefined;

  const applyMethods = useCallback((data: BookingQuote) => {
    const methods = data.paymentMethods ?? ["PAY_AT_VENUE"];
    if (!methods.includes("PAY_AT_VENUE") && methods.includes("BANK_TRANSFER_DEPOSIT")) {
      setMethod("BANK_TRANSFER_DEPOSIT");
    } else {
      setMethod("PAY_AT_VENUE");
    }
  }, []);

  const loadBaseQuote = useCallback(async () => {
    setLoading(true);
    setQuoteNote(null);
    try {
      const data = await fetchQuote({ courtId, startAt, durationMinutes });
      setBaseQuote(data);
      setQuote(data);
      applyMethods(data);
      return data;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        const next = new URLSearchParams({
          venueId,
          courtId,
          startAt,
          durationMinutes: String(durationMinutes),
          courtName,
        });
        if (priceLabel) next.set("price", priceLabel);
        if (listPriceLabel) next.set("listPrice", listPriceLabel);
        if (pricePaisa != null) next.set("pricePaisa", String(pricePaisa));
        if (initialPromo) next.set("promoCode", initialPromo);
        if (venueNameHint) next.set("venueName", venueNameHint);
        router.replace(
          `/play/login?next=${encodeURIComponent(`/play/checkout?${next.toString()}`)}`,
        );
        return null;
      }
      const api = err as ApiError;
      setQuoteNote(
        messageForCode(api.messageCode, api.message, api.fields) ||
          "Could not refresh the quote. Slot price below still works for pay at venue.",
      );
      setMethod("PAY_AT_VENUE");
      return null;
    } finally {
      setLoading(false);
    }
  }, [
    courtId,
    startAt,
    durationMinutes,
    venueId,
    courtName,
    priceLabel,
    listPriceLabel,
    pricePaisa,
    initialPromo,
    venueNameHint,
    router,
    applyMethods,
  ]);

  const applyPromo = useCallback(
    async (codeRaw?: string, baseline?: BookingQuote | null) => {
      const code = (codeRaw ?? promoInput).trim();
      if (!code) {
        setPromoError("Enter a promo code.");
        return;
      }
      setApplyingPromo(true);
      setPromoError(null);
      try {
        const updated = await fetchQuote({
          courtId,
          startAt,
          durationMinutes,
          promoCode: code,
        });
        const ref = baseline ?? baseQuote;
        const listPaisa =
          ref?.listPrice?.paisa ??
          ref?.price?.paisa ??
          fallbackList?.paisa ??
          fallbackPrice?.paisa;
        const basePaisa = ref?.price?.paisa ?? fallbackPrice?.paisa;
        const incomingPromo = initialPromo?.trim() ?? "";
        const dealAlreadyOnSlot =
          Boolean(incomingPromo) &&
          code.toUpperCase() === incomingPromo.toUpperCase() &&
          fallbackPrice?.paisa != null &&
          fallbackList?.paisa != null &&
          fallbackPrice.paisa < fallbackList.paisa;
        const applied =
          dealAlreadyOnSlot ||
          (basePaisa != null &&
            updated.price?.paisa != null &&
            updated.price.paisa < basePaisa) ||
          (listPaisa != null &&
            updated.price?.paisa != null &&
            updated.price.paisa < listPaisa);

        if (!applied) {
          // Still keep quote if API accepted the code and returned a price (slot-level deal).
          if (updated.price?.paisa != null && initialPromo?.trim()) {
            setPromoInput(code);
            setQuote(updated);
            setPromoApplied(true);
            setPromoError(null);
            applyMethods(updated);
            return;
          }
          setPromoApplied(false);
          setPromoError("That promo code is not valid for this slot.");
          return;
        }
        setPromoInput(code);
        setQuote(updated);
        setPromoApplied(true);
        setPromoError(null);
        applyMethods(updated);
      } catch (err) {
        const api = err as ApiError;
        // Deal already priced into the slot — keep the code marked applied from query.
        const incoming = initialPromo?.trim() ?? "";
        if (incoming && code.toUpperCase() === incoming.toUpperCase()) {
          setPromoInput(code);
          setPromoApplied(true);
          setPromoError(null);
          return;
        }
        setPromoApplied(false);
        setPromoError(
          messageForCode(api.messageCode, api.message, api.fields) ||
            "Could not apply promo.",
        );
      } finally {
        setApplyingPromo(false);
      }
    },
    [
      promoInput,
      courtId,
      startAt,
      durationMinutes,
      baseQuote,
      fallbackList,
      fallbackPrice,
      applyMethods,
      initialPromo,
    ],
  );

  function clearPromo() {
    setPromoInput("");
    setPromoApplied(false);
    setPromoError(null);
    if (baseQuote) {
      setQuote(baseQuote);
      applyMethods(baseQuote);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await loadBaseQuote();
      if (cancelled) return;
      const auto = initialPromo?.trim();
      if (auto) {
        setPromoInput(auto);
        // Mark applied immediately when the slot already carried a deal promo.
        if (
          fallbackPrice?.paisa != null &&
          fallbackList?.paisa != null &&
          fallbackPrice.paisa < fallbackList.paisa
        ) {
          setPromoApplied(true);
        }
        await applyPromo(auto, data);
      }
    })();
    return () => {
      cancelled = true;
    };
    // Initial load only — promo re-apply is user-driven after that.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courtId, startAt, durationMinutes]);

  // Bank transfer only when the venue has deposit details (API paymentMethods).
  const methods = quote?.paymentMethods ?? baseQuote?.paymentMethods ?? [];
  const offerBank = methods.includes("BANK_TRANSFER_DEPOSIT");
  const offerVenue = methods.length === 0 || methods.includes("PAY_AT_VENUE");

  const displayPrice = quote?.price ?? baseQuote?.price ?? fallbackPrice;
  const displayList = quote?.listPrice ?? baseQuote?.listPrice ?? fallbackList;
  const paisa = displayPrice?.paisa ?? pricePaisa;
  const depositNow = paisa != null ? depositPaisa(paisa) : null;
  const hasDiscount =
    promoApplied &&
    displayList?.paisa != null &&
    displayPrice?.paisa != null &&
    displayPrice.paisa < displayList.paisa;

  const venueTitle = quote?.venueName ?? baseQuote?.venueName ?? venueNameHint ?? "Venue";
  const courtTitle = quote?.courtName ?? baseQuote?.courtName ?? courtName;
  const when = quote?.startAt ?? baseQuote?.startAt ?? startAt;
  const mins = quote?.durationMinutes ?? baseQuote?.durationMinutes ?? durationMinutes;
  const dateParam = when.slice(0, 10);

  function goToBooking(id: string, reference?: string, deposit = false) {
    const q = new URLSearchParams();
    if (reference) q.set("ref", reference);
    if (deposit) q.set("deposit", "1");
    router.replace(`/play/bookings/${id}?${q.toString()}`);
  }

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      const booking = await apiFetch<{ id?: string; reference?: string }>(
        backendApi("api/v1/bookings"),
        {
          method: "POST",
          json: {
            courtId,
            startAt,
            durationMinutes,
            paymentMethod: method,
            ...(displayPrice?.paisa != null ? { quotedPricePaisa: displayPrice.paisa } : {}),
            ...(promoApplied && promoInput.trim()
              ? { promoCode: promoInput.trim() }
              : {}),
          },
          headers: { "Idempotency-Key": idempotencyKey },
        },
      );
      const id = booking.id ?? "";
      // App: bank transfer → upload modal first, then confirmation screen.
      if (method === "BANK_TRANSFER_DEPOSIT" && id) {
        setBusy(false);
        setDepositBookingId(id);
        // Keep reference on the dialog skip path via sessionStorage.
        if (booking.reference) {
          sessionStorage.setItem(`sporttek-booking-ref:${id}`, booking.reference);
        }
        return;
      }
      goToBooking(id, booking.reference, false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        const next = new URLSearchParams({
          venueId,
          courtId,
          startAt,
          durationMinutes: String(durationMinutes),
          courtName,
        });
        if (priceLabel) next.set("price", priceLabel);
        if (promoApplied && promoInput.trim()) next.set("promoCode", promoInput.trim());
        if (venueNameHint) next.set("venueName", venueNameHint);
        router.push(
          `/play/login?next=${encodeURIComponent(`/play/checkout?${next.toString()}`)}`,
        );
        return;
      }
      const api = err as ApiError;
      setError(messageForCode(api.messageCode, api.message, api.fields));
    } finally {
      setBusy(false);
    }
  }

  function finishDeposit(id: string) {
    const ref = sessionStorage.getItem(`sporttek-booking-ref:${id}`) ?? undefined;
    setDepositBookingId(null);
    goToBooking(id, ref, true);
  }

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
      <Link
        href={`/play/venues/${venueId}/slots?date=${encodeURIComponent(dateParam)}`}
        className="inline-flex items-center gap-1.5 text-base font-bold text-[#17354F] transition hover:text-[#4F8F38] dark:text-white dark:hover:text-[#D4E22A]"
      >
        <ChevronLeft size={20} />
        Back to slots
      </Link>

      <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-[#17354F] dark:text-white sm:text-4xl">
        How will you pay?
      </h1>
      <p className="mt-2 max-w-2xl text-base font-medium text-neutral-500 dark:text-white/55">
        Confirm the booking details, apply a promo if you have one, then choose how to pay.
      </p>

      {quoteNote ? (
        <div className="mt-6 max-w-3xl rounded-2xl bg-amber-50 px-5 py-3.5 text-sm font-semibold text-amber-900 dark:bg-amber-950/50 dark:text-amber-100">
          {quoteNote}
        </div>
      ) : null}

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-start xl:gap-12">
        <section className="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-[0_12px_32px_rgba(23,53,79,0.08)] dark:border-white/10 dark:bg-[#17354F] sm:p-8">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-neutral-400 dark:text-white/45">
            Booking summary
          </p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#17354F] dark:text-white">
            {loading ? "Loading…" : venueTitle}
          </h2>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <SummaryItem label="Court" value={courtTitle} />
            <SummaryItem label="Date" value={formatDate(when)} />
            <SummaryItem label="Time" value={formatTime(when)} />
            <SummaryItem label="Length" value={`${mins} min`} />
          </dl>

          {/* Promo */}
          <div
            className={cn(
              "mt-8 rounded-2xl border p-4",
              promoApplied
                ? "border-[#65AA2B] bg-[#E8F4DC] dark:bg-[#1E3A24]"
                : promoError
                  ? "border-red-200 bg-red-50/80 dark:border-red-900/40 dark:bg-red-950/30"
                  : "border-black/[0.06] bg-neutral-50 dark:border-white/10 dark:bg-white/5",
            )}
          >
            <div className="flex items-center gap-2">
              <Tag
                size={16}
                className={promoApplied ? "text-[#4F8F38] dark:text-[#D4E22A]" : "text-neutral-400"}
              />
              <p className="text-sm font-extrabold text-[#17354F] dark:text-white">Promo code</p>
              {promoApplied ? (
                <span className="ml-auto text-xs font-extrabold text-[#4F8F38] dark:text-[#D4E22A]">
                  Applied
                </span>
              ) : null}
            </div>
            <div className="mt-3 flex gap-2">
              <Input
                value={promoInput}
                disabled={applyingPromo || promoApplied || busy}
                placeholder="Enter code"
                className="dark:border-white/15 dark:bg-[#0F1C28] dark:text-white"
                onChange={(e) => {
                  setPromoInput(e.target.value.toUpperCase());
                  setPromoError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void applyPromo();
                  }
                }}
              />
              {promoApplied ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 shrink-0 rounded-xl px-3"
                  disabled={busy}
                  onClick={clearPromo}
                >
                  <X size={16} />
                  Clear
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 shrink-0 rounded-xl px-4"
                  disabled={applyingPromo || busy || !promoInput.trim()}
                  onClick={() => void applyPromo()}
                >
                  {applyingPromo ? "…" : "Apply"}
                </Button>
              )}
            </div>
            {promoError ? (
              <p className="mt-2 text-xs font-semibold text-red-700 dark:text-red-300">{promoError}</p>
            ) : promoApplied ? (
              <p className="mt-2 text-xs font-semibold text-[#4F8F38] dark:text-[#D4E22A]">
                Deal discount is on this booking.
              </p>
            ) : (
              <p className="mt-2 text-xs font-medium text-neutral-500 dark:text-white/50">
                Deal codes from exclusive offers apply automatically when present.
              </p>
            )}
          </div>

          {(quote ?? baseQuote)?.cancellationPolicy ? (
            <p className="mt-6 text-sm leading-relaxed text-neutral-500 dark:text-white/55">
              {(quote ?? baseQuote)?.cancellationPolicy}
            </p>
          ) : null}

          <div className="mt-8 flex items-end justify-between gap-4 border-t border-black/[0.06] pt-6 dark:border-white/10">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-neutral-400 dark:text-white/45">
                Total
              </p>
              <div className="mt-1 flex items-baseline gap-2.5">
                {(hasDiscount ||
                  (displayList?.display &&
                    displayList.paisa != null &&
                    displayPrice?.paisa != null &&
                    displayList.paisa !== displayPrice.paisa)) &&
                displayList?.display ? (
                  <span className="text-base font-semibold text-neutral-400 line-through">
                    {moneyDisplay(displayList)}
                  </span>
                ) : null}
                <span className="text-4xl font-extrabold tracking-tight text-[#4F8F38] dark:text-[#D4E22A]">
                  {moneyDisplay(displayPrice)}
                </span>
              </div>
              {method === "BANK_TRANSFER_DEPOSIT" && depositNow != null ? (
                <p className="mt-2 text-sm font-semibold text-neutral-500 dark:text-white/55">
                  {formatPkrFromPaisa(depositNow)} deposit now · balance at venue
                </p>
              ) : null}
            </div>
          </div>

          {(quote ?? baseQuote)?.overlapWarning ? (
            <p className="mt-5 rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm font-semibold text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
              You already have another booking that overlaps this time.
            </p>
          ) : null}
        </section>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <h2 className="text-lg font-extrabold tracking-tight text-[#17354F] dark:text-white">
            Payment method
          </h2>

          {offerVenue ? (
            <MethodCard
              selected={method === "PAY_AT_VENUE"}
              icon={<Store size={22} />}
              title="Pay at the venue"
              body="No payment now. Show your reference at the desk when you arrive."
              onClick={() => setMethod("PAY_AT_VENUE")}
              disabled={busy}
            />
          ) : null}

          {offerBank ? (
            <MethodCard
              selected={method === "BANK_TRANSFER_DEPOSIT"}
              icon={<Building2 size={22} />}
              title="Bank transfer"
              body="Transfer now, then upload a screenshot. The rest is due at the venue."
              accent
              onClick={() => setMethod("BANK_TRANSFER_DEPOSIT")}
              disabled={busy}
            />
          ) : null}

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100">
              {error}
            </div>
          ) : null}

          <Button
            type="button"
            disabled={busy || loading}
            className="h-14 w-full rounded-2xl bg-gradient-to-br from-[#4F8F38] to-[#66AB27] text-base font-bold text-white hover:from-[#458032] hover:to-[#5a9826] disabled:opacity-40"
            onClick={() => void confirm()}
          >
            {busy ? (
              "Booking…"
            ) : (
              <>
                <CheckCircle2 size={20} />
                {method === "BANK_TRANSFER_DEPOSIT" ? "Pay deposit & hold" : "Confirm booking"}
              </>
            )}
          </Button>
        </aside>
      </div>

      {depositBookingId ? (
        <DepositUploadDialog
          bookingId={depositBookingId}
          onDone={() => finishDeposit(depositBookingId)}
          onSkip={() => finishDeposit(depositBookingId)}
        />
      ) : null}
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-neutral-400 dark:text-white/45">
        {label}
      </dt>
      <dd className="mt-1 text-base font-extrabold text-[#17354F] dark:text-white">{value}</dd>
    </div>
  );
}

function MethodCard({
  selected,
  icon,
  title,
  body,
  onClick,
  disabled,
  accent = false,
}: {
  selected: boolean;
  icon: React.ReactNode;
  title: string;
  body: string;
  onClick: () => void;
  disabled?: boolean;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-4 rounded-2xl border p-5 text-left transition",
        selected
          ? accent
            ? "border-[#65AA2B] bg-[#E8F4DC] shadow-[0_8px_20px_rgba(79,143,56,0.15)] dark:border-[#65AA2B] dark:bg-[#1E3A24]"
            : "border-[#65AA2B] bg-[#F3F7F0] shadow-[0_8px_20px_rgba(23,53,79,0.1)] dark:border-[#65AA2B] dark:bg-[#1a2f42]"
          : "border-black/[0.06] bg-white hover:border-[#65AA2B]/40 dark:border-white/10 dark:bg-[#17354F]",
      )}
    >
      <span
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
          selected
            ? "bg-[#4F8F38] text-white"
            : "bg-neutral-100 text-[#4F8F38] dark:bg-white/10 dark:text-[#D4E22A]",
        )}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-3">
          <span className="text-base font-extrabold text-[#17354F] dark:text-white">{title}</span>
          <span
            className={cn(
              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
              selected ? "border-[#4F8F38] bg-[#4F8F38]" : "border-neutral-300 dark:border-white/30",
            )}
          >
            {selected ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
          </span>
        </span>
        <span className="mt-1 block text-sm font-medium leading-relaxed text-neutral-500 dark:text-white/55">
          {body}
        </span>
      </span>
    </button>
  );
}
