import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import type { ButtonHTMLAttributes, DetailedHTMLProps } from "react";

const buttonStyles = cva(
  "inline-flex items-center justify-center rounded-lg border border-transparent px-4 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
  {
    variants: {
      variant: {
        primary: "bg-brand-light text-white hover:bg-brand-dark focus-visible:outline-brand-light",
        secondary: "bg-slate-800 text-slate-100 hover:bg-slate-700 focus-visible:outline-slate-300",
        ghost: "text-slate-200 hover:bg-slate-800/60 focus-visible:outline-slate-500",
      },
      size: {
        sm: "px-3 py-1 text-xs",
        md: "px-4 py-2 text-sm",
        lg: "px-5 py-3 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export type ButtonProps = DetailedHTMLProps<
  ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
> &
  VariantProps<typeof buttonStyles>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={clsx(buttonStyles({ variant, size }), className)} {...props} />;
}
