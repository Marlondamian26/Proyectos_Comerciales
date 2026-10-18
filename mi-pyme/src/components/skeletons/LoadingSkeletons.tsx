import { DashboardSkeleton, ProductCardSkeleton, Skeleton, TableSkeleton } from "@/components/ui/Skeleton";

export function LoadingRegion({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={className}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
    >
      <div aria-hidden="true">{children}</div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function ServiceCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border-subtle bg-surface">
      <Skeleton variant="rect" className="aspect-[4/3] h-auto w-full" />
      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <Skeleton variant="text" className="h-5 w-3/4" />
        <Skeleton variant="text" lines={2} className="gap-2" />
        <div className="mt-auto flex items-center gap-4 border-t border-border pt-3" aria-hidden="true">
          <Skeleton variant="text" className="h-4 w-20" />
          <Skeleton variant="text" className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
}

export function ServiceGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <ServiceCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function AreasGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="space-y-3 rounded-xl border border-border bg-surface p-4">
          <Skeleton variant="rect" className="aspect-square h-auto w-full" />
          <Skeleton variant="text" className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  );
}

export function TablePageSkeleton({
  rows = 6,
  columns = 5,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Skeleton variant="text" className="h-8 w-48" />
        <Skeleton variant="text" className="h-4 w-72 max-w-full" />
      </div>
      <TableSkeleton rows={rows} cols={columns} />
    </div>
  );
}

export function DashboardPageSkeleton() {
  return <DashboardSkeleton />;
}

export function FormPageSkeleton({ fields = 5 }: { fields?: number }) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div className="space-y-3">
        <Skeleton variant="text" className="h-8 w-48" />
        <Skeleton variant="text" className="h-4 w-72 max-w-full" />
      </div>
      <div className="space-y-5 rounded-xl border border-border bg-surface p-5 sm:p-6">
        {Array.from({ length: fields }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton variant="text" className="h-4 w-32" />
            <Skeleton variant="rect" className="h-11 w-full rounded-lg" />
          </div>
        ))}
        <Skeleton variant="rect" className="h-11 w-36 rounded-lg" />
      </div>
    </div>
  );
}

export function DetailPageSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <Skeleton variant="rect" className="aspect-square h-auto w-full rounded-xl" />
      <div className="space-y-5">
        <Skeleton variant="badge" />
        <Skeleton variant="text" className="h-9 w-3/4" />
        <Skeleton variant="text" lines={3} />
        <Skeleton variant="text" className="h-8 w-32" />
        <Skeleton variant="rect" className="h-12 w-full rounded-lg" />
      </div>
    </div>
  );
}

export function CheckoutPageSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="space-y-6">
        <Skeleton variant="text" className="h-8 w-48" />
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} variant="rect" className="h-20 w-full rounded-lg" />
        ))}
      </div>
      <div className="h-fit space-y-4 rounded-xl border border-border bg-surface p-6">
        <Skeleton variant="text" className="h-6 w-1/2" />
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} variant="text" className="h-4 w-full" />
        ))}
        <Skeleton variant="rect" className="h-11 w-full rounded-lg" />
      </div>
    </div>
  );
}
