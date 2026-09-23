/*
  Warnings:

  - You are about to drop the column `logisticaId` on the `Pedido` table. All the data in the column will be lost.
  - Added the required column `negocioId` to the `Pedido` table without a default value. This is not possible if the table is not empty.

*/
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
    CONSTRAINT "Pedido_opcionLogisticaId_fkey" FOREIGN KEY ("opcionLogisticaId") REFERENCES "OpcionLogistica" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Pedido_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Pedido_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Pedido" ("direccionEntrega", "estado", "fechaCreacion", "id", "negocioIds", "tipo", "total", "updatedAt", "usuarioId") SELECT "direccionEntrega", "estado", "fechaCreacion", "id", "negocioIds", "tipo", "total", "updatedAt", "usuarioId" FROM "Pedido";
DROP TABLE "Pedido";
ALTER TABLE "new_Pedido" RENAME TO "Pedido";
CREATE INDEX "Pedido_negocioId_idx" ON "Pedido"("negocioId");
CREATE INDEX "Pedido_usuarioId_negocioId_idx" ON "Pedido"("usuarioId", "negocioId");
CREATE INDEX "Pedido_estado_idx" ON "Pedido"("estado");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
