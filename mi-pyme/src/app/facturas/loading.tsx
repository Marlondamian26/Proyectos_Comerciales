import { LoadingRegion, TablePageSkeleton } from "@/components/skeletons/LoadingSkeletons";

export default function FacturasLoading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <LoadingRegion label="Cargando facturas">
        <TablePageSkeleton rows={5} columns={4} />
      </LoadingRegion>
    </main>
  );
}
