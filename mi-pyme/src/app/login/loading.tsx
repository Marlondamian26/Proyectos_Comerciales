import { FormPageSkeleton, LoadingRegion } from "@/components/skeletons/LoadingSkeletons";

export default function LoginLoading() {
  return (
    <main className="container mx-auto px-4 py-10">
      <LoadingRegion label="Cargando inicio de sesión">
        <FormPageSkeleton fields={2} />
      </LoadingRegion>
    </main>
  );
}
