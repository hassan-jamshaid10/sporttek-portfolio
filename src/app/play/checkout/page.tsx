"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { BrandLoader } from "@/components/play/brand-loader";
import { CheckoutDesk } from "@/components/play/checkout-desk";

function CheckoutInner() {
  const search = useSearchParams();
  const venueId = search.get("venueId") ?? "";
  const courtId = search.get("courtId") ?? "";
  const startAt = search.get("startAt") ?? "";
  const durationMinutes = Number(search.get("durationMinutes") || 60);
  const courtName = search.get("courtName") || "Court";
  const priceLabel = search.get("price") || undefined;
  const listPriceLabel = search.get("listPrice") || undefined;
  const pricePaisaRaw = search.get("pricePaisa");
  const pricePaisa = pricePaisaRaw ? Number(pricePaisaRaw) : undefined;
  const promoCode = search.get("promoCode") || undefined;
  const venueName = search.get("venueName") || undefined;

  if (!venueId || !courtId || !startAt) {
    return (
      <div className="mx-auto max-w-lg px-5 py-16 text-center">
        <p className="font-extrabold text-[#17354F] dark:text-white">
          Missing slot details. Pick a slot again.
        </p>
      </div>
    );
  }

  return (
    <CheckoutDesk
      venueId={venueId}
      courtId={courtId}
      startAt={startAt}
      durationMinutes={durationMinutes}
      courtName={courtName}
      priceLabel={priceLabel}
      listPriceLabel={listPriceLabel}
      pricePaisa={Number.isFinite(pricePaisa) ? pricePaisa : undefined}
      promoCode={promoCode}
      venueNameHint={venueName}
    />
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={<BrandLoader label="Loading checkout" variant="inline" />}
    >
      <CheckoutInner />
    </Suspense>
  );
}
