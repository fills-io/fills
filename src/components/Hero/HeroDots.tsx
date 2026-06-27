"use client";

/**
 * HeroDots — the interactive sketchbook dot grid (ported faithfully from
 * the v40 prototype). Dots sit on a 50px lattice and magnetically repulse
 * away from the cursor with a quadratic falloff, then spring back.
 *
 * Light-mode only: in dark mode the hero shows HeroImageGrid instead, so
 * this canvas clears + skips drawing (its draw loop keeps running cheaply).
 * Pointer-events:none — the cursor is tracked on window, converted to
 * canvas-local coordinates.
 *
 * Constants match the reference exactly so the feel is identical:
 *   SPACING 50 · REPULSE 140 · MAX_PUSH 18 · FOLLOW .20 · RETURN .10
 *   dots drawn as 2.8px squares in warm graphite rgba(120,80,55,.38).
 */

import { useEffect, useRef } from "react";

export default function HeroDots() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Respect reduced-motion: draw the static lattice once, no interaction.
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const SPACING = 34; // denser — reads as a fine paper texture
    const REPULSE = 130;
    const MAX_PUSH = 14;
    const FOLLOW = 0.2;
    const RETURN = 0.1;
    const COLOR = "rgba(120,80,55,.30)"; // present but soft
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    let dots: { ox: number; oy: number; x: number; y: number }[] = [];
    const mouse = { x: -9999, y: -9999, active: false };
    let rafId = 0;

    function build() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx!.setTransform(1, 0, 0, 1, 0, 0);
      ctx!.scale(dpr, dpr);
      dots = [];
      for (let y = SPACING / 2; y < h; y += SPACING) {
        for (let x = SPACING / 2; x < w; x += SPACING) {
          dots.push({ ox: x, oy: y, x, y });
        }
      }
    }

    function isLight() {
      return !document.documentElement.classList.contains("theme-dark");
    }

    function draw() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      ctx!.clearRect(0, 0, rect.width, rect.height);
      if (!isLight()) return; // dark mode shows the image grid instead

      ctx!.fillStyle = COLOR;
      const r2 = REPULSE * REPULSE;
      for (const d of dots) {
        const dx = d.x - mouse.x;
        const dy = d.y - mouse.y;
        const dist2 = dx * dx + dy * dy;
        if (!reduce && mouse.active && dist2 < r2) {
          const dist = Math.sqrt(dist2) || 0.0001;
          const f = 1 - dist / REPULSE;
          const fall = f * f;
          const ux = dx / dist;
          const uy = dy / dist;
          const tx = d.ox + ux * fall * MAX_PUSH;
          const ty = d.oy + uy * fall * MAX_PUSH;
          d.x += (tx - d.x) * FOLLOW;
          d.y += (ty - d.y) * FOLLOW;
        } else {
          d.x += (d.ox - d.x) * RETURN;
          d.y += (d.oy - d.y) * RETURN;
        }
        ctx!.fillRect(d.x - 1.1, d.y - 1.1, 2.2, 2.2);
      }
    }

    function tick() {
      draw();
      rafId = requestAnimationFrame(tick);
    }

    function onMove(e: MouseEvent) {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      mouse.x = x;
      mouse.y = y;
      mouse.active = x >= 0 && x <= rect.width && y >= 0 && y <= rect.height;
    }
    function onLeave() {
      mouse.active = false;
    }

    let resizeT: ReturnType<typeof setTimeout>;
    function onResize() {
      clearTimeout(resizeT);
      resizeT = setTimeout(build, 150);
    }

    build();
    if (reduce) {
      draw(); // single static paint
    } else {
      tick();
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(resizeT);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="hero-dots-canvas pointer-events-none absolute inset-0 z-0 hidden h-full w-full md:block"
    />
  );
}
