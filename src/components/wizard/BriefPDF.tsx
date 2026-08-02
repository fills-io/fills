"use client";

/**
 * BriefPDF — the design deck.
 *
 * Modelled on how studios actually present a concept (see the Turtle / Emaar
 * Beachfront reference deck): a 16:9 presentation, roughly five or six images
 * per spread, and almost no prose. Facts are labels, not paragraphs. The one
 * piece of real writing is the inspiration narrative.
 *
 * IMAGES: @react-pdf fetches every <Image> src from the browser, and
 * Pinterest's CDN sends no CORS headers, so direct i.pinimg.com URLs silently
 * fail and the deck ships empty. Everything is routed through our own
 * same-origin /api/img proxy instead.
 */

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import type { GenerateBriefResponse } from "@/lib/ai/prompts/generate-brief";
import type { BriefPins } from "./BriefDisplay";

/** Facts the user gave us, shown as the project strip. */
export type BriefFacts = {
  projectName?: string;
  industry?: string;
  areaSqm?: number;
  hasOutdoor?: boolean;
  style?: string;
};

type Props = {
  brief: GenerateBriefResponse;
  pins?: BriefPins;
  facts?: BriefFacts;
  /** "deck" = 16:9 presentation (default). "document" = A4 portrait. */
  format: "deck" | "document";
  logoDataUrl?: string | null;
};

const ACC = "#c8512a";
const TXT = "#1a1714";
const TXT_2 = "#4a4038";
const TXT_3 = "#8a7f74";
const BG = "#f7f1e8";
const INK = "#1a1714";
const BDR = "#d8cdb8";

const DECK: [number, number] = [1440, 810];

/**
 * Pinterest stores our references at 474px, which is far too small for a
 * 1440pt page — a five-across image lands in a ~250pt slot and still reads
 * soft in print. The CDN serves the same asset at 1200px from the same path
 * (verified; /originals/ 403s on some pins, so we don't use it), which is
 * roughly four times the pixels. We upgrade before fetching.
 */
