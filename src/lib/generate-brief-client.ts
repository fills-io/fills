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

export async function generateBrief(
  input: BriefInput,
): Promise<GenerateBriefResponse> {
  const res = await fetch("/api/ai/generate-brief", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `HTTP ${res.status}`);
  }
  return (await res.json()) as GenerateBriefResponse;
}

/** Generate a single image (data URL) from a prompt. */
export async function generateImage(prompt: string): Promise<string> {
  const res = await fetch("/api/ai/generate-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `HTTP ${res.status}`);
  }
  const data = (await res.json()) as { image: string };
  return data.image;
}
