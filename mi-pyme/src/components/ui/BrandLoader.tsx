import Image from "next/image";
import { Skeleton } from "@/components/ui/Skeleton";

interface BrandLoaderProps {
  message?: string;
  fullscreen?: boolean;
}

export function BrandLoader({
  message = "Cargando Mi-Pyme...",
  fullscreen = false,
}: BrandLoaderProps) {
  return (
    <div
      className={`flex items-center justify-center bg-background ${
        fullscreen ? "min-h-screen" : "min-h-[24rem]"
      }`}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={message}
    >
      <div className="flex w-full max-w-5xl flex-col items-center gap-8 px-4 py-10">
        <div>
          <Image
            src="/images/logos/logo-horizontal.png"
            alt="Mi-Pyme"
            width={180}
            height={52}
            priority
            className="h-12 w-auto object-contain"
          />
        </div>
        <p className="text-sm font-medium text-muted-foreground">{message}</p>
        <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="space-y-3 rounded-xl border border-border bg-surface p-4">
              <Skeleton variant="rect" className="aspect-[4/3] h-auto w-full" />
              <Skeleton variant="text" className="h-5 w-3/4" />
              <Skeleton variant="text" className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
