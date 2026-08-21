/**
 * Blog content lives here as typed data, not a CMS. Each post is a list of
 * simple blocks the PostBody renderer turns into branded HTML. Adding a post
 * is just adding an object to POSTS. Keeping it in-repo means every article is
 * version-controlled, statically rendered, and free to host.
 *
 * House rule (matches the rest of the site): no em-dashes in prose.
 */

export type Block =
  | { k: "p"; t: string }
  | { k: "h2"; t: string }
  | { k: "h3"; t: string }
  | { k: "ul"; items: string[] }
  | { k: "ol"; items: string[] }
  | { k: "quote"; t: string }
  | { k: "callout"; t: string }
  | { k: "cta"; t: string; href: string; label: string };

export type Post = {
  slug: string;
  title: string;
  /** Optional override for the <title> shown in Google. Falls back to title. */
  metaTitle?: string;
  description: string;
  excerpt: string;
  keywords: string[];
  /** ISO date for metadata + sitemap. */
  date: string;
  /** Human label shown on the page. */
  dateLabel: string;
  readingTime: string;
  /** Eyebrow category shown above the headline. */
  category: string;
  body: Block[];
};

/**
 * The byline. Google rewards content from a real, credentialed person, and the
 * site already says Fills is built by a working architect. Change `name` here
 * to set the author across every article in one place.
 */
export const AUTHOR = {
  name: "Aisha Nazeer",
  role: "Architect & founder, Fills",
  bio: "Fills is built by a working architect, trained on how senior studios brief their clients.",
};

const HOW_TO_WRITE_A_BRIEF: Post = {
  slug: "how-to-write-an-interior-design-brief",
  title: "How to write an interior design brief",
  metaTitle:
    "How to Write an Interior Design Brief (Free Template) | Fills",
  description:
    "A working architect's guide to writing an interior design brief: the seven things every brief needs, the mistakes to avoid, and a free template you can copy.",
  excerpt:
    "The brief is the most important document in any project, and the one most people rush. Here is what a good one contains, from a working architect.",
  keywords: [
    "how to write an interior design brief",
    "interior design brief",
    "design brief template",
    "interior design brief example",
  ],
  date: "2026-06-28",
  dateLabel: "June 2026",
  readingTime: "6 min read",
  category: "Interior design",
  body: [
    {
      k: "p",
      t: "Every good interior starts with a good brief, and almost every difficult project starts without one. The brief is the quiet document that decides whether a space comes together or drifts. It is also the part most people skip, because it feels like admin when you would rather be choosing tiles.",
    },
    {
      k: "p",
      t: "This is a short, practical guide to writing one. It is the same structure used in professional studios, stripped down to what a single room actually needs.",
    },
    { k: "h2", t: "What an interior design brief is" },
    {
      k: "p",
      t: "A brief is a one-page summary of a project before any design happens. It captures who the space is for, how it should feel, what it must do, and what cannot change. Think of it as the agreement you make with yourself, or with a client, about where you are heading. Get it right and every later decision has something to measure against.",
    },
    {
      k: "p",
      t: "A brief is not a mood board, and it is not a shopping list. It comes before both. The mood board shows the look. The brief explains the intent behind it.",
    },
    { k: "h2", t: "The seven things every brief needs" },
    { k: "h3", t: "1. The room, and the people in it" },
    {
      k: "p",
      t: "Name the space, its rough size, and who uses it. A reading nook for one and a living room for a family of five lead to different answers, even with identical taste. Be specific about real life: pets, small children, people who work from home, the relative who visits every Sunday.",
    },
    { k: "h3", t: "2. One sentence on how it should feel" },
    {
      k: "p",
      t: "This is the heart of the brief. Force yourself to finish the sentence: this room should feel ____. Calm and uncluttered. Warm and a little theatrical. Bright and hard-working. One honest sentence here does more than a hundred saved images, because it gives you a test for every later choice.",
    },
    { k: "h3", t: "3. What is not working today" },
    {
      k: "p",
      t: "Design is often subtraction before addition. Write down the specific frustrations: the room is dark by four in the afternoon, there is nowhere to put keys, the sofa faces the wrong way. Problems are easier to design against than vague wishes.",
    },
    { k: "h3", t: "4. A clear style direction" },
    {
      k: "p",
      t: "Pin down the direction without over-defining it. Three or four words for the vibe, a few colours you are drawn to, and a few you want to avoid. References help here, but keep them tight. Five images that genuinely capture the feeling are worth more than fifty that hedge.",
    },
    { k: "h3", t: "5. The budget, stated plainly" },
    {
      k: "p",
      t: "A budget is not a limitation on the design, it is part of the design. Even a rough range changes what good looks like. Writing it down early avoids the most common and most expensive mistake: falling for a scheme the project was never going to afford.",
    },
    { k: "h3", t: "6. The hard constraints" },
    {
      k: "p",
      t: "List the things that cannot move. A radiator under the only window, a rental that forbids painting, a deadline tied to a new baby or a dinner party. Constraints are not the enemy of a good room. They are usually the reason it has any character at all.",
    },
    { k: "h3", t: "7. The must-haves and the must-nots" },
    {
      k: "p",
      t: "Finish with the non-negotiables on both sides. The piano has to fit. No open shelving in the kitchen. The grandmother's chair stays. These are the lines you will be grateful you drew when the tempting, wrong idea arrives later.",
    },
    { k: "h2", t: "The mistake to avoid: starting with products" },
    {
      k: "p",
      t: "The most common way a brief goes wrong is starting from a specific sofa or a paint colour rather than from intent. Products are decisions, and decisions made before the brief tend to quietly take it over. Decide how the room should feel and work first. The objects come last, and they come more easily.",
    },
    { k: "h2", t: "From a brief to a finished mood board" },
    {
      k: "p",
      t: "Once the brief is written, the next step is translating it into a visual direction: a palette, materials, lighting, and furniture that all answer the same sentence. That translation is exactly what Fills was built to do. You describe the project in a line or two, and it returns a complete editorial mood board you can refine, export, and share.",
    },
    {
      k: "cta",
      t: "Skip the blank page. Describe your project and get a complete brief in five minutes.",
      href: "/concept/quick",
      label: "Build your brief",
    },
    {
      k: "callout",
      t: "Want to write yours by hand first? Use our free, printable [interior design brief template](/interior-design-brief-template). It walks through all seven sections above, and it is yours to keep.",
    },
    {
      k: "p",
      t: "A brief takes fifteen minutes and saves weeks. Write it before you buy a single thing, and the rest of the project has a much easier job.",
    },
  ],
};

export const POSTS: Post[] = [HOW_TO_WRITE_A_BRIEF];

export function getPost(slug: string): Post | undefined {
  return POSTS.find((p) => p.slug === slug);
}
