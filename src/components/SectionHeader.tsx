/**
 * Reusable section header pattern: eyebrow tag · big serif headline · italic subhead · lead paragraph.
 * Used by Output, Architect, HowItWorks, MadeFor, FAQ.
 */

type Props = {
  eyebrow: string;
  headline: string;
  sub?: React.ReactNode;
  lead?: React.ReactNode;
  align?: "center" | "left";
  tone?: "light" | "dark";
};

export default function SectionHeader({
  eyebrow,
  headline,
  sub,
  lead,
  align = "center",
  tone = "light",
}: Props) {
  const textColor = tone === "dark" ? "text-hero-cream" : "text-txt";
  const subColor = tone === "dark" ? "text-hero-cream-2" : "text-txt-2";

  return (
    <div
      className={`mx-auto max-w-[780px] ${
        align === "center" ? "text-center" : "text-left"
      }`}
    >
      <span className="inline-flex items-center gap-2.5 font-mono text-[9px] font-medium uppercase tracking-[0.18em] text-acc">
        <span className="inline-block h-px w-6 bg-acc" />
        {eyebrow}
      </span>
      <h2
        className={`mt-5 font-serif text-[clamp(34px,4.6vw,56px)] font-medium leading-[1.05] tracking-tight ${textColor}`}
      >
        {headline}
      </h2>
      {sub && (
        <p
          className={`mt-3 font-serif text-[clamp(18px,2vw,22px)] italic ${subColor}`}
        >
          {sub}
        </p>
      )}
      {lead && (
        <p
          className={`mx-auto mt-5 max-w-2xl text-[13px] leading-[1.85] font-light ${subColor}`}
        >
          {lead}
        </p>
      )}
    </div>
  );
}
