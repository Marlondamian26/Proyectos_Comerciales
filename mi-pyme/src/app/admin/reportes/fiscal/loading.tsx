import { LoadingRegion, TablePageSkeleton } from "@/components/skeletons/LoadingSkeletons";

export default function ReporteFiscalLoading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <LoadingRegion label="Cargando reporte fiscal">
        <TablePageSkeleton rows={6} columns={5} />
      </LoadingRegion>
    </main>
  );
}
