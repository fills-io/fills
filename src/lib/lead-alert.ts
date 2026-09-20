/**
 * Email the team when a lead arrives.
 *
 * Until this existed, "a designer will reply by email" was a silent row in the
 * `leads` table. Nobody was told, so every enquiry waited until someone
 * happened to open /admin. This sends one plain-text email per lead.
 *
 * Sent through the company's own Gmail (Google Workspace) over SMTP. Chosen
 * over a transactional provider on purpose: Aisha already pays for Workspace,
 * wanted no new accounts, and the volume is a handful of emails a week. Two
 * settings, both server-side:
 *
 *   GMAIL_USER          the mailbox that sends, e.g. aisha@fills.io. Also the
 *                       default recipient.
 *   GMAIL_APP_PASSWORD  a Google "app password" for that mailbox, NOT the
 *                       normal password (Google rejects those for SMTP).
 *                       Made under Google Account → Security → 2-Step
 *                       Verification → App passwords. Treat it like the
 *                       mailbox password: it can read and send everything.
 *   LEAD_ALERT_TO       optional. Who receives the alert; defaults to
 *                       GMAIL_USER. Comma-separate to add more people.
 *
 * Without both Gmail settings this does nothing and says so in the logs, so
 * the lead flow works identically before they exist. Nothing breaks.
 *
 * Plain text only. The message is written by a stranger, and plain text means
 * nothing they type can be rendered as markup in the team's inbox.
 *
 * Best-effort, like the lead save itself: a failure is logged and swallowed.
 * An email outage must never turn a saved enquiry into an error for the person
 * who sent it.
 */

import nodemailer from "nodemailer";

/** Google's SMTP front door. Port 587 with STARTTLS is what they document. */
const GMAIL_HOST = "smtp.gmail.com";
const GMAIL_PORT = 587;

/** Long enough for a slow handshake, short enough to stay inside a serverless call. */
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

/** The settings, or null with the reason when the feature is switched off. */
function gmailConfig():
  | { user: string; pass: string; to: string[] }
  | { missing: string } {
  const user = process.env.GMAIL_USER?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.trim();
  if (!user) return { missing: "GMAIL_USER" };
  if (!pass) return { missing: "GMAIL_APP_PASSWORD" };

  const to = (process.env.LEAD_ALERT_TO?.trim() || user)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return { user, pass, to };
}

export async function sendLeadAlert(lead: LeadAlert): Promise<void> {
  const config = gmailConfig();
  if ("missing" in config) {
    console.info(`[lead-alert] ${config.missing} not set, skipping the email.`);
    return;
  }

  const { subject, text } = buildLeadAlert(lead);

  try {
    const transport = nodemailer.createTransport({
      host: GMAIL_HOST,
      port: GMAIL_PORT,
      secure: false, // STARTTLS is negotiated on 587; `true` here means implicit TLS on 465.
      requireTLS: true, // Never send the app password in the clear.
      auth: { user: config.user, pass: config.pass },
      connectionTimeout: TIMEOUT_MS,
      greetingTimeout: TIMEOUT_MS,
      socketTimeout: TIMEOUT_MS,
    });

    await transport.sendMail({
      // Gmail insists the sender is the authenticated mailbox (or one of its
      // aliases); anything else is silently rewritten, so don't pretend.
      from: `Fills <${config.user}>`,
      to: config.to,
      // Hitting reply answers the person who wrote in, not the mailbox.
      replyTo: lead.email,
      subject,
      text,
    });
  } catch (error) {
    // Google explains itself in the error (bad app password, 2-step off,
    // blocked sign-in...). Logged in full: this is the only place the reason
    // will ever surface.
    console.error("[lead-alert] send failed:", error);
  }
}
