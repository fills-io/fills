"use client";

/**
 * SignupGate — honest email capture (no fake social sign-in).
 *
 * The visitor enters their email to view + save their concept. We store it
 * as an early-access lead (with what they were designing) via /api/leads —
 * best-effort, so a storage hiccup never blocks them. Real accounts (Clerk)
 * land in Phase 6; until then this is a genuine waitlist, not a fake login.
 */

import { useState } from "react";
import type { FlowState } from "./FlowApp";

export default function SignupGate({
  state,
  onContinue,
}: {
  state: FlowState;
  onContinue: () => void;
}) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    // Fire-and-forget: never block the user on storage.
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          industry: state.industry || undefined,
          spec: state.spec || undefined,
          vibe: state.vibe || undefined,
          source: state.entryPath,
        }),
      });
    } catch {
      // ignore — still let them through
    }
    onContinue();
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-60px)] max-w-[440px] flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-acc">
        04 · Almost there
      </div>
      <h2 className="mb-3 font-serif text-[clamp(26px,4vw,38px)] font-normal leading-[1.1] tracking-tight text-txt">
        Your concept is <em className="italic text-acc">ready</em>.
      </h2>
      <p className="mb-8 max-w-[360px] text-[14px] leading-relaxed text-txt-2">
        Drop your email to view your full brief and save it — we&apos;ll send
        you a copy and let you know when full accounts open.
      </p>

      <form onSubmit={submit} className="flex w-full flex-col gap-2.5">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@studio.com"
          className="w-full border border-bdr-2 bg-bg-2 px-4 py-3.5 text-center text-[15px] text-txt outline-none placeholder:text-txt-3 focus:border-acc"
        />
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center justify-center gap-2 bg-acc px-6 py-3.5 text-[13px] font-medium text-white transition hover:gap-3 hover:bg-acc-h disabled:opacity-70"
        >
          {busy ? "One moment…" : "View my concept →"}
        </button>
      </form>

      <p className="mt-5 font-mono text-[9px] uppercase tracking-[0.12em] text-txt-3">
        Free · no card · no spam
      </p>
    </main>
  );
}
