import { FormPageSkeleton, LoadingRegion } from "@/components/skeletons/LoadingSkeletons";

export default function AuthLoading() {
  return (
    <main className="container mx-auto px-4 py-10">
      <LoadingRegion label="Cargando autenticación">
        <FormPageSkeleton fields={3} />
      </LoadingRegion>
    </main>
  );
}
