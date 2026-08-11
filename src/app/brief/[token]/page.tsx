/**
 * /brief/[token] — a saved brief, at a permanent address.
 *
 * The reason this route exists: a generated brief used to live only in the tab
 * that made it. A refresh, a back button or a closed laptop destroyed several
 * minutes of the user's work and a paid model call, and there was no way to
 * send it to anyone. Now every generated brief gets one of these.
 *
 * The token is random and unguessable rather than a sequential id, so a link
 * is shareable without exposing anyone else's work. Not indexed — a brief is
 * the user's, not ours to publish.
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { db, concepts } from "@/db";
import type { GenerateBriefResponse } from "@/lib/ai/prompts/generate-brief";
import type { BriefFacts } from "@/components/wizard/BriefPDF";
import type { BriefPins } from "@/components/wizard/BriefDisplay";
import SavedBrief from "./SavedBrief";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

async function loadBrief(token: string) {
  const rows = await db
    .select()
    .from(concepts)
    .where(eq(concepts.shareToken, token))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Can BriefDisplay actually render this?
 *
 * A saved brief is stored WHOLE, which is what lets an old one keep rendering
 * as it did the day it was made. The flip side is that this page will happily
 * hand any historical shape to a component that reads `brief.lighting.strategy`
 * without asking — and the brief schema has already changed more than once.
 * When it drifts again, a link someone was relying on should say so, not
 * return a blank 500.
 */
function isRenderable(brief: unknown): brief is GenerateBriefResponse {
  if (!brief || typeof brief !== "object") return false;
  const b = brief as Record<string, unknown>;
  const arrays = ["keywords", "colorSystem", "materials", "furniture", "spatialNotes", "dos", "donts", "nextSteps"];
  if (!arrays.every((k) => Array.isArray(b[k]))) return false;
  if (typeof b.conceptLine !== "string") return false;
  const summary = b.summary as Record<string, unknown> | undefined;
  if (!summary || typeof summary.projectType !== "string") return false;
  const lighting = b.lighting as Record<string, unknown> | undefined;
  return !!lighting && Array.isArray(lighting.layers);
}

export default async function SavedBriefPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  let row: Awaited<ReturnType<typeof loadBrief>> | null = null;
  try {
    row = await loadBrief(token);
  } catch (error) {
    // A database hiccup should read as "we couldn't find it", not a stack
    // trace — the visitor can't act on the difference either way.
    console.error("[/brief] lookup failed:", error);
  }
  if (!row?.brief) notFound();

  if (!isRenderable(row.brief)) {
    console.error(`[/brief] unrenderable payload for token ${token}`);
    return (
      <main className="mx-auto max-w-2xl px-6 py-20 text-center sm:px-8">
        <h1 className="font-serif text-[clamp(24px,3.5vw,34px)] font-normal leading-[1.15] text-txt">
          This brief can&apos;t be displayed.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-txt-2">
          It was saved in a format this page no longer knows how to read. The
          brief itself is safe — nothing has been deleted.
        </p>
        <Link
          href="/concept/quick"
          className="mt-8 inline-block border border-acc px-6 py-3 text-[12px] font-medium uppercase tracking-[0.1em] text-acc transition hover:bg-acc hover:text-white"
        >
          Start a new brief
        </Link>
      </main>
    );
  }

  return (
    <SavedBrief
      brief={row.brief as unknown as GenerateBriefResponse}
      pins={(row.briefPins ?? undefined) as BriefPins | undefined}
      facts={(row.briefFacts ?? undefined) as BriefFacts | undefined}
      savedAt={row.createdAt.toISOString()}
    />
  );
}
