import { cn } from "@/lib/utils";

type CardProps = {
  className?: string;
  children: React.ReactNode;
};

export function Card({ className, children }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-line-dim bg-ink-soft/90 p-5 text-paper shadow-sm transition-colors",
        className
      )}
    >
      {children}
    </div>
  );
}

export function PaperCard({ className, children }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-line-dim bg-ink-soft/90 p-6 text-paper shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}
