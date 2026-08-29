"use client";

/**
 * Reveal — fades + lifts its children up the first time they scroll into
 * view. A gentle, single-shot scroll-reveal used across the homepage.
 *
 * Uses a direct getBoundingClientRect check (immediate on mount + on
 * scroll/resize) rather than IntersectionObserver — equally smooth, but
 * fail-safe: anything already in view shows instantly, and content is never
 * left hidden. Honors prefers-reduced-motion.
 */

import { useEffect, useRef, useState } from "react";

export default function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  /** Stagger in ms, for sequencing sibling reveals. */
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Reduced motion: show it at once and never observe. A media query is
      // exactly the external system an effect is meant to read.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShown(true);
      return;
    }
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    let done = false;

    const cleanup = () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };

    const check = () => {
      if (done) return;
      const r = el.getBoundingClientRect();
      // Reveal once the top crosses ~90% of the viewport height.
      if (r.top < window.innerHeight * 0.9 && r.bottom > 0) {
        done = true;
        setShown(true);
        cleanup();
      }
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(check);
    };

    check(); // immediate — anything in view on mount shows right away
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return cleanup;
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "none" : "translateY(26px)",
        transition: `opacity .7s cubic-bezier(.22,1,.36,1) ${delay}ms, transform .7s cubic-bezier(.22,1,.36,1) ${delay}ms`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}
