CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"industry" text,
	"spec" text,
	"vibe" text,
	"source" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
