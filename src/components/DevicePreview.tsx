"use client";

/**
 * Device preview switcher (temporary testing tool — lives in the header).
 *
 * Pick a device and the current page renders inside a real, device-width
 * iframe, so genuine responsive breakpoints fire (an iframe has its own
 * viewport, unlike a CSS-constrained container). "Desktop" exits the frame.
 *
 * The iframe loads the same route with `?deviceframe=1`; inside that frame this
 * component renders nothing, so there's no nested switcher and no recursion.
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Device = { id: string; label: string; w: number; h: number };

const DEVICES: Device[] = [
  { id: "iphone-se", label: "iPhone SE", w: 375, h: 667 },
  { id: "iphone-14", label: "iPhone 14", w: 390, h: 844 },
  { id: "pixel-7", label: "Pixel 7", w: 412, h: 915 },
  { id: "ipad-mini", label: "iPad mini", w: 768, h: 1024 },
  { id: "ipad-pro", label: "iPad Pro", w: 1024, h: 1366 },
];

const DevicesIcon = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="14" height="10" rx="1" />
    <path d="M4 17h8" />
    <rect x="15.5" y="8.5" width="6.5" height="11.5" rx="1" />
  </svg>
);

export default function DevicePreview() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [device, setDevice] = useState<Device | null>(null);
  const [path, setPath] = useState("/");

  useEffect(() => {
    setMounted(true);
    setPath(window.location.pathname);
  }, []);

  // Rendered inside the preview iframe → show nothing (no switcher, no loop).
  const inFrame =
    mounted && new URLSearchParams(window.location.search).has("deviceframe");
  if (!mounted || inFrame) return null;

  return (
    <div className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Preview device size"
        aria-expanded={open}
        className={`grid h-[60px] w-[52px] place-items-center border-l border-bdr transition hover:bg-bg-2 hover:text-acc ${
          device ? "text-acc" : "text-txt-2"
        }`}
      >
        {DevicesIcon}
      </button>

      {open && (
        <>
          {/* click-away */}
          <div className="fixed inset-0 z-[70]" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-[60px] z-[80] w-52 border border-bdr bg-bg p-1 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.3)]">
            <p className="px-3 py-2 font-mono text-[9px] uppercase tracking-[0.16em] text-txt-3">
              Preview device
            </p>
            <MenuItem
              active={device === null}
              onClick={() => {
                setDevice(null);
                setOpen(false);
              }}
            >
              Desktop <span className="text-txt-3">full width</span>
            </MenuItem>
            {DEVICES.map((d) => (
              <MenuItem
                key={d.id}
                active={device?.id === d.id}
                onClick={() => {
                  setDevice(d);
                  setOpen(false);
                }}
              >
                {d.label}{" "}
                <span className="text-txt-3">
                  {d.w}×{d.h}
                </span>
              </MenuItem>
            ))}
          </div>
        </>
      )}

      {/* Portal to body so the fixed overlay escapes the header's
          backdrop-filter containing block and covers the real viewport. */}
      {device &&
        createPortal(
          <DeviceOverlay
            device={device}
            path={path}
            onPick={setDevice}
            onClose={() => setDevice(null)}
          />,
          document.body,
        )}
    </div>
  );
}

function MenuItem({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-[12.5px] transition hover:bg-bg-2 ${
        active ? "text-acc" : "text-txt"
      }`}
    >
      {children}
    </button>
  );
}

function DeviceOverlay({
  device,
  path,
  onPick,
  onClose,
}: {
  device: Device;
  path: string;
  onPick: (d: Device) => void;
  onClose: () => void;
}) {
  const [vp, setVp] = useState({ w: 1280, h: 800 });

  useEffect(() => {
    const on = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);

  const TOOLBAR = 56;
  const PAD = 24;
  const availW = vp.w - PAD * 2;
  const availH = vp.h - TOOLBAR - PAD * 2;
  // Scale only to fit the width, so the device keeps its true pixel width (the
  // thing responsive breakpoints react to). If it's taller than the screen, the
  // page just scrolls inside the frame — like a real device.
  const scale = Math.min(1, availW / device.w);
  const frameH = Math.min(device.h, Math.floor(availH / scale));

  const src = `${path}${path.includes("?") ? "&" : "?"}deviceframe=1`;

  return (
    <div className="fixed inset-0 z-[9998] flex flex-col bg-black/75 backdrop-blur-sm">
      {/* Toolbar */}
      <div
        className="flex flex-wrap items-center justify-center gap-1.5 px-4"
        style={{ height: TOOLBAR }}
      >
        {DEVICES.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => onPick(d)}
            className={`rounded-full px-3 py-1 text-[11px] transition ${
              d.id === device.id
                ? "bg-acc text-white"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            {d.label}
          </button>
        ))}
        <span className="ml-1 font-mono text-[10px] tabular-nums text-white/50">
          {device.w}×{device.h}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="ml-2 rounded-full border border-white/25 px-3 py-1 text-[11px] text-white transition hover:bg-white/10"
        >
          ✕ Exit
        </button>
      </div>

      {/* Framed device */}
      <div className="flex flex-1 items-center justify-center overflow-hidden py-6">
        <div style={{ width: device.w * scale, height: frameH * scale }}>
          <div
            style={{
              width: device.w,
              height: frameH,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
            className="overflow-hidden rounded-[24px] border-[8px] border-[#1a1714] bg-white shadow-[0_40px_120px_-20px_rgba(0,0,0,0.7)]"
          >
            <iframe
              src={src}
              width={device.w}
              height={frameH}
              title={`${device.label} preview`}
              className="block border-0"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
