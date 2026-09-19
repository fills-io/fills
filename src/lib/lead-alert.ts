/**
 * Email the team when a lead arrives.
 *
 * Until this existed, "a designer will reply by email" was a silent row in the
 * `leads` table. Nobody was told, so every enquiry waited until someone
 * happened to open /admin. This sends one plain-text email per lead.
 *
 * Sent through Resend's HTTP API with a bare fetch, so there is no SDK to keep
 * up to date. Three settings, all server-side:
 *
 *   RESEND_API_KEY   required. Without it this does nothing and says so in
 *                    the logs, so the lead flow works identically before the
 *                    account exists. Nothing breaks while it is missing.
 *   LEAD_ALERT_TO    who receives the alert. Defaults to aisha@fills.io.
 *   LEAD_ALERT_FROM  the sender. Defaults to Resend's shared test address,
 *                    which needs no DNS setup but can ONLY deliver to the
 *                    email the Resend account was opened with. So either open
 *                    the account with the LEAD_ALERT_TO address, or verify
 *                    fills.io in Resend and set this to e.g.
 *                    "Fills <alerts@fills.io>".
 *
 * Plain text only. The message is written by a stranger, and plain text means
 * nothing they type can be rendered as markup in the team's inbox.
 *
 * Best-effort, like the lead save itself: a failure is logged and swallowed.
 * An email outage must never turn a saved enquiry into an error for the person
 * who sent it.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_TO = "aisha@fills.io";
const DEFAULT_FROM = "Fills <onboarding@resend.dev>";

/** Long enough for a slow API, short enough to stay inside a serverless call. */
const TIMEOUT_MS = 8_000;

export type LeadAlert = {
  email: string;
  name?: string | null;
  industry?: string | null;
  spec?: string | null;
  vibe?: string | null;
  message?: string | null;
  source?: string | null;
  /** Absolute URL of the admin leads page, for a one-click jump from the email. */
  adminUrl: string;
};

/** Where the lead came from, in words the team would use. */
const SOURCE_LABEL: Record<string, string> = {
  "talk-to-designer": "Talk to a designer",
  quick: "Quick flow",
  upload: "Upload flow",
};

/**
 * One line, no control characters, bounded. The subject is built from what a
 * visitor typed into the name field.
 */
function oneLine(value: string, max = 120): string {
  const flat = value.replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}

export function buildLeadAlert(lead: LeadAlert): { subject: string; text: string } {
  const who = lead.name?.trim() || lead.email;
  const isEnquiry = lead.source === "talk-to-designer";

  const subject = oneLine(
    isEnquiry ? `New enquiry from ${who}` : `New sign-up on Fills: ${who}`,
  );

  const project = [lead.industry, lead.spec].filter(Boolean).join(" · ");
  const rows: Array<[string, string | null | undefined]> = [
    ["Name", lead.name],
    ["Email", lead.email],
    ["Came from", lead.source ? SOURCE_LABEL[lead.source] ?? lead.source : null],
    ["Working on", project || null],
    ["Vibe", lead.vibe],
  ];

  const lines = rows
    .filter(([, value]) => value && value.trim())
    .map(([label, value]) => `${label}: ${value!.trim()}`);

  if (lead.message?.trim()) {
    lines.push("", "Message:", lead.message.trim());
  }

  lines.push(
    "",
    isEnquiry
      ? "Reply to this email to answer them directly."
      : "Reply to this email to write to them directly.",
    `All leads: ${lead.adminUrl}`,
  );

  return { subject, text: lines.join("\n") };
}

export async function sendLeadAlert(lead: LeadAlert): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.info("[lead-alert] RESEND_API_KEY not set, skipping the email.");
    return;
  }

  const { subject, text } = buildLeadAlert(lead);

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.LEAD_ALERT_FROM?.trim() || DEFAULT_FROM,
        to: [process.env.LEAD_ALERT_TO?.trim() || DEFAULT_TO],
        // Hitting reply answers the person who wrote in, not the robot.
        reply_to: lead.email,
        subject,
        text,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) {
      // Resend explains itself in the body (bad key, unverified sender...).
      // Logged in full: this is the only place the reason will ever surface.
      const detail = await response.text().catch(() => "");
      console.error(`[lead-alert] Resend refused (${response.status}): ${detail}`);
    }
  } catch (error) {
    console.error("[lead-alert] send failed:", error);
  }
}
