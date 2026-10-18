import { LoadingRegion, TablePageSkeleton } from "@/components/skeletons/LoadingSkeletons";

export default function NegocioFacturasLoading() {
  return (
    <LoadingRegion label="Cargando facturas del negocio">
      <TablePageSkeleton rows={5} columns={5} />
    </LoadingRegion>
  );
}
