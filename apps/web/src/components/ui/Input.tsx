import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, id, ...props }, ref) => {
    return (
      <div className="mb-4">
        {label && (
          <label
            htmlFor={id}
            className="mb-2 block text-xs font-semibold text-fg"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "min-h-11 w-full rounded-xl border border-line-dim bg-ink px-3.5 py-3 font-body text-sm text-paper transition",
            "placeholder:text-muted focus:outline-none focus:border-cinnabar focus:ring-4 focus:ring-cinnabar/10",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = "Input";
