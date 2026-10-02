-- CreateTable
CREATE TABLE "Promocion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "negocioId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" TEXT NOT NULL,
    "valor" DECIMAL,
    "productoIds" TEXT NOT NULL DEFAULT '[]',
    "servicioIds" TEXT NOT NULL DEFAULT '[]',
    "subareaIds" TEXT NOT NULL DEFAULT '[]',
    "montoMinimo" DECIMAL,
    "fechaInicio" DATETIME,
    "fechaFin" DATETIME,
    "usosMaximos" INTEGER,
    "usosPorUsuario" INTEGER,
    "usosActuales" INTEGER NOT NULL DEFAULT 0,
    "exclusiva" BOOLEAN NOT NULL DEFAULT false,
    "estado" TEXT NOT NULL DEFAULT 'ACTIVA',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "creadaPorId" TEXT,
    CONSTRAINT "Promocion_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Promocion_creadaPorId_fkey" FOREIGN KEY ("creadaPorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PromocionUso" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "promocionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "descuento" DECIMAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PromocionUso_promocionId_fkey" FOREIGN KEY ("promocionId") REFERENCES "Promocion" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PromocionUso_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PromocionUso_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Cupon" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigo" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" TEXT NOT NULL,
    "valor" DECIMAL,
    "negocioId" TEXT,
    "montoMinimo" DECIMAL,
    "fechaInicio" DATETIME,
    "fechaFin" DATETIME,
    "usosMaximos" INTEGER,
    "usosPorUsuario" INTEGER,
    "usosActuales" INTEGER NOT NULL DEFAULT 0,
    "unaVezPorUsuario" BOOLEAN NOT NULL DEFAULT false,
    "primeraCompra" BOOLEAN NOT NULL DEFAULT false,
    "estado" TEXT NOT NULL DEFAULT 'ACTIVO',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "creadoPorId" TEXT,
    CONSTRAINT "Cupon_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Cupon_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CuponUso" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cuponId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "descuento" DECIMAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CuponUso_cuponId_fkey" FOREIGN KEY ("cuponId") REFERENCES "Cupon" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CuponUso_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CuponUso_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Combo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "imagen" TEXT,
    "precio" DECIMAL NOT NULL,
    "negocioId" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fechaInicio" DATETIME,
    "fechaFin" DATETIME,
    "usosMaximos" INTEGER,
    "usosActuales" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "creadoPorId" TEXT,
    CONSTRAINT "Combo_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Combo_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ComboItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "comboId" TEXT NOT NULL,
    "productoId" TEXT,
    "servicioId" TEXT,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ComboItem_comboId_fkey" FOREIGN KEY ("comboId") REFERENCES "Combo" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ComboItem_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ComboItem_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ComboUso" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "comboId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "descuento" DECIMAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ComboUso_comboId_fkey" FOREIGN KEY ("comboId") REFERENCES "Combo" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ComboUso_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ComboUso_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
    "permiteAcumularDescuentos" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Negocio_aprobadoPorId_fkey" FOREIGN KEY ("aprobadoPorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Negocio_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Negocio_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Negocio" ("activo", "aprobadoEn", "aprobadoPorId", "areaId", "createdAt", "descripcion", "direccion", "direccionFiscal", "emailContacto", "emailFiscal", "estado", "id", "modoPrecio", "motivoRechazo", "municipio", "nit", "nombre", "numeroFacturaConsecutivo", "permiteEnvio", "permiteReservas", "prefijoFactura", "provincia", "regimenFiscal", "slug", "tasaIVA", "telefono", "telefonoFiscal", "updatedAt", "userId") SELECT "activo", "aprobadoEn", "aprobadoPorId", "areaId", "createdAt", "descripcion", "direccion", "direccionFiscal", "emailContacto", "emailFiscal", "estado", "id", "modoPrecio", "motivoRechazo", "municipio", "nit", "nombre", "numeroFacturaConsecutivo", "permiteEnvio", "permiteReservas", "prefijoFactura", "provincia", "regimenFiscal", "slug", "tasaIVA", "telefono", "telefonoFiscal", "updatedAt", "userId" FROM "Negocio";
DROP TABLE "Negocio";
ALTER TABLE "new_Negocio" RENAME TO "Negocio";
CREATE UNIQUE INDEX "Negocio_slug_key" ON "Negocio"("slug");
CREATE INDEX "Negocio_regimenFiscal_idx" ON "Negocio"("regimenFiscal");
CREATE INDEX "Negocio_estado_idx" ON "Negocio"("estado");
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
    "promocionId" TEXT,
    "cuponId" TEXT,
    "comboId" TEXT,
    "descuentoTotal" DECIMAL NOT NULL DEFAULT 0,
    CONSTRAINT "Pedido_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Pedido_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Pedido_opcionLogisticaId_fkey" FOREIGN KEY ("opcionLogisticaId") REFERENCES "OpcionLogistica" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Pedido" ("baseImponibleTotal", "costoEnvio", "direccionEntrega", "estado", "estadoPago", "fechaCreacion", "fechaEntrega", "id", "modoPrecio", "montoIVATotal", "negocioId", "negocioIds", "notas", "opcionLogisticaId", "regimenFiscalNegocio", "tasaIVANegocio", "tipo", "tipoEntrega", "total", "totalConIVA", "updatedAt", "usuarioId") SELECT "baseImponibleTotal", "costoEnvio", "direccionEntrega", "estado", "estadoPago", "fechaCreacion", "fechaEntrega", "id", "modoPrecio", "montoIVATotal", "negocioId", "negocioIds", "notas", "opcionLogisticaId", "regimenFiscalNegocio", "tasaIVANegocio", "tipo", "tipoEntrega", "total", "totalConIVA", "updatedAt", "usuarioId" FROM "Pedido";
DROP TABLE "Pedido";
ALTER TABLE "new_Pedido" RENAME TO "Pedido";
CREATE INDEX "Pedido_estadoPago_idx" ON "Pedido"("estadoPago");
CREATE INDEX "Pedido_estado_idx" ON "Pedido"("estado");
CREATE INDEX "Pedido_usuarioId_negocioId_idx" ON "Pedido"("usuarioId", "negocioId");
CREATE INDEX "Pedido_negocioId_idx" ON "Pedido"("negocioId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Promocion_negocioId_estado_idx" ON "Promocion"("negocioId", "estado");

-- CreateIndex
CREATE INDEX "Promocion_fechaInicio_fechaFin_idx" ON "Promocion"("fechaInicio", "fechaFin");

-- CreateIndex
CREATE INDEX "PromocionUso_promocionId_userId_idx" ON "PromocionUso"("promocionId", "userId");

-- CreateIndex
CREATE INDEX "PromocionUso_userId_idx" ON "PromocionUso"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Cupon_codigo_key" ON "Cupon"("codigo");

-- CreateIndex
CREATE INDEX "Cupon_codigo_idx" ON "Cupon"("codigo");

-- CreateIndex
CREATE INDEX "Cupon_negocioId_estado_idx" ON "Cupon"("negocioId", "estado");

-- CreateIndex
CREATE INDEX "Cupon_fechaInicio_fechaFin_idx" ON "Cupon"("fechaInicio", "fechaFin");

-- CreateIndex
CREATE INDEX "CuponUso_cuponId_userId_idx" ON "CuponUso"("cuponId", "userId");

-- CreateIndex
CREATE INDEX "CuponUso_userId_idx" ON "CuponUso"("userId");

-- CreateIndex
CREATE INDEX "Combo_negocioId_activo_idx" ON "Combo"("negocioId", "activo");

-- CreateIndex
CREATE INDEX "Combo_fechaInicio_fechaFin_idx" ON "Combo"("fechaInicio", "fechaFin");

-- CreateIndex
CREATE INDEX "ComboItem_comboId_idx" ON "ComboItem"("comboId");

-- CreateIndex
CREATE INDEX "ComboUso_comboId_userId_idx" ON "ComboUso"("comboId", "userId");

-- CreateIndex
CREATE INDEX "ComboUso_userId_idx" ON "ComboUso"("userId");
