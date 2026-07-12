/**
 * Shared interface every text-generation provider implements.
 *
 * The point of this file: when we want to swap from OpenAI to Anthropic
 * (or Gemini, or anything else), we add a new adapter that implements
 * this interface. Nothing in the rest of the codebase changes.
 */

/**
 * Quality tier — "mini" is the cheap workhorse used for wizard interactions
 * (compatibility checks, search suggestions, etc.). "full" is the premium
 * model used for the high-stakes Design DNA generation, where output
 * quality is the user-facing artifact.
 *
 * Each provider maps these tiers to a concrete model name internally
 * (e.g. OpenAI: "mini" → gpt-5-mini, "full" → gpt-5).
 */
export type ModelTier = "mini" | "full";

export type TextGenerateOptions = {
  /** The actual user prompt. */
  prompt: string;
  /** Optional system instruction prepended to the conversation. */
  system?: string;
  /** Which quality tier to use. */
  tier?: ModelTier;
  /** Override temperature (0–2). Lower = more deterministic. */
  temperature?: number;
  /**
   * Optional JSON schema. When provided, the response is guaranteed to
   * conform to this schema (provider-enforced where supported, validated
   * at the adapter layer otherwise).
   *
   * Shape: a plain JSON Schema object (not Zod). We keep this provider-
   * neutral so we can drop a Zod schema in at the calling site via
   * z.toJSONSchema() when we want to.
   */
  schema?: Record<string, unknown>;
  /** Optional schema name when using `schema` (some providers require it). */
  schemaName?: string;
  /**
   * Hard cap on output length (in tokens). Default: 2048. Set lower for
   * short structured outputs to fail fast on runaway responses.
   */
  maxOutputTokens?: number;
};

export type TextGenerateResult = {
  /** The model's text response (raw string, before any schema validation). */
  text: string;
  /** Concrete model used (e.g. "gpt-5-mini"). For logging / debugging. */
  model: string;
  /** Provider that handled this request. For logging. */
  provider: string;
  /** Wall-clock latency in ms, measured at the adapter. */
  latencyMs: number;
};

/**
 * Every text provider adapter implements this. Callers go through
 * `aiText()` in src/lib/ai/index.ts — they should never import a
 * specific provider directly.
 */
export type TextProvider = {
  /** Provider name for logging. */
  name: string;
  generate(options: TextGenerateOptions): Promise<TextGenerateResult>;
};
