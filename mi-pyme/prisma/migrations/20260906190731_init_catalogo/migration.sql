-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "image" TEXT,
    "password" TEXT,
    "nombre" TEXT,
    "rol" TEXT NOT NULL DEFAULT 'CLIENTE',
    "provincia" TEXT,
    "municipio" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Area" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Negocio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "slug" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "areaId" TEXT,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Negocio_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Negocio_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Subarea" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "areaId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Subarea_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NegocioSubarea" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "negocioId" TEXT NOT NULL,
    "subareaId" TEXT NOT NULL,
    CONSTRAINT "NegocioSubarea_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NegocioSubarea_subareaId_fkey" FOREIGN KEY ("subareaId") REFERENCES "Subarea" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Producto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "negocioId" TEXT NOT NULL,
    "subareaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precio" REAL NOT NULL,
    "unidadMedida" TEXT NOT NULL,
    "imagenUrl" TEXT NOT NULL,
    "disponibleHoy" BOOLEAN NOT NULL DEFAULT true,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Producto_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Producto_subareaId_fkey" FOREIGN KEY ("subareaId") REFERENCES "Subarea" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Servicio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "negocioId" TEXT NOT NULL,
    "subareaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "duracionMinutos" INTEGER NOT NULL,
    "horariosDisponibles" JSONB NOT NULL,
    "capacidad" INTEGER NOT NULL,
    "imagenUrl" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Servicio_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Servicio_subareaId_fkey" FOREIGN KEY ("subareaId") REFERENCES "Subarea" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Inventario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productoId" TEXT NOT NULL,
    "cantidadActual" INTEGER NOT NULL,
    "puntoReorden" INTEGER NOT NULL,
    "ubicacion" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Inventario_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Negocio_slug_key" ON "Negocio"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Area_slug_key" ON "Area"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Subarea_slug_key" ON "Subarea"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "NegocioSubarea_negocioId_subareaId_key" ON "NegocioSubarea"("negocioId", "subareaId");
