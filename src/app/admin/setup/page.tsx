/**
 * /admin/setup — apply pending database changes without leaving the site.
 *
 * Behind the same Basic Auth as the rest of /admin (see middleware.ts).
 *
 * Why this page exists: DATABASE_URL is encrypted in Vercel and can't be
 * pulled locally, so `pnpm db:migrate` can only ever run from a machine that
 * has the real connection string. In practice that has meant hand-pasting SQL
 * into the Supabase dashboard, and the last change stalled there. A button on
 * a page the founder already visits is a better handoff than a set of
 * instructions about a dashboard she doesn't otherwise use.
 */

import Link from "next/link";
import SetupClient from "./SetupClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = { robots: { index: false, follow: false } };

export default function AdminSetupPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-14 sm:px-8">
      <Link
        href="/admin"
        className="font-mono text-[10px] uppercase tracking-[0.14em] text-txt-3 transition hover:text-acc"
      >
        ← Admin
      </Link>

      <h1 className="mt-6 font-serif text-[clamp(28px,4vw,40px)] font-normal leading-[1.12] tracking-tight text-txt">
        Database setup
      </h1>
      <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-txt-2">
        When the site learns to store something new, its database needs a place
        to put it. This page shows whether yours is ready, and adds anything
        missing.
      </p>

      <div className="mt-10">
        <SetupClient />
      </div>
    </main>
  );
}
