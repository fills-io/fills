"use client";

/**
 * The free, printable interior design brief template. Fields are editable, so a
 * visitor can fill it in on screen and then Print / Save as PDF. It renders as a
 * fixed "cream paper" sheet in both light and dark site modes, the way a
 * document preview always shows the page itself, not the surrounding UI.
 *
 * Colours are intentionally hard-coded (not theme tokens): this is a depiction
 * of a printable artifact, so it must look the same regardless of site theme.
 */

const INK = "#1F1B16";
const MUTED = "#9A8E7E";
const LINE = "rgba(31,27,22,.22)";
const LABEL = "#B0603A";
const TERRA = "#C8512A";
const PAPER = "#F4EDE1";
const CREAM = "#FBF1E8";

function Field({ label, wide }: { label: string; wide?: boolean }) {
  return (
    <div style={{ gridColumn: wide ? "1 / -1" : undefined }}>
      <label
        className="font-mono"
        style={{
          display: "block",
          fontSize: "8.5px",
          letterSpacing: ".12em",
          textTransform: "uppercase",
          color: MUTED,
          marginBottom: "5px",
        }}
      >
        {label}
      </label>
      <input
        type="text"
        aria-label={label}
        className="font-sans"
        style={{
          width: "100%",
          background: "transparent",
          border: "none",
          borderBottom: `1px solid ${LINE}`,
          outline: "none",
          padding: "2px 0 4px",
          fontSize: "14px",
          color: INK,
        }}
      />
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="font-mono"
      style={{
        fontSize: "9px",
        letterSpacing: ".18em",
        textTransform: "uppercase",
        color: LABEL,
        margin: "0 0 11px",
      }}
    >
      {children}
    </p>
  );
}

export default function BriefTemplate() {
  return (
    <div>
      {/* Toolbar (not printed) */}
      <div className="print:hidden mb-5 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-txt-3">
          Fill it in, then print or save as PDF
        </span>
        <button
          type="button"
          onClick={() => window.print()}
          className="bg-acc px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.1em] text-white transition hover:bg-acc-d"
        >
          Print / Save as PDF
        </button>
      </div>

      {/* The sheet */}
      <div
        id="brief-sheet"
        style={{
          position: "relative",
          maxWidth: "620px",
          margin: "0 auto",
          background: PAPER,
          border: `1px solid rgba(31,27,22,.13)`,
          padding: "40px 42px 32px",
          color: INK,
        }}
      >
        {/* Corner brackets */}
        <span style={{ position: "absolute", top: 10, left: 10, width: 15, height: 15, borderTop: `1.5px solid ${TERRA}`, borderLeft: `1.5px solid ${TERRA}` }} />
        <span style={{ position: "absolute", top: 10, right: 10, width: 15, height: 15, borderTop: `1.5px solid ${TERRA}`, borderRight: `1.5px solid ${TERRA}` }} />
        <span style={{ position: "absolute", bottom: 10, left: 10, width: 15, height: 15, borderBottom: `1.5px solid ${TERRA}`, borderLeft: `1.5px solid ${TERRA}` }} />
        <span style={{ position: "absolute", bottom: 10, right: 10, width: 15, height: 15, borderBottom: `1.5px solid ${TERRA}`, borderRight: `1.5px solid ${TERRA}` }} />

        {/* Masthead */}
        <div className="font-mono" style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", letterSpacing: ".18em", textTransform: "uppercase", color: MUTED }}>
          <span style={{ color: TERRA }}>Fills · Free template</span>
          <span>Brief · v.01</span>
        </div>
        <h1 className="font-serif" style={{ fontWeight: 500, fontSize: "32px", lineHeight: 1.05, letterSpacing: "-.01em", margin: "16px 0 6px", color: INK }}>
          Interior design brief
        </h1>
        <p className="font-serif" style={{ fontStyle: "italic", fontSize: "15px", color: "#7C7264", margin: "0 0 22px" }}>
          A one-page starting point for any project.
        </p>
        <div style={{ borderTop: `1px solid rgba(31,27,22,.14)`, margin: "0 0 22px" }} />

        {/* 01 Project */}
        <SectionLabel>01 · The project</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 24px", marginBottom: "24px" }}>
          <Field label="Client / project name" />
          <Field label="Date" />
          <Field label="Space or room" />
          <Field label="Approx. size" />
          <Field label="Who uses this space" wide />
        </div>

        {/* 02 Vision */}
        <SectionLabel>02 · The vision</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "18px", marginBottom: "24px" }}>
          <Field label="In one sentence, how should this space feel?" wide />
          <Field label="What isn't working today?" wide />
        </div>

        {/* 03 Style */}
        <SectionLabel>03 · Style direction</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 24px", marginBottom: "10px" }}>
          <div>
            <label className="font-mono" style={{ display: "block", fontSize: "8.5px", letterSpacing: ".12em", textTransform: "uppercase", color: MUTED, marginBottom: "7px" }}>
              Colours you love
            </label>
            <div style={{ display: "flex", gap: "6px" }}>
              {[0, 1, 2, 3].map((i) => (
                <span key={i} style={{ width: 26, height: 26, border: `1px solid ${LINE}` }} />
              ))}
            </div>
          </div>
          <Field label="Colours to avoid" />
          <Field label="Three words for the vibe" wide />
        </div>

        {/* 04 Practical */}
        <SectionLabel>04 · Practical</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 24px", marginBottom: "18px" }}>
          <Field label="Budget range" />
          <Field label="Deadline" />
          <Field label="Things that can't change" wide />
          <Field label="Must-haves and must-nots" wide />
        </div>

        {/* CTA band */}
        <div className="print:hidden" style={{ background: TERRA, padding: "18px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
          <div>
            <p className="font-serif" style={{ fontSize: "17px", color: CREAM, margin: "0 0 2px" }}>
              Don&apos;t want to fill this in by hand?
            </p>
            <p style={{ fontSize: "12px", color: "#F2D2C2", margin: 0 }}>
              Fills turns these answers into a finished brief: palette, materials, lighting, furniture.
            </p>
          </div>
          <a
            href="/concept/wizard"
            className="font-mono"
            style={{ whiteSpace: "nowrap", background: CREAM, color: "#A33F1E", fontSize: "11px", letterSpacing: ".08em", textTransform: "uppercase", padding: "11px 16px", textDecoration: "none" }}
          >
            Build it in 5 min →
          </a>
        </div>
      </div>
    </div>
  );
}
