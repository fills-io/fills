import { ImageResponse } from "next/og";

/**
 * The share card every link to fills.io renders with (Slack, X, WhatsApp,
 * LinkedIn). Living at the app root means Next serves it for nested routes too,
 * so a shared /blog or /concept link is never a bare grey box.
 *
 * One catch: a page that declares its own `openGraph` replaces the root's
 * wholesale, and this file's image with it. Every such page therefore points at
 * "/opengraph-image" explicitly — verified in the build output, not assumed.
 *
 * Drawn, not photographed: the drafting frame, terracotta rule and bracketed
 * wordmark are the same marks the site uses, so the card reads as Fills before
 * anyone reads the words. Deliberately typeface-free — satori would need a font
 * binary fetched over the network to render our Playfair headline, and the
 * build has to work offline, so the layout carries the brand instead.
 */

export const runtime = "nodejs";
export const alt =
  "Fills — design briefs, built like architecture. An interior design brief and mood board generator.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PAPER = "#f7f1e8";
const INK = "#1a1714";
const MUTED = "#6b6058";
const TERRA = "#c8512a";
const RULE = "rgba(26, 23, 20, 0.14)";

const EDGE = `3px solid ${TERRA}`;

/** The four L-shaped drafting brackets that clip the corners of the frame. */
const BRACKETS: React.CSSProperties[] = [
  { top: 0, left: 0, borderTop: EDGE, borderLeft: EDGE },
  { top: 0, right: 0, borderTop: EDGE, borderRight: EDGE },
  { bottom: 0, left: 0, borderBottom: EDGE, borderLeft: EDGE },
  { bottom: 0, right: 0, borderBottom: EDGE, borderRight: EDGE },
];

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: PAPER,
          color: INK,
          padding: 72,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 40,
            left: 40,
            right: 40,
            bottom: 40,
            border: `1px solid ${RULE}`,
            display: "flex",
          }}
        >
          {BRACKETS.map((corner, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                width: 46,
                height: 46,
                ...corner,
              }}
            />
          ))}
        </div>

        {/* Eyebrow */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 44, height: 2, background: TERRA }} />
          <div
            style={{
              fontSize: 20,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: TERRA,
            }}
          >
            Interior design briefs
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 82,
              lineHeight: 1.08,
              letterSpacing: -2,
              color: INK,
            }}
          >
            Design briefs, built
          </div>
          <div
            style={{
              fontSize: 82,
              lineHeight: 1.08,
              letterSpacing: -2,
              color: INK,
            }}
          >
            like architecture.
          </div>
          <div
            style={{
              marginTop: 26,
              fontSize: 26,
              lineHeight: 1.5,
              color: MUTED,
              whiteSpace: "nowrap",
            }}
          >
            Palette, materials, lighting and furniture — one page, five minutes.
          </div>
        </div>

        {/* Wordmark: fi[caret]s.io, the same mark the site wears. */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ fontSize: 54, letterSpacing: -1, color: INK }}>fi</div>
            <div style={{ fontSize: 54, color: TERRA, marginLeft: 4 }}>[</div>
            <div
              style={{
                width: 9,
                height: 38,
                background: TERRA,
                margin: "0 7px",
              }}
            />
            <div style={{ fontSize: 54, color: TERRA, marginRight: 4 }}>]</div>
            <div style={{ fontSize: 54, letterSpacing: -1, color: INK }}>s</div>
            <div style={{ fontSize: 26, color: MUTED, marginLeft: 6 }}>.io</div>
          </div>
          <div
            style={{
              fontSize: 18,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: MUTED,
            }}
          >
            Built by a working architect
          </div>
        </div>
      </div>
    ),
    size,
  );
}
