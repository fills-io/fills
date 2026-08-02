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
async function requestBrief(input: BriefInput): Promise<GenerateBriefResponse> {
  const res = await fetch("/api/ai/generate-brief", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    if (err?.error) throw new Error(err.error);
    throw new Error(
      res.status >= 500
        ? "The brief took too long to come back."
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
    try {
      return await requestBrief(input);
    } catch {
      throw first;
    }
  }
}
