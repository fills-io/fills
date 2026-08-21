/**
 * BriefPDF — the design deck.
 *
 * Deliberately NOT a client component. It holds no state and touches no
 * browser API beyond one guarded window check, and the paywall requires it to
 * render on the server — a `"use client"` module reaches server code as a
 * reference, not a function, and cannot be executed there.
 *
 * Modelled on how studios actually present a concept (see the Turtle / Emaar
 * Beachfront reference deck): a 16:9 presentation, roughly five or six images
 * per spread, and almost no prose.
 *
 * THE DECK IS DELIBERATELY NOT THE WHOLE BRIEF. The model still writes the
 * lighting plan, spatial notes, do/don't guardrails, colour locations, scope
 * and next steps — BriefDisplay shows all of it on the page, in its own
 * section, because that is what a designer actually builds from. None of it
 * appears here. A deck you hand across a table earns attention with images;
 * the specification lives on the page it links back to. If you are tempted to
 * add a paragraph to this file, it belongs in BriefDisplay instead.
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
  /** Absolute origin for the image proxy. Required when rendering on the
   *  server, where there is no window to read it from. */
  baseUrl?: string;
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

/**
 * Where /api/img lives, as an ABSOLUTE url.
 *
 * In the browser that's just this origin. On the server there is no window,
 * and @react-pdf cannot fetch a relative path — so the caller passes it in.
 */
function resolveBase(baseUrl?: string): string {
  if (baseUrl) return baseUrl.replace(/\/$/, "");
  return typeof window !== "undefined" ? window.location.origin : "";
}

