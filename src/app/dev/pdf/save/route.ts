/**
 * DEV ONLY — POST /dev/pdf/save
 *
 * Writes a rendered deck to disk so the layout can be inspected without going
 * through the browser's download folder. Refuses to run outside development.
 */

import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

export const runtime = "nodejs";

/** Serve the last saved deck back so it can be viewed in the browser. */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return new Response("Not found", { status: 404 });
  }
  const bytes = await readFile(join(tmpdir(), "dev-deck.pdf"));
  return new Response(new Uint8Array(bytes), {
    headers: { "content-type": "application/pdf" },
  });
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return new Response("Not found", { status: 404 });
  }
  const bytes = Buffer.from(await request.arrayBuffer());
  const path = join(tmpdir(), "dev-deck.pdf");
  await writeFile(path, bytes);
  return Response.json({ path, bytes: bytes.length });
}
