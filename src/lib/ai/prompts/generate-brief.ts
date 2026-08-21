/**
 * THE big prompt — Generate Brief.
 *
 * This is the call that produces the user's actual product: the design brief
 * they hand to an interior designer or contractor. Quality here directly
 * determines whether Fills is a real tool or a mood-board toy.
 *
 * We use the full GPT-5 tier (not gpt-5-mini) for this call only — the cost
 * increase is justified one place: where the user sees the output.
 *
 * DESIGN NOTE (2026-08, rewritten): the previous version produced only mood
 * poetry — a concept line, evocative colour names, eight one-line "atmospheres"
 * and three positioning paragraphs. Beautiful, unusable: a designer could not
 * build from it. This version outputs a real handover document — scope,
 * spatial strategy, a materials/finishes schedule (material -> where it goes),
 * furniture direction, a proper lighting plan with colour temperature, and
 * explicit do/don't guardrails — while keeping just enough of the voice to
 * still read like a designer wrote it.
 */

export const GENERATE_BRIEF_SYSTEM_PROMPT = `You are a senior interior designer writing a CONCEPT DECK for a client to hand to their designer, architect, or contractor.

This is a presentation, not an essay. Real studio decks carry about 200 words across the whole document — the images do the arguing and the words are LABELS. Someone must still be able to price and specify from it, so be specific, but say it in the fewest words possible.

Hard rule: apart from the intent and the closing description, nothing you write is a sentence. Everything else is a label or a phrase. If you catch yourself explaining, stop.

Voice — non-negotiable:
- Restrained, considered, designer-confident. Someone who has actually built spaces.
- Concrete and specific ALWAYS. Name real materials, finishes, fixture types, eras, colour temperatures. "Honed travertine" not "beautiful stone". "2700K" not "warm lighting".
- Zero hype. No "stunning", "elevate", "transform", "seamless", "curated", "bespoke", "breathtaking", "perfect". No em-dashes.
- Never invent the user's picks. Where they gave you no reference for a category, write the direction that follows logically from the rest of the brief and keep it clearly directional rather than pretending they chose it.
- Every line must earn its place. If a sentence could apply to any project, delete it and write the one that applies to THIS one.

Ground everything in the specifics you are given: the space type, the reference images, and the colour palette. The palette hexes are the user's actual decision — build the colour system on them, do not substitute your own.

Required output fields:

  conceptLine — one sentence, 12-25 words. The project's point of view. Designer-pithy.
    Good: "Warm minimalism rooted in Belgian linen and travertine, lit like a north-facing studio at 3pm."
    Bad: "A beautiful modern space combining warmth and style for the perfect retreat."

  title — NAME the scheme, the way a studio names one on a deck cover. Two to
    four words, drawn from the material, the light, or the feeling.
    Good: "Dune House". "The Quiet Lobby". "Copper and Ash".
    Bad: "Hotel Lobby Design". "Modern Restaurant Interior". A keyword string is
    not a title, and never just repeat the space type back.

  summary — the project at a glance. EACH OF THESE IS ONE SENTENCE. They sit
  above the images and are read in a glance by someone deciding whether to keep
  going. Long is wrong here.
    projectType: the space in plain words, e.g. "Hotel lobby, boutique hospitality".
    intent: ONE sentence on what this project is trying to achieve.
    whoItsFor: ONE short sentence. The people who use it and what they need from
      it — not a description of the room.
    scopeNotes: ONE short sentence on what still has to be confirmed on site.
      Be honest that measurements are not yet captured.

  keywords — 8 to 10 short lowercase tags. Material, era, or mood. Search-shaped.

  colorSystem — ONE ENTRY PER COLOUR the user gave you (4 to 6). Never drop one of their colours.
    Roles: "primary"|"secondary"|"accent"|"supporting" — use "supporting" more than once if needed.
    - hex MUST be the user's exact hex values, in their order.
    - name: two to four words, evocative but not silly. "first light on linen", "olive at dusk".
    - application: WHERE this colour actually goes in this space. This is the useful part.
      Good: "walls and ceiling, lime-washed plaster". Bad: "used throughout for warmth".

  materials — 5 to 7 entries. The finishes schedule. LABELS, not sentences.
    material: the material and finish only, e.g. "White oak, rift-sawn, matte oil".
    application: where it goes, in a few words, e.g. "Desk face, panelling to 1200mm".

  furniture — 4 to 6 entries. Also labels.
    item: the piece, e.g. "Lounge seating, low-back".
    character: form, material, proportion. A phrase, not a sentence.

  lighting — the lighting plan:
    strategy: ONE short sentence on how light should behave here.
    colorTemperature: specific, e.g. "2700K throughout, 3000K in task zones".
    layers: exactly 3 entries — layer ("Ambient"|"Task"|"Accent") and fixtures (the fitting types, a phrase).

  spatialNotes — 3 to 4 bullets on zoning, circulation, sightlines, and what happens where. Directional and concrete.

  dos — 4 to 5 short imperatives specific to this project. e.g. "Keep sightlines from entry to the back wall open".
  donts — 4 to 5 short imperatives. The things that would break this brief. e.g. "No cool-white downlights".

  nextSteps — 3 to 4 practical actions for the client, in order. What to measure, confirm, source, or ask their designer. Make the first one about getting accurate dimensions.

  cinematicDescription — 40 to 55 words. Not a paragraph, a single shot: the
    finished room as a photographer would frame it. Light direction, one or two
    materials catching it, what is in frame. Stop before you have described
    everything in the room.

Output strictly as JSON matching the provided schema. No prose around the JSON.`;

