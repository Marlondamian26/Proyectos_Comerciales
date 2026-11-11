# Administración de usuarios

Las rutas `/admin/usuarios` y `/admin/usuarios/nuevo`, disponibles solo para
`ADMIN`, permiten revisar cuentas y crear usuarios con cualquiera de los roles
`CLIENTE`, `NEGOCIO`, `LOGISTICA` y `ADMIN`. La tabla admite filtros por rol,
estado y fecha de registro; también permite cambiar roles existentes, emitir
una contraseña temporal, activar/desactivar y dar de baja lógicamente una
cuenta.

Las cuentas `NEGOCIO` y `LOGISTICA` se crean con su perfil operativo dentro de
la misma transacción que crea la cuenta. Los perfiles logísticos requieren
nombre, contacto y zona cuando la cobertura no es nacional. Las cuentas
`ADMIN` exigen confirmación explícita. Todas las contraseñas pasan por la
política central (`validarPassword`) y bcrypt, y se solicita por defecto el
cambio de contraseña en el siguiente inicio de sesión.

## API

| Método | Ruta | Uso |
| --- | --- | --- |
| `GET` | `/api/admin/usuarios?rol=&estado=&desde=&hasta=` | Listar y filtrar usuarios |
| `POST` | `/api/admin/usuarios` | Crear usuario y perfil operativo |
| `PATCH` | `/api/admin/usuarios/:id/rol` | Cambiar rol con `{ "nuevoRol": "..." }` |
| `POST` | `/api/admin/usuarios/:id/reset-password` | Restablecer y devolver contraseña temporal |
| `PATCH` | `/api/admin/usuarios/:id/estado` | Activar/desactivar con `{ "activo": true }` |
| `DELETE` | `/api/admin/usuarios/:id` | Baja lógica con `{ "motivo": "..." }` |

Los handlers llaman acciones de servidor que vuelven a validar el rol
administrativo. Los cambios de rol, contraseña, estado y baja lógica
incrementan `sessionVersion` para invalidar sesiones existentes y registran
auditoría. No se permite eliminar, cambiar el estado ni modificar el rol de la
cuenta administrativa genérica ni retirar al último administrador activo.