function hiRes(url: string): string {
  return url.replace(/\/(\d+)x\//, (m, w) => (Number(w) < 1200 ? "/1200x/" : m));
}

function pdfSrc(url?: string): string | null {
  if (!url) return null;
  if (url.startsWith("data:")) return url;
  try {
    const u = new URL(
      hiRes(url),
      typeof window !== "undefined" ? window.location.href : undefined,
    );
    if (u.hostname === "pinimg.com" || u.hostname.endsWith(".pinimg.com")) {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      return `${origin}/api/img?url=${encodeURIComponent(u.toString())}`;
    }
    return u.toString();
  } catch {
    return null;
  }
}

const s = StyleSheet.create({
  page: {
    backgroundColor: BG,
    paddingTop: 54,
    paddingHorizontal: 64,
    paddingBottom: 48,
    fontFamily: "Helvetica",
    color: TXT,
  },
  // running header
  head: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 26,
  },
  eyebrow: {
    fontSize: 9,
    color: ACC,
    letterSpacing: 2.4,
    fontFamily: "Helvetica-Bold",
  },
  pageMeta: { fontSize: 8, color: TXT_3, letterSpacing: 1.6 },

  // cover
  cover: { backgroundColor: INK, padding: 0 },
  coverImg: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" },
  coverScrim: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(20,17,14,0.55)" },
  coverInner: { position: "absolute", bottom: 72, left: 72, right: 72 },
  coverKicker: { fontSize: 10, color: "#f0e7dc", letterSpacing: 3, fontFamily: "Helvetica-Bold", marginBottom: 14 },
  coverTitle: { fontSize: 76, color: "#fdfaf5", fontFamily: "Times-Roman", lineHeight: 1.05 },
  coverSub: { fontSize: 15, color: "#e6dbcd", marginTop: 14, maxWidth: 620, lineHeight: 1.5 },
  coverFoot: { position: "absolute", top: 54, left: 72, right: 72, flexDirection: "row", justifyContent: "space-between" },
  coverBrand: { fontSize: 10, color: "#f0e7dc", letterSpacing: 3, fontFamily: "Helvetica-Bold" },
  logo: { width: 90, height: 34, objectFit: "contain" },

  // facts strip
  facts: { flexDirection: "row", borderTopWidth: 0.7, borderTopColor: BDR, borderBottomWidth: 0.7, borderBottomColor: BDR },
  fact: { flex: 1, paddingVertical: 16, paddingRight: 18 },
  factLabel: { fontSize: 7.5, color: TXT_3, letterSpacing: 1.8, marginBottom: 5 },
  factValue: { fontSize: 16, color: TXT, fontFamily: "Times-Roman" },

  // type
  h1: { fontSize: 40, fontFamily: "Times-Roman", lineHeight: 1.12, color: TXT, maxWidth: 900 },
  lead: { fontSize: 12.5, lineHeight: 1.72, color: TXT_2, maxWidth: 560 },
  small: { fontSize: 10, lineHeight: 1.6, color: TXT_2 },

  // Image grids. Heights are chosen against the slot WIDTH each grid produces
  // on a 1312pt content area, so every crop stays close to the portrait shape
  // the references are actually shot in. Landscape letterbox slots were what
  // made the earlier deck look like everything had been cut short.
  row: { flexDirection: "row", gap: 14 },
  fill: { flex: 1 },
  imgTall: { width: "100%", height: 470, objectFit: "cover" }, // 3-up in a column
  imgMed: { width: "100%", height: 330, objectFit: "cover" }, // 5-up, ~0.76
  imgWide: { width: "100%", height: 300, objectFit: "cover" }, // 5-up, ~0.84
  imgSq: { width: "100%", height: 296, objectFit: "cover" }, // 4-up, ~0.93
  caption: { fontSize: 7.5, color: TXT_3, letterSpacing: 1.6, marginTop: 6 },

  // Full-bleed mood board: no padding, two rows of five, edge to edge.
  moodPage: { backgroundColor: INK, padding: 0 },
  moodRow: { flexDirection: "row", gap: 8 },
  moodImg: { flex: 1, height: 401, objectFit: "cover" },

  // palette
  band: { flexDirection: "row", height: 210 },
  bandCell: { flex: 1, justifyContent: "flex-end", padding: 16 },
  bandHex: { fontSize: 9, letterSpacing: 1.4 },
  bandName: { fontSize: 14, fontFamily: "Times-Roman", marginTop: 3 },
  bandApp: { fontSize: 8.5, lineHeight: 1.45, marginTop: 5 },

  // Spec list — a schedule, set in two columns so it stays one screen deep.
  specCols: { flexDirection: "row", gap: 48 },
  spec: { flexDirection: "row", borderTopWidth: 0.6, borderTopColor: BDR, paddingVertical: 9, gap: 16 },
  specKey: { width: "44%", fontSize: 11, color: TXT, lineHeight: 1.35 },
  specVal: { flex: 1, fontSize: 10, color: TXT_2, lineHeight: 1.45 },

  bullet: { flexDirection: "row", gap: 8, marginBottom: 7 },
  bulletMark: { fontSize: 10, color: ACC, fontFamily: "Helvetica-Bold" },
  bulletText: { flex: 1, fontSize: 10.5, lineHeight: 1.55, color: TXT_2 },

  card: { flex: 1, borderWidth: 0.7, borderColor: BDR, padding: 18 },
  cardHead: { fontSize: 8, color: ACC, letterSpacing: 1.8, fontFamily: "Helvetica-Bold", marginBottom: 10 },
});

function textOn(hex: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return "#ffffff";
  const n = parseInt(m[1], 16);
  const l = 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
  return l > 150 ? "rgba(26,23,20,0.86)" : "rgba(255,255,255,0.92)";
}

