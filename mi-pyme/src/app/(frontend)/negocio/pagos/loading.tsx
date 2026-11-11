import { LoadingRegion, TablePageSkeleton } from "@/components/skeletons/LoadingSkeletons";

export default function NegocioPagosLoading() {
  return (
    <LoadingRegion label="Cargando pagos del negocio">
      <TablePageSkeleton rows={5} columns={5} />
    </LoadingRegion>
  );
}
