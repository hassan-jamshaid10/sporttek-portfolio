"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { BrandLoader } from "@/components/play/brand-loader";
import { BookingConfirmedDesk } from "@/components/play/booking-confirmed-desk";

function BookingDetailInner() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const id = params.id ?? "";
  const initialRef = search.get("ref") ?? undefined;
  const forceDeposit = search.get("deposit") === "1";

  return (
    <BookingConfirmedDesk
      bookingId={id}
      initialRef={initialRef}
      forceDeposit={forceDeposit}
    />
  );
}

export default function BookingDetailPage() {
  return (
    <Suspense
      fallback={<BrandLoader label="Loading booking" variant="inline" />}
    >
      <BookingDetailInner />
    </Suspense>
  );
}
