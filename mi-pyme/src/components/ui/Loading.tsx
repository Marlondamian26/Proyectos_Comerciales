import { cn } from "@/lib/utils";

export interface LoadingProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  variant?: "spinner" | "dots" | "pulse";
}

export function Loading({ size = "md", className, variant = "spinner" }: LoadingProps) {
  const sizeClasses = {
    sm: "h-5 w-5",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  if (variant === "dots") {
    return (
      <div className={cn("flex items-center justify-center gap-1", className)} aria-live="polite" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              "rounded-full bg-primary animate-bounce",
              size === "sm" ? "h-1.5 w-1.5" : size === "lg" ? "h-3 w-3" : "h-2 w-2"
            )}
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    );
  }

  if (variant === "pulse") {
    return (
      <div className={cn("flex items-center justify-center", className)} aria-live="polite" aria-busy="true">
        <div
          className={cn("rounded-full bg-primary/80 animate-ping", sizeClasses[size])}
          aria-hidden="true"
        />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-center", className)} aria-live="polite" aria-busy="true">
      <svg
        className={cn("animate-spin text-primary", sizeClasses[size])}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
}

Loading.displayName = "Loading";

export function LoadingOverlay({ message = "Cargando..." }: { message?: string }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-4 bg-surface p-8 rounded-2xl border shadow-2xl">
        <Loading size="lg" />
        <p className="text-sm text-muted-foreground font-medium">{message}</p>
      </div>
    </div>
  );
}

LoadingOverlay.displayName = "LoadingOverlay";

export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-muted",
        className
      )}
      aria-hidden="true"
    />
  );
}

LoadingSkeleton.displayName = "LoadingSkeleton";

export function LoadingCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl border bg-surface overflow-hidden", className)}>
      <LoadingSkeleton className="aspect-video w-full" />
      <div className="p-5 space-y-3">
        <LoadingSkeleton className="h-5 w-3/4" />
        <LoadingSkeleton className="h-4 w-1/2" />
        <LoadingSkeleton className="h-4 w-1/3" />
      </div>
    </div>
  );
}

LoadingCard.displayName = "LoadingCard";

export function LoadingTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border bg-surface">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-muted/50">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} scope="col" className="text-left font-medium py-3.5 px-4">
                <LoadingSkeleton className="h-4 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <tr key={rowIdx} className="border-b">
              {Array.from({ length: cols }).map((_, colIdx) => (
                <td key={colIdx} className="py-3.5 px-4">
                  <LoadingSkeleton className="h-4 w-24" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

LoadingTable.displayName = "LoadingTable";
