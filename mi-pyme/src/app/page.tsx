import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth.config";
import { Rol } from "@/lib/auth/roles";
import { listarAreas, listarSubareas, listarNegocios } from "@/lib/actions";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const rolToPath: Record<Rol, string> = {
  [Rol.CLIENTE]: "/cliente",
  [Rol.NEGOCIO]: "/negocio",
  [Rol.LOGISTICA]: "/logistica",
  [Rol.ADMIN]: "/admin",
};

export default async function Home() {
  const session = await getServerSession(authOptions);
  const userRol = session?.user?.rol;

  if (userRol && rolToPath[userRol]) {
    redirect(rolToPath[userRol]);
  }

  const [areas, subareas, negocios] = await Promise.all([
    listarAreas(),
    listarSubareas(),
    listarNegocios(),
  ]);

  return (
    <main className="max-w-4xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold mb-8">Mi-Pyme</h1>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Áreas</h2>
        {areas.length === 0 ? (
          <p className="text-sm text-gray-500">No hay áreas disponibles.</p>
        ) : (
          <ul className="space-y-2">
            {areas.map((area) => (
              <li key={area.id} className="border-b pb-1">
                <span className="font-medium">{area.nombre}</span>
                {area.slug && (
                  <span className="text-xs text-gray-500 ml-2">/{area.slug}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Subáreas</h2>
        {subareas.length === 0 ? (
          <p className="text-sm text-gray-500">No hay subáreas disponibles.</p>
        ) : (
          <ul className="space-y-2">
            {subareas.map((subarea) => (
              <li key={subarea.id} className="border-b pb-1">
                <span className="font-medium">{subarea.nombre}</span>
                {subarea.slug && (
                  <span className="text-xs text-gray-500 ml-2">/{subarea.slug}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Negocios</h2>
        {negocios.length === 0 ? (
          <p className="text-sm text-gray-500">No hay negocios disponibles.</p>
        ) : (
          <ul className="space-y-4">
            {negocios.map((negocio) => (
              <li key={negocio.id} className="border rounded p-4">
                <h3 className="font-bold text-lg">{negocio.nombre}</h3>
                {negocio.descripcion && (
                  <p className="text-sm text-gray-600 mt-1">
                    {negocio.descripcion}
                  </p>
                )}
                {negocio.area && (
                  <p className="text-xs text-gray-500 mt-2">
                    Área: {negocio.area.nombre}
                  </p>
                )}
                {negocio.subareas.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {negocio.subareas.map((ns) => (
                      <span
                        key={ns.subarea.id}
                        className="text-xs bg-gray-100 px-2 py-1 rounded"
                      >
                        {ns.subarea.nombre}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="flex gap-4">
          <a
            href="/login"
            className="inline-block text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Iniciar sesión →
          </a>
          <a
            href="/catalogo"
            className="inline-block text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Ver catálogo completo →
          </a>
          <a
            href="/carrito"
            className="inline-block text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Mi carrito →
          </a>
          <a
            href="/reservas"
            className="inline-block text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Mis reservas →
          </a>
        </div>
      </section>
    </main>
  );
}
