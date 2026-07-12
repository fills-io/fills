/**
 * Public AI API. Every AI call in Fills goes through `aiText()`.
 *
 * Calling code never names a provider. That's by design — when we want to
 * swap from OpenAI to Claude (or Gemini, or anything else), we change one
 * env var (TEXT_PROVIDER) and redeploy. Nothing else in the codebase moves.
 *
 * Example:
 *   const reply = await aiText({
 *     prompt: "Do these vibe pins clash with this color palette?",
 *     system: "You are a senior interior designer. Reply with JSON.",
 *     schema: { ... },
 *     tier: "mini",
 *   });
 */

export { type ModelTier, type TextGenerateOptions, type TextGenerateResult } from "./providers/types";
import type {
  TextGenerateOptions,
  TextGenerateResult,
  ImageGenerateOptions,
  ImageGenerateResult,
} from "./providers/types";
import { getImageProvider, getTextProvider } from "./config";

/**
 * Run a text generation call against whichever provider is currently
 * configured. Defaults to the "mini" tier (cheap workhorse) — pass
 * `tier: "full"` for the high-stakes Generate brief call.
 */
export async function aiText(
  options: TextGenerateOptions,
): Promise<TextGenerateResult> {
  const provider = getTextProvider();
  return provider.generate(options);
}

/** Generate a single image (data URL) via the configured image provider. */
export async function aiImage(
  options: ImageGenerateOptions,
): Promise<ImageGenerateResult> {
  const provider = getImageProvider();
  return provider.generate(options);
}
