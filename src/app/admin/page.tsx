/**
 * /admin — internal leads dashboard (gated by Basic Auth in middleware.ts).
 *
 * Lists every email captured from the flow, with what they were designing.
 * Server component — queries Supabase directly. Fails gracefully if the
 * `leads` table doesn't exist yet or the DB is unreachable.
 */

import Link from "next/link";
import { desc } from "drizzle-orm";
import { db, leads, type Lead } from "@/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getLeads(): Promise<{ rows: Lead[]; error: string | null }> {
  try {
    const rows = await db.select().from(leads).orderBy(desc(leads.createdAt));
    return { rows, error: null };
  } catch (e) {
    return { rows: [], error: e instanceof Error ? e.message : String(e) };
  }
}

function fmtDate(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminPage() {
  const { rows, error } = await getLeads();

  return (
    <main className="min-h-screen bg-bg px-6 py-12 text-txt">
      <div className="mx-auto max-w-[1000px]">
        <div className="mb-8 flex items-end justify-between border-b border-bdr pb-6">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-acc">
              Fills · Admin
            </div>
            <h1 className="mt-2 font-serif text-[32px] font-medium text-txt">
              Early-access leads
            </h1>
            <div className="mt-3 flex gap-4">
              <Link
                href="/admin/blog"
                className="font-mono text-[10px] uppercase tracking-[0.14em] text-txt-3 transition hover:text-acc"
              >
                Blog →
              </Link>
              <Link
                href="/admin/setup"
                className="font-mono text-[10px] uppercase tracking-[0.14em] text-txt-3 transition hover:text-acc"
              >
                Database setup →
              </Link>
            </div>
          </div>
          <div className="text-right">
            <div className="font-serif text-[40px] leading-none text-acc">
              {rows.length}
            </div>
            <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-txt-3">
              total
            </div>
          </div>
        </div>

        {error ? (
          <div className="border border-amber-500/40 bg-amber-500/5 p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-amber-600">
              No data yet
            </p>
            <p className="mt-2 text-[13px] text-txt-2">
              Couldn&apos;t read the leads table. If you just set this up, make
              sure the <code className="text-acc">leads</code> table exists in
              Supabase (run the SQL from the setup step). Technical detail:{" "}
              <span className="text-txt-3">{error}</span>
            </p>
          </div>
        ) : rows.length === 0 ? (
          <p className="py-16 text-center font-serif text-[18px] italic text-txt-3">
            No leads yet. They&apos;ll appear here the moment someone enters
            their email in the flow.
          </p>
        ) : (
          <div className="overflow-x-auto border border-bdr-2">
            <table className="w-full border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-bdr-2 bg-bg-2 font-mono text-[9px] uppercase tracking-[0.12em] text-txt-3">
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Industry</th>
                  <th className="px-4 py-3 font-medium">Specifically</th>
                  <th className="px-4 py-3 font-medium">Vibe</th>
                  <th className="px-4 py-3 font-medium">Message</th>
                  <th className="px-4 py-3 font-medium">Via</th>
                  <th className="px-4 py-3 font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-bdr-2 last:border-0">
                    <td className="px-4 py-3 font-medium text-txt">{r.email}</td>
                    <td className="px-4 py-3 text-txt-2">{r.name || "—"}</td>
                    <td className="px-4 py-3 text-txt-2">{r.industry || "—"}</td>
                    <td className="px-4 py-3 text-txt-2">{r.spec || "—"}</td>
                    <td className="px-4 py-3 italic text-txt-2">{r.vibe || "—"}</td>
                    <td
                      className="max-w-[260px] truncate px-4 py-3 text-txt-2"
                      title={r.message || ""}
                    >
                      {r.message || "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.08em] text-txt-3">
                      {r.source || "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-txt-3">
                      {fmtDate(r.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-8 font-mono text-[9px] uppercase tracking-[0.12em] text-txt-3">
          Visitor traffic (page views, countries, referrers) lives in your
          Vercel dashboard → Analytics.
        </p>
      </div>
    </main>
  );
}
