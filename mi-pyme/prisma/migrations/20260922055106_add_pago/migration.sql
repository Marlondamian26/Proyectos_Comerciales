-- CreateTable
CREATE TABLE "Pago" (
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
    "confirmadoPorId" TEXT,
    "confirmadoEn" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Pago_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Pago_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "Factura" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Pago_confirmadoPorId_fkey" FOREIGN KEY ("confirmadoPorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Pedido" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "total" REAL NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "tipo" TEXT NOT NULL,
    "tipoEntrega" TEXT NOT NULL DEFAULT 'DOMICILIO',
    "negocioIds" JSONB NOT NULL,
    "opcionLogisticaId" TEXT,
    "costoEnvio" REAL NOT NULL DEFAULT 0,
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
INSERT INTO "new_Pedido" ("costoEnvio", "direccionEntrega", "estado", "fechaCreacion", "fechaEntrega", "id", "negocioId", "negocioIds", "notas", "opcionLogisticaId", "tipo", "tipoEntrega", "total", "updatedAt", "usuarioId") SELECT "costoEnvio", "direccionEntrega", "estado", "fechaCreacion", "fechaEntrega", "id", "negocioId", "negocioIds", "notas", "opcionLogisticaId", "tipo", "tipoEntrega", "total", "updatedAt", "usuarioId" FROM "Pedido";
DROP TABLE "Pedido";
ALTER TABLE "new_Pedido" RENAME TO "Pedido";
CREATE INDEX "Pedido_negocioId_idx" ON "Pedido"("negocioId");
CREATE INDEX "Pedido_usuarioId_negocioId_idx" ON "Pedido"("usuarioId", "negocioId");
CREATE INDEX "Pedido_estado_idx" ON "Pedido"("estado");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Pago_pedidoId_key" ON "Pago"("pedidoId");

-- CreateIndex
CREATE UNIQUE INDEX "Pago_facturaId_key" ON "Pago"("facturaId");

-- CreateIndex
CREATE INDEX "Pago_estado_idx" ON "Pago"("estado");

-- CreateIndex
CREATE INDEX "Pago_metodo_idx" ON "Pago"("metodo");

-- CreateIndex
CREATE INDEX "Pago_pedidoId_idx" ON "Pago"("pedidoId");
