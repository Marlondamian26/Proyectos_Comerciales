-- CreateTable
CREATE TABLE "Factura" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pedidoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "negocioId" TEXT,
    "numero" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" TEXT NOT NULL DEFAULT 'emitida',
    "subtotal" REAL NOT NULL,
    "impuestos" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Factura_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Factura_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Factura_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FacturaItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "facturaId" TEXT NOT NULL,
    "productoId" TEXT,
    "servicioId" TEXT,
    "cantidad" INTEGER NOT NULL,
    "precioUnitario" REAL NOT NULL,
    "subtotal" REAL NOT NULL,
    CONSTRAINT "FacturaItem_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "Factura" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FacturaItem_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FacturaItem_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReporteVenta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "negocioId" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalVentas" REAL NOT NULL,
    "cantidadPedidos" INTEGER NOT NULL,
    CONSTRAINT "ReporteVenta_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Factura_pedidoId_key" ON "Factura"("pedidoId");

-- CreateIndex
CREATE UNIQUE INDEX "Factura_numero_key" ON "Factura"("numero");
