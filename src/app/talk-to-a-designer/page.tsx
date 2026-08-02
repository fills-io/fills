import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TalkToDesignerForm from "@/components/TalkToDesignerForm";

export const metadata: Metadata = {
  title: { absolute: "Talk to a Designer | Fills" },
  description:
    "Get a working interior architect's eyes on your project. Tell us what you're working on and a designer will reply by email.",
  alternates: { canonical: "https://fills.io/talk-to-a-designer" },
  openGraph: {
    type: "website",
    url: "https://fills.io/talk-to-a-designer",
    title: "Talk to a Designer | Fills",
    description:
      "Get a working interior architect's eyes on your project. Tell us what you're working on and a designer will reply by email.",
    images: ["/opengraph-image"],
  },
  // Without its own block this inherits the root twitter card and shares under
  // the homepage headline — openGraph and twitter are replaced, not merged.
  twitter: {
    card: "summary_large_image",
    title: "Talk to a Designer | Fills",
    description:
      "Get a working interior architect's eyes on your project. Tell us what you're working on and a designer will reply by email.",
    images: ["/opengraph-image"],
  },
};

export default async function TalkToDesignerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const { industry, spec, vibe } = sp;

  let initialMessage = "";
  if (industry || spec || vibe) {
    const bits = [
      `I'm working on a ${industry || "design"} project`,
      spec ? `, ${spec}` : "",
      vibe ? ` that feels like ${vibe}` : "",
      ". I'd love to talk it through.",
    ];
    initialMessage = bits.join("");
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-bg px-6 py-20 sm:px-8">
        <div className="mx-auto max-w-[640px]">
          <span className="inline-flex items-center gap-2.5 font-mono text-[9px] font-medium uppercase tracking-[0.18em] text-acc">
            <span className="inline-block h-px w-6 bg-acc" />
            Talk to a designer
          </span>
          <h1 className="mt-5 font-serif text-[clamp(32px,5vw,48px)] font-medium leading-[1.05] tracking-tight text-txt">
            Get a working architect on your project.
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-[1.8] font-light text-txt-2">
            Fills builds your design plan in minutes. When you want a human eye, a
            working interior architect can take it further: a second opinion, a
            full design service, or help getting a retail build-out through a
            mall&apos;s guidelines. Tell us about the project and we&apos;ll
            reply by email.
          </p>

          <div className="mt-10">
            <TalkToDesignerForm initialMessage={initialMessage} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
