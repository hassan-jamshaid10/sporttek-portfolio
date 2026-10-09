"use client";

import { useParams } from "next/navigation";
import { Suspense } from "react";
import { BrandLoader } from "@/components/play/brand-loader";
import { VenueDetailDesk } from "@/components/play/venue-detail-desk";

function VenueDetailInner() {
  const params = useParams<{ id: string }>();
  return <VenueDetailDesk slugOrId={params.id} />;
}

export default function VenueDetailPage() {
  return (
    <Suspense
      fallback={<BrandLoader label="Loading venue" variant="inline" />}
    >
      <VenueDetailInner />
    </Suspense>
  );
}
