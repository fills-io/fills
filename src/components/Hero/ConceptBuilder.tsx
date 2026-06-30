"use client";

/**
 * ConceptBuilder — the v40 hero input engine (ported).
 *
 * Three tabs share one card:
 *   • Quick — a madlib sentence: "I'm working on a [industry ▾] project —
 *     a [specifically…] that feels like [vibe…]." with smart AI suggestion
 *     chips (vibes matched to the exact space, not just the industry) and a
 *     "Surprise me" randomizer.
 *   • Upload images — a 3–5 image dropzone.
 *   • Full Studio — a launcher into the 9-category authoring flow.
 *
 * Theme-aware throughout (works on the cream light hero + the dark hero).
 */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  INDUSTRIES,
  getIndustry,
  getSpecSuggestions,
  getVibeSuggestions,
  shouldShowVibe,
  SPEC_BY_IND,
  VIBE_BY_IND,
} from "@/lib/concept-taxonomy";

type Tab = "quick" | "upload" | "studio";

function sample<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

// Generic example sets so the "specifically…" and "vibe…" blanks roll
// through suggestions even before an industry is picked (matching the
// industry slot). Once an industry is chosen, the industry-specific
// suggestions take over.
const GENERIC_SPECS = [
  "boutique hotel suite",
  "cocktail bar",
  "yoga studio",
  "loft apartment",
  "specialty café",
  "fragrance boutique",
  "founder's office",
];
const GENERIC_VIBES = [
  "warm minimalism",
  "japandi calm",
  "1920s glam",
  "moody intimate",
  "Mediterranean",
  "Belgian wabi",
];

