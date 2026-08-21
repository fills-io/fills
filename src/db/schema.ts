/**
 * Database schema for Fills.
 *
 * Two tables:
 *   - `concepts`   — one row per design brief. Stores the user's wizard picks,
 *                    AI-generated analysis (Design DNA, color system, etc.),
 *                    and the final mood board images.
 *   - `moodBoards` — 1:1 with a concept. Stores the user's *customization* of
 *                    how the generated mood board is displayed (page order,
 *                    captions, layout variation, hidden pages, etc.).
 *
 * Design decisions (locked 2026-05-19):
 *   - Legacy text fields from the prototype's older flow (`purpose`,
 *     `designStyle`, `mood`, `formLanguage`, `cameraStyle`, etc.) are
 *     intentionally dropped. The current product uses Pinterest selections
 *     + space details + AI output exclusively.
 *   - UUID primary keys (not serial) for privacy (can't enumerate rows) and
 *     forward-compat with future user table FKs.
 *   - AI output columns are nullable — they're empty until generation
 *     completes.
 *   - `shareToken` reserved for Phase 5 shareable URLs.
 *   - `status` tracks the concept lifecycle so the UI can show progress.
 */

import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ─── Enums ──────────────────────────────────────────────────────────────────

/** How the user started building the brief. */
export const creationModeEnum = pgEnum("creation_mode", [
  "quick", // user picks 3 things, AI fills the rest
  "full", // user picks all 9 wizard steps manually
  "from-image", // user uploads reference images, AI infers everything
]);

/** Lifecycle stage of a concept. */
export const conceptStatusEnum = pgEnum("concept_status", [
  "draft", // user is still filling out the wizard
  "generating", // AI is producing the Design DNA + images
  "ready", // generation complete, viewable
  "failed", // generation errored, can be retried
]);

// ─── Shared JSONB shapes (typed via $type<...>) ─────────────────────────────

/** Details about the physical space being designed. */
export type SpaceDetails = {
  category?: string;
  space?: string;
  zone?: string;
  subType?: string;
  size?: string;
  customDetails?: Record<string, string>;
  description?: string;
};

/** A single Pinterest pin the user selected. */
export type PinterestPin = {
  id: string;
  url: string;
  title: string;
  description?: string;
  altText?: string;
  imageUrl: string;
  imageThumbUrl?: string;
  dominantColor?: string;
  boardName?: string;
  boardUrl?: string;
};

/** One step of the wizard (e.g. "vibe", "colors", "lighting"). */
export type StepSelection = {
  query: string;
  pins: PinterestPin[];
};

/** Furniture has sub-sections (sofa, chairs, table…) — special shape. */
export type FurnitureSubSection = {
  name: string;
  query: string;
  pins: PinterestPin[];
};

/** All Pinterest-driven wizard picks, by category. */
export type WizardSelections = {
  vibeStyle?: StepSelection;
  colors?: StepSelection;
  furniture?: { subSections: FurnitureSubSection[] };
  lighting?: StepSelection;
  flooring?: StepSelection;
  ceiling?: StepSelection;
  materials?: StepSelection;
};

/** A single color in the rich color system (with name + material association). */
export type ColorEntry = {
  hex: string;
  name: string;
  material: string;
};

/** The full color system AI generates for a concept. */
export type RichColorSystem = {
  primary?: ColorEntry;
  secondary?: ColorEntry;
  accent?: ColorEntry;
  supporting?: ColorEntry[];
};

/** The three strategic angles AI generates for a concept. */
export type StrategicPillars = {
  psychological?: string;
  functional?: string;
  marketing?: string;
};

/** A generated mood board image with its assigned section. */
export type GeneratedImage = {
  url: string;
  area: string; // e.g. "hero", "vibe", "furniture"
};

// ─── concepts ────────────────────────────────────────────────────────────────

