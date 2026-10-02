"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Calendar, MapPin, Package } from "lucide-react";

export function TransporteForm({
  servicioId,
  disponible,
}: {
  servicioId: string;
  disponible: boolean;
}) {
  const router = useRouter();
  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");
  const [fecha, setFecha] = useState("");
  const [peso, setPeso] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disponible) return;
    setSubmitting(true);
    try {
      const metadata: Record<string, unknown> = { origen, destino, fecha };
      if (peso) metadata.peso = Number(peso);
      const res = await fetch("/api/carrito", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ servicioId, metadata }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push("/carrito");
      } else {
        alert(data.error ?? "Error al agregar al carrito");
      }
    } catch {
      alert("Error al agregar al carrito");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          Origen
        </label>
        <input
          type="text"
          value={origen}
          onChange={(e) => setOrigen(e.target.value)}
          placeholder="Ej: Pinar del Río"
          className="w-full px-3 py-2 rounded-md border bg-background"
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          Destino
        </label>
        <input
          type="text"
          value={destino}
          onChange={(e) => setDestino(e.target.value)}
          placeholder="Ej: La Habana"
          className="w-full px-3 py-2 rounded-md border bg-background"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            Peso (kg)
          </label>
          <input
            type="number"
            value={peso}
            onChange={(e) => setPeso(e.target.value)}
            placeholder="Opcional"
            min="0"
            step="0.1"
            className="w-full px-3 py-2 rounded-md border bg-background"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            Fecha
          </label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="w-full px-3 py-2 rounded-md border bg-background"
            required
            min={new Date().toISOString().split("T")[0]}
          />
        </div>
      </div>
      <Button
        type="submit"
        variant={disponible ? "primary" : "outline"}
        size="lg"
        className="w-full"
        loading={submitting}
        disabled={!disponible || submitting}
      >
        {disponible ? "Contratar transporte" : "Sin cupos disponibles hoy"}
      </Button>
    </form>
  );
}