function pdfSrc(url: string | undefined, base: string): string | null {
  if (!url) return null;
  if (url.startsWith("data:")) return url;
  try {
    const u = new URL(hiRes(url), base || undefined);
    if (u.hostname === "pinimg.com" || u.hostname.endsWith(".pinimg.com")) {
      return `${base}/api/img?url=${encodeURIComponent(u.toString())}`;
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

  // Image grids.
  //
  // Every slot is sized by ASPECT RATIO, never by a fixed height. It used to be
  // a fixed height with width:"100%", which held its shape only on the 1440pt
  // deck page. On A4 portrait the content width collapses to 36% while the
  // height stays put, so a 251x330 portrait slot became an 82x330 sliver and
  // "cover" threw away 73% of every photograph — the export was cutting the
  // pictures into vertical strips. A ratio holds on both page sizes because
  // the engine derives the height from whatever width it assigned.
  //
  // Do NOT reintroduce a fixed height here, and do not try to pin a row with
  // `flexShrink: 0`: @react-pdf/layout 4.6.1 coerces an explicit 0 back to 1
  // (setFlexShrink is `value || 1`), so it silently does nothing.
  row: { flexDirection: "row", gap: 14 },
  fill: { flex: 1 },
  caption: { fontSize: 7.5, color: TXT_3, letterSpacing: 1.6, marginTop: 6 },

  // Full-bleed mood board: no padding, edge to edge. Five across in two rows
  // on the deck, three across in three rows on A4.
  //
  // The rows must NOT be `flex: 1`. An <Image> with no ratio and no height
  // reports its INTRINSIC size — a 1200x1600 reference measures 1600pt tall —
  // so the rows grew to fit their content, overflowed, and react-pdf pushed
  // each one onto a page of its own where it then took the full height. That
  // is how a ten-page export became fourteen, with three mood images stretched
  // to 193 x 834. The cell ratio below sizes them instead.
  moodPage: { backgroundColor: INK, padding: 0 },
  moodRow: { flexDirection: "row", gap: 8 },

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
 * A schedule (material -> where it goes).
 *
 * Two columns on the 16:9 deck: one long column ran off the bottom of a wide
 * page and forced a text-only overflow spread. ONE column on A4, where two
 * would give each about 210pt with a 92pt key cell — narrower than the words
 * that go in it. A portrait page has the height to spend.
 */
function Schedule({
  rows,
  columns = 2,
}: {
  rows: Array<[string, string]>;
  columns?: number;
}) {
  const per = Math.ceil(rows.length / columns);
  const cols = Array.from({ length: columns }, (_, c) =>
    rows.slice(c * per, (c + 1) * per),
  );
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
  baseUrl,
}: Props) {
  const base = resolveBase(baseUrl);
  const size = format === "deck" ? DECK : "A4";
  const orientation = format === "deck" ? undefined : "portrait";
  const today = new Date().toISOString().slice(0, 10);

  // The crop shape each grid holds, as width ÷ height.
  //
  // The deck's numbers are the ones it already had, measured off its old fixed
  // heights, so the 16:9 export is unchanged. A4 is a different page and wants
  // its own: the same reference at 3-up on a 467pt column is less than a third
  // as wide, so the shapes are squarer and there are fewer of them per row.
  // Nothing sits below 0.55 (a sliver) or above 1.15 (a letterbox).
  const R =
    format === "deck"
      ? { tall: 0.91, med: 0.76, spec: 0.58, quad: 1.06, sq: 1.07, mood: 0.7 }
      : { tall: 0.78, med: 0.8, spec: 0.72, quad: 0.86, sq: 0.86, mood: 0.7 };

  /** Per-row image counts. Five across is 251pt on the deck and 87pt on A4. */
  const G =
    format === "deck"
      ? { project: 3, inspiration: 5, colour: 5, materials: 5, quad: 4, sq: 4, closing: 3, moodCols: 5 }
      : { project: 2, inspiration: 3, colour: 3, materials: 3, quad: 2, sq: 2, closing: 3, moodCols: 3 };

  /** An image that keeps its crop shape on any page size. */
  const img = (ratio: number) => [s.fill, { aspectRatio: ratio, objectFit: "cover" as const }];

  /**
   * Mood board: 5x2 on the deck, 3x3 on A4.
   *
   * The cell ratio is derived so the grid fills the sheet with a hair to
   * spare — a fraction over and the last row is pushed to a page of its own.
   *   deck: (1440 - 4x8)/5 = 281.6 wide, (810 - 8)/2 = 401 tall  -> 0.702
   *   A4:   (595.28 - 2x8)/3 = 193.1,    (841.89 - 2x8)/3 = 275.3 -> 0.701
   * Rounding both to 0.705 leaves ~3pt of slack on the deck and ~4pt on A4.
   */
  const moodCount = format === "deck" ? 10 : 9;
  const moodFill = [s.fill, { aspectRatio: 0.705, objectFit: "cover" as const }];

  /**
   * Display type, and the width it is allowed to run to.
   *
   * The sheet is authored for a 1312pt content area. On A4 that is 467pt, so
   * every `maxWidth: 900 / 1100 / 620` cap is inert and the 76pt cover title
   * and 40pt headings wrap to a column two or three words wide. Display sizes
   * scale hard because they are bound by width; body copy is left alone
   * because it is bound by legibility and 12.5pt is already near the floor.
   */
  const doc = format !== "deck";
  const contentW = doc ? 595.28 - 64 * 2 : 1312;
  const display = (deckPt: number) => (doc ? Math.round(deckPt * 0.55) : deckPt);
  /** Cap a deck-authored maxWidth to what the page can actually hold. */
  const cap = (deckPt: number) => Math.min(deckPt, contentW);

  /**
   * A cell in the project-facts strip. Four across is 116pt on A4, which wraps
   * "To be surveyed" onto three lines, so A4 takes two rows of two.
   *
   * The explicit `flex: 0` matters: `s.fact` sets `flex: 1`, which react-pdf
   * expands to flexBasis 0, and Yoga lines up flex items from the BASIS, not
   * the width. With basis 0 the line never fills, so `flexWrap` alone would
   * have done nothing at all and the cells would have stayed 4-across.
   */
  const factCell = doc ? { flex: 0, width: "50%" as const } : {};

  /** Split a spread's images into rows of `n`. */
  const rowsOf = <T,>(list: T[], n: number): T[][] =>
    Array.from({ length: Math.ceil(list.length / n) }, (_, r) =>
      list.slice(r * n, (r + 1) * n),
    );

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
      .map((p) => pdfSrc(p.imageUrl || p.imageThumbUrl, base))
      .filter((x): x is string => !!x);
  }
  const used = new Set<string>();

  /**
   * Take `n` unused images for a spread.
   *
   * `mix` decides what happens when the category runs short. A mood board, a
   * cover and the closing page are deliberate collages, so any good image
   * works and borrowing is right. A LABELLED spread is the opposite: this used
   * to borrow for every page, which is how the flooring spread of a real deck
   * shipped with three floor lamps on it. A labelled spread now runs short
   * rather than showing the wrong subject under its own heading.
   */
  function take(
    k: keyof BriefPins,
    n: number,
    mix: "own-category" | "any" = "own-category",
  ): string[] {
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
    if (mix === "any" && out.length < n) for (const other of CATS) pull(queues[other]);
    return out;
  }

  // Allocated up front, in the order the deck should get the best images —
  // not in JSX order, so the mood board isn't starved by the pages after it.
  // Allocation order is NOT page order. The two pure-image spreads are claimed
  // first: when they were allocated last the pool had run dry, and the mood
  // board shipped with five of its ten slots empty against a black background
  // while the closing page had none at all. The spreads that also carry text
  // can absorb a short row; these two cannot.
  const p = {
    // Cover, mood board and closing are collages with no subject heading over
    // them, so they may borrow across categories. Everything else is labelled.
    cover: take("vibe", 1, "any")[0] ?? null,
    mood: [
      ...take("furniture", 4, "any"),
      ...take("lighting", 3, "any"),
      ...take("flooring", 3, "any"),
    ],
    closing: take("ceiling", 3, "any"),
    project: take("vibe", 3),
    inspiration: take("vibe", 5),
    colour: take("materials", 5),
    materials: take("materials", 5),
    furniture: take("furniture", 8),
    // Lighting has no written plan any more, so the spread is pure reference.
    lighting: take("lighting", 8),
    flooring: take("flooring", 4),
    ceiling: take("ceiling", 4),
  };

  // The cover wants a NAME, not a category. "Dune House" reads as a scheme;
  // "Hotel lobby, boutique hospitality" reads as a search query. Briefs saved
  // before the model was asked for a title fall back to what they have.
  const name =
    facts?.projectName?.trim() || brief.title?.trim() || brief.summary.projectType;

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
          <Text style={[s.coverTitle, { fontSize: display(76), maxWidth: cap(1100) }]}>
            {name}
          </Text>
          <Text style={[s.coverSub, { maxWidth: cap(620) }]}>
            {brief.conceptLine}
          </Text>
        </View>
      </Page>

      {/* 2 — The project: facts + intent + two images */}
      <Page size={size} orientation={orientation} style={s.page}>
        <Head label="The project" name={name} date={today} />
        <View style={[s.facts, doc ? { flexWrap: "wrap" } : {}]}>
          <View style={[s.fact, factCell]}>
            <Text style={s.factLabel}>AREA</Text>
            <Text style={s.factValue}>
              {facts?.areaSqm ? `${facts.areaSqm} m²` : "To be surveyed"}
            </Text>
          </View>
          <View style={[s.fact, factCell]}>
            <Text style={s.factLabel}>SPACE</Text>
            <Text style={s.factValue}>{brief.summary.projectType}</Text>
          </View>
          <View style={[s.fact, factCell]}>
            <Text style={s.factLabel}>OUTDOOR</Text>
            <Text style={s.factValue}>{facts?.hasOutdoor ? "Yes" : "None"}</Text>
          </View>
          <View style={[s.fact, factCell]}>
            <Text style={s.factLabel}>DIRECTION</Text>
            <Text style={s.factValue}>{facts?.style ?? "—"}</Text>
          </View>
        </View>

        {/* The deck sets the intent beside the references; A4 stacks them.
            A 32% text column on a 467pt sheet is a 150pt newspaper gutter,
            and it left the three images 87pt wide apiece. */}
        <View
          style={
            doc
              ? { marginTop: 22 }
              : { flexDirection: "row", gap: 28, marginTop: 26 }
          }
        >
          <View style={doc ? {} : { width: "32%" }}>
            <Text style={s.lead}>{brief.summary.intent}</Text>
          </View>
          <View style={[s.row, s.fill, doc ? { marginTop: 18 } : {}]}>
            {p.project.slice(0, G.project).map((src, i) => (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image key={i} src={src} style={img(R.tall)} />
            ))}
          </View>
        </View>
      </Page>

      {/* 3 — Inspiration: the one paragraph of real writing, plus five images */}
      <Page size={size} orientation={orientation} style={s.page}>
        <Head label="Inspiration" name={name} date={today} />
        <Text style={[s.h1, { fontSize: display(40), maxWidth: cap(900), marginBottom: 18 }]}>
          {brief.conceptLine}
        </Text>
        <Text style={[s.lead, { maxWidth: cap(900), marginBottom: 24 }]}>
          {brief.cinematicDescription}
        </Text>
        {rowsOf(p.inspiration, G.inspiration).map((row, r) => (
          <View
            key={r}
            style={[s.row, r === 0 ? {} : { marginTop: 14 }]}
          >
            {row.map((src, i) => (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image key={i} src={src} style={img(R.med)} />
            ))}
          </View>
        ))}
      </Page>

      {/* 4 — Mood board. Full bleed, not one word. Ten images across two rows
          of five on the deck; nine across three rows of three on A4, because
          five across a 595pt sheet is a filmstrip. */}
      {p.mood.length > 0 ? (
        <Page size={size} orientation={orientation} style={s.moodPage}>
          {Array.from(
            { length: Math.ceil(moodCount / G.moodCols) },
            (_, r) => (
              <View
                key={r}
                style={[s.moodRow, r === 0 ? {} : { marginTop: 8 }]}
              >
                {p.mood
                  .slice(r * G.moodCols, (r + 1) * G.moodCols)
                  .map((src, i) => (
                    // eslint-disable-next-line jsx-a11y/alt-text
                    <Image key={i} src={src} style={moodFill} />
                  ))}
              </View>
            ),
          )}
        </Page>
      ) : null}

      {/* 5 — Palette */}
      <Page size={size} orientation={orientation} style={s.page}>
        <Head label="Colour" name={name} date={today} />
        <View style={[s.band, doc ? { height: 130 } : {}]}>
          {brief.colorSystem.map((c, i) => (
            <View key={i} style={[s.bandCell, { backgroundColor: c.hex }]}>
              <Text style={[s.bandHex, { color: textOn(c.hex) }]}>
                {c.hex.toUpperCase()}
              </Text>
              <Text style={[s.bandName, { color: textOn(c.hex) }]}>{c.name}</Text>
            </View>
          ))}
        </View>
        {rowsOf(p.colour, G.colour).map((row, r) => (
          <View
            key={r}
            style={[s.row, { marginTop: 18 }, r === 0 ? {} : { marginTop: 14 }]}
          >
            {row.map((src, i) => (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image key={i} src={src} style={img(R.med)} />
            ))}
          </View>
        ))}
      </Page>

      {/* 6 — Materials & finishes: images + schedule */}
      <Page size={size} orientation={orientation} style={s.page}>
        <Head label="Materials & finishes" name={name} date={today} />
        {rowsOf(p.materials, G.materials).map((row, r) => (
          <View
            key={r}
            style={[s.row, { marginBottom: 22 }, r === 0 ? {} : { marginTop: 14 }]}
          >
            {row.map((src, i) => (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image key={i} src={src} style={img(R.spec)} />
            ))}
          </View>
        ))}
        <Schedule
          rows={brief.materials.map((m) => [m.material, m.application])}
          columns={doc ? 1 : 2}
        />
      </Page>

      {/* 7 — Furniture: eight references over a single line of names. */}
      <Page size={size} orientation={orientation} style={s.page}>
        <Head label="Furniture" name={name} date={today} />
        {rowsOf(p.furniture, G.quad).map((row, r) => (
          <View key={r} style={[s.row, r === 0 ? {} : { marginTop: 14 }]}>
            {row.map((src, i) => (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image key={i} src={src} style={img(R.quad)} />
            ))}
          </View>
        ))}
        <Text style={[s.caption, { marginTop: 16 }]}>
          {brief.furniture.map((f) => f.item).join("   ·   ").toUpperCase()}
        </Text>
      </Page>

      {/* 8 — Lighting: reference only, no plan. */}
      <Page size={size} orientation={orientation} style={s.page}>
        <Head label="Lighting" name={name} date={today} />
        {rowsOf(p.lighting, G.quad).map((row, r) => (
          <View key={r} style={[s.row, r === 0 ? {} : { marginTop: 14 }]}>
            {row.map((src, i) => (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image key={i} src={src} style={img(R.quad)} />
            ))}
          </View>
        ))}
      </Page>

      {/* 9 — Surfaces: flooring over ceiling, four across each */}
      <Page size={size} orientation={orientation} style={s.page}>
        <Head label="Surfaces" name={name} date={today} />
        <Text style={s.caption}>FLOORING</Text>
        {rowsOf(p.flooring, G.sq).map((row, r) => (
          <View
            key={r}
            style={[s.row, { marginTop: 6 }, r === 0 ? {} : { marginTop: 14 }]}
          >
            {row.map((src, i) => (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image key={i} src={src} style={img(R.sq)} />
            ))}
          </View>
        ))}
        <Text style={[s.caption, { marginTop: 18 }]}>CEILING</Text>
        {rowsOf(p.ceiling, G.sq).map((row, r) => (
          <View
            key={r}
            style={[s.row, { marginTop: 6 }, r === 0 ? {} : { marginTop: 14 }]}
          >
            {row.map((src, i) => (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image key={i} src={src} style={img(R.sq)} />
            ))}
          </View>
        ))}
      </Page>

      {/* 10 — Closing: the direction in ten words, over three references. */}
      <Page size={size} orientation={orientation} style={s.page}>
        <Head label="The direction" name={name} date={today} />
        <Text style={[s.h1, { fontSize: display(40), marginBottom: 26, maxWidth: cap(1100) }]}>
          {brief.keywords.join("  ·  ")}
        </Text>
        {rowsOf(p.closing, G.closing).map((row, r) => (
          <View
            key={r}
            style={[s.row, r === 0 ? {} : { marginTop: 14 }]}
          >
            {row.map((src, i) => (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image key={i} src={src} style={img(R.tall)} />
            ))}
          </View>
        ))}
      </Page>

    </Document>
  );
}
