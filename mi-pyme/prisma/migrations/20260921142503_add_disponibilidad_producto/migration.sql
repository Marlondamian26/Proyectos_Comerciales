-- AlterTable
ALTER TABLE "CarritoItem" ADD COLUMN "fechaEntrega" DATETIME;

-- AlterTable
ALTER TABLE "PedidoItem" ADD COLUMN "fechaEntrega" DATETIME;

-- CreateTable
CREATE TABLE "DisponibilidadProducto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productoId" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "notas" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DisponibilidadProducto_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "DisponibilidadProducto_productoId_fecha_idx" ON "DisponibilidadProducto"("productoId", "fecha");

-- CreateIndex
CREATE INDEX "DisponibilidadProducto_fecha_idx" ON "DisponibilidadProducto"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "DisponibilidadProducto_productoId_fecha_key" ON "DisponibilidadProducto"("productoId", "fecha");
