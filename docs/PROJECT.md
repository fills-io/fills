# Fills — Project Status & Working Notes

_Last updated: 2026-06-28_

Fills turns a one-line brief into a complete editorial mood board (palette,
materials, lighting, furniture) in minutes. Built for interior designers and
architects. Live at **[fills.io](https://fills.io)**.

This doc is the single source of truth for **how we work**, **what's live**,
and **what's next**. Updated as we go.

---

## How we work together (the rules)

1. **Approve before it ships.** Every change is built on a branch and shown to
   you as a preview first. Nothing reaches fills.io until you reply **"approve"**.
2. **Discuss before we proceed** on anything significant. You decide direction;
   I recommend and build.
3. **Preview each change** before it goes live.
4. **Plain English, founder-first.** I don't ask you technical questions or make
   you choose between technical options. I recommend the best path and ask only
   about product or business intent.
5. **VC-ready codebase.** Clean, documented, no shortcuts that would embarrass us
   in due diligence.
6. **Brand voice in copy:** no visible "AI" wording (kept only in the behind-the-
   scenes SEO layer), and no em-dashes (they read as AI-written).
7. **Design language:** architectural-editorial — cream/dark themes with full
   day + night parity, Playfair serif headlines, terracotta accent, drafting
   marks and corner brackets.
8. **AI models:** re-researched before any recommendation; never assumed. We
   update to the best AI/image platform as better releases land. The Pinterest
   source (Apify scraper) is swappable if a better one appears.
9. **Goal-oriented:** every page drives toward the core action (build a brief →
   capture the user).
10. **SEO always:** factored into every change, not bolted on.
11. **Canva-level ease:** the UX bar is effortless, obvious, delightful.
12. **Constant work in progress:** we periodically run a website critique
    (Goal / SEO / UX) and act on the findings.

---

## What's live now

- **Homepage** — full redesign, day/night themes, motion, interactive hero, the
  rolling "I'm working on…" builder.
- **Custom domain** — fills.io (auto-deploys when we ship to `main`).
- **Lead capture + admin** — honest email capture in the flow; `/admin` dashboard
  (password-protected) lists who signed up and what they were designing.
- **SEO foundations** — keyword-led page titles, social-share tags, structured
  data, sitemap, robots. Visible "AI" wording and em-dashes removed.
- **Blog** — public `/blog` ("The Blog"), the first article, and a free printable
  **interior design brief template** at `/interior-design-brief-template`.
- **Blog manager** — write, edit, and publish posts yourself from `/admin/blog`
  (database-backed, password-protected).
- **Pinterest engine** — the live search API works in production (verified).

---

## What's pending / next

**Waiting on your word**
- **Real Pinterest in the Quick flow** (PR #41) — built and verified; the Vibe
  step will show real photos instead of placeholders. Just needs your approve.

**Agreed, not built yet**
- **Image uploads in the blog** — cover photo + images inside posts (deferred on
  purpose; the writing came first).
- **The rest of the flow is still placeholder** — after the Vibe step, the
  generated brief, mood board, and concept are not yet powered by real AI. This
  is the big "make it real" milestone.

**Housekeeping**
- **www vs non-www** — fills.io currently redirects to www.fills.io, but our SEO
  tags point at the non-www version. A small fix to make them consistent.
- **Blog author byline** — currently "Aisha Nazeer · Architect & founder."
  Confirm that's how you want to be credited (or change it).
- **Social share image** — the picture shown when fills.io is shared on
  social/messaging. Not designed yet.

**Bigger phases**
- **SEO long game** — more articles + backlinks (Product Hunt, design
  directories). This is a 3–6 month compounding effort.
- **Go private + upgrade** — make the repo private and move to Vercel Pro, add
  Bhaor. Backstop: **2026-08-01**.
- **Accounts + billing** — real user login (Clerk) and payments (Stripe).
- **Save + share** — store finished briefs and give each a shareable link.

---

## Where everything lives (founder reference)

- **Hosting:** Vercel. Pushing to the `main` branch auto-deploys to fills.io.
- **Domain:** fills.io (DNS at Namecheap → Vercel).
- **Database:** Supabase (Postgres). Tables: `concepts`, `mood_boards`, `leads`,
  `posts`.
- **Code:** GitHub `fills-io/fills`. Currently public (for free hosting); going
  private at upgrade time.
- **Admin:** `/admin` (Leads) and `/admin/blog` (Blog), both behind one password.
- **Keys/settings** (stored safely in Vercel, never in code): database URL,
  OpenAI key, Pinterest (Apify) token, admin username + password.

---

## How to (common tasks)

**Publish a blog post**
1. Go to `fills.io/admin/blog` and log in.
2. Click **New post**, write, use the toolbar for headings/bold/lists/links.
3. Toggle **Published**, click save. It's live on `/blog` immediately. Drafts
   stay hidden.

**See who signed up**
- `fills.io/admin` lists every email capture. Visitor traffic (views, countries)
  is in the Vercel dashboard → Analytics.

**Change the blog author name**
- Tell me, or edit the byline field on any post in the editor.
