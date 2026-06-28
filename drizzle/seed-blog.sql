-- Blog setup for Supabase — run ONCE in the SQL editor.
-- Part 1 creates the posts table (same as migration 0002).
-- Part 2 seeds the existing article so it stays live and becomes editable
-- from /admin/blog.

-- ── Part 1: table ────────────────────────────────────────────────────────────
CREATE TYPE "public"."post_status" AS ENUM('draft', 'published');

CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text,
	"body" text DEFAULT '' NOT NULL,
	"category" text DEFAULT 'Interior design' NOT NULL,
	"cover_image_url" text,
	"meta_title" text,
	"description" text,
	"keywords" jsonb,
	"status" "post_status" DEFAULT 'draft' NOT NULL,
	"author" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "posts_slug_unique" UNIQUE("slug")
);

-- ── Part 2: seed the first article ───────────────────────────────────────────
INSERT INTO "posts" ("slug","title","excerpt","body","category","description","keywords","status","author","published_at")
VALUES (
  'how-to-write-an-interior-design-brief',
  'How to write an interior design brief',
  'The brief is the most important document in any project, and the one most people rush. Here is what a good one contains, from a working architect.',
  $body$Every good interior starts with a good brief, and almost every difficult project starts without one. The brief is the quiet document that decides whether a space comes together or drifts. It is also the part most people skip, because it feels like admin when you would rather be choosing tiles.

This is a short, practical guide to writing one. It is the same structure used in professional studios, stripped down to what a single room actually needs.

## What an interior design brief is

A brief is a one-page summary of a project before any design happens. It captures who the space is for, how it should feel, what it must do, and what cannot change. Think of it as the agreement you make with yourself, or with a client, about where you are heading. Get it right and every later decision has something to measure against.

A brief is not a mood board, and it is not a shopping list. It comes before both. The mood board shows the look. The brief explains the intent behind it.

## The seven things every brief needs

### 1. The room, and the people in it

Name the space, its rough size, and who uses it. A reading nook for one and a living room for a family of five lead to different answers, even with identical taste. Be specific about real life: pets, small children, people who work from home, the relative who visits every Sunday.

### 2. One sentence on how it should feel

This is the heart of the brief. Force yourself to finish the sentence: this room should feel blank. Calm and uncluttered. Warm and a little theatrical. Bright and hard-working. One honest sentence here does more than a hundred saved images, because it gives you a test for every later choice.

### 3. What is not working today

Design is often subtraction before addition. Write down the specific frustrations: the room is dark by four in the afternoon, there is nowhere to put keys, the sofa faces the wrong way. Problems are easier to design against than vague wishes.

### 4. A clear style direction

Pin down the direction without over-defining it. Three or four words for the vibe, a few colours you are drawn to, and a few you want to avoid. References help here, but keep them tight. Five images that genuinely capture the feeling are worth more than fifty that hedge.

### 5. The budget, stated plainly

A budget is not a limitation on the design, it is part of the design. Even a rough range changes what good looks like. Writing it down early avoids the most common and most expensive mistake: falling for a scheme the project was never going to afford.

### 6. The hard constraints

List the things that cannot move. A radiator under the only window, a rental that forbids painting, a deadline tied to a new baby or a dinner party. Constraints are not the enemy of a good room. They are usually the reason it has any character at all.

### 7. The must-haves and the must-nots

Finish with the non-negotiables on both sides. The piano has to fit. No open shelving in the kitchen. The grandmother's chair stays. These are the lines you will be grateful you drew when the tempting, wrong idea arrives later.

## The mistake to avoid: starting with products

The most common way a brief goes wrong is starting from a specific sofa or a paint colour rather than from intent. Products are decisions, and decisions made before the brief tend to quietly take it over. Decide how the room should feel and work first. The objects come last, and they come more easily.

## From a brief to a finished mood board

Once the brief is written, the next step is translating it into a visual direction: a palette, materials, lighting, and furniture that all answer the same sentence. That translation is exactly what Fills was built to do. You describe the project in a line or two, and it returns a complete editorial mood board you can refine, export, and share.

Want to write yours by hand first? Use our free, printable [interior design brief template](/interior-design-brief-template). It walks through all seven sections above, and it is yours to keep.

A brief takes fifteen minutes and saves weeks. Write it before you buy a single thing, and the rest of the project has a much easier job.$body$,
  'Interior design',
  'A working architect''s guide to writing an interior design brief: the seven things every brief needs, the mistakes to avoid, and a free template you can copy.',
  '["how to write an interior design brief","interior design brief","design brief template","interior design brief example"]'::jsonb,
  'published',
  'Aisha Nazeer',
  now()
)
ON CONFLICT ("slug") DO NOTHING;
