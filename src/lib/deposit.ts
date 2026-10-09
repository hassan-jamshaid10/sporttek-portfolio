/** Same formula as mobile `deposit_amount.dart`. */
export function depositPaisa(
  pricePaisa: number,
  {
    percentage = 25,
    roundUpToPaisa = 10000,
    minimumPaisa = 50000,
  }: { percentage?: number; roundUpToPaisa?: number; minimumPaisa?: number } = {},
) {
  const raw = Math.floor((pricePaisa * percentage) / 100);
  const rounded = Math.ceil(raw / roundUpToPaisa) * roundUpToPaisa;
  return Math.max(rounded, minimumPaisa);
}

export function formatPkrFromPaisa(paisa: number) {
  return `PKR ${(paisa / 100).toLocaleString("en-PK")}`;
}

/** Same shape as mobile `formatCountdown`. */
export function formatCountdown(ms: number) {
  if (ms <= 0) return "0:00";
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const rm = m % 60;
    return `${h}:${String(rm).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function rejectReasonCopy(reason?: string) {
  switch (reason) {
    case "AMOUNT_MISMATCH":
      return "The amount did not match.";
    case "NOT_RECEIVED":
      return "The venue has not received the transfer yet.";
    case "UNREADABLE_IMAGE":
      return "The screenshot was not readable.";
    case "DUPLICATE_PROOF":
      return "That screenshot was already used.";
    case "WRONG_ACCOUNT":
      return "It was sent to the wrong account.";
    case "OTHER":
      return "The venue asked for another screenshot.";
    default:
      return "The venue could not match that screenshot.";
  }
}
