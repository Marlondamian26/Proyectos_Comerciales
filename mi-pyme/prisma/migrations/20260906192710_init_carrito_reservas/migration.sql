-- CreateTable
CREATE TABLE "Carrito" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'activo',
    CONSTRAINT "Carrito_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CarritoItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "carritoId" TEXT NOT NULL,
    "productoId" TEXT,
    "servicioId" TEXT,
    "cantidad" INTEGER NOT NULL,
    "precioUnitario" REAL NOT NULL,
    "tipo" TEXT NOT NULL,
    CONSTRAINT "CarritoItem_carritoId_fkey" FOREIGN KEY ("carritoId") REFERENCES "Carrito" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CarritoItem_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CarritoItem_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Reserva" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "servicioId" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "fechaHoraInicio" DATETIME NOT NULL,
    "fechaHoraFin" DATETIME NOT NULL,
    "venceEn" DATETIME NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    CONSTRAINT "Reserva_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Reserva_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Reserva_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Carrito_usuarioId_estado_key" ON "Carrito"("usuarioId", "estado");
