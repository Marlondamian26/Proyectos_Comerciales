-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "prefijoFactura" TEXT NOT NULL DEFAULT 'PR',
    CONSTRAINT "Negocio_aprobadoPorId_fkey" FOREIGN KEY ("aprobadoPorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Negocio_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Negocio_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Negocio" ("activo", "aprobadoEn", "aprobadoPorId", "areaId", "createdAt", "descripcion", "direccion", "direccionFiscal", "emailContacto", "emailFiscal", "estado", "id", "modoPrecio", "motivoRechazo", "municipio", "nit", "nombre", "numeroFacturaConsecutivo", "permiteEnvio", "permiteReservas", "provincia", "regimenFiscal", "slug", "tasaIVA", "telefono", "telefonoFiscal", "updatedAt", "userId") SELECT "activo", "aprobadoEn", "aprobadoPorId", "areaId", "createdAt", "descripcion", "direccion", "direccionFiscal", "emailContacto", "emailFiscal", "estado", "id", "modoPrecio", "motivoRechazo", "municipio", "nit", "nombre", "numeroFacturaConsecutivo", "permiteEnvio", "permiteReservas", "provincia", "regimenFiscal", "slug", "tasaIVA", "telefono", "telefonoFiscal", "updatedAt", "userId" FROM "Negocio";
DROP TABLE "Negocio";
ALTER TABLE "new_Negocio" RENAME TO "Negocio";
CREATE UNIQUE INDEX "Negocio_slug_key" ON "Negocio"("slug");
CREATE INDEX "Negocio_regimenFiscal_idx" ON "Negocio"("regimenFiscal");
CREATE INDEX "Negocio_estado_idx" ON "Negocio"("estado");
CREATE TABLE "new_Pago" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pedidoId" TEXT NOT NULL,
    "facturaId" TEXT,
    "metodo" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "monto" DECIMAL NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'CUP',
    "referencia" TEXT,
    "comprobanteUrl" TEXT,
    "notasCliente" TEXT,
    "notasNegocio" TEXT,
    "idTransferencia" TEXT,
    "entidadPago" TEXT,
    "fechaTransferencia" DATETIME,
    "idTransferenciaReembolso" TEXT,
    "fechaReembolso" DATETIME,
    "confirmadoPorId" TEXT,
    "confirmadoEn" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "codigoEntregaHash" TEXT,
    "codigoEntregaExpira" DATETIME,
    "codigoEntregaIntentos" INTEGER NOT NULL DEFAULT 0,
    "codigoEntregaRegeneraciones" INTEGER NOT NULL DEFAULT 0,
    "codigoEntregaUsadoEn" DATETIME,
    "codigoEntregaBloqueado" BOOLEAN NOT NULL DEFAULT false,
    "confirmacionManual" BOOLEAN NOT NULL DEFAULT false,
    "motivoConfirmacionManual" TEXT,
    CONSTRAINT "Pago_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Pago_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "Factura" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Pago_confirmadoPorId_fkey" FOREIGN KEY ("confirmadoPorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Pago" ("comprobanteUrl", "confirmadoEn", "confirmadoPorId", "createdAt", "estado", "facturaId", "id", "metodo", "moneda", "monto", "notasCliente", "notasNegocio", "pedidoId", "referencia", "updatedAt") SELECT "comprobanteUrl", "confirmadoEn", "confirmadoPorId", "createdAt", "estado", "facturaId", "id", "metodo", "moneda", "monto", "notasCliente", "notasNegocio", "pedidoId", "referencia", "updatedAt" FROM "Pago";
DROP TABLE "Pago";
ALTER TABLE "new_Pago" RENAME TO "Pago";
CREATE UNIQUE INDEX "Pago_pedidoId_key" ON "Pago"("pedidoId");
CREATE UNIQUE INDEX "Pago_facturaId_key" ON "Pago"("facturaId");
CREATE UNIQUE INDEX "Pago_idTransferencia_key" ON "Pago"("idTransferencia");
CREATE INDEX "Pago_pedidoId_idx" ON "Pago"("pedidoId");
CREATE INDEX "Pago_metodo_idx" ON "Pago"("metodo");
CREATE INDEX "Pago_estado_idx" ON "Pago"("estado");
CREATE INDEX "Pago_idTransferencia_idx" ON "Pago"("idTransferencia");
CREATE INDEX "Pago_entidadPago_idx" ON "Pago"("entidadPago");
CREATE INDEX "Pago_fechaTransferencia_idx" ON "Pago"("fechaTransferencia");
CREATE INDEX "Pago_codigoEntregaExpira_idx" ON "Pago"("codigoEntregaExpira");
CREATE INDEX "Pago_codigoEntregaBloqueado_idx" ON "Pago"("codigoEntregaBloqueado");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
