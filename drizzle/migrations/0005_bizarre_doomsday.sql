CREATE TYPE "public"."purchase_kind" AS ENUM('brief', 'pass');--> statement-breakpoint
CREATE TABLE "purchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"kind" "purchase_kind" NOT NULL,
	"brief_token" text,
	"expires_at" timestamp with time zone,
	"amount_minor" text,
	"currency" text,
	"provider" text,
	"provider_session_id" text,
	"provider_event_id" text,
	"refunded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "purchases_provider_event_id_unique" UNIQUE("provider_event_id")
);
