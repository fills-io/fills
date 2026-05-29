"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import InlineCombobox from "./InlineCombobox";
import { INDUSTRIES as TAXONOMY, findIndustryByLabel } from "@/lib/space-taxonomy";
import { getVibesForIndustry } from "@/lib/vibe-taxonomy";

type Tab = "quick" | "studio" | "upload";

const INDUSTRIES = TAXONOMY.map((i) => i.label);

export default function ConceptBuilder() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("quick");
  const [industry, setIndustry] = useState<string | null>(null);
  const [industryOpen, setIndustryOpen] = useState(false);
  const [spec, setSpec] = useState("");
  const [vibe, setVibe] = useState("");

  const filled =
    (industry ? 1 : 0) + (spec.trim() ? 1 : 0) + (vibe.trim() ? 1 : 0);
  const canGenerate = filled === 3;

  // Curated suggestion lists, derived from the selected industry.
  const matchedIndustry = useMemo(() => findIndustryByLabel(industry), [industry]);
  const specSuggestions = matchedIndustry?.spaces.map((s) => s.label) ?? [];
  const vibeSuggestions = getVibesForIndustry(matchedIndustry?.id ?? null);

  /** Build the destination URL based on the current tab + form state. */
  function handlePrimaryCta() {
    if (tab === "quick") {
      // Carry the three picks as query params so /concept can echo them back
      // and (later) seed the wizard.
      const qs = new URLSearchParams({
        mode: "quick",
        industry: industry ?? "",
        spec: spec.trim(),
        vibe: vibe.trim(),
      });
      router.push(`/concept?${qs.toString()}`);
      return;
    }
    if (tab === "studio") {
      router.push("/concept?mode=studio");
      return;
    }
    if (tab === "upload") {
      // The actual file gets re-uploaded on the concept page once Vercel Blob
      // is wired up. For now we just send the user across with the mode set.
      router.push("/concept?mode=upload");
    }
  }

  return (
    <div className="w-full max-w-[680px]">
      {/* Tab strip */}
      <div className="mb-3 flex items-center justify-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em]">
        {([
          { id: "quick", label: "Quick" },
          { id: "studio", label: "Full Studio" },
          { id: "upload", label: "Upload Image" },
        ] as { id: Tab; label: string }[]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 transition ${
              tab === t.id
                ? "text-acc"
                : "text-txt-3 hover:text-txt-2"
            }`}
          >
            <span
              className={`inline-block border-b ${
                tab === t.id ? "border-acc" : "border-transparent"
              } pb-1`}
            >
              {t.label}
            </span>
          </button>
        ))}
      </div>

      {/* Builder card — content swaps per tab */}
      <div className="relative border border-bdr-2 bg-bg-2 p-8 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.18)]">
        {/* Architectural bracket corners */}
        <span className="absolute -left-[2px] -top-[2px] h-3 w-3 border-l-[1.5px] border-t-[1.5px] border-acc opacity-60" />
        <span className="absolute -right-[2px] -top-[2px] h-3 w-3 border-r-[1.5px] border-t-[1.5px] border-acc opacity-60" />
        <span className="absolute -bottom-[2px] -left-[2px] h-3 w-3 border-b-[1.5px] border-l-[1.5px] border-acc opacity-60" />
        <span className="absolute -bottom-[2px] -right-[2px] h-3 w-3 border-b-[1.5px] border-r-[1.5px] border-acc opacity-60" />

        {tab === "quick" && (
          <QuickPanel
            industry={industry}
            setIndustry={(v) => {
              setIndustry(v);
              setIndustryOpen(false);
            }}
            industryOpen={industryOpen}
            setIndustryOpen={setIndustryOpen}
            spec={spec}
            setSpec={setSpec}
            specSuggestions={specSuggestions}
            vibe={vibe}
            setVibe={setVibe}
            vibeSuggestions={vibeSuggestions}
          />
        )}

        {tab === "studio" && <StudioPanel />}

        {tab === "upload" && <UploadPanel />}

        {/* Progress row — only on quick */}
        {tab === "quick" && (
          <div className="mt-6 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.14em] text-txt-3">
            <span>{filled} of 3</span>
            <div className="flex gap-[2px]">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className={`h-[3px] w-12 ${
                    i < filled ? "bg-acc" : "bg-bdr-2"
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CTAs */}
      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <button
          onClick={handlePrimaryCta}
          disabled={tab === "quick" && !canGenerate}
          className="inline-flex items-center gap-2 bg-acc px-7 py-3.5 text-sm font-medium text-white transition hover:gap-3 hover:bg-acc-h disabled:cursor-not-allowed disabled:bg-bdr-2 disabled:text-txt-3 disabled:opacity-70"
        >
          {tab === "quick" && "Build my brief →"}
          {tab === "studio" && "Open Full Studio →"}
          {tab === "upload" && "Analyze image →"}
        </button>
        <button className="inline-flex items-center gap-2 border border-bdr-2 px-6 py-3.5 text-sm text-txt transition hover:border-acc hover:text-acc">
          View Mood Board Samples
        </button>
      </div>
    </div>
  );
}

/* ----------------- Sub-panels ----------------- */

function QuickPanel({
  industry,
  setIndustry,
  industryOpen,
  setIndustryOpen,
  spec,
  setSpec,
  specSuggestions,
  vibe,
  setVibe,
  vibeSuggestions,
}: {
  industry: string | null;
  setIndustry: (v: string) => void;
  industryOpen: boolean;
  setIndustryOpen: (v: boolean) => void;
  spec: string;
  setSpec: (v: string) => void;
  specSuggestions: string[];
  vibe: string;
  setVibe: (v: string) => void;
  vibeSuggestions: string[];
}) {
  return (
    <div className="font-serif text-[clamp(20px,2.4vw,26px)] font-normal leading-[1.85] tracking-tight text-txt-3">
      <span>I&apos;m working on a </span>

      {/* Industry chip */}
      <span className="relative inline-block">
        <button
          onClick={() => setIndustryOpen(!industryOpen)}
          className={`inline-flex items-baseline gap-2 rounded-sm border px-3 py-0.5 italic transition ${
            industry
              ? "border-transparent bg-[rgba(232,196,176,0.12)] text-acc-2"
              : "border-dashed border-bdr-2 text-txt-3 hover:border-acc hover:text-acc-2"
          }`}
        >
          <span>{industry ?? "choose industry"}</span>
          <span className="text-xs not-italic opacity-70">▾</span>
        </button>

        {industryOpen && (
          <div className="absolute left-0 top-full z-50 mt-2 min-w-[200px] border border-bdr-2 bg-bg py-1 text-left text-base shadow-2xl">
            {INDUSTRIES.map((opt) => (
              <button
                key={opt}
                onClick={() => setIndustry(opt)}
                className="block w-full px-4 py-2 text-left font-sans text-sm not-italic text-txt-2 transition hover:bg-bdr-2 hover:text-acc"
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </span>

      <span> project — a </span>

      {/* Specifically — curated spaces for the selected industry. */}
      <InlineCombobox
        label="Specifically"
        value={spec}
        onChange={setSpec}
        suggestions={specSuggestions}
        placeholder="specifically…"
        disabled={!industry}
        widthClass="w-[200px]"
      />

      <span> that feels like </span>

      {/* Vibe — curated vibes for the selected industry. */}
      <InlineCombobox
        label="Feels like"
        value={vibe}
        onChange={setVibe}
        suggestions={vibeSuggestions}
        placeholder="vibe…"
        disabled={!industry || !spec.trim()}
        widthClass="w-[180px]"
      />

      <span>.</span>
    </div>
  );
}

function StudioPanel() {
  return (
    <div className="py-4 text-center">
      <div className="mb-3 inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-acc">
        <span className="inline-block h-px w-6 bg-acc" />
        For design pros
      </div>
      <h3 className="font-serif text-[clamp(22px,2.8vw,30px)] font-normal text-txt">
        Multi-zone authoring with <em className="text-acc">full control</em>.
      </h3>
      <p className="mx-auto mt-4 max-w-md text-[13px] leading-relaxed text-txt-2">
        Define every category yourself — palette, materials, lighting, furniture, ceiling, flooring. Build client-ready briefs in 10 minutes.
      </p>
      <div className="mt-6 grid grid-cols-3 gap-3 text-left">
        {[
          { n: "01", t: "9 categories" },
          { n: "02", t: "Multi-zone" },
          { n: "03", t: "Designer handoff" },
        ].map((s) => (
          <div key={s.n} className="border border-bdr-2 p-3">
            <div className="font-mono text-[9px] text-txt-3">{s.n}</div>
            <div className="mt-1 text-[11px] text-txt-2">{s.t}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function UploadPanel() {
  return (
    <div className="py-2 text-center">
      <div className="mb-3 inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-acc">
        <span className="inline-block h-px w-6 bg-acc" />
        Visual reference
      </div>
      <h3 className="font-serif text-[clamp(22px,2.8vw,30px)] font-normal text-txt">
        Drop a reference. We&apos;ll <em className="text-acc">extract the brief</em>.
      </h3>
      <div className="mt-5 grid place-items-center border-2 border-dashed border-bdr-2 px-6 py-10 transition hover:border-acc">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-txt-3">
          <path
            d="M16 20V8M16 8l-5 5M16 8l5 5M6 22v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <p className="mt-3 text-[13px] text-txt-2">
          Drop an image or <button className="text-acc underline-offset-2 hover:underline">browse</button>
        </p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-txt-3">
          JPG, PNG · up to 10MB
        </p>
      </div>
    </div>
  );
}
