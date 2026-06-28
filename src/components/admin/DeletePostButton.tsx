"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeletePostButton({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (!window.confirm(`Delete “${title}”? This can't be undone.`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/posts/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Delete failed (HTTP ${res.status})`);
      }
      router.refresh();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={busy}
      className="font-mono text-[10px] uppercase tracking-[0.1em] text-txt-3 transition hover:text-rose-500 disabled:opacity-50"
    >
      {busy ? "…" : "Delete"}
    </button>
  );
}
