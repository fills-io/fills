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

  return (
    <SavedBrief
      brief={row.brief as unknown as GenerateBriefResponse}
      pins={(row.briefPins ?? undefined) as BriefPins | undefined}
      facts={(row.briefFacts ?? undefined) as BriefFacts | undefined}
      savedAt={row.createdAt.toISOString()}
    />
  );
}
