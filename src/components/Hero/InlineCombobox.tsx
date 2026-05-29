"use client";

/**
 * InlineCombobox — a text input with a curated-suggestion dropdown.
 *
 * Used in the homepage Quick form's "specifically…" and "feels like…"
 * inputs so users without strong design vocabulary can either pick a
 * curated option or type their own. The input value is not restricted
 * to the suggestion list.
 *
 * Visual language matches the existing inline-prose inputs:
 *  - dashed underline, italic serif, transparent background
 *  - small chevron ▾ on the right hints that suggestions exist
 *  - dropdown opens below, styled like the industry chip dropdown
 */

import { useEffect, useRef, useState } from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  suggestions: string[];
  placeholder: string;
  disabled?: boolean;
  /** Tailwind width class — input has no intrinsic width inside the prose. */
  widthClass: string;
  /** aria-label for the input. */
  label: string;
};

export default function InlineCombobox({
  value,
  onChange,
  suggestions,
  placeholder,
  disabled = false,
  widthClass,
  label,
}: Props) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLSpanElement>(null);

  // Close on outside click. Blur alone is too aggressive — it fires before
  // the mousedown on a suggestion registers, swallowing the click.
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const pick = (suggestion: string) => {
    onChange(suggestion);
    setOpen(false);
  };

  return (
    <span ref={wrapperRef} className="relative inline-block">
      <span className="relative inline-block">
        <input
          aria-label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className={`${widthClass} inline-block border-b border-dashed border-bdr-2 bg-transparent pr-4 text-center font-serif italic text-txt-2 placeholder:text-txt-3 placeholder:opacity-85 focus:border-acc focus:outline-none disabled:cursor-not-allowed disabled:opacity-40`}
        />
        {/* Chevron hint — clickable so the dropdown can be opened without focusing the input first. */}
        <button
          type="button"
          aria-label={`Show ${label} suggestions`}
          onClick={() => !disabled && setOpen((v) => !v)}
          disabled={disabled}
          className="absolute right-0 top-1/2 -translate-y-1/2 px-0.5 text-xs not-italic text-txt-3 transition hover:text-acc disabled:cursor-not-allowed disabled:opacity-40"
        >
          ▾
        </button>
      </span>

      {open && !disabled && suggestions.length > 0 && (
        <div className="absolute left-1/2 top-full z-50 mt-2 min-w-[200px] -translate-x-1/2 border border-bdr-2 bg-bg py-1 text-left text-base shadow-2xl">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => pick(s)}
              className="block w-full px-4 py-2 text-left font-sans text-sm not-italic text-txt-2 transition hover:bg-bdr-2 hover:text-acc"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </span>
  );
}
