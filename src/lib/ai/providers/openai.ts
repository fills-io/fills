/**
 * OpenAI text-generation adapter.
 *
 * Maps the provider-neutral `TextProvider` interface to the OpenAI SDK.
 * The rest of the codebase never imports this directly — it goes through
 * `aiText()` in src/lib/ai/index.ts.
 *
 * Model picks (2026-05 — re-verify in memory ai_model_monitoring.md):
 *   mini → gpt-5-mini
 *           $0.25/M input, $2/M output. Schema-enforced JSON output.
 *           Used for compatibility checks, search suggestions, auto-fill,
 *           From-Image analysis — anywhere we want cheap structured replies.
 *   full → gpt-5
 *           ~$2.50/M input, $10/M output. Best quality.
 *           Used for the final "Generate brief" call (cinematic description,
 *           Design DNA narrative, marketing pillars) — the artifact the
 *           user reads.
 */

import OpenAI from "openai";
import type {
  TextProvider,
  TextGenerateOptions,
  TextGenerateResult,
} from "./types";

/** Lazy SDK init — missing key fails individual requests, not the build. */
function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not set. Add it in Vercel → Settings → Environment Variables.",
    );
  }
  return new OpenAI({ apiKey });
}

const MODEL_BY_TIER: Record<"mini" | "full", string> = {
  mini: "gpt-5-mini",
  full: "gpt-5",
};

export const openaiProvider: TextProvider = {
  name: "openai",

  async generate(opts: TextGenerateOptions): Promise<TextGenerateResult> {
    const startedAt = Date.now();
    const model = MODEL_BY_TIER[opts.tier ?? "mini"];

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
    if (opts.system) {
      messages.push({ role: "system", content: opts.system });
    }
    messages.push({ role: "user", content: opts.prompt });

    // Build the request. When a schema is provided, use OpenAI's
    // schema-enforced structured outputs (`response_format: json_schema`).
    // This is the killer feature for our wizard — the model literally
    // cannot return invalid JSON, so the UI never breaks on a malformed
    // response.
    //
    // Note on temperature: GPT-5 family (gpt-5, gpt-5-mini) only accepts
    // the default temperature (1). Passing any other value returns 400.
    // We omit the field when targeting these models, regardless of what
    // the caller asked for. For older / non-GPT-5 models, we'd honor
    // opts.temperature. For now all our tiers map to GPT-5 family, so
    // temperature is never sent.
    // Default 4096 — generous enough that GPT-5's reasoning-token overhead
    // plus a reasonable output fits comfortably. Callers expecting very
    // long outputs (Design DNA narrative) bump higher; callers wanting a
    // tight cap pass their own maxOutputTokens.
    const request: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming = {
      model,
      messages,
      max_completion_tokens: opts.maxOutputTokens ?? 4096,
    };

    const isGpt5Family = model.startsWith("gpt-5");
    if (!isGpt5Family && opts.temperature !== undefined) {
      request.temperature = opts.temperature;
    }

    if (opts.schema) {
      request.response_format = {
        type: "json_schema",
        json_schema: {
          name: opts.schemaName ?? "response",
          strict: true,
          schema: opts.schema,
        },
      };
    }

    const response = await getClient().chat.completions.create(request);
    const text = response.choices[0]?.message?.content ?? "";

    return {
      text,
      model,
      provider: "openai",
      latencyMs: Date.now() - startedAt,
    };
  },
};
