"use client";

import { useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import { BookmarkletInstall } from "./bookmarklet-install";

type AddUrlDialogProps = {
  open: boolean;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
};

type SaveResult = { kind: "created" | "duplicate"; imageId: string } | { error: string };
type InputMode = "single" | "bulk";
type BulkResult = { url: string; kind: "created" | "duplicate" | "error"; message: string };

function urlsFromLines(value: string): string[] {
  return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

export function AddUrlDialog({ open, onClose, onSaved }: AddUrlDialogProps) {
  const [url, setUrl] = useState("");
  const [bulkValue, setBulkValue] = useState("");
  const [mode, setMode] = useState<InputMode>("single");
  const [result, setResult] = useState<SaveResult | null>(null);
  const [bulkResults, setBulkResults] = useState<BulkResult[]>([]);
  const [saving, setSaving] = useState(false);
  const bulkUrls = urlsFromLines(bulkValue);

  const close = () => {
    setResult(null);
    setBulkResults([]);
    setMode("single");
    onClose();
  };

  const requestSave = async (sourceUrl: string): Promise<SaveResult> => {
    const response = await fetch("/api/images", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: sourceUrl }),
    });
    return await response.json().catch(() => ({ error: "Unable to save the image." })) as SaveResult;
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mode === "bulk") {
      if (!bulkUrls.length) return;
      setSaving(true);
      setBulkResults([]);
      let created = false;
      try {
        for (const sourceUrl of bulkUrls) {
          try {
            const body = await requestSave(sourceUrl);
            if ("kind" in body) {
              created ||= body.kind === "created";
              setBulkResults((current) => [...current, {
                url: sourceUrl,
                kind: body.kind,
                message: body.kind === "created" ? "Added" : "Already saved",
              }]);
            } else {
              setBulkResults((current) => [...current, { url: sourceUrl, kind: "error", message: body.error }]);
            }
          } catch {
            setBulkResults((current) => [...current, { url: sourceUrl, kind: "error", message: "Unable to save the image." }]);
          }
        }
        if (created) await onSaved();
      } finally {
        setSaving(false);
      }
      return;
    }

    setSaving(true);
    setResult(null);
    try {
      const body = await requestSave(url);
      setResult(body);
      if ("kind" in body) await onSaved();
    } catch {
      setResult({ error: "Unable to save the image." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet onClose={close} open={open} title="Add image URL">
      <form className="space-y-5" onSubmit={save}>
        <div aria-label="Add URL mode" className="flex border border-slate-300" role="group">
          <button aria-pressed={mode === "single"} className={`min-h-11 flex-1 text-sm font-medium ${mode === "single" ? "bg-slate-900 text-white" : "bg-white text-slate-700"}`} onClick={() => setMode("single")} type="button">Single URL</button>
          <button aria-pressed={mode === "bulk"} className={`min-h-11 flex-1 text-sm font-medium ${mode === "bulk" ? "bg-slate-900 text-white" : "bg-white text-slate-700"}`} onClick={() => setMode("bulk")} type="button">Bulk add URLs</button>
        </div>
        {mode === "single" ? <>
          <label className="block space-y-2 text-sm font-medium text-slate-800">
            Image URL
            <input autoFocus className="h-11 w-full border border-slate-300 px-3 text-sm font-normal outline-none focus:border-emerald-600" onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com/image.jpg" required type="url" value={url} />
          </label>
          <button className="min-h-11 w-full bg-emerald-700 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400" disabled={saving} type="submit">{saving ? "Saving" : "Save image"}</button>
          {result && "kind" in result && <p aria-live="polite" className="text-sm text-slate-700">{result.kind === "created" ? "Image saved to Inbox." : "This image is already saved."}</p>}
          {result && "error" in result && <p aria-live="polite" className="text-sm text-rose-700">{result.error}</p>}
        </> : <>
          <label className="block space-y-2 text-sm font-medium text-slate-800">
            Image URLs
            <textarea aria-label="Image URLs" autoFocus className="min-h-40 w-full resize-y border border-slate-300 px-3 py-2 text-sm font-normal outline-none focus:border-emerald-600" onChange={(event) => setBulkValue(event.target.value)} placeholder={"https://example.com/one.jpg\nhttps://example.com/two.jpg"} value={bulkValue} />
          </label>
          <button className="min-h-11 w-full bg-emerald-700 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400" disabled={saving || !bulkUrls.length} type="submit">{saving ? "Adding URLs" : `Add ${bulkUrls.length} URL${bulkUrls.length === 1 ? "" : "s"}`}</button>
          {bulkResults.length > 0 && <ul aria-live="polite" className="space-y-2 text-sm">
            {bulkResults.map((item, index) => <li className={item.kind === "error" ? "text-rose-700" : "text-slate-700"} key={`${item.url}-${index}`}>{item.message}: {item.url}</li>)}
          </ul>}
        </>}
      </form>
      <BookmarkletInstall />
    </Sheet>
  );
}