export function buildGenerateBriefPrompt(input: {
  industry?: string;
  space?: string;
  spaceDescription?: string;
  spaceSize?: string;
  vibeQuery?: string;
  vibePinTitles?: string[];
  palette?: Array<{ hex: string; name?: string; material?: string }>;
  furnitureSubSections?: Array<{
    name: string;
    query?: string;
    pinTitles?: string[];
  }>;
  lightingPinTitles?: string[];
  flooringPinTitles?: string[];
  ceilingPinTitles?: string[];
  materialsPinTitles?: string[];
}): string {
  const lines: string[] = ["The client's project and picks:"];

  if (input.industry || input.space) {
    lines.push(
      `- Space: ${[input.industry, input.space, input.spaceSize].filter(Boolean).join(" / ")}`,
    );
  }
  if (input.spaceDescription) {
    lines.push(`- Space notes: ${input.spaceDescription}`);
  }

  if (input.vibeQuery) {
    lines.push(`- Style direction: ${input.vibeQuery}`);
  }
  if (input.vibePinTitles && input.vibePinTitles.length > 0) {
    lines.push(`- Vibe references they chose: ${input.vibePinTitles.join("; ")}`);
  }

  if (input.palette && input.palette.length > 0) {
    const paletteStr = input.palette
      .map((c) => {
        const parts = [c.hex];
        if (c.name) parts.push(c.name);
        if (c.material) parts.push(`(${c.material})`);
        return parts.join(" ");
      })
      .join("; ");
    lines.push(
      `- Palette they chose (use these exact hexes): ${paletteStr}`,
    );
  }

  if (input.furnitureSubSections && input.furnitureSubSections.length > 0) {
    lines.push("- Furniture references:");
    for (const sub of input.furnitureSubSections) {
      const titles = (sub.pinTitles ?? []).slice(0, 4).join("; ");
      lines.push(`    • ${sub.name}: ${titles || "(no specific picks)"}`);
    }
  }

  const pinterestSummaries: Array<[string, string[] | undefined]> = [
    ["Lighting references", input.lightingPinTitles],
    ["Flooring references", input.flooringPinTitles],
    ["Ceiling references", input.ceilingPinTitles],
    ["Materials references", input.materialsPinTitles],
  ];
  for (const [label, titles] of pinterestSummaries) {
    if (titles && titles.length > 0) {
      lines.push(`- ${label}: ${titles.slice(0, 4).join("; ")}`);
    }
  }

  lines.push(
    "",
    "Write the complete design brief as JSON. Match the schema exactly. Be specific enough that a contractor could price it.",
  );

  return lines.join("\n");
}

