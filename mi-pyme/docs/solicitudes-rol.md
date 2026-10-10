# Solicitudes de cambio de rol

El flujo permite que una cuenta `CLIENTE` solicite pasar a `NEGOCIO` o
`LOGISTICA`. El rol no cambia al enviar el formulario: un administrador debe
aprobar explícitamente la solicitud. Las solicitudes anteriores de alta de
negocio se conservan en el mismo modelo `SolicitudAltaNegocio` y se normalizan
mediante la migración SQL incluida en `prisma/migrations`.

## Recorrido funcional

1. El usuario autenticado envía el formulario de `/solicitar-rol`. La ruta
   anterior `/negocios/solicitar` se mantiene por compatibilidad.
2. El servicio comprueba que la cuenta está activa, tiene rol `CLIENTE`, no
   dispone ya de perfil profesional y no mantiene otra solicitud pendiente.
3. Una solicitud `NEGOCIO` exige un área y al aprobarse crea el negocio y sus
   horarios predeterminados. Una solicitud `LOGISTICA` requiere tipos de envío
   y crea el perfil de proveedor logístico al aprobarse.
4. El usuario consulta las solicitudes y sus motivos en
   `/solicitar-rol/estado` o en la ruta heredada `/mis-solicitudes`.
5. El administrador filtra y resuelve solicitudes en
   `/admin/solicitudes-rol` (alias compatible: `/admin/solicitudes`).

Los estados de dominio son `PENDIENTE_APROBACION`, `APROBADA`, `RECHAZADA`,
`CANCELADA` y `SUSPENDIDA`. Los cambios de estado, el rol del usuario,
`sessionVersion` y el registro de auditoría se actualizan en las operaciones
transaccionales correspondientes. El motivo de rechazo debe tener al menos
20 caracteres.

## Endpoints

| Método | Ruta | Uso |
| --- | --- | --- |
| `POST` | `/api/solicitudes-rol` | Crear solicitud propia |
| `GET` | `/api/solicitudes-rol/mis-solicitudes` | Consultar solicitudes propias |
| `DELETE` | `/api/solicitudes-rol/:id` | Cancelar solicitud pendiente propia |
| `GET` | `/api/admin/solicitudes-rol?tipo=&estado=` | Filtrar solicitudes como ADMIN |
| `POST` | `/api/admin/solicitudes-rol/:id/aprobar` | Aprobar como ADMIN |
| `POST` | `/api/admin/solicitudes-rol/:id/rechazar` | Rechazar con `{ "motivo": "..." }` |

Los endpoints delegan en Server Actions protegidas y en
`SolicitudAltaService`; el control de autorización se aplica en cada invocación,
no solo en la interfaz.

## Persistencia

La migración `20261010120000_role_requests_and_profile_photos` añade el tipo y
los datos logísticos, convierte los estados históricos `ACTIVO`,
`RECHAZADO` y `SUSPENDIDO` y copia `tipoRol` a `tipo`. La migración fue creada
pero no aplicada a la base compartida. Antes de ejecutarla en un entorno
compartido, revisar el SQL, verificar los datos históricos y coordinar el
despliegue del esquema con la versión de aplicación compatible.
