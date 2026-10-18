import { LoadingRegion, TablePageSkeleton } from "@/components/skeletons/LoadingSkeletons";

export default function ReservasNegocioLoading() {
  return (
    <LoadingRegion label="Cargando reservas del negocio">
      <TablePageSkeleton rows={5} columns={5} />
    </LoadingRegion>
  );
}
