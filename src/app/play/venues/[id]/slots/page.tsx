"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { BrandLoader } from "@/components/play/brand-loader";
import { SlotPickerDesk } from "@/components/play/slot-picker-desk";

function SlotsInner() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  return (
    <SlotPickerDesk
      slugOrId={params.id}
      initialDate={search.get("date") ?? undefined}
      initialCourtId={search.get("courtId") ?? undefined}
      initialStart={search.get("start") ?? undefined}
    />
  );
}

export default function SlotsPage() {
  return (
    <Suspense
      fallback={<BrandLoader label="Loading slots" variant="inline" />}
    >
      <SlotsInner />
    </Suspense>
  );
}
