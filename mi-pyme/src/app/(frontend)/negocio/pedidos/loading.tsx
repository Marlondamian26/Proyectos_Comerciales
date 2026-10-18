import { LoadingRegion, TablePageSkeleton } from "@/components/skeletons/LoadingSkeletons";

export default function PedidosNegocioLoading() {
  return (
    <LoadingRegion label="Cargando pedidos del negocio">
      <TablePageSkeleton rows={6} columns={6} />
    </LoadingRegion>
  );
}
