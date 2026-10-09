DO $$
BEGIN
    CREATE TYPE "Moneda" AS ENUM ('CUP', 'USD', 'EUR', 'MLC', 'USD_TRANSFER', 'EUR_TRANSFER');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "User"
    ADD COLUMN IF NOT EXISTS "monedaPreferida" "Moneda" NOT NULL DEFAULT 'CUP';

ALTER TABLE "Negocio"
    ADD COLUMN IF NOT EXISTS "monedaBase" "Moneda" NOT NULL DEFAULT 'CUP',
    ADD COLUMN IF NOT EXISTS "monedaVisualizacion" "Moneda" NOT NULL DEFAULT 'CUP',
    ADD COLUMN IF NOT EXISTS "conversionAutomatica" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS "PrecioProducto" (
    "id" TEXT NOT NULL,
    "productoId" TEXT,
    "servicioId" TEXT,
    "monedaBase" "Moneda" NOT NULL DEFAULT 'CUP',
    "montoBase" DECIMAL(65,30) NOT NULL,
    "monedaVisualizacion" "Moneda" NOT NULL DEFAULT 'CUP',
    "montoVisualizacion" DECIMAL(65,30),
    "conversionAutomatica" BOOLEAN NOT NULL DEFAULT true,
    "tasaOverride" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PrecioProducto_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TasaCambio" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "moneda" "Moneda" NOT NULL,
    "tasa" DECIMAL(65,30) NOT NULL,
    "fuente" TEXT NOT NULL DEFAULT 'ELTOQUE',
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TasaCambio_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PreferenciaMonedaUsuario" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "moneda" "Moneda" NOT NULL DEFAULT 'CUP',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PreferenciaMonedaUsuario_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PrecioProducto_productoId_idx" ON "PrecioProducto"("productoId");
CREATE INDEX IF NOT EXISTS "PrecioProducto_servicioId_idx" ON "PrecioProducto"("servicioId");
CREATE UNIQUE INDEX IF NOT EXISTS "TasaCambio_fecha_moneda_fuente_key"
    ON "TasaCambio"("fecha", "moneda", "fuente");
CREATE INDEX IF NOT EXISTS "TasaCambio_moneda_fecha_idx" ON "TasaCambio"("moneda", "fecha");
CREATE INDEX IF NOT EXISTS "TasaCambio_fuente_idx" ON "TasaCambio"("fuente");
CREATE UNIQUE INDEX IF NOT EXISTS "PreferenciaMonedaUsuario_userId_key"
    ON "PreferenciaMonedaUsuario"("userId");

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PrecioProducto_productoId_fkey') THEN
        ALTER TABLE "PrecioProducto"
            ADD CONSTRAINT "PrecioProducto_productoId_fkey"
            FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PrecioProducto_servicioId_fkey') THEN
        ALTER TABLE "PrecioProducto"
            ADD CONSTRAINT "PrecioProducto_servicioId_fkey"
            FOREIGN KEY ("servicioId") REFERENCES "Servicio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PreferenciaMonedaUsuario_userId_fkey') THEN
        ALTER TABLE "PreferenciaMonedaUsuario"
            ADD CONSTRAINT "PreferenciaMonedaUsuario_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
