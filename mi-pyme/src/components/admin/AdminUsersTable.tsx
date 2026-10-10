"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  cambiarEstadoActivoUsuarioAction,
  cambiarRolUsuarioAction,
  eliminarUsuarioAdminAction,
  resetearPasswordUsuarioAction,
} from "@/lib/actions";
import type { RolUsuarioAdmin } from "@/services/AdminUserService";

export interface AdminUserRow {
  id: string;
  email: string;
  nombre: string | null;
  username: string | null;
  rol: RolUsuarioAdmin;
  isGenericAdmin: boolean;
  mustChangePassword: boolean;
  isActive: boolean;
  deletedAt: Date | null;
  createdAt: Date;
}

const roles: RolUsuarioAdmin[] = ["CLIENTE", "NEGOCIO", "LOGISTICA", "ADMIN"];

export function AdminUsersTable({
  users,
  currentAdminId,
}: {
  users: AdminUserRow[];
  currentAdminId: string;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [temporaryPasswords, setTemporaryPasswords] = useState<
    Record<string, string>
  >({});
  const [deleteReasonId, setDeleteReasonId] = useState<string | null>(null);

  const runAction = async (userId: string, action: () => Promise<void>) => {
    setBusyId(userId);
    setMessage(null);
    try {
      await action();
      router.refresh();
    } catch (error: unknown) {
      setMessage(
        error instanceof Error ? error.message : "No se pudo completar la acción."
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      {message && (
        <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {message}
        </p>
      )}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th scope="col" className="p-3">Usuario</th>
              <th scope="col" className="p-3">Rol</th>
              <th scope="col" className="p-3">Estado</th>
              <th scope="col" className="p-3">Registro</th>
              <th scope="col" className="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => {
              const disabled =
                busyId === user.id || user.isGenericAdmin || user.id === currentAdminId;
              return (
                <tr key={user.id} className="align-top">
                  <td className="p-3">
                    <p className="font-medium">{user.nombre ?? "Sin nombre"}</p>
                    <p className="text-muted-foreground">{user.email}</p>
                    {user.username && (
                      <p className="text-xs text-muted-foreground">@{user.username}</p>
                    )}
                  </td>
                  <td className="p-3">
                    <label className="sr-only" htmlFor={`rol-${user.id}`}>
                      Rol de {user.email}
                    </label>
                    <select
                      id={`rol-${user.id}`}
                      defaultValue={user.rol}
                      disabled={disabled || Boolean(user.deletedAt)}
                      className="min-h-[44px] rounded-md border border-border bg-background px-2 py-1"
                      onChange={(event) => {
                        const nuevoRol = event.currentTarget.value as RolUsuarioAdmin;
                        if (
                          !window.confirm(
                            `¿Cambiar el rol de ${user.email} a ${nuevoRol}? Se invalidará su sesión.`
                          )
                        ) {
                          event.currentTarget.value = user.rol;
                          return;
                        }
                        void runAction(user.id, () =>
                          cambiarRolUsuarioAction(user.id, nuevoRol)
                        );
                      }}
                    >
                      {roles.map((role) => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                    {user.mustChangePassword && (
                      <p className="mt-1 text-xs text-warning">
                        Debe cambiar su contraseña
                      </p>
                    )}
                  </td>
                  <td className="p-3">
                    {user.deletedAt
                      ? "Eliminado"
                      : user.isActive
                        ? "Activo"
                        : "Inactivo"}
                  </td>
                  <td className="whitespace-nowrap p-3">
                    {new Date(user.createdAt).toLocaleDateString("es-ES")}
                  </td>
                  <td className="min-w-56 space-y-2 p-3">
                    {!user.deletedAt && (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="min-h-[44px]"
                          disabled={disabled}
                          onClick={() => {
                            if (!window.confirm(`¿Restablecer la contraseña de ${user.email}?`)) {
                              return;
                            }
                            setBusyId(user.id);
                            setMessage(null);
                            void resetearPasswordUsuarioAction(user.id)
                              .then((password) => {
                                setTemporaryPasswords((current) => ({
                                  ...current,
                                  [user.id]: password,
                                }));
                              })
                              .catch((error: unknown) => {
                                setMessage(
                                  error instanceof Error
                                    ? error.message
                                    : "No se pudo restablecer la contraseña."
                                );
                              })
                              .finally(() => setBusyId(null));
                          }}
                        >
                          Restablecer contraseña
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="min-h-[44px]"
                          disabled={disabled}
                          onClick={() =>
                            void runAction(user.id, () =>
                              cambiarEstadoActivoUsuarioAction(user.id, !user.isActive)
                            )
                          }
                        >
                          {user.isActive ? "Desactivar" : "Activar"}
                        </Button>
                        {deleteReasonId === user.id ? (
                          <form
                            className="space-y-2"
                            onSubmit={(event) => {
                              event.preventDefault();
                              const form = event.currentTarget;
                              const reason = new FormData(form).get("motivo");
                              if (typeof reason !== "string") return;
                              void runAction(user.id, async () => {
                                await eliminarUsuarioAdminAction(user.id, reason);
                                setDeleteReasonId(null);
                              });
                            }}
                          >
                            <label
                              htmlFor={`delete-reason-${user.id}`}
                              className="block text-xs font-medium"
                            >
                              Motivo (mínimo 10 caracteres)
                            </label>
                            <textarea
                              id={`delete-reason-${user.id}`}
                              name="motivo"
                              required
                              minLength={10}
                              className="w-full rounded-md border border-border bg-background p-2 text-xs"
                            />
                            <div className="flex gap-2">
                              <Button
                                type="submit"
                                size="sm"
                                variant="destructive"
                                className="min-h-[44px]"
                              >
                                Confirmar eliminación
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="min-h-[44px]"
                                onClick={() => setDeleteReasonId(null)}
                              >
                                Cancelar
                              </Button>
                            </div>
                          </form>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            className="min-h-[44px]"
                            disabled={disabled}
                            onClick={() => setDeleteReasonId(user.id)}
                          >
                            Eliminar
                          </Button>
                        )}
                      </>
                    )}
                    {temporaryPasswords[user.id] && (
                      <p
                        className="break-all rounded bg-muted p-2 text-xs"
                        role="status"
                      >
                        Contraseña temporal:{" "}
                        <code>{temporaryPasswords[user.id]}</code>
                      </p>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {users.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No hay usuarios que coincidan con los filtros.
        </p>
      )}
    </div>
  );
}
