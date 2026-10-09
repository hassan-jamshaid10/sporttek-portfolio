"use client";

import { Upload } from "lucide-react";
import { useState } from "react";
import { DepositPanel } from "@/components/play/deposit-panel";
import { Button } from "@/components/ui/button";

/** Same flow as mobile `_showDepositUploadModal` after bank-transfer create. */
export function DepositUploadDialog({
  bookingId,
  onDone,
  onSkip,
}: {
  bookingId: string;
  onDone: () => void;
  onSkip: () => void;
}) {
  const [showCheck, setShowCheck] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#0F1C28]/55 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="deposit-upload-title"
    >
      <div className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-[28px] bg-white shadow-[0_-8px_40px_rgba(23,53,79,0.28)] dark:bg-[#152636] sm:rounded-[28px]">
        {showCheck ? (
          <div className="flex h-[320px] items-center justify-center">
            <div className="flex h-24 w-24 animate-[bounce_0.6s_ease] items-center justify-center rounded-full bg-gradient-to-br from-[#4F8F38] to-[#66AB27] shadow-[0_12px_32px_rgba(79,143,56,0.35)]">
              <svg viewBox="0 0 24 24" className="h-12 w-12 text-white" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        ) : (
          <div className="px-5 pb-6 pt-3 sm:px-6 sm:pb-7 sm:pt-4">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-neutral-200 dark:bg-[#3D5A75] sm:hidden" />
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E6F0E1] dark:bg-[#1B2E40]">
                <Upload size={22} className="text-[#4F8F38] dark:text-[#D4E22A]" />
              </div>
              <div>
                <h2
                  id="deposit-upload-title"
                  className="text-lg font-extrabold text-[#17354F] dark:text-white"
                >
                  Upload screenshot
                </h2>
                <p className="mt-0.5 text-sm font-semibold leading-snug text-neutral-500 dark:text-white/55">
                  Transfer now, then upload a screenshot. The rest is due at the venue.
                </p>
              </div>
            </div>

            <div className="mt-5">
              <DepositPanel
                bookingId={bookingId}
                compact
                onUpdated={() => {
                  setShowCheck(true);
                  window.setTimeout(() => onDone(), 1400);
                }}
              />
            </div>

            <Button
              type="button"
              variant="outline"
              className="mt-4 h-12 w-full rounded-xl"
              onClick={onSkip}
            >
              Go back
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
