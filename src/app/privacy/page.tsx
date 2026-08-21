import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

/**
 * Privacy policy.
 *
 * Written against what the code ACTUALLY does, not against a template. Every
 * claim on this page maps to something real:
 *
 *   • `leads` table          — src/app/api/leads/route.ts (email, name, message)
 *   • `concepts` table       — src/app/api/concepts/route.ts (the saved brief)
 *   • `purchases` table      — src/lib/payments/** (email + what was bought)
 *   • localStorage drafts    — src/lib/quick-storage.ts, src/lib/wizard-storage.ts
 *   • Vercel Analytics       — src/app/layout.tsx
 *   • IP in memory only      — src/lib/rate-limit.ts
 *
 * If any of those change, this page changes with them. A privacy policy that
 * describes data we don't collect, or misses data we do, is worse than none.
 */

export const metadata: Metadata = {
  title: { absolute: "Privacy Policy | Fills" },
  description:
    "What Fills collects, where it is stored, who else sees it, and how to have it deleted. Plainly written, and accurate to what the product actually does.",
  alternates: { canonical: "https://fills.io/privacy" },
  openGraph: {
    type: "website",
    url: "https://fills.io/privacy",
    title: "Privacy Policy | Fills",
    description:
      "What Fills collects, where it is stored, who else sees it, and how to have it deleted.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy | Fills",
    description:
      "What Fills collects, where it is stored, who else sees it, and how to have it deleted.",
  },
};

/** Shown at the top of the page and in the closing note. */
const LAST_UPDATED = "21 August 2026";

/**
 * The one address in the repo that reaches a human.
 *
 * A shared inbox, not a founder's personal address: this is the contact a data
 * request has to reach, and it must outlive any one person's mailbox. NEEDS A
 * GOOGLE WORKSPACE ALIAS ON fills.io BEFORE LAUNCH, or the privacy policy
 * points at nothing.
 */
const CONTACT_EMAIL = "hello@fills.io";

