export default function SocialBand() {
  return (
    <div className="border-b border-bdr bg-bg-2 px-6 py-14 text-center sm:px-8">
      {/* This used to read "in daily use by working architects and interior
          designers". Nothing on a pre-launch product supports that, and an
          adoption claim is the one line a visitor can check. Says what the
          brief IS instead, which is true on day one. */}
      <p className="mx-auto max-w-3xl text-[13px] leading-relaxed text-txt-2">
        Written the way a studio scopes a project, for{" "}
        <em className="not-italic font-medium text-txt">residential</em>,{" "}
        <em className="not-italic font-medium text-txt">hospitality</em>, and{" "}
        <em className="not-italic font-medium text-txt">retail</em> work.
      </p>
    </div>
  );
}
