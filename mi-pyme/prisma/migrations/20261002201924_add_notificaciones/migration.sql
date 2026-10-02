-- CreateTable
CREATE TABLE "Notificacion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'NO_LEIDA',
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "enlace" TEXT,
    "metadata" JSONB,
    "leidaEn" DATETIME,
    "emailEnviado" BOOLEAN NOT NULL DEFAULT false,
    "emailEnviadoEn" DATETIME,
    "emailError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Notificacion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PreferenciaNotificacion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "inApp" BOOLEAN NOT NULL DEFAULT true,
    "email" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PreferenciaNotificacion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Notificacion_userId_estado_idx" ON "Notificacion"("userId", "estado");

-- CreateIndex
CREATE INDEX "Notificacion_userId_createdAt_idx" ON "Notificacion"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Notificacion_tipo_idx" ON "Notificacion"("tipo");

-- CreateIndex
CREATE INDEX "PreferenciaNotificacion_userId_idx" ON "PreferenciaNotificacion"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PreferenciaNotificacion_userId_tipo_key" ON "PreferenciaNotificacion"("userId", "tipo");
