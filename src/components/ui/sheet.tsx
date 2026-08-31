"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { IconButton } from "./icon-button";

type SheetProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

export function Sheet({ open, title, onClose, children }: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end" role="presentation">
      <button aria-label="Close filters" className="absolute inset-0 bg-slate-950/30" onClick={onClose} type="button" />
      <aside aria-label={title} aria-modal="true" className="relative flex h-full w-full max-w-sm flex-col bg-white shadow-2xl" role="dialog">
        <header className="flex min-h-14 items-center justify-between border-b border-slate-200 px-4">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <IconButton label="Close filters" onClick={onClose}><X size={18} /></IconButton>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
      </aside>
    </div>
  );
}
