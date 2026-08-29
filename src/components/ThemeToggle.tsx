"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // The theme is set on <html> by an inline script before React runs, so the
  // only way to read it is after mount. One pass, on mount, never again.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    setIsDark(document.documentElement.classList.contains("theme-dark"));
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add("theme-dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("theme-dark");
      localStorage.setItem("theme", "light");
    }
  };

  // Avoid flicker on first paint — render an invisible placeholder until mounted
  if (!mounted) {
    return (
      <button
        aria-label="Toggle theme"
        className="h-[60px] w-[52px] border-l border-bdr"
      />
    );
  }

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="grid h-[60px] w-[52px] place-items-center border-l border-bdr text-txt-2 transition hover:bg-bg-2 hover:text-acc"
    >
      {isDark ? (
        // Sun icon — shown in dark mode
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.4" />
          <path
            d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        // Moon icon — shown in light mode
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path
            d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
