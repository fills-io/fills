/**
 * AI provider selection — driven by environment variables.
 *
 * To swap providers (e.g. OpenAI → Anthropic Claude) when a better model
 * lands later, you change ONE env var:
 *
 *   TEXT_PROVIDER=openai     (default)
 *   TEXT_PROVIDER=anthropic  (when we wire up Claude)
 *
 * No code changes anywhere. That's the whole point of the abstraction.
 *
 * For now we only have one provider wired up. As more adapters land, they
 * register here.
 */

import type { TextProvider } from "./providers/types";
import { openaiProvider } from "./providers/openai";

const PROVIDERS: Record<string, TextProvider> = {
  openai: openaiProvider,
  // anthropic: anthropicProvider,   // future
  // gemini: geminiProvider,         // future
};

/**
 * Resolve the current text provider from env var. Defaults to "openai"
 * if TEXT_PROVIDER isn't set (e.g. in local dev with a fresh .env.local).
 */
export function getTextProvider(): TextProvider {
  const name = (process.env.TEXT_PROVIDER ?? "openai").toLowerCase();
  const provider = PROVIDERS[name];
  if (!provider) {
    throw new Error(
      `Unknown TEXT_PROVIDER "${name}". Valid options: ${Object.keys(PROVIDERS).join(", ")}.`,
    );
  }
  return provider;
}
