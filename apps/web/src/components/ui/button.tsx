import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "primary" | "secondary" | "ghost" | "paper";
  size?: "sm" | "md";
  asChild?: boolean;
  href?: string;
  children: React.ReactNode;
};

export function Button({
  variant = "default",
  size = "md",
  asChild,
  href,
  className,
  children,
  ...props
}: ButtonProps) {
  const styles = cn(
    "inline-flex items-center justify-center gap-2 rounded-lg font-body font-semibold normal-case tracking-normal transition duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinnabar/70 focus-visible:ring-offset-2 focus-visible:ring-offset-ink disabled:pointer-events-none disabled:opacity-55 active:translate-y-px",
    size === "sm" ? "min-h-9 px-3.5 text-xs" : "min-h-11 px-5 text-sm",
    (variant === "default" || variant === "primary") &&
      "border border-cinnabar bg-cinnabar text-white shadow-[0_6px_18px_rgba(199,62,29,0.18)] hover:border-cinnabar-dark hover:bg-cinnabar-dark hover:shadow-[0_8px_22px_rgba(199,62,29,0.24)]",
    variant === "secondary" &&
      "border border-line-dim bg-ink-soft text-paper hover:border-line hover:bg-ink-soft/80",
    variant === "ghost" &&
      "border border-line-dim bg-transparent text-paper hover:border-line hover:bg-ink-soft/70",
    variant === "paper" &&
      "border border-paper bg-paper text-ink hover:bg-paper-dim",
    className
  );

  if (asChild && href) {
    return (
      <Link className={styles} href={href}>
        {children}
      </Link>
    );
  }

  return (
    <button className={styles} {...props}>
      {children}
    </button>
  );
}
