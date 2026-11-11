import { CheckoutPageSkeleton, LoadingRegion } from "@/components/skeletons/LoadingSkeletons";

export default function CheckoutLoading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <LoadingRegion label="Cargando checkout">
        <CheckoutPageSkeleton />
      </LoadingRegion>
    </main>
  );
}
