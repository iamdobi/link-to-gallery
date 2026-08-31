"use client";

import Link from "next/link";
import { useState } from "react";

type CaptureConfirmationProps = {
  url: string | null;
  validationError?: string;
};

type SaveResult = { kind: "created" | "duplicate"; imageId: string } | { error: string };

export function CaptureConfirmation({ url, validationError }: CaptureConfirmationProps) {
  const [result, setResult] = useState<SaveResult | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!url) return;
    setSaving(true);
    setResult(null);
    try {
      const response = await fetch("/api/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      setResult(await response.json() as SaveResult);
    } catch {
      setResult({ error: "Unable to save the image." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-950 sm:px-6">
      <section className="mx-auto max-w-2xl space-y-5">
        <header className="space-y-1">
          <p className="text-sm font-medium text-emerald-700">Link Gallery</p>
          <h1 className="text-2xl font-semibold">Save image</h1>
        </header>
        {url ? <>
          <div className="overflow-hidden border border-slate-300 bg-white">
            {/* The saved remote image is intentionally rendered from its original URL. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="Image to save" className="block max-h-[65vh] w-full object-contain" src={url} />
          </div>
          <p className="break-all text-sm text-slate-600">{url}</p>
          <button className="min-h-11 bg-emerald-700 px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400" disabled={saving} onClick={() => void save()} type="button">{saving ? "Saving" : "Save to Inbox"}</button>
        </> : <p className="border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{validationError ?? "An image URL is required."}</p>}
        {result && "kind" in result && <div aria-live="polite" className="border border-slate-300 bg-white p-4 text-sm text-slate-700"><p>{result.kind === "created" ? "Image saved to Inbox." : "This image is already in your gallery."}</p><Link className="mt-3 inline-flex min-h-10 items-center text-sm font-semibold text-emerald-700 underline" href="/gallery">Open gallery</Link></div>}
        {result && "error" in result && <p aria-live="polite" className="border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{result.error}</p>}
      </section>
    </main>
  );
}
