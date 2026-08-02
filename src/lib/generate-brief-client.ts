/**
 * Small client helper to call /api/ai/generate-brief — shared by the wizard and
 * the Quick canvas so they produce the same brief from the same endpoint.
 */

import type { GenerateBriefResponse } from "@/lib/ai/prompts/generate-brief";

export type BriefInput = {
  industry?: string;
  space?: string;
  spaceDescription?: string;
  spaceSize?: string;
  vibeQuery?: string;
  vibePinTitles?: string[];
  palette?: Array<{ hex: string; name?: string; material?: string }>;
  furnitureSubSections?: Array<{
    name: string;
    query: string;
    pinTitles: string[];
  }>;
  lightingPinTitles?: string[];
  flooringPinTitles?: string[];
  ceilingPinTitles?: string[];
  materialsPinTitles?: string[];
};

/**
 * Ask for the brief, once.
 *
 * A serverless timeout does not return our JSON error shape — it returns
 * Vercel's HTML error page — so a failed parse here means "the platform gave
 * up", not "the model misbehaved". We say so in words the user can act on
 * rather than surfacing "HTTP 500".
 */
/** Thrown for failures that a second identical request could still fix. */
class TransientError extends Error {}

async function requestBrief(input: BriefInput): Promise<GenerateBriefResponse> {
  let res: Response;
  try {
    res = await fetch("/api/ai/generate-brief", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    // The connection dropped — worth another go.
    throw new TransientError("Couldn't reach the server. Check your connection.");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    if (res.status >= 500) {
      throw new TransientError(err?.error || "The brief took too long to come back.");
    }
    // 4xx means the request itself is wrong — something the user typed is too
    // long, most likely. Repeating it verbatim can only fail the same way.
    throw new Error(
      err?.error
        ? "Some of your answers are too long for the brief. Try shortening them."
        : `Couldn't generate the brief (${res.status}).`,
    );
  }
  return (await res.json()) as GenerateBriefResponse;
}

/**
 * The brief call runs 22-40s and the platform cuts it off at 60, so a slow
 * one occasionally dies with nothing wrong on our side. Retrying once turns
 * almost all of those into a successful brief, and the generation screen
 * already covers the extra wait.
 */
export async function generateBrief(
  input: BriefInput,
): Promise<GenerateBriefResponse> {
  try {
    return await requestBrief(input);
  } catch (first) {
    // Only retry what a retry can fix. Retrying a 400 sent the same rejected
    // body a second time and then showed the user "Try again", which could
    // never work — it just doubled the wait before the same dead end.
    if (!(first instanceof TransientError)) throw first;
    try {
      return await requestBrief(input);
    } catch {
      throw first;
    }
  }
}
