"use client";

import { useState, useSyncExternalStore } from "react";
import { Copy } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { buildBookmarklet } from "@/lib/bookmarklet";

export function BookmarkletInstall() {
  const origin = useSyncExternalStore(
    () => () => undefined,
    () => window.location.origin,
    () => "",
  );
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  const bookmarklet = origin ? buildBookmarklet(origin) : "";

  const copy = async () => {
    setCopied(false);
    setCopyFailed(false);
    try {
      await navigator.clipboard.writeText(bookmarklet);
      setCopied(true);
    } catch {
      setCopyFailed(true);
    }
  };

  if (!bookmarklet) return null;

  return (
    <section className="mt-8 border-t border-slate-200 pt-5">
      <div className="flex items-center gap-2">
        <input aria-label="Bookmarklet code" className="h-10 min-w-0 flex-1 border border-slate-300 px-2 font-mono text-xs text-slate-700" readOnly value={bookmarklet} />
        <IconButton label="Copy bookmarklet" onClick={() => void copy()}><Copy size={17} /></IconButton>
      </div>
      {copied && <p aria-live="polite" className="mt-2 text-xs text-emerald-700">Copied</p>}
      {copyFailed && <p aria-live="polite" className="mt-2 text-xs text-rose-700">Copy the code manually.</p>}
    </section>
  );
}
