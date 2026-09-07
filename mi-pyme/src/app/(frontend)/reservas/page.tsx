import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth.config";
import { listarReservas, cancelarReserva } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function ReservasPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return (
      <main className="max-w-4xl mx-auto py-12 px-6">
        <h1 className="text-3xl font-bold mb-8">Mis Reservas</h1>
        <p className="text-sm text-gray-500">
          Debes iniciar sesión para ver tus reservas.
        </p>
      </main>
    );
  }

  const reservas = await listarReservas(session.user.id);

  return (
    <main className="max-w-4xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold mb-8">Mis Reservas</h1>

      {reservas.length === 0 ? (
        <p className="text-sm text-gray-500">No tienes reservas activas.</p>
      ) : (
        <ul className="space-y-4">
          {reservas.map((reserva) => {
            const formatoEstado = (estado: string) => {
              const map: Record<string, string> = {
                pendiente: "Pendiente",
                confirmada: "Confirmada",
                expirada: "Expirada",
                cancelada: "Cancelada",
              };
              return map[estado] ?? estado;
            };

            const formatoFecha = (fecha: Date) => {
              return new Date(fecha).toLocaleString("es-ES", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              });
            };

            return (
              <li
                key={reserva.id}
                className="border rounded p-4 flex justify-between items-center"
              >
                <div>
                  <h3 className="font-bold text-lg">
                    {reserva.servicio.nombre}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {reserva.negocio.nombre}
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    Inicio: {formatoFecha(reserva.fechaHoraInicio)}
                  </p>
                  <p className="text-sm text-gray-700">
                    Fin: {formatoFecha(reserva.fechaHoraFin)}
                  </p>
                  <span
                    className={`inline-block text-xs px-2 py-1 rounded mt-2 ${
                      reserva.estado === "confirmada"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {formatoEstado(reserva.estado)}
                  </span>
                </div>
                {reserva.estado !== "cancelada" && (
                  <form action={async () => {
                    "use server";
                    await cancelarReserva(reserva.id, session.user.id);
                  }}>
                    <button
                      type="submit"
                      className="text-sm text-red-600 hover:text-red-800 font-medium"
                    >
                      Cancelar reserva
                    </button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