/**
 * A bounded string.
 *
 * Keep maxLength GENEROUS. Structured outputs enforce it by cutting the model
 * off mid-word rather than making it plan a shorter answer, and tight caps put
 * things like "low-glare downl" and "LED toe-kick to millw" straight onto the
 * user's brief. Brevity is the prompt's job; this is only a backstop.
 */
const str = (minLength: number, maxLength: number) => ({
  type: "string",
  minLength,
  maxLength,
});

export const GENERATE_BRIEF_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: str(3, 60),
    conceptLine: str(20, 200),

    summary: {
      type: "object",
      additionalProperties: false,
      properties: {
        projectType: str(3, 80),
        intent: str(40, 200),
        whoItsFor: str(20, 130),
        scopeNotes: str(20, 150),
      },
      required: ["projectType", "intent", "whoItsFor", "scopeNotes"],
    },

    keywords: {
      type: "array",
      minItems: 8,
      maxItems: 10,
      items: str(2, 40),
    },

    colorSystem: {
      type: "array",
      minItems: 4,
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          role: {
            type: "string",
            enum: ["primary", "secondary", "accent", "supporting"],
          },
          hex: { type: "string", pattern: "^#[0-9a-fA-F]{6}$" },
          name: str(2, 40),
          application: str(10, 180),
        },
        required: ["role", "hex", "name", "application"],
      },
    },

    materials: {
      type: "array",
      minItems: 5,
      maxItems: 7,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          material: str(3, 90),
          application: str(5, 140),
        },
        required: ["material", "application"],
      },
    },

    furniture: {
      type: "array",
      minItems: 4,
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          item: str(3, 80),
          character: str(10, 140),
        },
        required: ["item", "character"],
      },
    },

    lighting: {
      type: "object",
      additionalProperties: false,
      properties: {
        strategy: str(40, 260),
        colorTemperature: str(3, 90),
        layers: {
          type: "array",
          minItems: 3,
          maxItems: 3,
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              layer: { type: "string", enum: ["Ambient", "Task", "Accent"] },
              fixtures: str(5, 160),
            },
            required: ["layer", "fixtures"],
          },
        },
      },
      required: ["strategy", "colorTemperature", "layers"],
    },

    spatialNotes: {
      type: "array",
      minItems: 3,
      maxItems: 4,
      items: str(15, 190),
    },

    dos: { type: "array", minItems: 4, maxItems: 5, items: str(8, 130) },
    donts: { type: "array", minItems: 4, maxItems: 5, items: str(8, 130) },

    nextSteps: {
      type: "array",
      minItems: 3,
      maxItems: 4,
      items: str(10, 190),
    },

    cinematicDescription: str(120, 340),
  },
  required: [
    "title",
    "conceptLine",
    "summary",
    "keywords",
    "colorSystem",
    "materials",
    "furniture",
    "lighting",
    "spatialNotes",
    "dos",
    "donts",
    "nextSteps",
    "cinematicDescription",
  ],
} as const;

export type GenerateBriefResponse = {
  /** The scheme's name, the way a studio names one on a deck cover. Optional
   *  only because briefs saved before this field existed carry none — every
   *  caller falls back to the project type. */
  title?: string;
  conceptLine: string;
  summary: {
    projectType: string;
    intent: string;
    whoItsFor: string;
    scopeNotes: string;
  };
  keywords: string[];
  colorSystem: Array<{
    role: "primary" | "secondary" | "accent" | "supporting";
    hex: string;
    name: string;
    application: string;
  }>;
  materials: Array<{
    material: string;
    application: string;
  }>;
  furniture: Array<{
    item: string;
    character: string;
  }>;
  lighting: {
    strategy: string;
    colorTemperature: string;
    layers: Array<{
      layer: "Ambient" | "Task" | "Accent";
      fixtures: string;
    }>;
  };
  spatialNotes: string[];
  dos: string[];
  donts: string[];
  nextSteps: string[];
  cinematicDescription: string;
};
