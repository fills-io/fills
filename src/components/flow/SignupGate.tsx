"use client";

/**
 * SignupGate — the "Your concept is ready" sign-in step. Design-first:
 * the providers are visual stubs; any of them (or the email Continue)
 * advances to the concept page. Real auth (Clerk) lands in Phase 6.
 */

import { useState } from "react";

export default function SignupGate({ onContinue }: { onContinue: () => void }) {
  const [email, setEmail] = useState("");

  return (
    <main className="mx-auto flex min-h-[calc(100vh-60px)] max-w-[440px] flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-acc">
        04 · Sign in to view
      </div>
      <h2 className="mb-3 font-serif text-[clamp(26px,4vw,38px)] font-normal leading-[1.1] tracking-tight text-txt">
        Your concept is <em className="italic text-acc">ready</em>.
      </h2>
      <p className="mb-9 max-w-[360px] text-[14px] leading-relaxed text-txt-2">
        Create a free account to view your full editorial brief, edit it, and
        export a mood board.
      </p>

      <div className="w-full space-y-2.5">
        <button
          onClick={onContinue}
          className="flex w-full items-center justify-center gap-2.5 border border-bdr-2 bg-bg-2 px-5 py-3.5 text-[13px] font-medium text-txt transition hover:border-acc"
        >
          <span className="font-mono text-[13px]">G</span> Continue with Google
        </button>
        <button
          onClick={onContinue}
          className="flex w-full items-center justify-center gap-2.5 border border-bdr-2 bg-bg-2 px-5 py-3.5 text-[13px] font-medium text-txt transition hover:border-acc"
        >
          <span className="text-[14px]"></span> Continue with Apple
        </button>
      </div>

      <div className="my-5 flex w-full items-center gap-3 font-mono text-[9px] uppercase tracking-[0.16em] text-txt-3">
        <span className="h-px flex-1 bg-bdr-2" /> or <span className="h-px flex-1 bg-bdr-2" />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onContinue();
        }}
        className="flex w-full gap-2"
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@studio.com"
          className="flex-1 border border-bdr-2 bg-bg-2 px-4 py-3.5 text-[14px] text-txt outline-none placeholder:text-txt-3 focus:border-acc"
        />
        <button
          type="submit"
          className="bg-acc px-5 text-[12px] font-medium uppercase tracking-[0.08em] text-white transition hover:bg-acc-h"
        >
          Continue
        </button>
      </form>

      <p className="mt-6 font-mono text-[9px] uppercase tracking-[0.12em] text-txt-3">
        Free trial · no card required
      </p>
    </main>
  );
}
