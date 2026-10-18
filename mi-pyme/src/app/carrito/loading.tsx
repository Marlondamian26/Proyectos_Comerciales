import {
  CheckoutPageSkeleton,
  LoadingRegion,
} from "@/components/skeletons/LoadingSkeletons";

export default function CarritoLoading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <LoadingRegion label="Cargando carrito">
        <CheckoutPageSkeleton />
      </LoadingRegion>
    </main>
  );
}
