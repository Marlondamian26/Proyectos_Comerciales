import { LoadingRegion, TablePageSkeleton } from "@/components/skeletons/LoadingSkeletons";

export default function VentasNegocioLoading() {
  return (
    <LoadingRegion label="Cargando ventas del negocio">
      <TablePageSkeleton rows={6} columns={5} />
    </LoadingRegion>
  );
}
