"use client";

import { Globe, Mail, MessageCircle, Phone, X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";

const ROWS = [
  {
    icon: Globe,
    label: "Website",
    value: "sporttek.pk",
    href: "https://sporttek.pk",
  },
  {
    icon: Phone,
    label: "Phone",
    value: "+92 321 4736239",
    href: "tel:+923214736239",
  },
  {
    icon: Mail,
    label: "Email",
    value: "info@octabitlogics.com",
    href: "mailto:info@octabitlogics.com",
  },
  {
    icon: MessageCircle,
    label: "WhatsApp",
    value: "Chat with us",
    href: "https://wa.me/923214736239",
  },
] as const;

export function ContactDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-[#0F1C28]/60 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-title"
      onClick={onClose}
    >
      <div
        className="flex w-full max-h-[90dvh] flex-col overflow-hidden rounded-t-3xl bg-white shadow-[0_-12px_48px_rgba(23,53,79,0.35)] dark:bg-[#152636] sm:max-h-[min(32rem,85dvh)] sm:max-w-[26rem] sm:rounded-3xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-neutral-200 sm:hidden dark:bg-white/20" />

        <div className="flex shrink-0 items-start justify-between gap-3 px-4 pb-2 pt-3 sm:px-5 sm:pt-5">
          <div className="min-w-0 pr-2">
            <h2
              id="contact-title"
              className="text-lg font-extrabold text-[#17354F] dark:text-white"
            >
              Contact us
            </h2>
            <p className="mt-0.5 text-sm font-semibold text-neutral-500 dark:text-white/55">
              Reach the SportTek team.
            </p>
          </div>
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/10"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-4 pb-5 sm:px-5 sm:pb-6">
          {ROWS.map((row) => {
            const Icon = row.icon;
            return (
              <a
                key={row.label}
                href={row.href}
                target={row.href.startsWith("http") ? "_blank" : undefined}
                rel={row.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="flex items-center gap-3 rounded-2xl border border-black/[0.06] px-3.5 py-3.5 transition active:bg-[#F3F7F0] hover:border-[#65AA2B]/40 hover:bg-[#F3F7F0] dark:border-white/10 dark:active:bg-white/5 dark:hover:bg-white/5"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E8F4DC] text-[#4F8F38] dark:bg-[#1E3A24] dark:text-[#D4E22A]">
                  <Icon size={18} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] font-extrabold uppercase tracking-wide text-neutral-400 dark:text-white/45">
                    {row.label}
                  </span>
                  <span className="mt-0.5 block break-words text-[15px] font-extrabold leading-snug text-[#17354F] dark:text-white">
                    {row.value}
                  </span>
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </div>,
    document.body,
  );
}
