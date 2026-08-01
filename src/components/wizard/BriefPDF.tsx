"use client";

/**
 * BriefPDF — the downloadable design brief.
 *
 * Built with @react-pdf/renderer so the output is a true PDF (not a screenshot).
 *
 * IMAGES (the bug this file existed to fix): @react-pdf fetches every <Image>
 * src from the browser. Pinterest's CDN sends no CORS headers, so fetching
 * i.pinimg.com directly fails and every image was silently dropped — the export
 * shipped with zero photos. We now route each pin through our own same-origin
 * `/api/img` proxy, which makes the fetch legal and the image embed.
 *
 * Structure mirrors the web brief: cover, project + colour, materials +
 * furniture, lighting + layout + do/don't, then large reference plates.
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

type Props = {
  brief: GenerateBriefResponse;
  pins?: BriefPins;
  orientation: "portrait" | "landscape";
  /** Data-URL of an uploaded logo (PNG/JPG). */
  logoDataUrl?: string | null;
};

const ACC = "#c8512a";
const TXT = "#1a1714";
const TXT_2 = "#4a4038";
const TXT_3 = "#857a70";
const BG = "#f7f1e8";
const BDR = "#d8cdb8";

/**
 * Same-origin proxy URL for a Pinterest image so @react-pdf can fetch it.
 * Non-pinimg sources (and data URLs) are passed through untouched.
 */
function pdfImageSrc(url: string | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("data:")) return url;
  try {
    const u = new URL(url, typeof window !== "undefined" ? window.location.href : undefined);
    if (u.hostname === "pinimg.com" || u.hostname.endsWith(".pinimg.com")) {
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      return `${origin}/api/img?url=${encodeURIComponent(u.toString())}`;
    }
    return u.toString();
  } catch {
    return null;
  }
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: BG,
    paddingTop: 48,
    paddingHorizontal: 48,
    paddingBottom: 44,
    fontFamily: "Helvetica",
    color: TXT,
  },
  // Cover
  coverHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 48,
  },
  wordmark: {
    fontSize: 9,
    color: ACC,
    letterSpacing: 2,
    fontFamily: "Helvetica-Bold",
  },
  logo: { width: 80, height: 32, objectFit: "contain" },
  coverLabel: {
    fontSize: 8,
    color: ACC,
    letterSpacing: 2,
    fontFamily: "Helvetica-Bold",
    marginBottom: 14,
  },
  conceptLine: {
    fontFamily: "Times-Roman",
    fontSize: 26,
    lineHeight: 1.28,
    color: TXT,
    marginBottom: 20,
  },
  coverIntent: {
    fontSize: 11,
    lineHeight: 1.6,
    color: TXT_2,
    maxWidth: "85%",
    marginBottom: 26,
  },
  keywordRow: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  keyword: {
    borderWidth: 0.5,
    borderColor: BDR,
    paddingHorizontal: 6,
    paddingVertical: 3,
    fontSize: 7.5,
    color: TXT_2,
    letterSpacing: 1,
  },
  coverFooter: {
    position: "absolute",
    bottom: 32,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: TXT_3,
    letterSpacing: 1.5,
  },
  // Body
  h2: {
    fontSize: 8,
    color: ACC,
    letterSpacing: 2,
    fontFamily: "Helvetica-Bold",
    marginBottom: 10,
  },
  section: { marginBottom: 22 },
  body: { fontSize: 10, lineHeight: 1.55, color: TXT_2 },
  // Two-up info cards
  cardRow: { flexDirection: "row", gap: 12 },
  card: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: BDR,
    padding: 12,
  },
  cardHead: {
    fontSize: 7,
    color: ACC,
    letterSpacing: 1.5,
    fontFamily: "Helvetica-Bold",
    marginBottom: 5,
  },
  cardBody: { fontSize: 9, lineHeight: 1.5, color: TXT_2 },
  // Colour
  swatchRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  swatchCell: { flex: 1 },
  swatch: {
    height: 56,
    borderWidth: 0.5,
    borderColor: BDR,
    marginBottom: 5,
  },
  swatchName: { fontSize: 9.5, fontFamily: "Times-Roman", color: TXT },
  swatchHex: { fontSize: 7, color: TXT_3, letterSpacing: 1, marginBottom: 2 },
  swatchApp: { fontSize: 8, lineHeight: 1.45, color: TXT_2 },
  // Spec rows
  specRow: {
    flexDirection: "row",
    borderTopWidth: 0.5,
    borderTopColor: BDR,
    paddingVertical: 6,
    gap: 12,
  },
  specHead: { width: "38%", fontSize: 9.5, color: TXT, lineHeight: 1.4 },
  specBody: { flex: 1 },
  specSub: { fontSize: 9, color: TXT_2, lineHeight: 1.45 },
  specNote: { fontSize: 8, color: TXT_3, lineHeight: 1.4, marginTop: 1 },
  // Lists
  bullet: { flexDirection: "row", gap: 6, marginBottom: 4 },
  bulletDot: { fontSize: 9, color: ACC },
  bulletText: { flex: 1, fontSize: 9, lineHeight: 1.5, color: TXT_2 },
  // Reference plates
  plateLabel: {
    fontSize: 7,
    color: TXT_3,
    letterSpacing: 1.5,
    marginBottom: 5,
    marginTop: 4,
  },
  plateGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  plate: {
    width: "31.5%",
    height: 118,
    borderWidth: 0.5,
    borderColor: BDR,
    objectFit: "cover",
  },
});

