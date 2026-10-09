const KNOWN: Record<string, string> = {
  "ST-002": "Check the details and try again.",
  "ST-003": "Sign in to continue.",
  "ST-004": "You are not allowed to do that.",
  "ST-005": "Venue not found.",
  "ST-006": "That slot was just taken. Pick another.",
  "ST-007": "Too many attempts. Wait a moment.",
  "ST-008": "Something went wrong. Try again.",
  "ST-031": "Wait before requesting another code.",
  "ST-032": "That code is incorrect.",
  "ST-033": "Code expired. Request a new one.",
  "ST-034": "Too many wrong codes. Try later.",
  "ST-035": "We could not send the code. Try again.",
  "ST-036": "Enter a valid Pakistani mobile number.",
  "ST-037": "This account is blocked.",
};

export function messageForCode(
  code?: string,
  description?: string,
  fields?: Record<string, string>,
): string {
  const known = code ? KNOWN[code] : undefined;
  // Prefer the API description when present so ST-008 does not hide useful detail.
  const base = description?.trim() || known || "Something went wrong.";
  if (fields?.remainingAttempts) {
    return `${base} ${fields.remainingAttempts} attempts left.`;
  }
  if (fields?.retryAfterSeconds) {
    return `${base} Try again in ${fields.retryAfterSeconds}s.`;
  }
  return base;
}
