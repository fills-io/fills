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

import { useLayoutEffect, useRef, useState } from "react";
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
      router.push(`/create?${qs.toString()}`);
    } else if (tab === "upload") {
      // → new QuickFlow upload path.
      router.push("/create?path=upload");
    } else {
      // Full Studio keeps the existing detailed wizard.
      router.push("/concept?mode=studio");
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
          className="inline-flex items-center gap-2 rounded-[2px] bg-acc px-[26px] py-[14px] text-[13px] font-medium text-white transition hover:gap-3 hover:bg-acc-h disabled:cursor-not-allowed disabled:bg-bdr-2 disabled:text-txt-3 disabled:opacity-70"
        >
          {tab === "quick" && "Build my brief →"}
          {tab === "studio" && "Open Full Studio →"}
          {tab === "upload" && "Analyze images →"}
        </button>
        <button className="inline-flex items-center gap-2 rounded-[2px] border border-bdr-2 px-[22px] py-[14px] text-[13px] font-medium text-txt transition hover:border-acc hover:text-acc">
          View samples
        </button>
      </div>

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

      {/* Surprise-me dice — top-right */}
      <button
        ref={diceRef}
        type="button"
        onClick={randomize}
        title="Surprise me — randomize all three"
        className="absolute right-3.5 top-3.5 inline-flex items-center gap-1.5 rounded-full border border-bdr-2 px-3 py-1.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-txt-3 transition hover:border-acc hover:text-acc"
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
          <span>{industry?.label ?? "choose industry"}</span>
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
      <span> project — a </span>
      <AutoSizeInput
        value={spec}
        onChange={setSpec}
        placeholder="specifically…"
        disabled={!industryId}
      />
      <span> that feels like </span>
      <AutoSizeInput
        value={vibe}
        onChange={setVibe}
        placeholder="vibe…"
        disabled={!showVibe}
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

      {/* Progress */}
      <div className="mt-3.5 flex items-center justify-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.06em] text-txt-3">
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
    </div>
  );
}

/* Auto-sizing inline text input (serif, italic, dashed underline). */
function AutoSizeInput({
  value,
  onChange,
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  const mirrorRef = useRef<HTMLSpanElement>(null);
  const [width, setWidth] = useState(160);

  useLayoutEffect(() => {
    if (mirrorRef.current) {
      setWidth(Math.max(120, mirrorRef.current.offsetWidth + 8));
    }
  }, [value, placeholder]);

  return (
    <span className={`relative inline-block align-baseline ${disabled ? "opacity-40" : ""}`}>
      <span
        ref={mirrorRef}
        aria-hidden
        className="invisible absolute left-0 top-0 whitespace-pre px-3.5 font-serif italic"
      >
        {value || placeholder}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        style={{ width }}
        className={`border-b border-dashed px-3.5 py-px text-center align-baseline font-serif italic outline-none transition placeholder:italic placeholder:text-txt-3 placeholder:opacity-85 disabled:cursor-not-allowed ${
          value
            ? "border-transparent bg-[rgba(200,81,42,0.12)] text-acc"
            : "border-bdr-2 bg-transparent text-txt-3 focus:border-acc focus:bg-[rgba(200,81,42,0.06)] focus:text-txt"
        }`}
      />
    </span>
  );
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
      {chips.map((c) => {
        const isActive = active.trim().toLowerCase() === c.toLowerCase();
        return (
          <button
            key={c}
            type="button"
            onClick={() => onPick(c)}
            className={`rounded-full border px-[11px] py-[5px] font-sans text-[11.5px] transition ${
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

function StudioPanel() {
  return (
    <div className="relative border border-bdr-2 bg-bg-2 p-7">
      <span className="absolute -left-[2px] -top-[2px] h-[18px] w-[18px] border-l border-t border-acc" />
      <span className="absolute -right-[2px] -top-[2px] h-[18px] w-[18px] border-r border-t border-acc" />
      <span className="absolute -bottom-[2px] -left-[2px] h-[18px] w-[18px] border-b border-l border-acc" />
      <span className="absolute -bottom-[2px] -right-[2px] h-[18px] w-[18px] border-b border-r border-acc" />

      <div className="flex items-start gap-3.5">
        <span className="grid h-10 w-10 flex-shrink-0 place-items-center border border-bdr-2 text-txt-2">
          <svg width="18" height="18" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="1" width="5.5" height="5.5" stroke="currentColor" strokeWidth="1.1" />
            <rect x="7.5" y="1" width="5.5" height="5.5" stroke="currentColor" strokeWidth="1.1" />
            <rect x="1" y="7.5" width="5.5" height="5.5" stroke="currentColor" strokeWidth="1.1" />
            <rect x="7.5" y="7.5" width="5.5" height="5.5" stroke="currentColor" strokeWidth="1.1" />
          </svg>
        </span>
        <div className="text-left">
          <div className="font-serif text-[22px] font-medium leading-tight text-txt">
            Multi-zone <em className="italic text-acc">authoring</em>
          </div>
          <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-txt-3">
            9 categories · ~10 min · for architects &amp; designers
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-x-[18px] gap-y-[9px] text-left sm:grid-cols-3">
        {[
          "Industry & function",
          "Spatial layout",
          "Material palette",
          "Color system",
          "Lighting plan",
          "Furniture brief",
          "Mood references",
          "Constraints",
          "Output format",
        ].map((s) => (
          <span key={s} className="inline-flex items-center gap-2 font-sans text-[12px] text-txt-2">
            <span className="h-1 w-1 flex-shrink-0 rounded-full bg-acc" />
            {s}
          </span>
        ))}
      </div>
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
        PNG · JPG · HEIC — screenshots or moodboard exports, up to 10 MB each
      </span>
      <input type="file" accept="image/*" multiple className="hidden" />
    </label>
  );
}
