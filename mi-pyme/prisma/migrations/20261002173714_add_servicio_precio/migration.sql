-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "precio" REAL NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "permiteReservas" BOOLEAN NOT NULL DEFAULT true,
    "tratamientoIVA" TEXT NOT NULL DEFAULT 'GRAVADO',
    "tasaIVAOverride" DECIMAL,
    "tipo" TEXT NOT NULL DEFAULT 'SERVICIO_GENERAL',
    "tipoTransporte" TEXT,
    "pesoMaximo" DECIMAL,
    "dimensionesMaximas" TEXT,
    "origenBase" TEXT,
    "destinoBase" TEXT,
    "alcanceNacional" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Servicio_subareaId_fkey" FOREIGN KEY ("subareaId") REFERENCES "Subarea" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Servicio_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Servicio" ("activo", "alcanceNacional", "capacidad", "createdAt", "descripcion", "destinoBase", "dimensionesMaximas", "duracionMinutos", "horariosDisponibles", "id", "imagenUrl", "negocioId", "nombre", "origenBase", "permiteReservas", "pesoMaximo", "subareaId", "tasaIVAOverride", "tipo", "tipoTransporte", "tratamientoIVA", "updatedAt") SELECT "activo", "alcanceNacional", "capacidad", "createdAt", "descripcion", "destinoBase", "dimensionesMaximas", "duracionMinutos", "horariosDisponibles", "id", "imagenUrl", "negocioId", "nombre", "origenBase", "permiteReservas", "pesoMaximo", "subareaId", "tasaIVAOverride", "tipo", "tipoTransporte", "tratamientoIVA", "updatedAt" FROM "Servicio";
DROP TABLE "Servicio";
ALTER TABLE "new_Servicio" RENAME TO "Servicio";
CREATE INDEX "Servicio_tratamientoIVA_idx" ON "Servicio"("tratamientoIVA");
CREATE INDEX "Servicio_tipo_idx" ON "Servicio"("tipo");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
