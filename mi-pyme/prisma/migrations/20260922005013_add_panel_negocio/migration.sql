-- CreateTable
CREATE TABLE "HorarioNegocio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "negocioId" TEXT NOT NULL,
    "diaSemana" INTEGER NOT NULL,
    "horaApertura" TEXT NOT NULL,
    "horaCierre" TEXT NOT NULL,
    "cerrado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "HorarioNegocio_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SolicitudAltaNegocio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "nombreNegocio" TEXT NOT NULL,
    "descripcion" TEXT,
    "areaId" TEXT,
    "subareaIds" TEXT,
    "provincia" TEXT,
    "municipio" TEXT,
    "telefono" TEXT,
    "emailContacto" TEXT,
    "direccion" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE_APROBACION',
    "motivoRechazo" TEXT,
    "revisadoPorId" TEXT,
    "revisadoEn" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SolicitudAltaNegocio_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SolicitudAltaNegocio_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SolicitudAltaNegocio_revisadoPorId_fkey" FOREIGN KEY ("revisadoPorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NegocioUsuario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "negocioId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'GESTOR',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NegocioUsuario_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NegocioUsuario_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    CONSTRAINT "Negocio_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Negocio_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Negocio_aprobadoPorId_fkey" FOREIGN KEY ("aprobadoPorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Negocio" ("activo", "areaId", "createdAt", "descripcion", "id", "nombre", "permiteEnvio", "permiteReservas", "slug", "updatedAt", "userId") SELECT "activo", "areaId", "createdAt", "descripcion", "id", "nombre", "permiteEnvio", "permiteReservas", "slug", "updatedAt", "userId" FROM "Negocio";
DROP TABLE "Negocio";
ALTER TABLE "new_Negocio" RENAME TO "Negocio";
CREATE UNIQUE INDEX "Negocio_slug_key" ON "Negocio"("slug");
CREATE INDEX "Negocio_estado_idx" ON "Negocio"("estado");
CREATE TABLE "new_ProveedorLogistico" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "zonaCobertura" TEXT NOT NULL,
    "alcanceNacional" BOOLEAN NOT NULL DEFAULT false,
    "contacto" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProveedorLogistico_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ProveedorLogistico" ("activo", "contacto", "createdAt", "id", "nombre", "updatedAt", "usuarioId", "zonaCobertura") SELECT "activo", "contacto", "createdAt", "id", "nombre", "updatedAt", "usuarioId", "zonaCobertura" FROM "ProveedorLogistico";
DROP TABLE "ProveedorLogistico";
ALTER TABLE "new_ProveedorLogistico" RENAME TO "ProveedorLogistico";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "HorarioNegocio_negocioId_idx" ON "HorarioNegocio"("negocioId");

-- CreateIndex
CREATE UNIQUE INDEX "HorarioNegocio_negocioId_diaSemana_key" ON "HorarioNegocio"("negocioId", "diaSemana");

-- CreateIndex
CREATE INDEX "SolicitudAltaNegocio_estado_idx" ON "SolicitudAltaNegocio"("estado");

-- CreateIndex
CREATE INDEX "SolicitudAltaNegocio_userId_idx" ON "SolicitudAltaNegocio"("userId");

-- CreateIndex
CREATE INDEX "NegocioUsuario_userId_idx" ON "NegocioUsuario"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NegocioUsuario_negocioId_userId_key" ON "NegocioUsuario"("negocioId", "userId");
