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

export function AddUrlDialog({ open, onClose, onSaved }: AddUrlDialogProps) {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<SaveResult | null>(null);
  const [saving, setSaving] = useState(false);

  const close = () => {
    setResult(null);
    onClose();
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setResult(null);
    try {
      const response = await fetch("/api/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const body = await response.json() as SaveResult;
      setResult(body);
      if (response.ok && "kind" in body) await onSaved();
    } catch {
      setResult({ error: "Unable to save the image." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet onClose={close} open={open} title="Add image URL">
      <form className="space-y-5" onSubmit={save}>
        <label className="block space-y-2 text-sm font-medium text-slate-800">
          Image URL
          <input autoFocus className="h-11 w-full border border-slate-300 px-3 text-sm font-normal outline-none focus:border-emerald-600" onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com/image.jpg" required type="url" value={url} />
        </label>
        <button className="min-h-11 w-full bg-emerald-700 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400" disabled={saving} type="submit">{saving ? "Saving" : "Save image"}</button>
        {result && "kind" in result && <p aria-live="polite" className="text-sm text-slate-700">{result.kind === "created" ? "Image saved to Inbox." : "This image is already saved."}</p>}
        {result && "error" in result && <p aria-live="polite" className="text-sm text-rose-700">{result.error}</p>}
      </form>
      <BookmarkletInstall />
    </Sheet>
  );
}
