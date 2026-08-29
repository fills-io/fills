"use client";

/**
 * "Talk to a designer" inquiry form. Posts to /api/leads with
 * source="talk-to-designer" so inquiries land in the same admin dashboard
 * as the rest of the leads. No external scheduler needed — Aisha replies and
 * books the call by hand (the concierge stage).
 */

import { useState } from "react";

export default function TalkToDesignerForm({
  initialMessage = "",
}: {
  initialMessage?: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(initialMessage);
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please add your email so we can reply.");
      return;
    }
    setStatus("sending");
    setError(null);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || undefined,
          message: message.trim() || undefined,
          source: "talk-to-designer",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || "Something went wrong. Please try again.");
      }
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  if (status === "done") {
    return (
      <div className="relative border border-bdr-2 bg-bg-2 p-8 text-center">
        <span className="absolute left-0 top-0 h-[16px] w-[16px] border-l-[1.5px] border-t-[1.5px] border-acc" />
        <span className="absolute bottom-0 right-0 h-[16px] w-[16px] border-b-[1.5px] border-r-[1.5px] border-acc" />
        <h2 className="font-serif text-[24px] font-medium text-txt">
          Thank you, your message is in.
        </h2>
        <p className="mt-3 text-[14px] leading-relaxed text-txt-2">
          A designer will reply by email shortly. While you wait, you can{" "}
          <a
            href="/concept/quick"
            className="text-acc underline decoration-acc/40 underline-offset-2 hover:decoration-acc"
          >
            start a brief
          </a>
          .
        </p>
      </div>
    );
  }

  const label = "block font-mono text-[10px] uppercase tracking-[0.14em] text-txt-3 mb-1.5";
  const input = "w-full border border-bdr-2 bg-bg-2 px-3 py-2.5 text-[14px] text-txt outline-none transition focus:border-acc";

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="ttd-name">Your name</label>
          <input
            id="ttd-name"
            className={input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Doe"
          />
        </div>
        <div>
          <label className={label} htmlFor="ttd-email">Email</label>
          <input
            id="ttd-email"
            type="email"
            className={input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@studio.com"
          />
        </div>
      </div>
      <div>
        <label className={label} htmlFor="ttd-message">What are you working on?</label>
        <textarea
          id="ttd-message"
          className={`${input} min-h-[140px] leading-relaxed`}
          // Matches the `message` cap on /api/leads.
          maxLength={2000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="A retail unit in a Dubai mall, a home renovation, a restaurant build-out… tell us a little about the project and where you'd like help."
        />
      </div>

      {error && (
        <p className="border border-rose-500/40 bg-rose-500/5 px-4 py-3 text-[13px] text-rose-600">
          {error}
        </p>
      )}

      <div>
        <button
          type="submit"
          disabled={status === "sending"}
          className="inline-flex items-center gap-2 bg-acc px-7 py-3.5 text-[13px] font-medium text-white transition hover:gap-3 hover:bg-acc-d disabled:opacity-50"
        >
          {status === "sending" ? "Sending…" : "Send message →"}
        </button>
        {/* Someone typing their email into a box deserves to know where it
            goes. This is what actually happens: it's stored, a person reads
            it, they reply. No list, no resale. */}
        <p className="mt-4 text-[12px] leading-relaxed text-txt-3">
          We store your message and email so a designer can reply. We
          won&apos;t add you to a mailing list or pass it on — see our{" "}
          <a
            href="/privacy"
            className="underline decoration-txt-3/40 underline-offset-2 transition hover:text-acc hover:decoration-acc"
          >
            privacy policy
          </a>
          .
        </p>
      </div>
    </form>
  );
}
