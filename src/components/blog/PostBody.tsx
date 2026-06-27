/**
 * Renders a Post's typed blocks into branded, semantic HTML. Server component,
 * no interactivity. Paragraphs and callouts support a tiny inline syntax:
 *   **bold**            -> medium-weight emphasis
 *   [label](/path)      -> internal Link
 *   [label](https://..) -> external link
 */

import Link from "next/link";
import type { Block } from "@/content/blog/posts";

function renderInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const pattern = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;

  while ((m = pattern.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));

    if (m[1] !== undefined) {
      nodes.push(
        <strong key={key++} className="font-medium text-txt">
          {m[1]}
        </strong>,
      );
    } else {
      const label = m[2];
      const href = m[3];
      const internal = href.startsWith("/");
      const className =
        "text-acc underline decoration-acc/40 underline-offset-2 transition hover:decoration-acc";
      nodes.push(
        internal ? (
          <Link key={key++} href={href} className={className}>
            {label}
          </Link>
        ) : (
          <a key={key++} href={href} className={className}>
            {label}
          </a>
        ),
      );
    }
    last = pattern.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export default function PostBody({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-6">
      {blocks.map((b, i) => {
        switch (b.k) {
          case "h2":
            return (
              <h2
                key={i}
                className="mt-14 font-serif text-[clamp(24px,3vw,32px)] font-medium leading-tight tracking-tight text-txt"
              >
                {b.t}
              </h2>
            );
          case "h3":
            return (
              <h3
                key={i}
                className="mt-8 font-serif text-[19px] font-medium text-txt"
              >
                {b.t}
              </h3>
            );
          case "p":
            return (
              <p
                key={i}
                className="text-[16px] leading-[1.85] font-light text-txt-2"
              >
                {renderInline(b.t)}
              </p>
            );
          case "ul":
            return (
              <ul key={i} className="space-y-2.5 pl-1">
                {b.items.map((it, j) => (
                  <li
                    key={j}
                    className="relative pl-5 text-[16px] leading-[1.8] font-light text-txt-2"
                  >
                    <span className="absolute left-0 top-[11px] h-[5px] w-[5px] bg-acc" />
                    {renderInline(it)}
                  </li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={i} className="space-y-2.5">
                {b.items.map((it, j) => (
                  <li
                    key={j}
                    className="relative pl-8 text-[16px] leading-[1.8] font-light text-txt-2"
                  >
                    <span className="absolute left-0 top-0 font-mono text-[12px] text-acc">
                      {String(j + 1).padStart(2, "0")}
                    </span>
                    {renderInline(it)}
                  </li>
                ))}
              </ol>
            );
          case "quote":
            return (
              <blockquote
                key={i}
                className="border-l-2 border-acc pl-5 font-serif text-[22px] italic leading-snug text-txt"
              >
                {b.t}
              </blockquote>
            );
          case "callout":
            return (
              <div
                key={i}
                className="relative border border-bdr-2 bg-bg-2 p-6 text-[15px] leading-[1.75] font-light text-txt-2"
              >
                <span className="absolute left-0 top-0 h-[14px] w-[14px] border-l-[1.5px] border-t-[1.5px] border-acc" />
                <span className="absolute bottom-0 right-0 h-[14px] w-[14px] border-b-[1.5px] border-r-[1.5px] border-acc" />
                {renderInline(b.t)}
              </div>
            );
          case "cta":
            return (
              <div
                key={i}
                className="flex flex-col gap-4 bg-acc px-7 py-7 sm:flex-row sm:items-center sm:justify-between"
              >
                <p className="max-w-md font-serif text-[18px] leading-snug text-[#fbf1e8]">
                  {b.t}
                </p>
                <Link
                  href={b.href}
                  className="shrink-0 whitespace-nowrap bg-[#fbf1e8] px-5 py-3 text-center font-mono text-[11px] uppercase tracking-[0.1em] text-acc-d transition hover:bg-white"
                >
                  {b.label} →
                </Link>
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
