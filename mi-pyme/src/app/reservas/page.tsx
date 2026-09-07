"use client";

import { useState, useEffect } from "react";

type Servicio = {
  id: string;
  nombre: string;
  descripcion?: string;
  duracionMinutos: number;
  capacidad: number;
  negocio: { nombre: string };
};

type Reserva = {
  id: string;
  estado: string;
  fechaHoraInicio: string;
  fechaHoraFin: string;
  servicio: Servicio;
  negocio: { nombre: string };
};

export default function ReservasPage({
  searchParams,
}: {
  searchParams: Promise<{ servicioId?: string }>;
}) {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [selectedServicioId, setSelectedServicioId] = useState<string>("");
  const [fechaHora, setFechaHora] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const params = await searchParams;
      if (params.servicioId) {
        setSelectedServicioId(params.servicioId);
      }

      const [sRes, rRes] = await Promise.all([
        fetch("/api/servicios?activo=true"),
        fetch("/api/reservas"),
      ]);

      if (sRes.ok) setServicios(await sRes.json());
      if (rRes.ok) setReservas(await rRes.json());
      setLoading(false);
    })();
  }, [searchParams]);

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError(null);

    const res = await fetch("/api/reservas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        servicioId: selectedServicioId,
        fechaHoraInicio: fechaHora,
      }),
    });

    if (res.ok) {
      const nueva = await res.json();
      setReservas([nueva, ...reservas]);
      setFechaHora("");
      setSelectedServicioId("");
    } else {
      const data = await res.json();
      setError(data.error || "Error al crear la reserva");
    }
    setSubmitLoading(false);
  };

  const handleCancelar = async (reservaId: string) => {
    const res = await fetch(`/api/reservas/${reservaId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setReservas(reservas.filter((r) => r.id !== reservaId));
    }
  };

  if (loading) return <p className="p-6">Cargando...</p>;

  return (
    <main className="max-w-4xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold mb-8">Mis Reservas</h1>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Nueva Reserva</h2>
        <form onSubmit={handleCrear} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Servicio</label>
            <select
              value={selectedServicioId}
              onChange={(e) => setSelectedServicioId(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            >
              <option value="">Seleccionar servicio</option>
              {servicios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre} ({s.negocio.nombre})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Fecha y hora
            </label>
            <input
              type="datetime-local"
              value={fechaHora}
              onChange={(e) => setFechaHora(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitLoading}
            className="bg-blue-600 text-white rounded px-4 py-2 text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {submitLoading ? "Creando..." : "Crear Reserva"}
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Reservas existentes</h2>
        {reservas.length === 0 ? (
          <p className="text-sm text-gray-500">No tienes reservas.</p>
        ) : (
          <ul className="space-y-3">
            {reservas.map((r) => (
              <li
                key={r.id}
                className="border rounded p-4 flex justify-between items-center"
              >
                <div>
                  <span className="font-medium">{r.servicio.nombre}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    {new Date(r.fechaHoraInicio).toLocaleString()} -{" "}
                    {new Date(r.fechaHoraFin).toLocaleString()}
                  </span>
                  <span
                    className={`ml-2 text-xs px-2 py-1 rounded ${
                      r.estado === "confirmada"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {r.estado}
                  </span>
                </div>
                {r.estado !== "cancelada" && (
                  <button
                    onClick={() => handleCancelar(r.id)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Cancelar
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
