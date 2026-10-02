import { NextResponse } from "next/server";
import { Rol } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/requireRole";
import { BusinessError } from "@/shared/types";
import { NotificacionScheduler } from "@/services/NotificacionScheduler";

function handleError(err: unknown) {
  if (err instanceof BusinessError) {
    return NextResponse.json(
      { error: err.message, code: err.code },
      { status: err.status }
    );
  }
  const message = err instanceof Error ? err.message : String(err);
  console.error("Error in scheduler API:", err);
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function POST() {
  try {
    await requireRole([Rol.ADMIN]);
    const scheduler = new NotificacionScheduler();
    const result = await scheduler.ejecutarJobs();
    return NextResponse.json(result);
  } catch (err: unknown) {
    return handleError(err);
  }
}
