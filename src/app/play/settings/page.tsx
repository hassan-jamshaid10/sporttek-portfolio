"use client";

import { FormEvent, useEffect, useState } from "react";
import { usePlayUi } from "@/components/play/AppShell";
import { ApiError, apiFetch, backendApi } from "@/lib/api";
import { messageForCode } from "@/lib/auth-messages";
import { writePlayMe } from "@/lib/play-me";

export default function SettingsPage() {
  const { me, refreshMe } = usePlayUi();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (me?.fullName != null) setName(me.fullName);
  }, [me?.fullName]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setDone(null);
    try {
      await apiFetch(backendApi("api/v1/me"), {
        method: "PATCH",
        json: { fullName: name.trim() },
      });
      if (me) writePlayMe({ ...me, fullName: name.trim() });
      await refreshMe();
      setDone("Profile updated");
    } catch (err) {
      const api = err as ApiError;
      setError(messageForCode(api.messageCode, api.message, api.fields));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="play-list" style={{ gap: 14 }} onSubmit={onSubmit}>
      <h1 className="play-title">Settings</h1>
      {error ? <div className="play-banner warn">{error}</div> : null}
      {done ? <div className="play-banner">{done}</div> : null}
      <div className="play-card">
        <label className="play-label" htmlFor="name">
          Full name
        </label>
        <input id="name" className="play-input" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <button className="play-btn" type="submit" disabled={busy || name.trim().length < 2}>
        {busy ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
