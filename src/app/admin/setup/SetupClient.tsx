"use client";

/**
 * The button half of /admin/setup. See page.tsx for why this exists.
 *
 * Written for a non-technical reader: it says what will happen before it
 * happens, and what happened afterwards, in words rather than status codes.
 */

import { useCallback, useEffect, useState } from "react";

type ColumnStatus = {
  table: string;
  column: string;
  present: boolean;
  why: string;
};

type Status = {
  ok: boolean;
  pending?: number;
  columns?: ColumnStatus[];
  error?: string;
};

export default function SetupClient() {
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/migrate");
      setStatus((await res.json()) as Status);
    } catch {
      setStatus({ ok: false, error: "Couldn't reach the database." });
    }
  }, []);

  // Reading the live schema on mount is exactly the external-system sync the
  // rule exempts — there is no way to know what the database has without
  // asking it.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function apply() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/migrate", { method: "POST" });
      const data = (await res.json()) as Status;
      setStatus(data);
      setDone(data.ok === true);
    } catch {
      setStatus({ ok: false, error: "Couldn't reach the database." });
    } finally {
      setBusy(false);
    }
  }

  if (!status) {
    return <p className="text-[14px] text-txt-2">Checking the database…</p>;
  }

  if (!status.ok) {
    return (
      <div className="border border-rose-700/50 bg-rose-950/20 p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-rose-300">
          Couldn&apos;t check
        </p>
        <p className="mt-2 text-[14px] text-txt-2">{status.error}</p>
        <button
          onClick={load}
          className="mt-3 text-[13px] underline underline-offset-2 hover:text-acc"
        >
          Try again
        </button>
      </div>
    );
  }

  const pending = status.pending ?? 0;

  return (
    <div className="space-y-6">
      <div className="border border-bdr-2 bg-bg-2 p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-acc">
          {pending === 0 ? "Up to date" : `${pending} change${pending === 1 ? "" : "s"} waiting`}
        </p>
        <p className="mt-2 text-[14px] leading-relaxed text-txt-2">
          {pending === 0
            ? "Your database has everything the site needs. Saved briefs and their share links are working."
            : "Your database is missing some places to store things the site now produces. Nothing is broken — those features just stay switched off until this runs."}
        </p>
      </div>

      <ul className="space-y-3">
        {(status.columns ?? []).map((c) => (
          <li
            key={`${c.table}.${c.column}`}
            className="flex items-start gap-3 border-t border-bdr-2 pt-3"
          >
            <span
              className={`mt-0.5 font-mono text-[11px] ${
                c.present ? "text-acc" : "text-txt-3"
              }`}
            >
              {c.present ? "✓" : "○"}
            </span>
            <div className="min-w-0">
              <div className="text-[14px] text-txt">{c.why}</div>
              <div className="mt-0.5 font-mono text-[11px] text-txt-3">
                {c.table}.{c.column}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {pending > 0 && (
        <div>
          <button
            onClick={apply}
            disabled={busy}
            className="bg-acc px-6 py-3.5 text-[13px] font-medium uppercase tracking-[0.1em] text-white transition hover:bg-acc-h disabled:opacity-50"
          >
            {busy ? "Applying…" : "Apply the changes"}
          </button>
          <p className="mt-3 max-w-lg text-[13px] leading-relaxed text-txt-3">
            This only adds new, empty places to store things. It cannot change
            or delete anything you already have, and running it twice is
            harmless.
          </p>
        </div>
      )}

      {done && pending === 0 && (
        <p className="text-[14px] text-acc">
          Done. Every brief generated from now on gets a permanent link.
        </p>
      )}
    </div>
  );
}
