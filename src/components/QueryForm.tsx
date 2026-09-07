"use client";

import { useState } from "react";
import { Loader2, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { sendEmail } from "@/app/actions/sendEmail";

export function QueryForm() {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus("idle");

    const form = event.currentTarget;
    const data = new FormData(form);

    const result = await sendEmail({
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      phone: String(data.get("phone") ?? "") || undefined,
      role: String(data.get("role") ?? "") || undefined,
      message: String(data.get("message") ?? ""),
    });

    setBusy(false);
    if (result.success) {
      setStatus("success");
      form.reset();
    } else {
      setStatus("error");
      setErrorMessage(result.error ?? "Something went wrong.");
    }

    window.setTimeout(() => setStatus("idle"), 7000);
  }

  return (
    <form className="query-form" onSubmit={handleSubmit} noValidate>
      <div className="query-grid">
        <label>
          <span>Name</span>
          <input name="name" type="text" autoComplete="name" required placeholder="Your name" />
        </label>
        <label>
          <span>Email</span>
          <input name="email" type="email" autoComplete="email" required placeholder="you@email.com" />
        </label>
        <label>
          <span>Phone</span>
          <input name="phone" type="tel" autoComplete="tel" placeholder="03xx xxxxxxx" />
        </label>
        <label>
          <span>I am a</span>
          <select name="role" defaultValue="Player">
            <option>Player</option>
            <option>Venue owner</option>
            <option>Partner</option>
            <option>Press</option>
          </select>
        </label>
      </div>
      <label className="query-message">
        <span>Message</span>
        <textarea name="message" required rows={5} placeholder="Tell us what you need — a court, a partnership, or a question." />
      </label>
      <button type="submit" className="query-submit" disabled={busy}>
        {busy ? <Loader2 className="spin" size={18} /> : <Send size={18} />}
        {busy ? "Sending" : "Send query"}
      </button>
      {status === "success" ? (
        <p className="query-note query-note--ok" role="status">
          <CheckCircle2 size={16} /> Received. We will reply from info@sporttek.pk.
        </p>
      ) : null}
      {status === "error" ? (
        <p className="query-note query-note--err" role="alert">
          <AlertCircle size={16} /> {errorMessage}
        </p>
      ) : null}
    </form>
  );
}
