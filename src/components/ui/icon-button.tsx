import type { ButtonHTMLAttributes, ReactNode } from "react";

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  children: ReactNode;
  tone?: "default" | "overlay";
  size?: "standard" | "touch";
};

export function IconButton({ label, children, className = "", size = "standard", tone = "default", ...props }: IconButtonProps) {
  const toneClasses = tone === "overlay"
    ? "border-slate-600 bg-slate-900 text-white hover:border-slate-400 hover:bg-slate-800"
    : "border-slate-300 bg-white text-slate-700 hover:border-slate-500 hover:bg-slate-50";
  const sizeClasses = size === "touch" ? "size-11" : "size-10";

  return (
    <button
      aria-label={label}
      className={`inline-flex ${sizeClasses} shrink-0 items-center justify-center border ${toneClasses} transition disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      title={label}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}
