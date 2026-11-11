import { LoadingRegion, TablePageSkeleton } from "@/components/skeletons/LoadingSkeletons";

export default function AdminFacturasLoading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <LoadingRegion label="Cargando facturas de administración">
        <TablePageSkeleton rows={5} columns={5} />
      </LoadingRegion>
    </main>
  );
}
