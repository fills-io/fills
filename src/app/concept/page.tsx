import { redirect } from "next/navigation";

/**
 * /concept now redirects into the real wizard at /concept/wizard, carrying any
 * query (industry / spec / vibe). The old echo/intro shell is retired so every
 * entry lands in the actual AI brief builder.
 */
export default async function ConceptPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === "string") qs.set(k, v);
  }
  const q = qs.toString();
  redirect(`/concept/wizard${q ? `?${q}` : ""}`);
}
