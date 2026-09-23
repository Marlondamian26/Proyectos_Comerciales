-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Factura" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pedidoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "negocioId" TEXT,
    "numero" TEXT NOT NULL,
    "nitEmisor" TEXT,
    "nitReceptor" TEXT,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" TEXT NOT NULL DEFAULT 'emitida',
    "subtotal" DECIMAL NOT NULL,
    "impuestos" DECIMAL NOT NULL DEFAULT 0,
    "total" DECIMAL NOT NULL,
    "baseImponible" DECIMAL,
    "montoIVA" DECIMAL,
    "desgloseIVA" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Factura_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Factura_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Factura_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Factura" ("createdAt", "estado", "fecha", "id", "impuestos", "negocioId", "numero", "pedidoId", "subtotal", "total", "updatedAt", "usuarioId") SELECT "createdAt", "estado", "fecha", "id", "impuestos", "negocioId", "numero", "pedidoId", "subtotal", "total", "updatedAt", "usuarioId" FROM "Factura";
DROP TABLE "Factura";
ALTER TABLE "new_Factura" RENAME TO "Factura";
CREATE UNIQUE INDEX "Factura_pedidoId_key" ON "Factura"("pedidoId");
CREATE UNIQUE INDEX "Factura_numero_key" ON "Factura"("numero");
CREATE TABLE "new_FacturaItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "facturaId" TEXT NOT NULL,
    "productoId" TEXT,
    "servicioId" TEXT,
    "cantidad" INTEGER NOT NULL,
    "precioUnitario" DECIMAL NOT NULL,
    "precioUnitarioBase" DECIMAL NOT NULL DEFAULT 0,
    "precioUnitarioConIVA" DECIMAL NOT NULL DEFAULT 0,
    "tasaIVA" DECIMAL NOT NULL DEFAULT 0,
    "tratamientoIVA" TEXT NOT NULL DEFAULT 'GRAVADO',
    "baseImponible" DECIMAL NOT NULL DEFAULT 0,
    "montoIVA" DECIMAL NOT NULL DEFAULT 0,
    "subtotal" DECIMAL NOT NULL,
    CONSTRAINT "FacturaItem_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FacturaItem_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FacturaItem_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "Factura" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_FacturaItem" ("cantidad", "facturaId", "id", "precioUnitario", "productoId", "servicioId", "subtotal") SELECT "cantidad", "facturaId", "id", "precioUnitario", "productoId", "servicioId", "subtotal" FROM "FacturaItem";
DROP TABLE "FacturaItem";
ALTER TABLE "new_FacturaItem" RENAME TO "FacturaItem";
CREATE TABLE "new_Negocio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "slug" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE_APROBACION',
    "motivoRechazo" TEXT,
    "aprobadoPorId" TEXT,
    "aprobadoEn" DATETIME,
    "areaId" TEXT,
    "userId" TEXT,
    "provincia" TEXT,
    "municipio" TEXT,
    "telefono" TEXT,
    "emailContacto" TEXT,
    "direccion" TEXT,
    "permiteReservas" BOOLEAN NOT NULL DEFAULT true,
    "permiteEnvio" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "regimenFiscal" TEXT NOT NULL DEFAULT 'GENERAL',
    "tasaIVA" DECIMAL NOT NULL DEFAULT 10.00,
    "modoPrecio" TEXT NOT NULL DEFAULT 'IVA_INCLUIDO',
    "nit" TEXT,
    "direccionFiscal" TEXT,
    "telefonoFiscal" TEXT,
    "emailFiscal" TEXT,
    "numeroFacturaConsecutivo" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Negocio_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Negocio_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Negocio_aprobadoPorId_fkey" FOREIGN KEY ("aprobadoPorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Negocio" ("activo", "aprobadoEn", "aprobadoPorId", "areaId", "createdAt", "descripcion", "direccion", "emailContacto", "estado", "id", "motivoRechazo", "municipio", "nombre", "permiteEnvio", "permiteReservas", "provincia", "slug", "telefono", "updatedAt", "userId") SELECT "activo", "aprobadoEn", "aprobadoPorId", "areaId", "createdAt", "descripcion", "direccion", "emailContacto", "estado", "id", "motivoRechazo", "municipio", "nombre", "permiteEnvio", "permiteReservas", "provincia", "slug", "telefono", "updatedAt", "userId" FROM "Negocio";
DROP TABLE "Negocio";
ALTER TABLE "new_Negocio" RENAME TO "Negocio";
CREATE UNIQUE INDEX "Negocio_slug_key" ON "Negocio"("slug");
CREATE INDEX "Negocio_estado_idx" ON "Negocio"("estado");
CREATE INDEX "Negocio_regimenFiscal_idx" ON "Negocio"("regimenFiscal");
CREATE TABLE "new_Pedido" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "total" DECIMAL NOT NULL,
    "baseImponibleTotal" DECIMAL NOT NULL DEFAULT 0,
    "montoIVATotal" DECIMAL NOT NULL DEFAULT 0,
    "totalConIVA" DECIMAL NOT NULL DEFAULT 0,
    "modoPrecio" TEXT NOT NULL DEFAULT 'IVA_INCLUIDO',
    "regimenFiscalNegocio" TEXT NOT NULL DEFAULT 'GENERAL',
    "tasaIVANegocio" DECIMAL NOT NULL DEFAULT 10.00,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "tipo" TEXT NOT NULL,
    "tipoEntrega" TEXT NOT NULL DEFAULT 'DOMICILIO',
    "negocioIds" JSONB NOT NULL,
    "opcionLogisticaId" TEXT,
    "costoEnvio" DECIMAL NOT NULL DEFAULT 0,
    "direccionEntrega" TEXT,
    "fechaEntrega" DATETIME,
    "notas" TEXT,
    "fechaCreacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "estadoPago" TEXT NOT NULL DEFAULT 'PENDIENTE',
    CONSTRAINT "Pedido_opcionLogisticaId_fkey" FOREIGN KEY ("opcionLogisticaId") REFERENCES "OpcionLogistica" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Pedido_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Pedido_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Pedido" ("costoEnvio", "direccionEntrega", "estado", "estadoPago", "fechaCreacion", "fechaEntrega", "id", "negocioId", "negocioIds", "notas", "opcionLogisticaId", "tipo", "tipoEntrega", "total", "updatedAt", "usuarioId") SELECT "costoEnvio", "direccionEntrega", "estado", "estadoPago", "fechaCreacion", "fechaEntrega", "id", "negocioId", "negocioIds", "notas", "opcionLogisticaId", "tipo", "tipoEntrega", "total", "updatedAt", "usuarioId" FROM "Pedido";
