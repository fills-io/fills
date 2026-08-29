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

/**
 * The two tokens a saved brief comes back with.
 *
 * `shareToken` is the public address, safe to hand to a designer. `editToken`
 * is write capability and must never leave the browser that made the brief —
 * it is what lets that person re-pick their own reference images later.
 */
export type SavedBriefTokens = {
  shareToken: string | null;
  editToken: string | null;
};

export async function saveBrief(input: SaveInput): Promise<SavedBriefTokens> {
  const none: SavedBriefTokens = { shareToken: null, editToken: null };
  try {
    const res = await fetch("/api/concepts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) return none;
    const data = (await res.json()) as {
      shareToken?: string;
      editToken?: string;
    };
    return {
      shareToken: data.shareToken ?? null,
      editToken: data.editToken ?? null,
    };
  } catch {
    return none;
  }
}
