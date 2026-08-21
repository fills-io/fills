/**
 * /api/admin/migrate — apply pending schema changes from the browser.
 *
 * Schema changes normally go through `pnpm db:migrate`, which needs
 * DATABASE_URL. That value is encrypted in Vercel and can't be pulled to a
 * laptop, so in practice every migration has meant the founder pasting SQL
 * into the Supabase dashboard. That handoff is where the last one stalled.
 *
 * This makes it a button instead. It is NOT a general SQL endpoint: the exact
 * statements live in the lists below, every one is additive and idempotent
 * (`ADD COLUMN IF NOT EXISTS`, `CREATE TABLE IF NOT EXISTS`), and nothing here
 * can drop or alter existing data. Both the page and this route sit behind the
 * Basic Auth in middleware.ts (`/api/admin/:path*`).
 *
 * GET  — what's applied and what isn't. Reads information_schema, writes nothing.
 * POST — applies whatever is missing. Safe to run twice.
 */

import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Every column this app expects but that predates it.
 *
 * Keep this list in step with drizzle/migrations. When a new migration adds a
 * column, add it here too so the button stays a complete answer.
 */
const EXPECTED_COLUMNS: Array<{
  table: string;
  column: string;
  type: string;
  why: string;
}> = [
  {
    table: "concepts",
    column: "brief",
    type: "jsonb",
    why: "The generated brief, stored whole so it renders as it did the day it was made.",
  },
  {
    table: "concepts",
    column: "brief_pins",
    type: "jsonb",
    why: "The reference images chosen for each section.",
  },
  {
    table: "concepts",
    column: "brief_facts",
    type: "jsonb",
    why: "Project facts the user entered (name, area, outdoor, style).",
  },
];

/**
 * Whole tables this app expects.
 *
 * Statements must be idempotent — the button is safe to press twice, and a
 * half-applied migration should be finishable by pressing it again. Postgres
 * has no CREATE TYPE IF NOT EXISTS, hence the DO block.
 */
const EXPECTED_TABLES: Array<{ table: string; why: string; sql: string[] }> = [
  {
    table: "purchases",
    why: "Records who bought which brief, so a paid download can be recognised.",
    sql: [
      `DO $$ BEGIN
         CREATE TYPE "purchase_kind" AS ENUM ('brief', 'pass');
       EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
      `CREATE TABLE IF NOT EXISTS "purchases" (
         "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
         "email" text NOT NULL,
         "kind" "purchase_kind" NOT NULL,
         "brief_token" text,
         "expires_at" timestamp with time zone,
         "amount_minor" text,
         "currency" text,
         "provider" text,
         "provider_session_id" text,
         "provider_event_id" text UNIQUE,
         "refunded_at" timestamp with time zone,
         "created_at" timestamp with time zone DEFAULT now() NOT NULL
       )`,
    ],
  },
];

type ColumnStatus = { table: string; column: string; present: boolean; why: string };

type SchemaRow = { table_name: string; column_name: string };

async function readTables(): Promise<Set<string>> {
  const rows = (await db.execute(
    sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`,
  )) as unknown as Array<{ table_name: string }>;
  return new Set(rows.map((r) => r.table_name));
}

async function readStatus(): Promise<ColumnStatus[]> {
  // drizzle-orm/postgres-js resolves execute() to the rows themselves, not a
  // { rows } wrapper — a driver swap would surface here as a failed status
  // read rather than a wrong answer, which is the right way round.
  const rows = (await db.execute(
    sql`SELECT table_name, column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'`,
  )) as unknown as SchemaRow[];

  const have = new Set(rows.map((r) => `${r.table_name}.${r.column_name}`));
  const tables = await readTables();

  return [
    // Whole tables first: a missing table makes its columns moot, and the
    // columns below are filtered to tables that actually exist so a fresh
    // database doesn't report the same gap twice.
    ...EXPECTED_TABLES.map((t) => ({
      table: t.table,
      column: "(whole table)",
      why: t.why,
      present: tables.has(t.table),
    })),
    ...EXPECTED_COLUMNS.filter((c) => tables.has(c.table)).map((c) => ({
      table: c.table,
      column: c.column,
      why: c.why,
      present: have.has(`${c.table}.${c.column}`),
    })),
  ];
}

export async function GET() {
  try {
    const columns = await readStatus();
    return NextResponse.json({
      ok: true,
      pending: columns.filter((c) => !c.present).length,
      columns,
    });
  } catch (error) {
    console.error("[/api/admin/migrate] status failed:", error);
    return NextResponse.json(
      { ok: false, error: "Couldn't read the database schema." },
      { status: 500 },
    );
  }
}

export async function POST() {
  const applied: string[] = [];
  try {
    for (const t of EXPECTED_TABLES) {
      for (const statement of t.sql) {
        await db.execute(sql.raw(statement));
      }
      applied.push(t.table);
    }

    for (const c of EXPECTED_COLUMNS) {
      // Identifiers come from the constant list above, never from the request,
      // so there is nothing here a caller can influence.
      await db.execute(
        sql.raw(
          `ALTER TABLE "${c.table}" ADD COLUMN IF NOT EXISTS "${c.column}" ${c.type}`,
        ),
      );
      applied.push(`${c.table}.${c.column}`);
    }
    const columns = await readStatus();
    return NextResponse.json({
      ok: true,
      applied,
      pending: columns.filter((col) => !col.present).length,
      columns,
    });
  } catch (error) {
    console.error("[/api/admin/migrate] apply failed:", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          "Couldn't apply the change. Nothing was removed. The database is as it was.",
      },
      { status: 500 },
    );
  }
}
