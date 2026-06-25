/**
 * WordmarkMoment — the oversized "FILLS" typographic beat (ported from the
 * v40 wordmark section). A deliberate art-directed break between the card
 * grids, with a three-column meta row beneath. Theme-aware.
 */
export default function WordmarkMoment() {
  return (
    <section className="overflow-hidden border-b border-bdr bg-bg px-8 py-[104px]">
      <div className="mx-auto max-w-[1280px]">
        <h2 className="text-center font-serif font-medium leading-[0.86] tracking-[-0.03em] text-txt">
          <span className="block text-[clamp(72px,16vw,220px)]">
            Fills<span className="text-acc">.</span>
          </span>
        </h2>

        <div className="mx-auto mt-10 grid max-w-[880px] grid-cols-1 gap-px border border-bdr bg-bdr sm:grid-cols-3">
          {[
            ["Built by", "A working architect"],
            ["Trained on", "How senior studios brief"],
            ["Delivered in", "Five minutes"],
          ].map(([k, v]) => (
            <div key={k} className="bg-bg px-6 py-6 text-center">
              <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-txt-3">
                {k}
              </div>
              <div className="mt-2 font-serif text-[18px] text-txt">{v}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