/** Running header on every interior page. */
function Head({
  label,
  name,
  date,
}: {
  label: string;
  name: string;
  date: string;
}) {
  return (
    <View style={s.head}>
      <Text style={s.eyebrow}>{label.toUpperCase()}</Text>
      <Text style={s.pageMeta}>
        {name.toUpperCase()} · {date}
      </Text>
    </View>
  );
}

/**
 * A schedule (material -> where it goes) laid out in two columns. One long
 * column ran off the bottom of a 16:9 page and forced a text-only overflow
 * spread; two columns keep every category to a single slide.
 */
function Schedule({ rows }: { rows: Array<[string, string]> }) {
  const half = Math.ceil(rows.length / 2);
  const cols = [rows.slice(0, half), rows.slice(half)];
  return (
    <View style={s.specCols}>
      {cols.map((col, c) => (
        <View key={c} style={s.fill}>
          {col.map(([k, v], i) => (
            <View key={i} style={s.spec} wrap={false}>
              <Text style={s.specKey}>{k}</Text>
              <Text style={s.specVal}>{v}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

export default function BriefPDF({
  brief,
  pins,
  facts,
  format,
  logoDataUrl,
}: Props) {
  const size = format === "deck" ? DECK : "A4";
  const orientation = format === "deck" ? undefined : "portrait";
  const today = new Date().toISOString().slice(0, 10);

  // Every image appears exactly ONCE in the deck. Pages draw from per-category
  // queues; slicing from the front of one shared list is what made the same
  // shots turn up on three different spreads.
  const CATS: (keyof BriefPins)[] = [
    "vibe",
    "materials",
    "furniture",
    "lighting",
    "flooring",
    "ceiling",
  ];
  const queues: Partial<Record<keyof BriefPins, string[]>> = {};
  for (const k of CATS) {
    queues[k] = (pins?.[k] ?? [])
      .map((p) => pdfSrc(p.imageUrl || p.imageThumbUrl))
      .filter((x): x is string => !!x);
  }
  const used = new Set<string>();

  /**
   * Take `n` unused images for a spread. If that category is short (the user
   * may have picked only three vibe references), top up from the other pools
   * rather than shipping a half-empty grid.
   */
  function take(k: keyof BriefPins, n: number): string[] {
    const out: string[] = [];
    const pull = (q?: string[]) => {
      while (q && q.length > 0 && out.length < n) {
        const src = q.shift() as string;
        if (!used.has(src)) {
          used.add(src);
          out.push(src);
        }
      }
    };
    pull(queues[k]);
    if (out.length < n) for (const other of CATS) pull(queues[other]);
    return out;
  }

  // Allocated up front, in the order the deck should get the best images —
  // not in JSX order, so the mood board isn't starved by the pages after it.
  const p = {
    cover: take("vibe", 1)[0] ?? null,
    project: take("vibe", 3),
    inspiration: take("vibe", 5),
    colour: take("materials", 5),
    materials: take("materials", 5),
    furniture: take("furniture", 5),
    lighting: take("lighting", 5),
    flooring: take("flooring", 4),
    ceiling: take("ceiling", 4),
    // Whatever is left, ten across two full-bleed rows.
    mood: [...take("furniture", 4), ...take("lighting", 3), ...take("flooring", 3)],
  };

  const name = facts?.projectName?.trim() || brief.summary.projectType;

  return (
    <Document title={`${name} — design brief`} author="Fills" subject={brief.conceptLine}>
      {/* 1 — Cover */}
      <Page size={size} orientation={orientation} style={[s.page, s.cover]}>
        {p.cover ? (
          <>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={p.cover} style={s.coverImg} />
            <View style={s.coverScrim} />
          </>
        ) : null}
        <View style={s.coverFoot}>
          <Text style={s.coverBrand}>FILLS</Text>
          {logoDataUrl ? (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image src={logoDataUrl} style={s.logo} />
          ) : null}
        </View>
        <View style={s.coverInner}>
          <Text style={s.coverKicker}>
            {(facts?.industry ?? brief.summary.projectType).toUpperCase()}
          </Text>
          <Text style={s.coverTitle}>{name}</Text>
          <Text style={s.coverSub}>{brief.conceptLine}</Text>
        </View>
      </Page>

      {/* 2 — The project: facts + intent + two images */}
      <Page size={size} orientation={orientation} style={s.page}>
        <Head label="The project" name={name} date={today} />
        <View style={s.facts}>
          <View style={s.fact}>
            <Text style={s.factLabel}>AREA</Text>
            <Text style={s.factValue}>
              {facts?.areaSqm ? `${facts.areaSqm} m²` : "To be surveyed"}
            </Text>
          </View>
          <View style={s.fact}>
            <Text style={s.factLabel}>SPACE</Text>
            <Text style={s.factValue}>{brief.summary.projectType}</Text>
          </View>
          <View style={s.fact}>
            <Text style={s.factLabel}>OUTDOOR</Text>
            <Text style={s.factValue}>{facts?.hasOutdoor ? "Yes" : "None"}</Text>
          </View>
          <View style={s.fact}>
            <Text style={s.factLabel}>DIRECTION</Text>
            <Text style={s.factValue}>{facts?.style ?? "—"}</Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 28, marginTop: 26 }}>
          <View style={{ width: "38%" }}>
            <Text style={s.lead}>{brief.summary.intent}</Text>
            <Text style={[s.small, { marginTop: 16, color: TXT_3 }]}>
              {brief.summary.whoItsFor}
            </Text>
          </View>
          <View style={[s.row, s.fill]}>
            {p.project.map((src, i) => (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image key={i} src={src} style={[s.fill, s.imgTall]} />
            ))}
          </View>
        </View>
      </Page>

      {/* 3 — Inspiration: the one paragraph of real writing, plus five images */}
      <Page size={size} orientation={orientation} style={s.page}>
        <Head label="Inspiration" name={name} date={today} />
        <Text style={[s.h1, { marginBottom: 18 }]}>{brief.conceptLine}</Text>
        <Text style={[s.lead, { maxWidth: 900, marginBottom: 24 }]}>
          {brief.cinematicDescription}
        </Text>
        <View style={s.row}>
          {p.inspiration.map((src, i) => (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image key={i} src={src} style={[s.fill, s.imgMed]} />
          ))}
        </View>
      </Page>

      {/* 4 — Mood board. Full bleed, ten images, not one word. */}
      {p.mood.length > 0 ? (
        <Page size={size} orientation={orientation} style={s.moodPage}>
          <View style={s.moodRow}>
            {p.mood.slice(0, 5).map((src, i) => (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image key={i} src={src} style={s.moodImg} />
            ))}
          </View>
          <View style={[s.moodRow, { marginTop: 8 }]}>
            {p.mood.slice(5, 10).map((src, i) => (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image key={i} src={src} style={s.moodImg} />
            ))}
          </View>
        </Page>
      ) : null}

      {/* 5 — Palette */}
      <Page size={size} orientation={orientation} style={s.page}>
        <Head label="Colour" name={name} date={today} />
        <View style={s.band}>
          {brief.colorSystem.map((c, i) => (
            <View key={i} style={[s.bandCell, { backgroundColor: c.hex }]}>
              <Text style={[s.bandHex, { color: textOn(c.hex) }]}>
                {c.hex.toUpperCase()}
              </Text>
              <Text style={[s.bandName, { color: textOn(c.hex) }]}>{c.name}</Text>
              <Text style={[s.bandApp, { color: textOn(c.hex) }]}>
                {c.application}
              </Text>
            </View>
          ))}
        </View>
        <View style={[s.row, { marginTop: 18 }]}>
          {p.colour.map((src, i) => (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image key={i} src={src} style={[s.fill, s.imgMed]} />
          ))}
        </View>
      </Page>

      {/* 6 — Materials & finishes: images + schedule */}
      <Page size={size} orientation={orientation} style={s.page}>
        <Head label="Materials & finishes" name={name} date={today} />
        <View style={[s.row, { marginBottom: 22 }]}>
          {p.materials.map((src, i) => (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image key={i} src={src} style={[s.fill, s.imgWide]} />
          ))}
        </View>
        <Schedule
          rows={brief.materials.map((m) => [m.material, m.application])}
        />
      </Page>

      {/* 7 — Furniture */}
      <Page size={size} orientation={orientation} style={s.page}>
        <Head label="Furniture" name={name} date={today} />
        <View style={[s.row, { marginBottom: 22 }]}>
          {p.furniture.map((src, i) => (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image key={i} src={src} style={[s.fill, s.imgWide]} />
          ))}
        </View>
        <Schedule rows={brief.furniture.map((f) => [f.item, f.character])} />
      </Page>

      {/* 8 — Lighting */}
      <Page size={size} orientation={orientation} style={s.page}>
        <Head label="Lighting" name={name} date={today} />
        <View style={[s.row, { marginBottom: 22 }]}>
          {p.lighting.map((src, i) => (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image key={i} src={src} style={[s.fill, s.imgWide]} />
          ))}
        </View>
        <Text style={[s.eyebrow, { marginBottom: 12 }]}>
          {brief.lighting.colorTemperature.toUpperCase()}
        </Text>
        <Schedule
          rows={brief.lighting.layers.map((l) => [l.layer, l.fixtures])}
        />
      </Page>

      {/* 9 — Surfaces: flooring over ceiling, four across each */}
      <Page size={size} orientation={orientation} style={s.page}>
        <Head label="Surfaces" name={name} date={today} />
        <Text style={s.caption}>FLOORING</Text>
        <View style={[s.row, { marginTop: 6 }]}>
          {p.flooring.map((src, i) => (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image key={i} src={src} style={[s.fill, s.imgSq]} />
          ))}
        </View>
        <Text style={[s.caption, { marginTop: 18 }]}>CEILING</Text>
        <View style={[s.row, { marginTop: 6 }]}>
          {p.ceiling.map((src, i) => (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image key={i} src={src} style={[s.fill, s.imgSq]} />
          ))}
        </View>
      </Page>

      {/* 10 — Layout, guardrails, next steps */}
      <Page size={size} orientation={orientation} style={s.page}>
        <Head label="Layout & next steps" name={name} date={today} />
        <View style={[s.row, { marginBottom: 20 }]}>
          <View style={s.card}>
            <Text style={s.cardHead}>LAYOUT</Text>
            {brief.spatialNotes.map((n, i) => (
              <View key={i} style={s.bullet} wrap={false}>
                <Text style={s.bulletMark}>·</Text>
                <Text style={s.bulletText}>{n}</Text>
              </View>
            ))}
          </View>
          <View style={s.card}>
            <Text style={s.cardHead}>DO</Text>
            {brief.dos.map((d, i) => (
              <View key={i} style={s.bullet} wrap={false}>
                <Text style={s.bulletMark}>+</Text>
                <Text style={s.bulletText}>{d}</Text>
              </View>
            ))}
          </View>
          <View style={s.card}>
            <Text style={s.cardHead}>DON&apos;T</Text>
            {brief.donts.map((d, i) => (
              <View key={i} style={s.bullet} wrap={false}>
                <Text style={[s.bulletMark, { color: TXT_3 }]}>−</Text>
                <Text style={s.bulletText}>{d}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={[s.eyebrow, { marginBottom: 10 }]}>NEXT STEPS</Text>
        {brief.nextSteps.map((n, i) => (
          <View key={i} style={s.bullet} wrap={false}>
            <Text style={s.bulletMark}>{String(i + 1).padStart(2, "0")}</Text>
            <Text style={s.bulletText}>{n}</Text>
          </View>
        ))}
      </Page>

    </Document>
  );
}