const h2 = "font-serif text-[24px] font-medium leading-tight text-txt";
const h3 = "font-medium text-[15px] text-txt";
const p = "text-[15px] leading-[1.8] font-light text-txt-2";
const li = "text-[15px] leading-[1.8] font-light text-txt-2";
const link =
  "text-acc underline decoration-acc/40 underline-offset-2 transition hover:decoration-acc";

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-bg px-6 py-16 sm:px-8">
        <div className="mx-auto max-w-[680px]">
          <span className="inline-flex items-center gap-2.5 font-mono text-[9px] font-medium uppercase tracking-[0.18em] text-acc">
            <span className="inline-block h-px w-6 bg-acc" />
            Privacy
          </span>
          <h1 className="mt-5 font-serif text-[clamp(30px,4.6vw,46px)] font-medium leading-[1.06] tracking-tight text-txt">
            What we keep, and what we don&apos;t.
          </h1>
          <p className={`mt-4 max-w-xl ${p}`}>
            This page describes what Fills actually stores. It is written from
            the code, not from a template, so it is specific: it names the
            things we hold, where they sit, and how to make them go away.
          </p>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-txt-3">
            Last updated · {LAST_UPDATED}
          </p>

          {/* ── The short version ─────────────────────────────────────────── */}
          <section className="relative mt-12 border border-bdr-2 bg-bg-2 p-7">
            <span className="absolute left-0 top-0 h-[16px] w-[16px] border-l-[1.5px] border-t-[1.5px] border-acc" />
            <span className="absolute bottom-0 right-0 h-[16px] w-[16px] border-b-[1.5px] border-r-[1.5px] border-acc" />
            <h2 className={h2}>The short version</h2>
            <ul className="mt-4 space-y-2.5">
              <li className={li}>
                You can use Fills to build a brief without giving us your name
                or your email. There are no accounts and no passwords.
              </li>
              <li className={li}>
                We only hold an email address if you send us one, either through
                &ldquo;talk to a designer&rdquo;, or by buying something.
              </li>
              <li className={li}>
                The briefs people generate are saved so they survive a closed
                tab. They are not attached to a name or an email address.
              </li>
              <li className={li}>
                No advertising cookies, no tracking pixels, no data sold or
                shared with anyone for marketing. Ever.
              </li>
              <li className={li}>
                Want it deleted? Email{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className={link}>
                  {CONTACT_EMAIL}
                </a>{" "}
                and we&apos;ll do it.
              </li>
            </ul>
          </section>

          {/* ── What we collect ───────────────────────────────────────────── */}
          <section className="mt-14 border-t border-bdr pt-8">
            <h2 className={h2}>What we collect</h2>
            <p className={`mt-3 ${p}`}>
              Four things, and only when the situation calls for them.
            </p>

            <div className="mt-7 space-y-7">
              <div>
                <h3 className={h3}>1. When you write to us</h3>
                <p className={`mt-2 ${p}`}>
                  The &ldquo;talk to a designer&rdquo; form sends us your email
                  address, your name if you fill it in, and the message you
                  write about your project. We store those in our database and a
                  person reads them, so a designer can reply to you by email.
                </p>
                <p className={`mt-2 ${p}`}>
                  That is the whole purpose. We don&apos;t add you to a mailing
                  list, we don&apos;t pass your message to anyone outside Fills,
                  and we don&apos;t use it to advertise to you.
                </p>
              </div>

              <div>
                <h3 className={h3}>2. The briefs you generate</h3>
                <p className={`mt-2 ${p}`}>
                  When a brief finishes generating, we save it. That means: what
                  kind of space you were designing, the project details you
                  entered (things like the space type, rough floor area, whether
                  there&apos;s outdoor space, and any description you wrote), the
                  reference images you picked, your colour palette, and the text
                  the brief came back with.
                </p>
                <p className={`mt-2 ${p}`}>
                  We save it so that closing a tab or hitting refresh
                  doesn&apos;t destroy work you spent time on. Each saved brief
                  gets a long random link, and it is only reachable by someone
                  who has that link.
                </p>
                <p className={`mt-2 ${p}`}>
                  Worth being clear about: a saved brief is{" "}
                  <em>not linked to your name or your email address</em>. We
                  can&apos;t look at a brief and tell whose it is. The one
                  exception is you: if you type personal details into the
                  free-text description box, they get saved along with
                  everything else, so please don&apos;t put anything there you
                  wouldn&apos;t want stored.
                </p>
              </div>

              <div>
                <h3 className={h3}>3. When you buy something</h3>
                <p className={`mt-2 ${p}`}>
                  A purchase records your email address, what you bought, what
                  it cost, and the payment provider&apos;s reference for the
                  transaction. Your email is the thing that unlocks your
                  download later, which is why we keep it. It saves you having
                  to invent a password in the middle of a checkout.
                </p>
                <p className={`mt-2 ${p}`}>
                  Card numbers never reach us. When payments go live they will
                  be handled entirely by a payment provider, on their systems.
                  We only ever see that a payment succeeded, and for how much.
                </p>
                <p className={`mt-2 ${p}`}>
                  At the time of writing, paid checkout is not switched on yet.
                </p>
              </div>

              <div>
                <h3 className={h3}>4. Draft work, saved in your own browser</h3>
                <p className={`mt-2 ${p}`}>
                  While you&apos;re part-way through building a brief, we keep a
                  draft in your browser&apos;s own local storage, so a refresh
                  or an accidental back-swipe doesn&apos;t wipe six minutes of
                  work. We also remember whether you chose light or dark mode
                  the same way.
                </p>
                <p className={`mt-2 ${p}`}>
                  This lives on your device and is never sent to us on its own.
                  Drafts are dropped after seven days, and clearing your browser
                  data clears them immediately.
                </p>
              </div>
            </div>
          </section>

          {/* ── Analytics ─────────────────────────────────────────────────── */}
          <section className="mt-14 border-t border-bdr pt-8">
            <h2 className={h2}>Analytics</h2>
            <p className={`mt-3 ${p}`}>
              We use Vercel Analytics, and nothing else. It counts page views,
              which pages get visited, roughly where in the world from, what
              kind of device, without setting cookies and without building a
              profile of you. We use it to see which pages are worth keeping.
            </p>
            <p className={`mt-3 ${p}`}>
              There is no Google Analytics here, no advertising pixel, no
              session recorder, and no third-party marketing tag. That is also
              why you haven&apos;t been asked to accept a cookie banner: there
              are no tracking cookies to accept.
            </p>
          </section>

          {/* ── IP addresses ──────────────────────────────────────────────── */}
          <section className="mt-14 border-t border-bdr pt-8">
            <h2 className={h2}>IP addresses</h2>
            <p className={`mt-3 ${p}`}>
              Like any website, our servers see the IP address a request comes
              from. We hold it briefly, in memory, to stop one script hammering
              the expensive parts of the product. It is not written to our
              database and it is not connected to your brief or your email. Our
              hosting provider keeps its own short-lived request logs, as
              hosting providers do.
            </p>
          </section>

          {/* ── Where it lives ────────────────────────────────────────────── */}
          <section className="mt-14 border-t border-bdr pt-8">
            <h2 className={h2}>Where it lives, and who else sees it</h2>
            <p className={`mt-3 ${p}`}>
              Everything we store sits in a Postgres database hosted by
              Supabase, our database provider. The site itself runs on Vercel.
              Both are companies we pay to run infrastructure for us; neither
              gets to use your data for their own purposes.
            </p>
            <p className={`mt-3 ${p}`}>
              A small number of other services see specific slices of this,
              because the product needs them to work:
            </p>
            <ul className="mt-4 space-y-3">
              <li className={li}>
                <span className="text-txt">OpenAI</span> — writes the brief. It
                receives what you told us about the space: the description, the
                style words, the titles of the reference images you picked and
                your palette. It does not receive your name, your email address
                or anything you sent through the contact form.
              </li>
              <li className={li}>
                <span className="text-txt">Apify</span> — fetches the reference
                images from Pinterest. It receives the search terms used to find
                them, and nothing about you.
              </li>
              <li className={li}>
                <span className="text-txt">Supabase</span> — stores everything
                described on this page.
              </li>
              <li className={li}>
                <span className="text-txt">Vercel</span> — hosts the site and
                provides the page-view analytics above.
              </li>
              <li className={li}>
                <span className="text-txt">A payment provider</span> — once paid
                checkout is switched on, it will handle the payment itself and
                the card details that go with it.
              </li>
            </ul>
            <p className={`mt-4 ${p}`}>
              These providers run infrastructure in various countries, which
              means your data may be processed outside the country you are in.
              We do not sell your data, and we do not share it with anyone for
              advertising.
            </p>
          </section>

          {/* ── How long ──────────────────────────────────────────────────── */}
          <section className="mt-14 border-t border-bdr pt-8">
            <h2 className={h2}>How long we keep things</h2>
            <ul className="mt-4 space-y-2.5">
              <li className={li}>
                <span className="text-txt">Messages and emails you send us</span>{" "}
                — kept while we may still need to reply or follow up, and
                deleted whenever you ask.
              </li>
              <li className={li}>
                <span className="text-txt">Saved briefs</span> — kept
                indefinitely, so that a link you saved still works in a year.
                Deleted on request.
              </li>
              <li className={li}>
                <span className="text-txt">Purchase records</span> — kept as
                long as we need them for accounting and to honour what you
                bought. A refund is recorded rather than erased, so there is an
                accurate history of what was sold.
              </li>
              <li className={li}>
                <span className="text-txt">Browser drafts</span> — seven days,
                on your own device, or until you clear your browser data.
              </li>
            </ul>
          </section>

          {/* ── Your data, deleted ────────────────────────────────────────── */}
          <section className="mt-14 border-t border-bdr pt-8">
            <h2 className={h2}>Getting your data, or having it deleted</h2>
            <p className={`mt-3 ${p}`}>
              Email{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className={link}>
                {CONTACT_EMAIL}
              </a>{" "}
              and ask. You can ask us for a copy of what we hold about you, ask
              us to correct it, or ask us to delete it. There is no form to
              fill in and no charge.
            </p>
            <p className={`mt-3 ${p}`}>
              To help us find it, include the email address you used and, if
              you want a specific brief removed, the link to that brief. We
              can&apos;t match a saved brief to a person on our own, so without
              the link we won&apos;t be able to find yours.
            </p>
            <p className={`mt-3 ${p}`}>
              We&apos;ll deal with it within 30 days, and usually a great deal
              faster. If we&apos;ve taken money from you, we may need to keep
              the bare purchase record for accounting even after deleting the
              rest, and we&apos;ll tell you if that applies.
            </p>
          </section>

          {/* ── Odds and ends ─────────────────────────────────────────────── */}
          <section className="mt-14 border-t border-bdr pt-8">
            <h2 className={h2}>A few other things</h2>
            <p className={`mt-3 ${p}`}>
              <span className="text-txt">Children.</span> Fills is built for
              people working on real spaces and isn&apos;t intended for children.
              We don&apos;t knowingly collect anything from under-16s.
            </p>
            <p className={`mt-3 ${p}`}>
              <span className="text-txt">Security.</span> We keep the amount of
              personal data we hold deliberately small, because the safest data
              is the data you never collected. Saved briefs use long random
              links rather than guessable numbers. No system is perfectly
              secure, and we won&apos;t pretend otherwise.
            </p>
            <p className={`mt-3 ${p}`}>
              <span className="text-txt">Changes.</span> Fills is early and
              moving quickly. When what we store changes, this page changes with
              it, and the date at the top will tell you when it last did.
            </p>
          </section>

          {/* ── Footer note ───────────────────────────────────────────────── */}
          <section className="mt-14 border-t border-bdr pt-8">
            <p className={p}>
              Questions about any of this go to{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className={link}>
                {CONTACT_EMAIL}
              </a>
              . The companion page to this one is our{" "}
              <Link href="/terms" className={link}>
                terms of use
              </Link>
              .
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
