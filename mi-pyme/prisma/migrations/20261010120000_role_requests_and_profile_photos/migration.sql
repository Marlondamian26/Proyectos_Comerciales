CREATE TYPE "TipoSolicitud" AS ENUM ('NEGOCIO', 'LOGISTICA');

CREATE TYPE "EstadoSolicitud" AS ENUM (
  'PENDIENTE_APROBACION',
  'APROBADA',
  'RECHAZADA',
  'CANCELADA',
  'SUSPENDIDA'
);

ALTER TABLE "User"
  ADD COLUMN "fotoPerfilUrl" TEXT,
  ADD COLUMN "fotoPerfilPublicId" TEXT;

ALTER TABLE "SolicitudAltaNegocio"
  ADD COLUMN "tipo" "TipoSolicitud" NOT NULL DEFAULT 'NEGOCIO',
  ADD COLUMN "alcanceNacional" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "tiposEnvio" TEXT;

UPDATE "SolicitudAltaNegocio"
SET "tipo" = CASE
  WHEN UPPER(COALESCE("tipoRol", 'NEGOCIO')) = 'LOGISTICA'
    THEN 'LOGISTICA'::"TipoSolicitud"
  ELSE 'NEGOCIO'::"TipoSolicitud"
END;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "SolicitudAltaNegocio"
    WHERE "estado" NOT IN (
      'PENDIENTE_APROBACION',
      'ACTIVO',
      'APROBADA',
      'RECHAZADO',
      'RECHAZADA',
      'CANCELADA',
      'SUSPENDIDO',
      'SUSPENDIDA'
    )
  ) THEN
    RAISE EXCEPTION 'SolicitudAltaNegocio contiene estados sin mapeo para EstadoSolicitud';
  END IF;
END $$;

ALTER TABLE "SolicitudAltaNegocio"
  ALTER COLUMN "estado" DROP DEFAULT,
  ALTER COLUMN "estado" TYPE "EstadoSolicitud"
    USING (
      CASE "estado"
        WHEN 'ACTIVO' THEN 'APROBADA'
        WHEN 'RECHAZADO' THEN 'RECHAZADA'
        WHEN 'SUSPENDIDO' THEN 'SUSPENDIDA'
        ELSE "estado"
      END
    )::"EstadoSolicitud",
  ALTER COLUMN "estado" SET DEFAULT 'PENDIENTE_APROBACION';

ALTER TABLE "SolicitudAltaNegocio"
  DROP COLUMN "tipoRol";

CREATE INDEX "SolicitudAltaNegocio_tipo_idx"
  ON "SolicitudAltaNegocio"("tipo");
