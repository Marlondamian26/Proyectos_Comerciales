import { auth } from "@/lib/auth";
import { Rol } from "@/lib/auth/roles";
import type { PagoConRelacionesDTO } from "@/shared/pagos.types";
import PagoDetalleClient from "./PagoDetalleClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PagoDetallePage({ params }: Props) {
  const session = await auth();
  const rolActual = (session?.user?.rol ?? Rol.CLIENTE) as "CLIENTE" | "NEGOCIO" | "ADMIN";
  const { id } = await params;

  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/pagos/${id}`, {
    next: { tags: [`pago-${id}`] },
  });

  let pago: PagoConRelacionesDTO | null = null;
  let error: string | null = null;

  if (!res.ok) {
    error = "No se pudo cargar el pago";
  } else {
    pago = await res.json();
  }

  return <PagoDetalleClient pago={pago} error={error} rolActual={rolActual} pagoId={id} />;
}
