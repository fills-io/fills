/**
 * Quick-flow draft persistence — localStorage-backed.
 *
 * The 9-step wizard has had this since it shipped (src/lib/wizard-storage.ts);
 * the Quick canvas never got it, even though the homepage sends most people
 * there. The result was that a refresh, an accidental back-swipe on a phone,
 * or a call arriving mid-flow wiped the project setup, every hand-picked
 * reference image and the tuned palette, and dropped the user back to an empty
 * sentence six minutes in.
 *
 * Same trade-offs as the wizard's version: one slot, this device only, and
 * clearing browser data clears it. A draft is scratch work — it becomes a real
 * database row when the brief is generated (src/app/api/concepts/route.ts).
 */

import type { QuickState } from "./quick-state";

const STORAGE_KEY = "fills:quick:draft";

/** Drop drafts older than this rather than resuming something long abandoned. */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

type StoredDraft = {
  savedAt: string;
  state: QuickState;
};

/** SSR-safe: silently does nothing server-side. */
export function saveQuickDraft(state: QuickState): void {
  if (typeof window === "undefined") return;
  try {
    const payload: StoredDraft = {
      savedAt: new Date().toISOString(),
      state,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Quota exceeded or private browsing. Losing the draft is the old
    // behaviour, so there is nothing useful to tell the user here.
  }
}

/** The saved state, or null if there is none, it is unreadable, or it is stale. */
export function loadQuickDraft(): QuickState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredDraft;
    if (!parsed?.state) return null;
    const age = Date.now() - new Date(parsed.savedAt).getTime();
    if (!Number.isFinite(age) || age > MAX_AGE_MS) return null;
    return parsed.state;
  } catch {
    return null;
  }
}

/** How long ago the draft was saved, in plain words ("just now", "yesterday"). */
export function quickDraftAge(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const { savedAt } = JSON.parse(raw) as StoredDraft;
    const mins = Math.floor((Date.now() - new Date(savedAt).getTime()) / 60000);
    if (!Number.isFinite(mins)) return null;
    if (mins < 2) return "just now";
    if (mins < 60) return `${mins} minutes ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return hours === 1 ? "an hour ago" : `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return days === 1 ? "yesterday" : `${days} days ago`;
  } catch {
    return null;
  }
}

export function clearQuickDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* nothing useful to do */
  }
}
