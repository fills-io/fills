/**
 * The site's one address, used for every absolute URL we hand to a crawler:
 * canonical tags, Open Graph URLs, the sitemap, robots.txt, structured data.
 *
 * It is www because that is where Vercel serves the site: fills.io answers
 * every request with a redirect to www.fills.io. These tags used to name the
 * bare fills.io, so each page told Google its real address was a URL that
 * never serves the page, only a temporary redirect back to the one Google was
 * already reading. The two must agree.
 *
 * If the redirect is ever flipped in Vercel (Settings → Domains) so that www
 * points at the bare domain instead, change this line and nothing else.
 */
export const SITE_URL = "https://www.fills.io";
