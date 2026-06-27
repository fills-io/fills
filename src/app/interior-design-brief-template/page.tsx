import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BriefTemplate from "@/components/blog/BriefTemplate";

export const metadata: Metadata = {
  title: { absolute: "Free Interior Design Brief Template (Printable) | Fills" },
  description:
    "A free, printable interior design brief template. Fill it in on screen or print it, covering goals, style, budget, and constraints. Built by a working architect.",
  keywords: [
    "interior design brief template",
    "free interior design brief template",
    "design brief template",
    "interior design brief template pdf",
    "printable design brief",
  ],
  alternates: { canonical: "https://fills.io/interior-design-brief-template" },
  openGraph: {
    type: "website",
    url: "https://fills.io/interior-design-brief-template",
    title: "Free Interior Design Brief Template (Printable) | Fills",
    description:
      "A free, printable interior design brief template covering goals, style, budget, and constraints. Built by a working architect.",
  },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to use the interior design brief template",
  description:
    "Fill in each section of the interior design brief template to define a project before design begins.",
  step: [
    { "@type": "HowToStep", name: "The project", text: "Note the space, its size, and who uses it." },
    { "@type": "HowToStep", name: "The vision", text: "Write one sentence on how the space should feel, and what is not working today." },
    { "@type": "HowToStep", name: "Style direction", text: "List the colours you love, colours to avoid, and three words for the vibe." },
    { "@type": "HowToStep", name: "Practical", text: "State the budget, the deadline, and anything that cannot change." },
  ],
};

export default function TemplatePage() {
  return (
    <>
      <Navbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <main className="min-h-screen bg-bg px-6 py-16 sm:px-8">
        <div className="mx-auto max-w-[680px]">
          {/* Intro (real text for search engines) */}
          <span className="inline-flex items-center gap-2.5 font-mono text-[9px] font-medium uppercase tracking-[0.18em] text-acc print:hidden">
            <span className="inline-block h-px w-6 bg-acc" />
            Free resource
          </span>
          <h1 className="mt-5 font-serif text-[clamp(30px,4.6vw,46px)] font-medium leading-[1.06] tracking-tight text-txt print:hidden">
            The interior design brief template
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-[1.8] font-light text-txt-2 print:hidden">
            A good brief is the difference between a room that comes together and
            one that drifts. This free template walks through every part of one:
            the space and the people in it, how it should feel, your style
            direction, budget, and the constraints that cannot change. Fill it in
            below, then print it or save it as a PDF to keep.
          </p>

          <div className="mt-10">
            <BriefTemplate />
          </div>

          {/* After the sheet */}
          <div className="mt-14 border-t border-bdr pt-8 print:hidden">
            <h2 className="font-serif text-[24px] font-medium leading-tight text-txt">
              Prefer to skip the blank page?
            </h2>
            <p className="mt-3 max-w-xl text-[15px] leading-[1.8] font-light text-txt-2">
              The template is the manual way. Fills is the fast one. Describe your
              project in a line or two and it returns a complete editorial mood
              board: palette, materials, lighting, and furniture, ready to refine
              and share in five minutes.
            </p>
            <Link
              href="/concept?mode=quick"
              className="mt-6 inline-flex items-center gap-2 bg-acc px-6 py-3.5 font-mono text-[11px] uppercase tracking-[0.1em] text-white transition hover:bg-acc-d"
            >
              Build your brief with Fills →
            </Link>
            <p className="mt-8 text-[13px] text-txt-2">
              New to briefs? Read{" "}
              <Link
                href="/blog/how-to-write-an-interior-design-brief"
                className="text-acc underline decoration-acc/40 underline-offset-2 hover:decoration-acc"
              >
                how to write an interior design brief
              </Link>
              .
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
