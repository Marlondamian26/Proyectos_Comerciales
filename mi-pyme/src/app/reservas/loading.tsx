import { LoadingRegion, TablePageSkeleton } from "@/components/skeletons/LoadingSkeletons";

export default function ReservasLoading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <LoadingRegion label="Cargando reservas">
        <TablePageSkeleton rows={5} columns={5} />
      </LoadingRegion>
    </main>
  );
}
