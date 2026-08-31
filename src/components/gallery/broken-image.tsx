import { RotateCw, TriangleAlert } from "lucide-react";

type BrokenImageProps = {
  onRetry: () => void;
};

export function BrokenImage({ onRetry }: BrokenImageProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-100 p-4 text-center text-slate-600">
      <TriangleAlert aria-hidden="true" size={20} />
      <span className="text-xs font-medium">Image unavailable</span>
      <button className="inline-flex min-h-9 items-center gap-1 border border-slate-400 bg-white px-3 text-xs font-medium text-slate-800" onClick={onRetry} type="button">
        <RotateCw size={14} />
        Retry
      </button>
    </div>
  );
}
