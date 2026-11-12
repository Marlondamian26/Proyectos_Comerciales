"use server";

import { auth } from "@/lib/auth";
import { agregarAlCarrito } from "@/lib/actions";
import { getDashboardPath } from "@/lib/auth/dashboard-paths";
import { Rol } from "@/lib/auth/roles";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function catalogoAddToCart(formData: FormData) {
  const productoId = formData.get("productoId") as string;
  const fechaEntrega = formData.get("fechaEntrega") as string | null;
  const session = await auth();
  if (!session?.user?.id) {
    const params = new URLSearchParams({
      callbackUrl: "/catalogo",
      intent: JSON.stringify({ action: "carrito", productoId }),
    });
    redirect(`/auth/registro?${params.toString()}`);
    return;
  }
  await agregarAlCarrito(session.user.id, {
    productoId,
    cantidad: 1,
    fechaEntrega: fechaEntrega ?? undefined,
  });
  revalidatePath("/catalogo");
  revalidatePath("/carrito");
}

export async function catalogoReserve(formData: FormData) {
  const servicioId = formData.get("servicioId") as string;
  const session = await auth();
  if (!session?.user?.id) {
    const params = new URLSearchParams({
      callbackUrl: "/servicios",
      intent: JSON.stringify({ action: "reserva", servicioId }),
    });
    redirect(`/auth/registro?${params.toString()}`);
    return;
  }
  if (session.user.rol !== Rol.CLIENTE) {
    redirect(
      session.user.rol
        ? getDashboardPath(session.user.rol)
        : "/auth/login"
    );
  }
  redirect(`/reservas?servicioId=${servicioId}`);
}
