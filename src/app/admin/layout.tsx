import Link from "next/link";

/**
 * Shared chrome for every /admin page: a slim top bar with the section nav.
 * Everything under /admin (and /api/admin) is gated by Basic Auth in
 * middleware.ts, so this layout can assume the viewer is the owner.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg text-txt">
      <header className="sticky top-0 z-40 flex h-[52px] items-center justify-between border-b border-bdr bg-[var(--nav-bg)] px-6 backdrop-blur-md">
        <div className="flex items-center gap-5">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-acc">
            Fills · Admin
          </span>
          <nav className="flex items-center gap-4 text-[12px]">
            <Link href="/admin" className="text-txt-2 transition hover:text-acc">
              Leads
            </Link>
            <Link
              href="/admin/blog"
              className="text-txt-2 transition hover:text-acc"
            >
              Blog
            </Link>
          </nav>
        </div>
        <Link
          href="/"
          className="font-mono text-[10px] uppercase tracking-[0.12em] text-txt-3 transition hover:text-acc"
        >
          View site →
        </Link>
      </header>
      {children}
    </div>
  );
}