export default function ConceptBuilder() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("quick");
  const [industryId, setIndustryId] = useState<string | null>(null);
  const [spec, setSpec] = useState("");
  const [vibe, setVibe] = useState("");
  const [ddOpen, setDdOpen] = useState(false);
  const diceRef = useRef<HTMLButtonElement>(null);

  const industry = getIndustry(industryId);
  const specSuggestions = getSpecSuggestions(industryId);
  const vibeSuggestions = getVibeSuggestions(industryId, spec);
  const showVibe = shouldShowVibe(industryId, spec);

  const filled =
    (industryId ? 1 : 0) + (spec.trim() ? 1 : 0) + (vibe.trim() ? 1 : 0);
  const canGenerate = filled === 3;

  function randomize() {
    const ind = sample(INDUSTRIES);
    const sp = sample(SPEC_BY_IND[ind.id] ?? ["custom space"]);
    const vb = sample(VIBE_BY_IND[ind.id] ?? ["warm minimalism"]);
    setIndustryId(ind.id);
    setSpec(sp);
    setVibe(vb);
    setDdOpen(false);
    const el = diceRef.current;
    if (el) {
      el.classList.remove("dice-rolling");
      void el.offsetWidth;
      el.classList.add("dice-rolling");
    }
  }

  function build() {
    if (tab === "quick") {
      // → new QuickFlow, prefilled from the madlib.
      const qs = new URLSearchParams({
        path: "quick",
        industry: industry?.label ?? "",
        spec: spec.trim(),
        vibe: vibe.trim(),
      });
      router.push(`/concept/wizard?${qs.toString()}`);
    } else if (tab === "upload") {
      // → new QuickFlow upload path.
      router.push("/concept/wizard");
    } else {
      // Full Studio keeps the existing detailed wizard.
      router.push("/concept/wizard");
    }
  }

  return (
    <div className="w-full max-w-[700px]">
      {/* ── Pill tabs ── */}
      <div className="mb-[18px] inline-flex gap-0.5 rounded-sm border border-bdr-2 bg-bg p-1">
        {(
          [
            ["quick", "Quick", "~5 min"],
            ["upload", "Upload images", "~1 min"],
            ["studio", "Full Studio", "~10 min"],
          ] as [Tab, string, string][]
        ).map(([id, label, meta]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`inline-flex items-center gap-2 rounded-[1px] px-[18px] py-[9px] text-[13px] font-medium transition ${
              tab === id
                ? "bg-acc text-white"
                : "text-txt-3 hover:text-txt-2"
            }`}
          >
            <span
              className={`h-[5px] w-[5px] rounded-full border ${
                tab === id ? "border-white bg-white" : "border-current bg-transparent"
              }`}
            />
            {label}
            <span className="text-[11px] italic opacity-70">{meta}</span>
          </button>
        ))}
      </div>

      {/* ── Panels ── */}
      {tab === "quick" && (
        <QuickPanel
          industry={industry}
          industryId={industryId}
          setIndustryId={(v) => {
            setIndustryId(v);
            setDdOpen(false);
          }}
          ddOpen={ddOpen}
          setDdOpen={setDdOpen}
          spec={spec}
          setSpec={setSpec}
          vibe={vibe}
          setVibe={setVibe}
          specSuggestions={specSuggestions}
          vibeSuggestions={vibeSuggestions}
          showVibe={showVibe}
          filled={filled}
          diceRef={diceRef}
          randomize={randomize}
        />
      )}
      {tab === "studio" && <StudioPanel />}
      {tab === "upload" && <UploadPanel />}

      {/* ── CTAs ── */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={build}
          disabled={tab === "quick" && !canGenerate}
          className="inline-flex items-center gap-2 rounded-[2px] bg-acc px-[26px] py-[14px] text-[13px] font-medium text-white transition hover:gap-3 hover:bg-acc-h active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-bdr-2 disabled:text-txt-3 disabled:opacity-70"
        >
          {tab === "quick" && "Build my brief →"}
          {tab === "studio" && "Open Full Studio →"}
          {tab === "upload" && "Analyze images →"}
        </button>
        <button className="inline-flex items-center gap-2 rounded-[2px] border border-bdr-2 px-[22px] py-[14px] text-[13px] font-medium text-txt transition hover:border-acc hover:text-acc">
          View samples
        </button>
      </div>

      {/* Hint when the Quick CTA is gated — tells the user what's missing
          instead of showing a silent, unexplained disabled button. */}
      {tab === "quick" && !canGenerate && (
        <p className="mt-3 text-center text-[12px] text-txt-3">
          {!industryId
            ? "Pick what you're working on"
            : !spec.trim()
              ? "Add the specifics"
              : "Add a vibe"}{" "}
          to continue, or{" "}
          <button
            type="button"
            onClick={randomize}
            className="text-acc underline underline-offset-2 transition hover:text-acc-h"
          >
            surprise me
          </button>
          .
        </p>
      )}

      {/* Rolling dice animation */}
      <style>{`
        @keyframes diceRoll {
          0% { transform: rotate(0) scale(1); }
          25% { transform: rotate(100deg) scale(1.18); }
          60% { transform: rotate(260deg) scale(0.92); }
          85% { transform: rotate(340deg) scale(1.05); }
          100% { transform: rotate(360deg) scale(1); }
        }
        .dice-rolling svg { animation: diceRoll 0.55s cubic-bezier(0.22,1,0.36,1); }
        .dice-hover:hover svg { animation: diceRoll 0.55s cubic-bezier(0.22,1,0.36,1); }
        @keyframes cbRoll {
          0% { opacity: 0; transform: translateY(70%); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes cbBlink {
          0%, 50% { opacity: 1; }
          50.01%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

/* ─────────────────────────── Quick panel ─────────────────────────── */

function QuickPanel(props: {
  industry: ReturnType<typeof getIndustry>;
  industryId: string | null;
  setIndustryId: (v: string) => void;
  ddOpen: boolean;
  setDdOpen: (v: boolean) => void;
  spec: string;
  setSpec: (v: string) => void;
  vibe: string;
  setVibe: (v: string) => void;
  specSuggestions: string[];
  vibeSuggestions: string[];
  showVibe: boolean;
  filled: number;
  diceRef: React.RefObject<HTMLButtonElement | null>;
  randomize: () => void;
}) {
  const {
    industry,
    industryId,
    setIndustryId,
    ddOpen,
    setDdOpen,
    spec,
    setSpec,
    vibe,
    setVibe,
    specSuggestions,
    vibeSuggestions,
    showVibe,
    filled,
    diceRef,
    randomize,
  } = props;

  const wrapRef = useRef<HTMLDivElement>(null);

  // Close the industry dropdown on outside click.
  useLayoutEffect(() => {
    if (!ddOpen) return;
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setDdOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [ddOpen, setDdOpen]);

  return (
    <div
      ref={wrapRef}
      className="relative border border-bdr-2 bg-bg-2 p-8 text-center font-serif text-[clamp(20px,2.4vw,26px)] font-normal leading-[1.85] tracking-tight text-txt-3 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.18)]"
    >
      {/* Architectural bracket corners */}
      <span className="absolute -left-[2px] -top-[2px] h-3 w-3 border-l-[1.5px] border-t-[1.5px] border-acc opacity-60" />
      <span className="absolute -right-[2px] -top-[2px] h-3 w-3 border-r-[1.5px] border-t-[1.5px] border-acc opacity-60" />
      <span className="absolute -bottom-[2px] -left-[2px] h-3 w-3 border-b-[1.5px] border-l-[1.5px] border-acc opacity-60" />
      <span className="absolute -bottom-[2px] -right-[2px] h-3 w-3 border-b-[1.5px] border-r-[1.5px] border-acc opacity-60" />

      {/* Madlib sentence */}
      <span>I&apos;m working on a </span>
      <span className="relative inline-block">
        <button
          type="button"
          onClick={() => setDdOpen(!ddOpen)}
          className={`inline-flex items-baseline gap-2 rounded-[3px] px-3.5 py-0.5 italic transition ${
            industry
              ? "bg-[rgba(200,81,42,0.12)] text-acc"
              : "border border-dashed border-bdr-2 text-txt-3 hover:border-acc hover:text-acc"
          }`}
        >
          {industry ? (
            <span>{industry.label}</span>
          ) : (
            <RollingWord items={ROLLING_INDUSTRIES} />
          )}
          <span className={`text-[10px] not-italic transition ${ddOpen ? "rotate-180" : ""}`}>▾</span>
        </button>

        {ddOpen && (
          <div className="absolute left-1/2 top-[calc(100%+8px)] z-[60] max-h-[360px] min-w-[260px] -translate-x-1/2 overflow-y-auto border border-bdr bg-bg p-1.5 text-left shadow-[0_32px_80px_-12px_rgba(0,0,0,0.4)]">
            {INDUSTRIES.map((i) => (
              <button
                key={i.id}
                type="button"
                onClick={() => setIndustryId(i.id)}
                className={`flex w-full items-center justify-between gap-3 px-3 py-[7px] text-left font-sans text-[12.5px] not-italic transition hover:bg-bg-3 ${
                  industryId === i.id ? "text-acc" : "text-txt"
                }`}
              >
                <span>{i.label}</span>
                <span className="font-mono text-[10px] tracking-[0.04em] text-txt-3">
                  {i.meta}
                </span>
              </button>
            ))}
          </div>
        )}
      </span>
      <span> project, a </span>
      <AutoSizeInput
        value={spec}
        onChange={setSpec}
        placeholder="specifically…"
        placeholderOptions={specSuggestions.length ? specSuggestions : GENERIC_SPECS}
      />
      <span> that feels like </span>
      <AutoSizeInput
        value={vibe}
        onChange={setVibe}
        placeholder="vibe…"
        placeholderOptions={vibeSuggestions.length ? vibeSuggestions : GENERIC_VIBES}
      />
      <span>.</span>

      {/* Suggestion chips */}
      {industryId && (
        <div className="mt-[18px] border-t border-bdr-2 pt-3.5 text-left font-sans">
          <ChipRow
            label="Specifically"
            chips={specSuggestions}
            active={spec}
            onPick={setSpec}
          />
          {showVibe && (
            <div className="mt-2.5">
              <ChipRow
                label="Vibe"
                chips={vibeSuggestions}
                active={vibe}
                onPick={setVibe}
              />
            </div>
          )}
        </div>
      )}

      {/* Bottom row — progress (left) + Surprise me (right, terracotta) */}
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-bdr-2 pt-3.5">
        <div className="flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.06em] text-txt-3">
          <span>{filled} of 3</span>
          <div className="flex gap-[3px]">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={`h-[3px] w-6 rounded-[1px] transition-colors ${
                  i < filled ? "bg-acc" : "bg-bdr-2"
                }`}
              />
            ))}
          </div>
        </div>

        <button
          ref={diceRef}
          type="button"
          onClick={randomize}
          title="Surprise me: randomize all three"
          className="dice-hover inline-flex items-center gap-1.5 rounded-full border border-acc/50 px-3.5 py-1.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-acc transition hover:border-acc hover:bg-[rgba(200,81,42,0.08)] active:scale-95"
        >
          <svg width="14" height="14" viewBox="0 0 18 18" fill="none" aria-hidden>
            <rect x="1" y="1" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="5.5" cy="5.5" r="1.1" fill="currentColor" />
            <circle cx="12.5" cy="5.5" r="1.1" fill="currentColor" />
            <circle cx="9" cy="9" r="1.1" fill="currentColor" />
            <circle cx="5.5" cy="12.5" r="1.1" fill="currentColor" />
            <circle cx="12.5" cy="12.5" r="1.1" fill="currentColor" />
          </svg>
          Surprise me
        </button>
      </div>
    </div>
  );
}

/* Typewriter for the placeholder examples — types a word out, holds, erases,
 * advances. Drives the "type here" feel. Off when focused/typing/reduced-motion. */
function useTypewriter(words: string[], active: boolean): string {
  const key = words.join("|");
  const [text, setText] = useState("");
  const [i, setI] = useState(0);
  const [mode, setMode] = useState<"type" | "hold" | "erase">("type");

  useEffect(() => {
    if (!active) {
      setText("");
      setMode("type");
      setI(0);
      return;
    }
    const list = key ? key.split("|") : [];
    if (list.length === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setText(list[i % list.length]);
      return;
    }
    const full = list[i % list.length];
    let t: ReturnType<typeof setTimeout>;
    if (mode === "type") {
      t = setTimeout(
        () =>
          text.length < full.length
            ? setText(full.slice(0, text.length + 1))
            : setMode("hold"),
        text.length < full.length ? 55 : 1300,
      );
    } else if (mode === "hold") {
      t = setTimeout(() => setMode("erase"), 700);
    } else {
      t = setTimeout(
        () => {
          if (text.length > 0) setText(full.slice(0, text.length - 1));
          else {
            setI((p) => (p + 1) % list.length);
            setMode("type");
          }
        },
        text.length > 0 ? 28 : 120,
      );
    }
    return () => clearTimeout(t);
  }, [active, key, text, mode, i]);

  return text;
}

/* Auto-sizing inline text input (serif, italic, dashed underline).
 * When empty + unfocused, it TYPES OUT example values (terracotta, with a
 * blinking caret) so it reads as an editable field, not read-only text.
 * The typing stops the moment you focus/type. */
function AutoSizeInput({
  value,
  onChange,
  placeholder,
  placeholderOptions,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  placeholderOptions?: string[];
  disabled?: boolean;
}) {
  const mirrorRef = useRef<HTMLSpanElement>(null);
  const [width, setWidth] = useState(160);
  const [focused, setFocused] = useState(false);

  const options = placeholderOptions ?? [];
  const typing = !disabled && !value && !focused && options.length > 0;
  const typed = useTypewriter(options, typing);

  // Width is sized to the longest example so the sentence never reflows.
  const longest = options.length
    ? options.reduce((a, b) => (b.length > a.length ? b : a), placeholder)
    : placeholder;

  useLayoutEffect(() => {
    if (mirrorRef.current) {
      setWidth(Math.max(120, mirrorRef.current.offsetWidth + 8));
    }
  }, [value, longest]);

  return (
    <span className={`relative inline-block align-baseline ${disabled ? "opacity-40" : ""}`}>
      <span
        ref={mirrorRef}
        aria-hidden
        className="invisible absolute left-0 top-0 whitespace-pre px-3.5 font-serif italic"
      >
        {value || longest}
      </span>
      {/* Typewriter placeholder overlay — terracotta + blinking caret */}
      {typing && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden whitespace-nowrap px-3.5 font-serif italic text-acc"
        >
          {typed}
          <span className="ml-px inline-block w-px self-stretch bg-acc" style={{ animation: "cbBlink 1s step-end infinite" }} />
        </span>
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={typing ? "" : placeholder}
        disabled={disabled}
        autoComplete="off"
        style={{ width }}
        className={`cursor-text border-b border-dashed px-3.5 py-px text-center align-baseline font-serif italic outline-none transition placeholder:italic placeholder:text-txt-3 placeholder:opacity-85 disabled:cursor-not-allowed ${
          value
            ? "border-transparent bg-[rgba(200,81,42,0.12)] text-acc"
            : "border-acc/40 bg-transparent text-acc focus:border-acc focus:bg-[rgba(200,81,42,0.06)]"
        }`}
      />
    </span>
  );
}

/* Rolling-word ticker: cycles items with a vertical roll. Width is fixed to
 * the longest item so surrounding text never reflows. */
const ROLLING_INDUSTRIES = [
  "Hospitality",
  "a café",
  "Retail",
  "a studio",
  "Workplace",
  "a gallery",
  "Wellness",
  "a salon",
];

function RollingWord({ items }: { items: string[] }) {
  const idx = useRotatingIndex(items.length, 2000, true);
  const longest = items.reduce((a, b) => (b.length > a.length ? b : a), "");
  return (
    <span className="relative inline-block overflow-hidden align-baseline" style={{ height: "1.4em" }}>
      <span className="invisible" aria-hidden>
        {longest}
      </span>
      <span
        key={idx}
        className="absolute inset-0 flex items-center justify-center whitespace-nowrap text-acc"
        style={{ animation: "cbRoll .5s cubic-bezier(.22,1,.36,1)" }}
      >
        {items[idx]}
      </span>
    </span>
  );
}

/* Shared rotating index. enabled=false freezes it (and resets to 0). */
function useRotatingIndex(length: number, intervalMs: number, enabled: boolean) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (!enabled || length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % length), intervalMs);
    return () => clearInterval(id);
  }, [length, intervalMs, enabled]);
  return idx;
}

/* AI suggestion chip row. */
function ChipRow({
  label,
  chips,
  active,
  onPick,
}: {
  label: string;
  chips: string[];
  active: string;
  onPick: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 inline-flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-txt-3">
        <span className="text-acc">
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
            <path d="M6 1 L7 5 L11 6 L7 7 L6 11 L5 7 L1 6 L5 5 Z" fill="currentColor" />
          </svg>
        </span>
        <b className="text-[10px] font-medium normal-case tracking-normal text-txt-2">
          {label}
        </b>{" "}
        suggestions
      </span>
      {chips.map((c, i) => {
        const isActive = active.trim().toLowerCase() === c.toLowerCase();
        return (
          <button
            key={`${c}-${i}`}
            type="button"
            onClick={() => onPick(c)}
            className={`rounded-full border px-[11px] py-[5px] font-sans text-[11.5px] transition active:scale-95 ${
              isActive
                ? "border-acc bg-[rgba(200,81,42,0.18)] text-acc"
                : "border-bdr-2 text-txt-2 hover:border-acc hover:bg-[rgba(200,81,42,0.08)] hover:text-acc"
            }`}
          >
            {c}
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────────────────── Studio panel ─────────────────────────── */

const STUDIO_STEPS: { label: string; note: string }[] = [
  { label: "Space", note: "what it is, who it's for" },
  { label: "Vibe", note: "the feeling, in references" },
  { label: "Colors", note: "your palette" },
  { label: "Furniture", note: "pieces, by category" },
  { label: "Lighting", note: "mood, task, accent" },
  { label: "Flooring", note: "the plane underfoot" },
  { label: "Ceiling", note: "the fifth wall" },
  { label: "Materials", note: "textures and finishes" },
  { label: "Review", note: "review, then generate" },
];

/** A small on-brand preview of what each studio step produces. */
function studioVisual(i: number) {
  switch (i) {
    case 0: // Space — a plan
      return (
        <svg viewBox="0 0 200 80" preserveAspectRatio="none" className="h-full w-full text-txt-3" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round">
          <rect x="10" y="12" width="108" height="56" />
          <rect x="124" y="30" width="66" height="38" />
          <path d="M42 68 Q82 68 120 62" strokeDasharray="3 3" />
          <circle cx="178" cy="18" r="5" />
        </svg>
      );
    case 1: // Vibe — warm mood
      return <div className="h-full w-full bg-gradient-to-br from-[#E8C4B0] via-[#D4C2A3] to-[#A89890]" />;
    case 2: // Colors — palette
      return (
        <div className="flex h-full">
          {["#E8DCC8", "#D4C2A3", "#A89890", "#C8512A", "#1A1714", "#F0D5C4"].map((c, n) => (
            <span key={n} className="flex-1" style={{ backgroundColor: c }} />
          ))}
        </div>
      );
    case 3: // Furniture — line art
      return (
        <div className="flex h-full items-center justify-center gap-6 text-txt-3">
          <svg width="46" height="40" viewBox="0 0 60 60" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
            <path d="M8 48 L8 26 Q8 18 16 18 L44 18 Q52 18 52 26 L52 48" />
            <path d="M14 48 L14 34 L46 34 L46 48" />
          </svg>
          <svg width="46" height="40" viewBox="0 0 60 60" fill="none" stroke="currentColor" strokeWidth="1.4">
            <line x1="10" y1="22" x2="50" y2="22" />
            <line x1="13" y1="22" x2="13" y2="50" />
            <line x1="47" y1="22" x2="47" y2="50" />
          </svg>
          <svg width="46" height="40" viewBox="0 0 60 60" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
            <path d="M22 14 L38 14 L42 26 L18 26 Z" />
            <line x1="30" y1="26" x2="30" y2="52" />
          </svg>
        </div>
      );
    case 4: // Lighting
      return (
        <svg viewBox="0 0 200 80" className="h-full w-full text-txt-3" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="14" y1="12" x2="186" y2="12" />
          <path d="M55 12 L48 32 L62 32 Z" />
          <path d="M125 12 L118 32 L132 32 Z" />
          <line x1="90" y1="12" x2="90" y2="48" />
          <circle cx="90" cy="52" r="4" />
          <line x1="166" y1="42" x2="182" y2="42" />
        </svg>
      );
    case 5: // Flooring — wood
      return (
        <div className="relative h-full w-full bg-gradient-to-b from-[#8B6F47] to-[#5C4730]">
          <svg viewBox="0 0 200 80" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" stroke="#3d2f1e" strokeWidth="0.8" opacity="0.5">
            <line x1="0" y1="20" x2="200" y2="20" />
            <line x1="0" y1="40" x2="200" y2="40" />
            <line x1="0" y1="60" x2="200" y2="60" />
            <line x1="70" y1="0" x2="70" y2="20" />
            <line x1="140" y1="20" x2="140" y2="40" />
            <line x1="50" y1="40" x2="50" y2="60" />
          </svg>
        </div>
      );
    case 6: // Ceiling — slats
      return (
        <svg viewBox="0 0 200 80" preserveAspectRatio="none" className="h-full w-full text-txt-3" stroke="currentColor" strokeWidth="1" fill="none">
          {Array.from({ length: 9 }).map((_, n) => (
            <line key={n} x1={14 + n * 21.5} y1="6" x2={14 + n * 21.5} y2="74" />
          ))}
        </svg>
      );
    case 7: // Materials — gradient swatches
      return (
        <div className="flex h-full gap-1.5 p-1.5">
          <div className="flex-1 bg-gradient-to-br from-[#D4C2A3] to-[#A89890]" />
          <div className="flex-1 bg-gradient-to-br from-[#8B6F47] to-[#5C4730]" />
          <div className="flex-1 bg-gradient-to-br from-[#E0D4BE] to-[#B8A888]" />
        </div>
      );
    case 8: // Review — the assembled brief
      return (
        <div className="flex h-full gap-1.5 p-1.5">
          <div className="flex w-1/2 flex-col gap-1.5">
            <div className="flex flex-1">
              {["#E8DCC8", "#C8512A", "#A89890", "#1A1714"].map((c, n) => (
                <span key={n} className="flex-1" style={{ backgroundColor: c }} />
              ))}
            </div>
            <div className="flex-1 bg-gradient-to-br from-[#8B6F47] to-[#5C4730]" />
          </div>
          <div className="w-1/2 bg-gradient-to-br from-[#E8C4B0] to-[#A89890]" />
        </div>
      );
    default:
      return null;
  }
}

function StudioPanel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [imgs, setImgs] = useState<string[]>([]);

  // Pull real reference images once (only when the Full Studio tab is open) so
  // the preview shows the actual image-choosing process, not abstract
  // placeholders. Cached server-side, so it's a single cheap call.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/pinterest/search?q=interior%20design%20moodboard&limit=14")
      .then((r) => r.json())
      .then((d: { pins?: { imageUrl?: string }[] }) => {
        if (cancelled || !Array.isArray(d.pins)) return;
        setImgs(d.pins.map((p) => p.imageUrl || "").filter(Boolean));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-walk through the real steps, showing a preview of each, so the panel
  // feels alive like the Quick madlib. Pauses while the user hovers a step.
  useEffect(() => {
    if (paused) return;
    const t = setInterval(
      () => setActive((a) => (a + 1) % STUDIO_STEPS.length),
      1400,
    );
    return () => clearInterval(t);
  }, [paused]);

  const step = STUDIO_STEPS[active];
  // A shifting window of real references, so each step browses a fresh set.
  const win =
    imgs.length > 0
      ? Array.from({ length: 6 }, (_, k) => imgs[(active * 2 + k) % imgs.length])
      : [];
  const picked = [1, 4];

  return (
    <div
      className="relative border border-bdr-2 bg-bg-2 p-7 text-left"
      onMouseLeave={() => setPaused(false)}
    >
      <span className="absolute -left-[2px] -top-[2px] h-[18px] w-[18px] border-l border-t border-acc" />
      <span className="absolute -right-[2px] -top-[2px] h-[18px] w-[18px] border-r border-t border-acc" />
      <span className="absolute -bottom-[2px] -left-[2px] h-[18px] w-[18px] border-b border-l border-acc" />
      <span className="absolute -bottom-[2px] -right-[2px] h-[18px] w-[18px] border-b border-r border-acc" />

      <div className="font-serif text-[24px] font-medium leading-[1.15] text-txt">
        Shape the whole <em className="italic text-acc">vision</em>.
      </div>
      <p className="mt-2.5 max-w-[470px] text-[13.5px] leading-relaxed text-txt-2">
        Nine guided steps, about ten minutes, and you walk away with a complete,
        client-ready brief: palette, materials, lighting, furniture, and more,
        ready to export as a PDF.
      </p>

      {/* Step chips — auto-advance, hover to explore (which drives the preview). */}
      <div className="mt-5 flex flex-wrap gap-1.5">
        {STUDIO_STEPS.map((s, i) => {
          const on = i === active;
          return (
            <button
              key={s.label}
              type="button"
              onMouseEnter={() => {
                setActive(i);
                setPaused(true);
              }}
              onFocus={() => {
                setActive(i);
                setPaused(true);
              }}
              className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.06em] transition-all duration-300 ${
                on
                  ? "scale-105 border-acc bg-acc text-white"
                  : "border-bdr-2 text-txt-3 hover:border-acc hover:text-acc"
              }`}
            >
              {String(i + 1).padStart(2, "0")} {s.label}
            </button>
          );
        })}
      </div>

      {/* Live preview of the real image-choosing process. */}
      <div className="mt-3 border border-bdr-2 bg-bg-3 p-2">
        {win.length > 0 ? (
          <div className="grid grid-cols-6 gap-1.5">
            {win.map((src, n) => {
              const sel = picked.includes(n);
              return (
                <div
                  key={n}
                  className="relative aspect-square overflow-hidden bg-bg-2"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src.replace("/736x/", "/236x/")}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                  {sel && (
                    <>
                      <span className="absolute inset-0 ring-2 ring-inset ring-acc" />
                      <span className="absolute right-1 top-1 grid h-4 w-4 place-items-center rounded-full bg-acc text-[8px] text-white">
                        ✓
                      </span>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="relative h-[68px]">
            <div key={active} className="flow-stage-in absolute inset-0">
              {studioVisual(active)}
            </div>
          </div>
        )}
        <div className="mt-2 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.12em]">
          <span className="text-acc">
            {String(active + 1).padStart(2, "0")} · {step.label}
          </span>
          <span className="text-txt-3">
            {win.length ? "choosing references" : step.note}
          </span>
        </div>
      </div>

      <p className="mt-4 text-[12px] italic text-txt-3">
        Best when you want a project considered down to the last detail.
      </p>
    </div>
  );
}

/* ─────────────────────────── Upload panel ─────────────────────────── */

function UploadPanel() {
  return (
    <label className="flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-3 border-[1.5px] border-dashed border-bdr-2 bg-bg-2 p-10 text-center transition hover:border-acc hover:bg-[rgba(200,81,42,0.05)]">
      <span className="mb-1 grid h-12 w-12 place-items-center border border-bdr-2 text-txt-2">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M11 15 L11 4 M6 9 L11 4 L16 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="square" />
          <path d="M3 14 L3 18 L19 18 L19 14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="square" />
        </svg>
      </span>
      <span className="font-serif text-[19px] font-medium leading-tight text-txt">
        Drop <em className="italic text-acc">3 to 5 reference images</em>
      </span>
      <span className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-txt-3">
        Aggregated extraction: palette · materials · lighting · vibe
      </span>
      <span className="font-sans text-[11px] text-txt-3">
        PNG · JPG · HEIC, screenshots or moodboard exports, up to 10 MB each
      </span>
      <input type="file" accept="image/*" multiple className="hidden" />
    </label>
  );
}
