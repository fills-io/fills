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

/** Per-step reference search (null = the Colors step, which shows a palette). */
const STUDIO_QUERIES: (string | null)[] = [
  "interior design moodboard", // 1 Space
  "interior mood board vibe", // 2 Vibe
  null, // 3 Colors → palette + eyedropper
  "furniture interior design", // 4 Furniture
  "interior lighting design", // 5 Lighting
  "flooring interior wood", // 6 Flooring
  "ceiling design interior", // 7 Ceiling
  "interior materials texture", // 8 Materials
  "interior moodboard editorial", // 9 Review
];

/** Arrow cursor that glides to a CSS left/top percentage. */
function DemoCursor({ left, top }: { left: number; top: number }) {
  return (
    <div
      className="pointer-events-none absolute z-20"
      style={{
        left: `${left}%`,
        top: `${top}%`,
        transform: "translate(-40%,-30%)",
        transition:
          "left 0.45s cubic-bezier(0.22,1,0.36,1), top 0.45s cubic-bezier(0.22,1,0.36,1)",
      }}
    >
      <svg width="15" height="15" viewBox="0 0 16 16">
        <path
          d="M2 1 L2 13 L5.5 9.5 L8 14.5 L10 13.5 L7.5 8.5 L12 8 Z"
          fill="#1A1714"
          stroke="#fff"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/**
 * Category image-picking demo: the cursor glides to two references and they
 * turn red (selected). Remounted per step so it replays for each category.
 */
function ImagePickDemo({ images }: { images: string[] }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPhase((p) => (p < 3 ? p + 1 : p)), 720);
    return () => clearInterval(t);
  }, []);

  const A = 1;
  const B = 4;
  const cursorCell = phase === 0 ? 0 : phase === 1 ? A : B;
  const selected = phase >= 2 ? [A, B] : phase >= 1 ? [A] : [];
  const left = ((cursorCell + 0.5) / 6) * 100;

  return (
    <div className="relative">
      <div className="grid grid-cols-6 gap-1.5">
        {Array.from({ length: 6 }, (_, i) => images[i]).map((src, i) => {
          const sel = selected.includes(i);
          return (
            <div key={i} className="relative aspect-[3/4] overflow-hidden bg-bg-2">
              {src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={src.replace("/736x/", "/236x/")}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-bdr-2 to-bg-3" />
              )}
              {/* red wash + border + check when the cursor selects it */}
              <span
                className={`pointer-events-none absolute inset-0 bg-acc mix-blend-multiply transition-opacity duration-300 ${
                  sel ? "opacity-40 delay-[340ms]" : "opacity-0"
                }`}
              />
              <span
                className={`pointer-events-none absolute inset-0 ring-2 ring-inset ring-acc transition-opacity duration-300 ${
                  sel ? "opacity-100 delay-[340ms]" : "opacity-0"
                }`}
              />
              <span
                className={`pointer-events-none absolute right-1 top-1 grid h-4 w-4 place-items-center rounded-full bg-acc text-[8px] text-white transition-transform duration-300 ${
                  sel ? "scale-100 delay-[340ms]" : "scale-0"
                }`}
              >
                ✓
              </span>
            </div>
          );
        })}
      </div>
      <DemoCursor left={left} top={50} />
    </div>
  );
}

/** Colors step: an eyedropper glides along and fills the palette swatch by swatch. */
function ColorPickDemo() {
  const COLORS = ["#C8512A", "#E8DCC8", "#A89890", "#8B6F47", "#1A1714"];
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t = setInterval(
      () => setPhase((p) => (p < COLORS.length ? p + 1 : p)),
      520,
    );
    return () => clearInterval(t);
  }, [COLORS.length]);

  const slot = Math.min(phase, COLORS.length - 1);
  const left = ((slot + 0.5) / COLORS.length) * 100;

  return (
    <div className="relative">
      <div className="flex h-[150px] gap-1.5">
        {COLORS.map((c, i) => {
          const filled = phase > i;
          return (
            <div
              key={i}
              className="relative flex-1 overflow-hidden border border-bdr-2 bg-bg-2"
            >
              <div
                className="absolute inset-0 transition-all duration-300"
                style={{ backgroundColor: c, opacity: filled ? 1 : 0 }}
              />
              {!filled && (
                <span className="absolute inset-2 border border-dashed border-bdr-2" />
              )}
            </div>
          );
        })}
      </div>
      {/* eyedropper, gliding to the slot it's filling */}
      <div
        className="pointer-events-none absolute top-0 z-20"
        style={{
          left: `${left}%`,
          transform: "translate(-50%,-55%)",
          transition: "left 0.4s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#1A1714"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 20l2-0.5 9-9" />
          <path d="M13.5 6.5l4 4" />
          <path d="M16 4a2 2 0 1 1 3 3l-2 2-3-3z" fill="#C8512A" stroke="none" />
          <path d="M16 4a2 2 0 1 1 3 3l-2 2-3-3z" />
        </svg>
      </div>
    </div>
  );
}

function StudioPanel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [byQuery, setByQuery] = useState<Record<string, string[]>>({});

  // Pull category-specific references once (only when the Full Studio tab is
  // open) so each step browses its own kind of image — furniture on the
  // Furniture step, lighting on Lighting, and so on. Cached server-side.
  useEffect(() => {
    let cancelled = false;
    const uniq = [...new Set(STUDIO_QUERIES.filter((q): q is string => !!q))];
    Promise.all(
      uniq.map((q) =>
        fetch(`/api/pinterest/search?q=${encodeURIComponent(q)}&limit=8`)
          .then((r) => r.json())
          .then(
            (d: { pins?: { imageUrl?: string }[] }) =>
              [
                q,
                Array.isArray(d.pins)
                  ? d.pins.map((p) => p.imageUrl || "").filter(Boolean)
                  : [],
              ] as [string, string[]],
          )
          .catch(() => [q, []] as [string, string[]]),
      ),
    ).then((entries) => {
      if (!cancelled) setByQuery(Object.fromEntries(entries));
    });
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
      2800,
    );
    return () => clearInterval(t);
  }, [paused]);

  // Guarantee every tile has a real photo: if a category returns fewer than
  // six references, top it up from the pool of all fetched images. Once the
  // fetch resolves there are no placeholder tiles.
  const pool = Object.values(byQuery).flat();
  const q = STUDIO_QUERIES[active];
  const own = q ? byQuery[q] ?? [] : [];
  const stepImages =
    own.length >= 6
      ? own.slice(0, 6)
      : [...new Set([...own, ...pool])].slice(0, 6);

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

      {/* Animated demo of how you choose, per category. */}
      <div className="mt-3 border border-bdr-2 bg-bg-3 p-2">
        {active === 2 ? (
          <ColorPickDemo key="colors" />
        ) : (
          <ImagePickDemo
            key={active}
            images={stepImages}
          />
        )}
        <div className="mt-2 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.12em]">
          <span className="text-acc">
            {active === 2 ? "Building palette" : "Picking references"}
          </span>
          <span className="text-txt-3">
            {String(active + 1).padStart(2, "0")} · {STUDIO_STEPS[active].label}
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
