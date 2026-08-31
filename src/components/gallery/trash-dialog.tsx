"use client";

type TrashDialogProps = {
  open: boolean;
  permanent?: boolean;
  count: number;
  onClose: () => void;
  onConfirm: () => void;
};

export function TrashDialog({ open, permanent = false, count, onClose, onConfirm }: TrashDialogProps) {
  if (!open) return null;
  const title = permanent ? "Permanently delete images" : "Move images to trash";
  const action = permanent ? "Delete permanently" : "Move to trash";
  return (
    <div aria-modal="true" className="fixed inset-0 z-40 flex items-end bg-slate-950/35 p-4 sm:items-center sm:justify-center" role="dialog">
      <div className="w-full max-w-sm border border-slate-200 bg-white p-5 shadow-xl">
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{count} selected image{count === 1 ? "" : "s"} will be affected.</p>
        <div className="mt-6 flex justify-end gap-2"><button className="min-h-10 border border-slate-300 px-4 text-sm font-medium text-slate-800" onClick={onClose} type="button">Cancel</button><button className="min-h-10 bg-rose-700 px-4 text-sm font-medium text-white" onClick={onConfirm} type="button">{action}</button></div>
      </div>
    </div>
  );
}