const PIN_SECTIONS: Array<[keyof BriefPins, string]> = [
  ["vibe", "Vibe"],
  ["furniture", "Furniture"],
  ["lighting", "Lighting"],
  ["flooring", "Flooring"],
  ["ceiling", "Ceiling"],
  ["materials", "Materials"],
];

const ROLE_LABEL: Record<string, string> = {
  primary: "Primary",
  secondary: "Secondary",
  accent: "Accent",
  supporting: "Supporting",
};

function Spec({
  head,
  sub,
  note,
}: {
  head: string;
  sub: string;
  note?: string;
}) {
  return (
    <View style={styles.specRow} wrap={false}>
      <Text style={styles.specHead}>{head}</Text>
      <View style={styles.specBody}>
        <Text style={styles.specSub}>{sub}</Text>
        {note ? <Text style={styles.specNote}>{note}</Text> : null}
      </View>
    </View>
  );
}

function Bullets({ items, mark = "•" }: { items: string[]; mark?: string }) {
  return (
    <View>
      {items.map((t, i) => (
        <View key={i} style={styles.bullet} wrap={false}>
          <Text style={styles.bulletDot}>{mark}</Text>
          <Text style={styles.bulletText}>{t}</Text>
        </View>
      ))}
    </View>
  );
}

export default function BriefPDF({
  brief,
  pins,
  orientation,
  logoDataUrl,
}: Props) {
  const pinSections = PIN_SECTIONS.map(([key, label]) => {
    const list = (pins?.[key] ?? [])
      .map((p) => ({
        id: p.id,
        src: pdfImageSrc(p.imageUrl || p.imageThumbUrl),
      }))
      .filter((p): p is { id: string; src: string } => !!p.src);
    return { key, label, list };
  }).filter((s) => s.list.length > 0);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <Document
      title={`Design brief — ${brief.summary.projectType}`}
      author="Fills"
      subject={brief.conceptLine}
    >
      {/* 1 — Cover */}
      <Page size="A4" orientation={orientation} style={styles.page}>
        <View style={styles.coverHeader}>
          <Text style={styles.wordmark}>FILLS · DESIGN BRIEF</Text>
          {logoDataUrl ? (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image src={logoDataUrl} style={styles.logo} />
          ) : null}
        </View>

        <Text style={styles.coverLabel}>
          {brief.summary.projectType.toUpperCase()}
        </Text>
        <Text style={styles.conceptLine}>{brief.conceptLine}</Text>
        <Text style={styles.coverIntent}>{brief.summary.intent}</Text>

        <View style={styles.keywordRow}>
          {brief.keywords.map((kw) => (
            <Text key={kw} style={styles.keyword}>
              {kw.toUpperCase()}
            </Text>
          ))}
        </View>

        <View style={styles.coverFooter}>
          <Text>FILLS.IO</Text>
          <Text>{today}</Text>
        </View>
      </Page>

      {/* 2 — The project + colour system */}
      <Page size="A4" orientation={orientation} style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.h2}>THE PROJECT</Text>
          <View style={styles.cardRow}>
            <View style={styles.card}>
              <Text style={styles.cardHead}>WHO IT&apos;S FOR</Text>
              <Text style={styles.cardBody}>{brief.summary.whoItsFor}</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardHead}>SCOPE</Text>
              <Text style={styles.cardBody}>{brief.summary.scopeNotes}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.h2}>COLOUR SYSTEM</Text>
          <View style={styles.swatchRow}>
            {brief.colorSystem.map((c, i) => (
              <View key={`${c.hex}-${i}`} style={styles.swatchCell}>
                <View style={[styles.swatch, { backgroundColor: c.hex }]} />
                <Text style={styles.swatchHex}>
                  {(ROLE_LABEL[c.role] ?? c.role).toUpperCase()} ·{" "}
                  {c.hex.toUpperCase()}
                </Text>
                <Text style={styles.swatchName}>{c.name}</Text>
                <Text style={styles.swatchApp}>{c.application}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.h2}>LAYOUT &amp; SPATIAL NOTES</Text>
          <Bullets items={brief.spatialNotes} />
        </View>
      </Page>

      {/* 3 — Materials + furniture */}
      <Page size="A4" orientation={orientation} style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.h2}>MATERIALS &amp; FINISHES</Text>
          {brief.materials.map((m, i) => (
            <Spec key={i} head={m.material} sub={m.application} note={m.note} />
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.h2}>FURNITURE</Text>
          {brief.furniture.map((f, i) => (
            <Spec key={i} head={f.item} sub={f.character} note={f.note} />
          ))}
        </View>
      </Page>

      {/* 4 — Lighting + guardrails + next steps */}
      <Page size="A4" orientation={orientation} style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.h2}>LIGHTING PLAN</Text>
          <Text style={[styles.body, { marginBottom: 4 }]}>
            {brief.lighting.strategy}
          </Text>
          <Text
            style={{
              fontSize: 8,
              color: ACC,
              letterSpacing: 1.2,
              marginBottom: 6,
              fontFamily: "Helvetica-Bold",
            }}
          >
            {brief.lighting.colorTemperature.toUpperCase()}
          </Text>
          {brief.lighting.layers.map((l) => (
            <Spec key={l.layer} head={l.layer} sub={l.fixtures} note={l.note} />
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.cardRow}>
            <View style={styles.card}>
              <Text style={styles.cardHead}>DO</Text>
              <Bullets items={brief.dos} mark="+" />
            </View>
            <View style={styles.card}>
              <Text style={styles.cardHead}>DON&apos;T</Text>
              <Bullets items={brief.donts} mark="−" />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.h2}>NEXT STEPS</Text>
          {brief.nextSteps.map((s, i) => (
            <View key={i} style={styles.bullet} wrap={false}>
              <Text style={[styles.bulletDot, { fontFamily: "Helvetica-Bold" }]}>
                {String(i + 1).padStart(2, "0")}
              </Text>
              <Text style={styles.bulletText}>{s}</Text>
            </View>
          ))}
        </View>
      </Page>

      {/* 5 — Reference plates (large) */}
      {pinSections.length > 0 && (
        <Page size="A4" orientation={orientation} style={styles.page}>
          <Text style={styles.h2}>REFERENCE IMAGES</Text>
          {pinSections.map(({ key, label, list }) => (
            <View key={key} wrap={false}>
              <Text style={styles.plateLabel}>{label.toUpperCase()}</Text>
              <View style={styles.plateGrid}>
                {list.map((p) => (
                  // eslint-disable-next-line jsx-a11y/alt-text
                  <Image key={p.id} src={p.src} style={styles.plate} />
                ))}
              </View>
            </View>
          ))}
        </Page>
      )}

      {/* 6 — How it should look */}
      <Page size="A4" orientation={orientation} style={styles.page}>
        <Text style={styles.h2}>HOW IT SHOULD LOOK</Text>
        <Text
          style={{
            fontFamily: "Times-Roman",
            fontSize: 12,
            lineHeight: 1.65,
            color: TXT,
          }}
        >
          {brief.cinematicDescription}
        </Text>
        <View style={styles.coverFooter}>
          <Text>FILLS.IO · {brief.summary.projectType.toUpperCase()}</Text>
          <Text>{today}</Text>
        </View>
      </Page>
    </Document>
  );
}
