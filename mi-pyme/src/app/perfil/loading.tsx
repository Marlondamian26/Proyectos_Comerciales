import { FormPageSkeleton, LoadingRegion } from "@/components/skeletons/LoadingSkeletons";

export default function PerfilLoading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <LoadingRegion label="Cargando perfil">
        <FormPageSkeleton fields={4} />
      </LoadingRegion>
    </main>
  );
}
