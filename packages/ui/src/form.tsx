import { clsx } from "clsx";
import type { HTMLAttributes, InputHTMLAttributes, LabelHTMLAttributes, ReactNode } from "react";

export function FormField({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("flex flex-col gap-2", className)} {...props} />;
}

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={clsx("text-sm font-medium text-slate-200", className)} {...props} />;
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(
        "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-brand-light focus:outline-none",
        className
      )}
      {...props}
    />
  );
}

export function HelperText({ className, children }: { className?: string; children: ReactNode }) {
  return <p className={clsx("text-xs text-slate-400", className)}>{children}</p>;
}
