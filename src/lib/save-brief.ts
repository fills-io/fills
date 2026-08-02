/**
 * Save a finished brief so it survives the tab it was made in.
 *
 * Deliberately swallows every failure. The brief is already on the user's
 * screen by the time this runs; if saving fails they simply don't get a share
 * link, which is far better than an error covering work they can see.
 */

import type { GenerateBriefResponse } from "@/lib/ai/prompts/generate-brief";

type SaveInput = {
  brief: GenerateBriefResponse;
  pins?: unknown;
  facts?: unknown;
  spaceType?: string;
  creationMode?: "quick" | "full" | "from-image";
};

export async function saveBrief(input: SaveInput): Promise<string | null> {
  try {
    const res = await fetch("/api/concepts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { shareToken?: string };
    return data.shareToken ?? null;
  } catch {
    return null;
  }
}