DROP TABLE "Pedido";
ALTER TABLE "new_Pedido" RENAME TO "Pedido";
CREATE INDEX "Pedido_negocioId_idx" ON "Pedido"("negocioId");
CREATE INDEX "Pedido_usuarioId_negocioId_idx" ON "Pedido"("usuarioId", "negocioId");
CREATE INDEX "Pedido_estado_idx" ON "Pedido"("estado");
CREATE INDEX "Pedido_estadoPago_idx" ON "Pedido"("estadoPago");
CREATE TABLE "new_PedidoItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pedidoId" TEXT NOT NULL,
    "productoId" TEXT,
    "servicioId" TEXT,
    "cantidad" INTEGER NOT NULL,
    "precioUnitario" DECIMAL NOT NULL,
    "precioUnitarioBase" DECIMAL NOT NULL DEFAULT 0,
    "precioUnitarioConIVA" DECIMAL NOT NULL DEFAULT 0,
    "tasaIVA" DECIMAL NOT NULL DEFAULT 0,
    "tratamientoIVA" TEXT NOT NULL DEFAULT 'GRAVADO',
    "baseImponible" DECIMAL NOT NULL DEFAULT 0,
    "montoIVA" DECIMAL NOT NULL DEFAULT 0,
    "subtotal" DECIMAL NOT NULL,
    "negocioId" TEXT NOT NULL,
    "fechaEntrega" DATETIME,
    CONSTRAINT "PedidoItem_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PedidoItem_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PedidoItem_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PedidoItem_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PedidoItem" ("cantidad", "fechaEntrega", "id", "negocioId", "pedidoId", "precioUnitario", "productoId", "servicioId", "subtotal") SELECT "cantidad", "fechaEntrega", "id", "negocioId", "pedidoId", "precioUnitario", "productoId", "servicioId", "subtotal" FROM "PedidoItem";
DROP TABLE "PedidoItem";
ALTER TABLE "new_PedidoItem" RENAME TO "PedidoItem";
CREATE TABLE "new_Producto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "negocioId" TEXT NOT NULL,
    "subareaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precio" REAL NOT NULL,
    "unidadMedida" TEXT NOT NULL,
    "imagenUrl" TEXT NOT NULL,
    "disponibleHoy" BOOLEAN NOT NULL DEFAULT true,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "tratamientoIVA" TEXT NOT NULL DEFAULT 'GRAVADO',
    "tasaIVAOverride" DECIMAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Producto_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Producto_subareaId_fkey" FOREIGN KEY ("subareaId") REFERENCES "Subarea" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Producto" ("activo", "createdAt", "descripcion", "disponibleHoy", "id", "imagenUrl", "negocioId", "nombre", "precio", "subareaId", "unidadMedida", "updatedAt") SELECT "activo", "createdAt", "descripcion", "disponibleHoy", "id", "imagenUrl", "negocioId", "nombre", "precio", "subareaId", "unidadMedida", "updatedAt" FROM "Producto";
DROP TABLE "Producto";
ALTER TABLE "new_Producto" RENAME TO "Producto";
CREATE INDEX "Producto_tratamientoIVA_idx" ON "Producto"("tratamientoIVA");
CREATE TABLE "new_Servicio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "negocioId" TEXT NOT NULL,
    "subareaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "duracionMinutos" INTEGER NOT NULL,
    "horariosDisponibles" JSONB NOT NULL,
    "capacidad" INTEGER NOT NULL,
    "imagenUrl" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "permiteReservas" BOOLEAN NOT NULL DEFAULT true,
    "tratamientoIVA" TEXT NOT NULL DEFAULT 'GRAVADO',
    "tasaIVAOverride" DECIMAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Servicio_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Servicio_subareaId_fkey" FOREIGN KEY ("subareaId") REFERENCES "Subarea" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Servicio" ("activo", "capacidad", "createdAt", "descripcion", "duracionMinutos", "horariosDisponibles", "id", "imagenUrl", "negocioId", "nombre", "permiteReservas", "subareaId", "updatedAt") SELECT "activo", "capacidad", "createdAt", "descripcion", "duracionMinutos", "horariosDisponibles", "id", "imagenUrl", "negocioId", "nombre", "permiteReservas", "subareaId", "updatedAt" FROM "Servicio";
DROP TABLE "Servicio";
ALTER TABLE "new_Servicio" RENAME TO "Servicio";
CREATE INDEX "Servicio_tratamientoIVA_idx" ON "Servicio"("tratamientoIVA");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

