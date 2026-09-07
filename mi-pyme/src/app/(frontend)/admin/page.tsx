import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth.config";
import {
  listarAreas,
  listarSubareas,
  listarNegocios,
  listarUsuarios,
  reporteVentasGlobal,
} from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await getServerSession(authOptions);
  const userRol = session?.user?.rol;

  const [areas, subareas, negocios, usuarios, ventas] = await Promise.all([
    listarAreas(),
    listarSubareas(),
    listarNegocios(),
    listarUsuarios(),
    reporteVentasGlobal(),
  ]);

  return (
    <main className="max-w-5xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold mb-2">Panel de Administrador</h1>
      <p className="text-sm text-gray-500 mb-8">
        Rol: <span className="font-medium">{userRol ?? "ADMIN"}</span>
      </p>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Áreas</h2>
        {areas.length === 0 ? (
          <p className="text-sm text-gray-500">No hay áreas.</p>
        ) : (
          <ul className="space-y-2">
            {areas.map((area) => (
              <li key={area.id} className="border-b pb-1 flex justify-between">
                <div>
                  <span className="font-medium">{area.nombre}</span>
                  <span className="text-xs text-gray-400 ml-2">
                    /{area.slug}
                  </span>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    area.activo
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {area.activo ? "Activo" : "Inactivo"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Subáreas</h2>
        {subareas.length === 0 ? (
          <p className="text-sm text-gray-500">No hay subáreas.</p>
        ) : (
          <ul className="space-y-2">
            {subareas.map((subarea) => (
              <li key={subarea.id} className="border-b pb-1 flex justify-between">
                <div>
                  <span className="font-medium">{subarea.nombre}</span>
                  <span className="text-xs text-gray-400 ml-2">
                    /{subarea.slug}
                  </span>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    subarea.activo
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {subarea.activo ? "Activo" : "Inactivo"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Negocios</h2>
        {negocios.length === 0 ? (
          <p className="text-sm text-gray-500">No hay negocios.</p>
        ) : (
          <ul className="space-y-2">
            {negocios.map((negocio) => (
              <li key={negocio.id} className="border-b pb-1">
                <span className="font-medium">{negocio.nombre}</span>
                <span className="text-xs text-gray-400 ml-2">
                  /{negocio.slug}
                </span>
                {negocio.area && (
                  <span className="text-xs text-gray-400 ml-2">
                    Área: {negocio.area.nombre}
                  </span>
                )}
                <span
                  className={`ml-2 text-xs px-2 py-1 rounded ${
                    negocio.activo
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {negocio.activo ? "Activo" : "Inactivo"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Usuarios</h2>
        {usuarios.length === 0 ? (
          <p className="text-sm text-gray-500">No hay usuarios.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left pb-2">Email</th>
                <th className="text-left pb-2">Nombre</th>
                <th className="text-left pb-2">Rol</th>
                <th className="text-left pb-2">Creado</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-b">
                  <td>{u.email}</td>
                  <td>{u.nombre ?? "-"}</td>
                  <td>{u.rol}</td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">
          Reporte Global de Ventas
        </h2>
        {ventas.length === 0 ? (
          <p className="text-sm text-gray-500">Sin ventas registradas.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left pb-2">Fecha</th>
                <th className="text-right pb-2">Total Ventas</th>
                <th className="text-right pb-2">Cantidad</th>
              </tr>
            </thead>
            <tbody>
              {ventas.slice(0, 15).map((v) => (
                <tr key={v.fecha} className="border-b">
                  <td>{v.fecha}</td>
                  <td className="text-right">${v.totalVentas.toFixed(2)}</td>
                  <td className="text-right">{v.cantidad}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
