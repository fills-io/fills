"use client";

/**
 * BriefPDF — a magazine-style PDF rendering of the Design DNA brief.
 *
 * Built with @react-pdf/renderer so the output is a true PDF (not a
 * screenshot of HTML). Editorial qualities:
 *  - Cover page with concept line set in serif at display size
 *  - Generous whitespace, named section labels in mono caps
 *  - Color system as labeled swatches, not just hex codes
 *  - Reference imagery laid out as a contact-sheet grid
 *  - Optional client logo on the cover
 *  - Portrait or landscape orientation
 *
 * Pin images are loaded via remote URL by @react-pdf; if a particular
 * image fails (CORS, 404), it's silently skipped so one bad pin can't
 * tank the whole export.
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

const styles = StyleSheet.create({
  page: {
    backgroundColor: BG,
    paddingTop: 56,
    paddingHorizontal: 56,
    paddingBottom: 48,
    fontFamily: "Helvetica",
    color: TXT,
  },
  // Cover page
  coverHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 60,
  },
  wordmark: {
    fontSize: 9,
    color: ACC,
    letterSpacing: 2,
    fontFamily: "Helvetica-Bold",
  },
  logo: {
    width: 80,
    height: 32,
    objectFit: "contain",
  },
  coverLabel: {
    fontSize: 8,
    color: ACC,
    letterSpacing: 2,
    fontFamily: "Helvetica-Bold",
    marginBottom: 16,
  },
  conceptLine: {
    fontFamily: "Times-Roman",
    fontSize: 30,
    lineHeight: 1.25,
    color: TXT,
    marginBottom: 36,
  },
  keywordRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  keyword: {
    borderWidth: 0.5,
    borderColor: BDR,
    paddingHorizontal: 7,
    paddingVertical: 3,
    fontSize: 8,
    color: TXT_2,
    letterSpacing: 1,
    fontFamily: "Helvetica",
  },
  coverFooter: {
    position: "absolute",
    bottom: 36,
    left: 56,
    right: 56,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: TXT_3,
    letterSpacing: 1.5,
    fontFamily: "Helvetica",
  },
  // Body pages
  h2: {
    fontSize: 8,
    color: ACC,
    letterSpacing: 2,
    fontFamily: "Helvetica-Bold",
    marginBottom: 14,
  },
  section: { marginBottom: 28 },
  // Color system
  swatchRow: {
    flexDirection: "row",
    gap: 12,
  },
  swatchCell: {
    flex: 1,
  },
  swatch: {
    height: 80,
    borderWidth: 0.5,
    borderColor: BDR,
    marginBottom: 8,
  },
  swatchRole: {
    fontSize: 7,
    color: TXT_3,
    letterSpacing: 1.5,
    fontFamily: "Helvetica",
    marginBottom: 2,
  },
  swatchName: {
    fontSize: 12,
    fontFamily: "Times-Roman",
    color: TXT,
    marginBottom: 1,
  },
  swatchMaterial: {
    fontSize: 8,
    color: TXT_2,
    fontFamily: "Helvetica",
  },
  // Cinematic + pillars
  cinematicBox: {
    borderWidth: 0.5,
    borderColor: BDR,
    padding: 18,
    marginBottom: 28,
  },
  cinematicBody: {
    fontFamily: "Times-Roman",
    fontSize: 11,
    lineHeight: 1.6,
    color: TXT,
  },
  pillarsRow: {
    flexDirection: "row",
    gap: 0,
  },
  pillarCell: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: BDR,
    padding: 14,
  },
  pillarHead: {
    fontSize: 7,
    color: ACC,
    letterSpacing: 1.5,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
  },
  pillarBody: {
    fontSize: 9,
    lineHeight: 1.55,
    color: TXT_2,
    fontFamily: "Helvetica",
  },
  // Atmospheres
  atmosphereGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  atmosphereCell: {
    width: "47%",
    marginBottom: 14,
  },
  atmosphereLabel: {
    fontSize: 7,
    color: TXT_3,
    letterSpacing: 1.5,
    fontFamily: "Helvetica",
    marginBottom: 3,
  },
  atmosphereBody: {
    fontSize: 10,
    lineHeight: 1.5,
    color: TXT_2,
    fontFamily: "Helvetica",
  },
  // Reference imagery
  pinSectionRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  pinSectionLabel: {
    width: 80,
    fontSize: 7,
    color: TXT_3,
    letterSpacing: 1.5,
    fontFamily: "Helvetica",
    paddingTop: 4,
  },
  pinGrid: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  pinThumb: {
    width: 60,
    height: 60,
    borderWidth: 0.5,
    borderColor: BDR,
    objectFit: "cover",
  },
});

const ATMOSPHERE_LABELS: Array<[keyof GenerateBriefResponse["sectionMoodLines"], string]> = [
  ["vibe", "Vibe"],
  ["colors", "Colors"],
  ["furniture", "Furniture"],
  ["lighting", "Lighting"],
  ["surfaces", "Surfaces"],
  ["materials", "Materials"],
  ["pillars", "Pillars"],
  ["cover", "Cover"],
];

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

export default function BriefPDF({
  brief,
  pins,
  orientation,
  logoDataUrl,
}: Props) {
  const hasAnyPins =
    !!pins &&
    PIN_SECTIONS.some(([key]) => (pins[key]?.length ?? 0) > 0);

  return (
    <Document
      title="Design plan (brief)"
      author="Fills"
      subject={brief.conceptLine}
    >
      {/* Cover */}
      <Page size="A4" orientation={orientation} style={styles.page}>
        <View style={styles.coverHeader}>
          <Text style={styles.wordmark}>FILLS · DESIGN PLAN</Text>
          {logoDataUrl ? (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image src={logoDataUrl} style={styles.logo} />
          ) : null}
        </View>

        <Text style={styles.coverLabel}>BRIEF</Text>
        <Text style={styles.conceptLine}>{brief.conceptLine}</Text>

        <View style={styles.keywordRow}>
          {brief.keywords.map((kw) => (
            <Text key={kw} style={styles.keyword}>
              {kw.toUpperCase()}
            </Text>
          ))}
        </View>

        <View style={styles.coverFooter}>
          <Text>FILLS.IO</Text>
          <Text>{new Date().toISOString().slice(0, 10).toUpperCase()}</Text>
        </View>
      </Page>

      {/* Color system + atmospheres */}
      <Page size="A4" orientation={orientation} style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.h2}>COLOR SYSTEM</Text>
          <View style={styles.swatchRow}>
            {brief.colorSystem.map((c) => (
              <View key={c.role} style={styles.swatchCell}>
                <View style={[styles.swatch, { backgroundColor: c.hex }]} />
                <Text style={styles.swatchRole}>
                  {(ROLE_LABEL[c.role] ?? c.role).toUpperCase()} · {c.hex.toUpperCase()}
                </Text>
                <Text style={styles.swatchName}>{c.name}</Text>
                <Text style={styles.swatchMaterial}>{c.material}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.h2}>SECTION ATMOSPHERES</Text>
          <View style={styles.atmosphereGrid}>
            {ATMOSPHERE_LABELS.map(([key, label]) => (
              <View key={key} style={styles.atmosphereCell}>
                <Text style={styles.atmosphereLabel}>{label.toUpperCase()}</Text>
                <Text style={styles.atmosphereBody}>
                  {brief.sectionMoodLines[key]}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </Page>

      {/* Cinematic + strategic pillars */}
      <Page size="A4" orientation={orientation} style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.h2}>THE SPACE, AS IT WOULD BE PHOTOGRAPHED</Text>
          <View style={styles.cinematicBox}>
            <Text style={styles.cinematicBody}>
              {brief.cinematicDescription}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.h2}>STRATEGIC PILLARS</Text>
          <View style={styles.pillarsRow}>
            {(
              [
                ["psychological", "Psychological"],
                ["functional", "Functional"],
                ["marketing", "Marketing"],
              ] as const
            ).map(([key, label]) => (
              <View key={key} style={styles.pillarCell}>
                <Text style={styles.pillarHead}>{label.toUpperCase()}</Text>
                <Text style={styles.pillarBody}>
                  {brief.strategicPillars[key]}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </Page>

      {/* Reference imagery (only if any pins) */}
      {hasAnyPins && (
        <Page size="A4" orientation={orientation} style={styles.page}>
          <Text style={styles.h2}>REFERENCE IMAGES</Text>
          {PIN_SECTIONS.map(([key, label]) => {
            const list = pins?.[key] ?? [];
            if (list.length === 0) return null;
            return (
              <View key={key} style={styles.pinSectionRow} wrap={false}>
                <Text style={styles.pinSectionLabel}>{label.toUpperCase()}</Text>
                <View style={styles.pinGrid}>
                  {list.map((pin) => (
                    // eslint-disable-next-line jsx-a11y/alt-text
                    <Image
                      key={pin.id}
                      src={pin.imageThumbUrl || pin.imageUrl}
                      style={styles.pinThumb}
                    />
                  ))}
                </View>
              </View>
            );
          })}
        </Page>
      )}
    </Document>
  );
}