export const concepts = pgTable("concepts", {
  // Identity
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),

  // Lifecycle
  status: conceptStatusEnum("status").notNull().default("draft"),
  creationMode: creationModeEnum("creation_mode").notNull().default("full"),

  // Share / privacy
  /** Random opaque token used in /brief/[shareToken] URLs. NULL until shared. */
  shareToken: text("share_token").unique(),

  /**
   * Write capability for the brief's own creator, so they can re-pick its
   * reference images after it is generated.
   *
   * Separate from shareToken and NEVER rendered into /brief/[token]. The share
   * link is a bearer credential we actively tell people to hand to their
   * designer or contractor; if it also authorised writes, the contractor could
   * silently rewrite the client's brief, and the deck they already downloaded.
   * Read and write are two different permissions, so they get two tokens.
   */
  editToken: text("edit_token"),

  // ── User inputs ──────────────────────────────────────────────────────────
  /** Top-level space type, e.g. "residential", "commercial". */
  spaceType: text("space_type").notNull(),
  /** Detailed space metadata (category, zone, size, description). */
  spaceDetails: jsonb("space_details").$type<SpaceDetails>(),
  /** For from-image mode: URLs of the user's uploaded reference photos. */
  referenceImages: jsonb("reference_images").$type<string[]>(),
  /** Pinterest picks across all wizard steps. */
  pinterestSelections: jsonb("pinterest_selections").$type<WizardSelections>(),

  // ── AI outputs (filled in when status moves to 'ready') ──────────────────
  /** Free-text Design DNA analysis (the headline narrative). */
  designDna: text("design_dna"),
  /** Short list of extracted color hex codes. */
  colorTones: jsonb("color_tones").$type<string[]>(),
  /** Why this design works psychologically (1–2 paragraphs). */
  psychologicalAnalysis: text("psychological_analysis"),
  /** How to pitch/sell this design (1–2 paragraphs). */
  marketingAnalysis: text("marketing_analysis"),
  /** Keyword tags surfaced from the design. */
  keywords: jsonb("keywords").$type<string[]>(),
  /** Cinematic prose describing the space if you walked into it. */
  cinematicDescription: text("cinematic_description"),
  /** Three strategic angles (psychological / functional / marketing). */
  strategicPillars: jsonb("strategic_pillars").$type<StrategicPillars>(),
  /** Per-section mood lines (one short sentence per board section). */
  sectionMoodLines: jsonb("section_mood_lines").$type<
    Record<string, string>
  >(),
  /** Full color system with primary/secondary/accent + supporting. */
  richColorSystem: jsonb("rich_color_system").$type<RichColorSystem>(),

  // ── The brief, as generated ──────────────────────────────────────────────
  //
  // The columns above model the ORIGINAL brief shape (design DNA, strategic
  // pillars, section mood lines). The brief the product actually produces now
  // is a different document, and mapping it across a dozen legacy columns
  // would lose the parts that don't fit. It is stored whole instead, so a
  // saved brief always renders exactly as it did when it was generated —
  // including after the prompt changes again.
  /** The full GenerateBriefResponse payload. */
  brief: jsonb("brief").$type<Record<string, unknown>>(),
  /** The reference images chosen for each section, keyed by category. */
  briefPins: jsonb("brief_pins").$type<Record<string, unknown>>(),
  /** Project facts the user entered (name, area, outdoor, style). */
  briefFacts: jsonb("brief_facts").$type<Record<string, unknown>>(),

  // ── Final outputs ────────────────────────────────────────────────────────
  /** Generated mood board images, one per board section. */
  images: jsonb("images").$type<GeneratedImage[]>(),
  /** The OpenAI prompt used to generate the hero mood board image. */
  prompt: text("prompt"),

  // ── Timestamps ───────────────────────────────────────────────────────────
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Concept = typeof concepts.$inferSelect;
export type NewConcept = typeof concepts.$inferInsert;

// ─── moodBoards ──────────────────────────────────────────────────────────────

/** Default page order of a generated mood board. */
export const DEFAULT_PAGE_ORDER = [
  "cover",
  "vibe",
  "colors",
  "furniture",
  "lighting",
  "surfaces",
  "materials",
  "pillars",
] as const;
export type PageId = (typeof DEFAULT_PAGE_ORDER)[number];

export const moodBoards = pgTable("mood_boards", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),

  /** The concept this mood board belongs to. 1:1 — each concept has at most one. */
  conceptId: uuid("concept_id")
    .notNull()
    .unique()
    .references(() => concepts.id, { onDelete: "cascade" }),

  // ── Editor state (everything below is user customization on top of AI output) ──
  /** Ordered list of page IDs (e.g. ["cover", "vibe", …]). NULL = use DEFAULT_PAGE_ORDER. */
  pageOrder: jsonb("page_order").$type<string[]>(),
  /** Per-page caption text edits, keyed by page ID. */
  captions: jsonb("captions").$type<Record<string, string>>(),
  /** Which generated image to use as the hero of each page, keyed by page ID. */
  heroImageSelections: jsonb("hero_image_selections").$type<
    Record<string, string>
  >(),
  /** Named layout preset, e.g. "editorial-tall", "grid-compact". */
  layoutVariation: text("layout_variation"),
  /** Page IDs the user has chosen to hide. */
  hiddenPages: jsonb("hidden_pages").$type<string[]>(),
  /** Export format, e.g. "pdf", "image-pack". */
  format: text("format"),
  /** URL of an uploaded logo to include in exports. */
  logo: text("logo"),

  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type MoodBoard = typeof moodBoards.$inferSelect;
export type NewMoodBoard = typeof moodBoards.$inferInsert;

// ─── leads ─────────────────────────────────────────────────────────────────
// Early-access email captures from the flow's "view your concept" gate.
// Stores the email plus what they were designing, so Aisha sees intent,
// not just an address. Viewable in the Supabase Table Editor.

export const leads = pgTable("leads", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  /** What they were building when they entered their email (optional). */
  industry: text("industry"),
  spec: text("spec"),
  vibe: text("vibe"),
  /** For "talk to a designer" inquiries: their name + free-text message. */
  name: text("name"),
  message: text("message"),
  /** Entry path / lead type: "quick" | "upload" | "talk-to-designer". */
  source: text("source"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;

// ─── purchases ───────────────────────────────────────────────────────────────

/** What someone bought. */
export const purchaseKindEnum = pgEnum("purchase_kind", [
  "brief", // one deck, unlocked forever
  "pass", // every brief for a window
]);

/**
 * A completed purchase — the only thing that unlocks a download.
 *
 * Keyed on EMAIL, not a user id, on purpose. The buyer is someone doing their
 * own flat once; asking them to invent a password for a $9 purchase is
 * homework in the middle of a checkout. The payment provider already collects
 * an email, so that is the identity, and a magic link brings them back.
 *
 * Append-only. A refund writes `refundedAt` rather than deleting the row, so
 * the history of what someone was sold survives.
 */
export const purchases = pgTable("purchases", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  kind: purchaseKindEnum("kind").notNull(),
  /** For "brief": the concept.shareToken it unlocks. Null for a pass. */
  briefToken: text("brief_token"),
  /** When a pass stops granting new downloads. Null for a single brief,
   *  which never expires — they bought that deck outright. */
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  /** Minor units, so 900 = $9.00. Stored because prices change and a receipt
   *  should say what was actually paid. */
  amountMinor: text("amount_minor"),
  currency: text("currency"),
  /**
   * The payment provider's ids. Null while the placeholder provider is in
   * use — Stripe UAE needs a trade licence, so the flow is built and dark
   * until that exists. `providerEventId` is UNIQUE: webhooks are delivered
   * at least once, and this is what stops a retry granting a second purchase.
   */
  provider: text("provider"),
  providerSessionId: text("provider_session_id"),
  providerEventId: text("provider_event_id").unique(),
  refundedAt: timestamp("refunded_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Purchase = typeof purchases.$inferSelect;
export type NewPurchase = typeof purchases.$inferInsert;

// ─── posts ───────────────────────────────────────────────────────────────────
// Blog posts authored from the /admin Blog manager. Body is stored as light
// markdown (headings, lists, bold, links). Cover + inline images land in a
// later increment (the `cover_image_url` column is reserved for it). Published
// posts render at /blog; drafts stay hidden from the public.

export const postStatusEnum = pgEnum("post_status", ["draft", "published"]);

export const posts = pgTable("posts", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  /** URL slug, e.g. "how-to-write-an-interior-design-brief". Unique. */
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  /** One-line summary shown on the blog index and in search results. */
  excerpt: text("excerpt"),
  /** The article body, stored as light markdown. */
  body: text("body").notNull().default(""),
  /** Eyebrow category, e.g. "Interior design". */
  category: text("category").notNull().default("Interior design"),
  /** Reserved for the image-upload increment. NULL for now. */
  coverImageUrl: text("cover_image_url"),
  /** SEO overrides — fall back to title / excerpt when empty. */
  metaTitle: text("meta_title"),
  description: text("description"),
  keywords: jsonb("keywords").$type<string[]>(),
  status: postStatusEnum("status").notNull().default("draft"),
  /** Byline name; falls back to the site author when empty. */
  author: text("author"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
