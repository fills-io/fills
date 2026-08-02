"use client";

/** Client half of the /dev/pdf harness — see page.tsx. */

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import BriefPDF from "@/components/wizard/BriefPDF";
import { selectCategoryImages, AUTO_CATEGORIES } from "@/lib/select-images";
import type { GenerateBriefResponse } from "@/lib/ai/prompts/generate-brief";
import type { BriefPins } from "@/components/wizard/BriefDisplay";
import type { PinterestPin } from "@/db/schema";

const BRIEF: GenerateBriefResponse = {
  conceptLine:
    "Coastal modernism in travertine and bleached oak, lit like a terrace at six in the evening.",
  summary: {
    projectType: "Hospitality guest room, boutique resort",
    intent:
      "A room that reads calm on arrival and warm after dark. Everything the guest touches is a natural material.",
    whoItsFor:
      "Couples on three-night stays who spend daylight outside and want the room to feel like shade.",
    scopeNotes:
      "Covers finishes, furniture, lighting and surfaces. Dimensions, services and existing conditions still to be surveyed.",
  },
  keywords: [
    "travertine",
    "bleached oak",
    "linen",
    "coastal",
    "warm minimal",
    "plaster",
    "rattan",
    "brushed brass",
    "matte",
  ],
  colorSystem: [
    { role: "primary", hex: "#e8ddcc", name: "first light on linen", application: "Walls and ceiling, lime-washed plaster" },
    { role: "secondary", hex: "#c8a882", name: "dry sand", application: "Joinery fronts, headboard surround" },
    { role: "accent", hex: "#c8512a", name: "terracotta at dusk", application: "Throw, single lounge chair" },
    { role: "supporting", hex: "#5e4226", name: "wet driftwood", application: "Floor, door frames" },
    { role: "supporting", hex: "#2a2a28", name: "shadow line", application: "Ironmongery, lighting tracks" },
  ],
  materials: [
    { material: "Travertine, honed, unfilled", application: "Bathroom floor and vanity top" },
    { material: "White oak, rift-sawn, matte oil", application: "Wardrobe fronts, panelling to 1200mm" },
    { material: "Lime plaster, burnished", application: "All walls and ceiling" },
    { material: "Belgian linen, undyed", application: "Curtains, bed linen, cushion covers" },
    { material: "Brushed brass, unlacquered", application: "Handles, taps, switch plates" },
    { material: "Rattan, natural cane", application: "Wardrobe inserts, headboard panel" },
  ],
  furniture: [
    { item: "Bed, low platform", character: "Oak base, no visible legs, linen headboard" },
    { item: "Lounge chair, low-back", character: "Curved cane frame, deep seat" },
    { item: "Side tables, pair", character: "Solid travertine cylinders, 450mm high" },
    { item: "Desk, wall-hung", character: "Oak slab, no drawers, brass rail" },
    { item: "Bench, end of bed", character: "Woven leather top, tapered oak legs" },
  ],
  lighting: {
    strategy:
      "No ceiling downlights over the bed. Light comes from the walls and from low, so evenings feel like lamplight.",
    colorTemperature: "2700K throughout, 3000K at the vanity",
    layers: [
      { layer: "Ambient", fixtures: "Concealed cove to perimeter, dimmable" },
      { layer: "Task", fixtures: "Swing-arm wall lights either side of bed" },
      { layer: "Accent", fixtures: "Uplight grazing the plaster behind the headboard" },
    ],
  },
  spatialNotes: [
    "Keep the sightline from the door to the window clear of furniture.",
    "Bathroom entry set back so the vanity is not visible from the bed.",
    "Luggage and wardrobe grouped on the entry wall, away from the view.",
    "Lounge chair angled to the window, not to the television.",
  ],
  dos: [
    "Keep every material matte or honed",
    "Run the oak grain vertically on all fronts",
    "Dim every circuit independently",
    "Let the plaster show its trowel marks",
  ],
  donts: [
    "No cool-white downlights",
    "No polished stone anywhere",
    "No printed or patterned textiles",
    "No visible cable trunking",
  ],
  nextSteps: [
    "Measure the room and ceiling void before any joinery is drawn",
    "Confirm the window orientation and time of peak sun",
    "Source travertine slabs and approve the actual blocks",
    "Agree the dimming system with the electrical contractor",
  ],
  cinematicDescription:
    "Late afternoon. The sun is low enough to come in sideways, and it lands across the plaster in a long band that picks up every trowel mark. The oak fronts are half in shadow. Linen moves slightly at the window. The travertine on the side table has gone warm and slightly pink, and the brass handle nearest the light is the brightest thing in the room.",
};

export default function DevPdfClient() {
  const [status, setStatus] = useState("");
  const [url, setUrl] = useState<string | null>(null);

  async function make() {
    setStatus("selecting images…");
    const pins: BriefPins = {};
    for (const cat of AUTO_CATEGORIES) {
      pins[cat as keyof BriefPins] = selectCategoryImages(cat, {
        vibe: "warm coastal minimalism",
        paletteHexes: BRIEF.colorSystem.map((c) => c.hex),
        spaceId: null,
        count: 12,
      }).map((p) => ({ ...p, url: p.imageUrl })) as unknown as PinterestPin[];
    }
    pins.vibe = selectCategoryImages("materials", {
      vibe: "warm coastal minimalism",
      paletteHexes: BRIEF.colorSystem.map((c) => c.hex),
      spaceId: null,
      count: 12,
    }).map((p) => ({ ...p, url: p.imageUrl })) as unknown as PinterestPin[];

    // Dump every chosen pin so a bad reference can be traced to its category.
    console.log(
      Object.entries(pins)
        .map(
          ([k, v]) =>
            `${k}\n` +
            (v as PinterestPin[])
              .map((p) => `   ${p.imageUrl} · ${p.title}`)
              .join("\n"),
        )
        .join("\n"),
    );

    setStatus("rendering pdf (fetching every image)…");
    const blob = await pdf(
      <BriefPDF
        brief={BRIEF}
        pins={pins}
        facts={{
          projectName: "Dune House",
          industry: "Hospitality",
          areaSqm: 48,
          hasOutdoor: true,
          style: "Coastal modernism",
        }}
        format="deck"
      />,
    ).toBlob();

    const res = await fetch("/dev/pdf/save", { method: "POST", body: blob });
    const saved = (await res.json()) as { path: string };
    setUrl(URL.createObjectURL(blob));
    setStatus(`done — ${Math.round(blob.size / 1024)} KB → ${saved.path}`);
  }

  return (
    <main className="p-16">
      <button
        type="button"
        id="make"
        onClick={make}
        className="border border-acc px-4 py-2 text-acc"
      >
        Render deck
      </button>
      <p id="status" className="mt-4 font-mono text-sm">
        {status}
      </p>
      {url ? (
        <iframe
          src={`${url}#toolbar=0&zoom=45`}
          title="deck"
          className="mt-6 h-[3000px] w-full border border-bdr"
        />
      ) : null}
    </main>
  );
}
