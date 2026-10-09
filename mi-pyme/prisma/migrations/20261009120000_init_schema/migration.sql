-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Moneda" AS ENUM ('CUP', 'USD', 'EUR', 'MLC', 'USD_TRANSFER', 'EUR_TRANSFER');

-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'CLIENTE', 'NEGOCIO', 'LOGISTICA');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('EFECTIVO_CONTRA_ENTREGA', 'TRANSFERENCIA_BANCARIA', 'PAGO_MOVIL', 'TARJETA');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('PENDIENTE', 'EN_PROCESO', 'COMPLETADO', 'FALLIDO', 'REEMBOLSADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoEntrega" AS ENUM ('DOMICILIO', 'RECOGIDA_TIENDA', 'ENVIO');

-- CreateEnum
CREATE TYPE "EstadoFactura" AS ENUM ('PENDIENTE', 'EMITIDA', 'PAGADA', 'ANULADA');

-- CreateEnum
CREATE TYPE "RegimenFiscal" AS ENUM ('GENERAL', 'SIMPLIFICADO', 'EXENTO', 'NO_SUJETO');

-- CreateEnum
CREATE TYPE "ModoPrecio" AS ENUM ('IVA_INCLUIDO', 'IVA_AGREGADO');

-- CreateEnum
CREATE TYPE "TratamientoIVA" AS ENUM ('GRAVADO', 'EXENTO', 'NO_SUJETO');

-- CreateEnum
CREATE TYPE "TipoServicio" AS ENUM ('SERVICIO_GENERAL', 'TRANSPORTE');

-- CreateEnum
CREATE TYPE "TipoTransporte" AS ENUM ('ENVIO_PAQUETE', 'MUDANZA', 'TRASLADO_MUEBLE', 'TRANSPORTE_PERSONAS', 'OTRO');

-- CreateEnum
CREATE TYPE "TipoDescuento" AS ENUM ('PORCENTAJE', 'MONTO_FIJO', 'DOS_POR_UNO', 'ENVIO_GRATIS');

-- CreateEnum
CREATE TYPE "EstadoPromocion" AS ENUM ('ACTIVA', 'PAUSADA', 'EXPIRADA', 'AGOTADA');

-- CreateEnum
CREATE TYPE "EstadoCupon" AS ENUM ('ACTIVO', 'PAUSADO', 'EXPIRADO', 'AGOTADO');

-- CreateEnum
CREATE TYPE "TipoNotificacion" AS ENUM ('PEDIDO_CREADO', 'PEDIDO_ESTADO_CAMBIADO', 'PEDIDO_ASIGNADO_LOGISTICA', 'RESERVA_CREADA', 'RESERVA_CANCELADA', 'PAGO_COMPROBANTE_SUBIDO', 'PAGO_CONFIRMADO', 'PAGO_RECHAZADO', 'PAGO_REEMBOLSADO', 'CODIGO_ENTREGA_REGENERADO', 'SOLICITUD_ALTA_CREADA', 'SOLICITUD_ALTA_APROBADA', 'SOLICITUD_ALTA_RECHAZADA', 'DISPONIBILIDAD_AGOTADA', 'STOCK_BAJO', 'TRANSPORTE_CONTRATADO', 'CUPON_PROXIMO_A_EXPIRAR', 'PROMOCION_AGOTADA', 'BIENVENIDA', 'PASSWORD_CAMBIADO', 'LOGIN_NUEVO_DISPOSITIVO');

-- CreateEnum
CREATE TYPE "EstadoNotificacion" AS ENUM ('NO_LEIDA', 'LEIDA', 'ARCHIVADA');

-- CreateEnum
CREATE TYPE "CanalNotificacion" AS ENUM ('IN_APP', 'EMAIL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "username" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT,
    "nombre" TEXT,
    "rol" "Rol" NOT NULL DEFAULT 'CLIENTE',
    "monedaPreferida" "Moneda" NOT NULL DEFAULT 'CUP',
    "provincia" TEXT,
    "municipio" TEXT,
    "isGenericAdmin" BOOLEAN NOT NULL DEFAULT false,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "deletedReason" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "sessionVersion" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
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

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Negocio" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "slug" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE_APROBACION',
    "motivoRechazo" TEXT,
    "aprobadoPorId" TEXT,
    "aprobadoEn" TIMESTAMP(3),
    "areaId" TEXT,
    "userId" TEXT,
    "provincia" TEXT,
    "municipio" TEXT,
    "telefono" TEXT,
    "emailContacto" TEXT,
    "direccion" TEXT,
    "monedaBase" "Moneda" NOT NULL DEFAULT 'CUP',
    "monedaVisualizacion" "Moneda" NOT NULL DEFAULT 'CUP',
    "conversionAutomatica" BOOLEAN NOT NULL DEFAULT true,
    "permiteReservas" BOOLEAN NOT NULL DEFAULT true,
    "permiteEnvio" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "regimenFiscal" "RegimenFiscal" NOT NULL DEFAULT 'GENERAL',
    "tasaIVA" DECIMAL(65,30) NOT NULL DEFAULT 10.00,
    "modoPrecio" "ModoPrecio" NOT NULL DEFAULT 'IVA_INCLUIDO',
    "nit" TEXT,
    "direccionFiscal" TEXT,
    "telefonoFiscal" TEXT,
    "emailFiscal" TEXT,
    "numeroFacturaConsecutivo" INTEGER NOT NULL DEFAULT 0,
    "prefijoFactura" TEXT NOT NULL DEFAULT 'PR',
    "permiteAcumularDescuentos" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Negocio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Provincia" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Provincia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Municipio" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "provinciaId" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Municipio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Area" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subarea" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "areaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subarea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NegocioSubarea" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "subareaId" TEXT NOT NULL,

    CONSTRAINT "NegocioSubarea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Producto" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "subareaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precio" DOUBLE PRECISION NOT NULL,
    "unidadMedida" TEXT NOT NULL,
    "imagenUrl" TEXT NOT NULL,
    "disponibleHoy" BOOLEAN NOT NULL DEFAULT true,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "tratamientoIVA" "TratamientoIVA" NOT NULL DEFAULT 'GRAVADO',
    "tasaIVAOverride" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Servicio" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "subareaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "duracionMinutos" INTEGER NOT NULL,
    "horariosDisponibles" JSONB NOT NULL,
    "capacidad" INTEGER NOT NULL,
    "imagenUrl" TEXT NOT NULL,
    "precio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "permiteReservas" BOOLEAN NOT NULL DEFAULT true,
    "tratamientoIVA" "TratamientoIVA" NOT NULL DEFAULT 'GRAVADO',
    "tasaIVAOverride" DECIMAL(65,30),
    "tipo" "TipoServicio" NOT NULL DEFAULT 'SERVICIO_GENERAL',
    "tipoTransporte" "TipoTransporte",
    "pesoMaximo" DECIMAL(65,30),
    "dimensionesMaximas" TEXT,
    "origenBase" TEXT,
    "destinoBase" TEXT,
    "alcanceNacional" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Servicio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrecioProducto" (
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

-- CreateTable
CREATE TABLE "TasaCambio" (
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

-- CreateTable
CREATE TABLE "PreferenciaMonedaUsuario" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "moneda" "Moneda" NOT NULL DEFAULT 'CUP',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreferenciaMonedaUsuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inventario" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "cantidadActual" INTEGER NOT NULL,
    "puntoReorden" INTEGER NOT NULL,
    "ubicacion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Carrito" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'activo',

    CONSTRAINT "Carrito_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarritoItem" (
    "id" TEXT NOT NULL,
    "carritoId" TEXT NOT NULL,
    "productoId" TEXT,
    "servicioId" TEXT,
    "cantidad" INTEGER NOT NULL,
    "precioUnitario" DOUBLE PRECISION NOT NULL,
    "tipo" TEXT NOT NULL,
    "fechaEntrega" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "CarritoItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reserva" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "servicioId" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "fechaHoraInicio" TIMESTAMP(3) NOT NULL,
    "fechaHoraFin" TIMESTAMP(3) NOT NULL,
    "venceEn" TIMESTAMP(3) NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "metadata" JSONB,

    CONSTRAINT "Reserva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProveedorLogistico" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "zonaCobertura" TEXT NOT NULL,
    "alcanceNacional" BOOLEAN NOT NULL DEFAULT false,
    "contacto" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProveedorLogistico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpcionLogistica" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "proveedorId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "tarifaBase" DOUBLE PRECISION NOT NULL,
    "tarifaPorDistancia" DOUBLE PRECISION NOT NULL,
    "tiempoEstimado" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpcionLogistica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pedido" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "total" DECIMAL(65,30) NOT NULL,
    "baseImponibleTotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "montoIVATotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalConIVA" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "modoPrecio" "ModoPrecio" NOT NULL DEFAULT 'IVA_INCLUIDO',
    "regimenFiscalNegocio" "RegimenFiscal" NOT NULL DEFAULT 'GENERAL',
    "tasaIVANegocio" DECIMAL(65,30) NOT NULL DEFAULT 10.00,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "tipo" TEXT NOT NULL,
    "tipoEntrega" TEXT NOT NULL DEFAULT 'DOMICILIO',
    "negocioIds" JSONB NOT NULL,
    "opcionLogisticaId" TEXT,
    "costoEnvio" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "direccionEntrega" TEXT,
    "fechaEntrega" TIMESTAMP(3),
    "notas" TEXT,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "estadoPago" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "promocionId" TEXT,
    "cuponId" TEXT,
    "comboId" TEXT,
    "descuentoTotal" DECIMAL(65,30) NOT NULL DEFAULT 0,

    CONSTRAINT "Pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PedidoItem" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "productoId" TEXT,
    "servicioId" TEXT,
    "cantidad" INTEGER NOT NULL,
    "precioUnitario" DECIMAL(65,30) NOT NULL,
    "precioUnitarioBase" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "precioUnitarioConIVA" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "tasaIVA" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "tratamientoIVA" "TratamientoIVA" NOT NULL DEFAULT 'GRAVADO',
    "baseImponible" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "montoIVA" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(65,30) NOT NULL,
    "negocioId" TEXT NOT NULL,
    "fechaEntrega" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "PedidoItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Factura" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "negocioId" TEXT,
    "numero" TEXT NOT NULL,
    "nitEmisor" TEXT,
    "nitReceptor" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" TEXT NOT NULL DEFAULT 'emitida',
    "subtotal" DECIMAL(65,30) NOT NULL,
    "impuestos" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total" DECIMAL(65,30) NOT NULL,
    "baseImponible" DECIMAL(65,30),
    "montoIVA" DECIMAL(65,30),
    "desgloseIVA" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Factura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacturaItem" (
    "id" TEXT NOT NULL,
    "facturaId" TEXT NOT NULL,
    "productoId" TEXT,
    "servicioId" TEXT,
    "cantidad" INTEGER NOT NULL,
    "precioUnitario" DECIMAL(65,30) NOT NULL,
    "precioUnitarioBase" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "precioUnitarioConIVA" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "tasaIVA" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "tratamientoIVA" "TratamientoIVA" NOT NULL DEFAULT 'GRAVADO',
    "baseImponible" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "montoIVA" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "FacturaItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReporteVenta" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalVentas" DOUBLE PRECISION NOT NULL,
    "cantidadPedidos" INTEGER NOT NULL,

    CONSTRAINT "ReporteVenta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "actorId" TEXT,
    "targetId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "meta" JSONB,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisponibilidadProducto" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DisponibilidadProducto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HorarioNegocio" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "diaSemana" INTEGER NOT NULL,
    "horaApertura" TEXT NOT NULL,
    "horaCierre" TEXT NOT NULL,
    "cerrado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HorarioNegocio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Promocion" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" "TipoDescuento" NOT NULL,
    "valor" DECIMAL(65,30),
    "productoIds" TEXT NOT NULL DEFAULT '[]',
    "servicioIds" TEXT NOT NULL DEFAULT '[]',
    "subareaIds" TEXT NOT NULL DEFAULT '[]',
    "montoMinimo" DECIMAL(65,30),
    "fechaInicio" TIMESTAMP(3),
    "fechaFin" TIMESTAMP(3),
    "usosMaximos" INTEGER,
    "usosPorUsuario" INTEGER,
    "usosActuales" INTEGER NOT NULL DEFAULT 0,
    "exclusiva" BOOLEAN NOT NULL DEFAULT false,
    "estado" "EstadoPromocion" NOT NULL DEFAULT 'ACTIVA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "creadaPorId" TEXT,

    CONSTRAINT "Promocion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromocionUso" (
    "id" TEXT NOT NULL,
    "promocionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "descuento" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromocionUso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cupon" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" "TipoDescuento" NOT NULL,
    "valor" DECIMAL(65,30),
    "negocioId" TEXT,
    "montoMinimo" DECIMAL(65,30),
    "fechaInicio" TIMESTAMP(3),
    "fechaFin" TIMESTAMP(3),
    "usosMaximos" INTEGER,
    "usosPorUsuario" INTEGER,
    "usosActuales" INTEGER NOT NULL DEFAULT 0,
    "unaVezPorUsuario" BOOLEAN NOT NULL DEFAULT false,
    "primeraCompra" BOOLEAN NOT NULL DEFAULT false,
    "estado" "EstadoCupon" NOT NULL DEFAULT 'ACTIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "creadoPorId" TEXT,

    CONSTRAINT "Cupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CuponUso" (
    "id" TEXT NOT NULL,
    "cuponId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "descuento" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CuponUso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Combo" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "imagen" TEXT,
    "precio" DECIMAL(65,30) NOT NULL,
    "negocioId" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fechaInicio" TIMESTAMP(3),
    "fechaFin" TIMESTAMP(3),
    "usosMaximos" INTEGER,
    "usosActuales" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "creadoPorId" TEXT,

    CONSTRAINT "Combo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComboItem" (
    "id" TEXT NOT NULL,
    "comboId" TEXT NOT NULL,
    "productoId" TEXT,
    "servicioId" TEXT,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComboItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComboUso" (
    "id" TEXT NOT NULL,
    "comboId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "descuento" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComboUso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NegocioUsuario" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'GESTOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NegocioUsuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pago" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "facturaId" TEXT,
    "metodo" "MetodoPago" NOT NULL,
    "estado" "EstadoPago" NOT NULL DEFAULT 'PENDIENTE',
    "monto" DECIMAL(65,30) NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'CUP',
    "referencia" TEXT,
    "comprobanteUrl" TEXT,
    "notasCliente" TEXT,
    "notasNegocio" TEXT,
    "idTransferencia" TEXT,
    "entidadPago" TEXT,
    "fechaTransferencia" TIMESTAMP(3),
    "idTransferenciaReembolso" TEXT,
    "fechaReembolso" TIMESTAMP(3),
    "confirmadoPorId" TEXT,
    "confirmadoEn" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "codigoEntregaHash" TEXT,
    "codigoEntregaExpira" TIMESTAMP(3),
    "codigoEntregaIntentos" INTEGER NOT NULL DEFAULT 0,
    "codigoEntregaRegeneraciones" INTEGER NOT NULL DEFAULT 0,
    "codigoEntregaUsadoEn" TIMESTAMP(3),
    "codigoEntregaBloqueado" BOOLEAN NOT NULL DEFAULT false,
    "confirmacionManual" BOOLEAN NOT NULL DEFAULT false,
    "motivoConfirmacionManual" TEXT,

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolicitudAltaNegocio" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nombreNegocio" TEXT NOT NULL,
    "tipoRol" TEXT NOT NULL DEFAULT 'NEGOCIO',
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
    "revisadoEn" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SolicitudAltaNegocio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notificacion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tipo" "TipoNotificacion" NOT NULL,
    "estado" "EstadoNotificacion" NOT NULL DEFAULT 'NO_LEIDA',
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "enlace" TEXT,
    "metadata" JSONB,
    "leidaEn" TIMESTAMP(3),
    "emailEnviado" BOOLEAN NOT NULL DEFAULT false,
    "emailEnviadoEn" TIMESTAMP(3),
    "emailError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreferenciaNotificacion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tipo" "TipoNotificacion" NOT NULL,
    "inApp" BOOLEAN NOT NULL DEFAULT true,
    "email" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreferenciaNotificacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_rol_idx" ON "User"("rol");

-- CreateIndex
CREATE INDEX "User_isGenericAdmin_idx" ON "User"("isGenericAdmin");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

-- CreateIndex
CREATE INDEX "User_lockedUntil_idx" ON "User"("lockedUntil");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Negocio_slug_key" ON "Negocio"("slug");

-- CreateIndex
CREATE INDEX "Negocio_regimenFiscal_idx" ON "Negocio"("regimenFiscal");

-- CreateIndex
CREATE INDEX "Negocio_estado_idx" ON "Negocio"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "Provincia_nombre_key" ON "Provincia"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Provincia_slug_key" ON "Provincia"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Municipio_slug_key" ON "Municipio"("slug");

-- CreateIndex
CREATE INDEX "Municipio_provinciaId_idx" ON "Municipio"("provinciaId");

-- CreateIndex
CREATE UNIQUE INDEX "Area_slug_key" ON "Area"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Subarea_slug_key" ON "Subarea"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "NegocioSubarea_negocioId_subareaId_key" ON "NegocioSubarea"("negocioId", "subareaId");

-- CreateIndex
CREATE INDEX "Producto_tratamientoIVA_idx" ON "Producto"("tratamientoIVA");

-- CreateIndex
CREATE INDEX "Servicio_tratamientoIVA_idx" ON "Servicio"("tratamientoIVA");

-- CreateIndex
CREATE INDEX "Servicio_tipo_idx" ON "Servicio"("tipo");

-- CreateIndex
CREATE INDEX "PrecioProducto_productoId_idx" ON "PrecioProducto"("productoId");

-- CreateIndex
CREATE INDEX "PrecioProducto_servicioId_idx" ON "PrecioProducto"("servicioId");

-- CreateIndex
CREATE INDEX "TasaCambio_moneda_fecha_idx" ON "TasaCambio"("moneda", "fecha");

-- CreateIndex
CREATE INDEX "TasaCambio_fuente_idx" ON "TasaCambio"("fuente");

-- CreateIndex
CREATE UNIQUE INDEX "TasaCambio_fecha_moneda_fuente_key" ON "TasaCambio"("fecha", "moneda", "fuente");

-- CreateIndex
CREATE UNIQUE INDEX "PreferenciaMonedaUsuario_userId_key" ON "PreferenciaMonedaUsuario"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Carrito_usuarioId_estado_key" ON "Carrito"("usuarioId", "estado");

-- CreateIndex
CREATE INDEX "Pedido_estadoPago_idx" ON "Pedido"("estadoPago");

-- CreateIndex
CREATE INDEX "Pedido_estado_idx" ON "Pedido"("estado");

-- CreateIndex
CREATE INDEX "Pedido_usuarioId_negocioId_idx" ON "Pedido"("usuarioId", "negocioId");

-- CreateIndex
CREATE INDEX "Pedido_negocioId_idx" ON "Pedido"("negocioId");

-- CreateIndex
CREATE UNIQUE INDEX "Factura_pedidoId_key" ON "Factura"("pedidoId");

-- CreateIndex
CREATE UNIQUE INDEX "Factura_numero_key" ON "Factura"("numero");

-- CreateIndex
CREATE INDEX "AuditLog_eventType_idx" ON "AuditLog"("eventType");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_targetId_idx" ON "AuditLog"("targetId");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");

-- CreateIndex
CREATE INDEX "DisponibilidadProducto_productoId_fecha_idx" ON "DisponibilidadProducto"("productoId", "fecha");

-- CreateIndex
CREATE INDEX "DisponibilidadProducto_fecha_idx" ON "DisponibilidadProducto"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "DisponibilidadProducto_productoId_fecha_key" ON "DisponibilidadProducto"("productoId", "fecha");

-- CreateIndex
CREATE INDEX "HorarioNegocio_negocioId_idx" ON "HorarioNegocio"("negocioId");

-- CreateIndex
CREATE UNIQUE INDEX "HorarioNegocio_negocioId_diaSemana_key" ON "HorarioNegocio"("negocioId", "diaSemana");

-- CreateIndex
CREATE INDEX "Promocion_negocioId_estado_idx" ON "Promocion"("negocioId", "estado");

-- CreateIndex
CREATE INDEX "Promocion_fechaInicio_fechaFin_idx" ON "Promocion"("fechaInicio", "fechaFin");

-- CreateIndex
CREATE INDEX "PromocionUso_promocionId_userId_idx" ON "PromocionUso"("promocionId", "userId");

-- CreateIndex
CREATE INDEX "PromocionUso_userId_idx" ON "PromocionUso"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Cupon_codigo_key" ON "Cupon"("codigo");

-- CreateIndex
CREATE INDEX "Cupon_codigo_idx" ON "Cupon"("codigo");

-- CreateIndex
CREATE INDEX "Cupon_negocioId_estado_idx" ON "Cupon"("negocioId", "estado");

-- CreateIndex
CREATE INDEX "Cupon_fechaInicio_fechaFin_idx" ON "Cupon"("fechaInicio", "fechaFin");

-- CreateIndex
CREATE INDEX "CuponUso_cuponId_userId_idx" ON "CuponUso"("cuponId", "userId");

-- CreateIndex
CREATE INDEX "CuponUso_userId_idx" ON "CuponUso"("userId");

-- CreateIndex
CREATE INDEX "Combo_negocioId_activo_idx" ON "Combo"("negocioId", "activo");

-- CreateIndex
CREATE INDEX "Combo_fechaInicio_fechaFin_idx" ON "Combo"("fechaInicio", "fechaFin");

-- CreateIndex
CREATE INDEX "ComboItem_comboId_idx" ON "ComboItem"("comboId");

-- CreateIndex
CREATE INDEX "ComboUso_comboId_userId_idx" ON "ComboUso"("comboId", "userId");

-- CreateIndex
CREATE INDEX "ComboUso_userId_idx" ON "ComboUso"("userId");

-- CreateIndex
CREATE INDEX "NegocioUsuario_userId_idx" ON "NegocioUsuario"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NegocioUsuario_negocioId_userId_key" ON "NegocioUsuario"("negocioId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Pago_pedidoId_key" ON "Pago"("pedidoId");

-- CreateIndex
CREATE UNIQUE INDEX "Pago_facturaId_key" ON "Pago"("facturaId");

-- CreateIndex
CREATE UNIQUE INDEX "Pago_idTransferencia_key" ON "Pago"("idTransferencia");

-- CreateIndex
CREATE INDEX "Pago_pedidoId_idx" ON "Pago"("pedidoId");

-- CreateIndex
CREATE INDEX "Pago_metodo_idx" ON "Pago"("metodo");

-- CreateIndex
CREATE INDEX "Pago_estado_idx" ON "Pago"("estado");

-- CreateIndex
CREATE INDEX "Pago_idTransferencia_idx" ON "Pago"("idTransferencia");

-- CreateIndex
CREATE INDEX "Pago_entidadPago_idx" ON "Pago"("entidadPago");

-- CreateIndex
CREATE INDEX "Pago_fechaTransferencia_idx" ON "Pago"("fechaTransferencia");

-- CreateIndex
CREATE INDEX "Pago_codigoEntregaExpira_idx" ON "Pago"("codigoEntregaExpira");

-- CreateIndex
CREATE INDEX "Pago_codigoEntregaBloqueado_idx" ON "Pago"("codigoEntregaBloqueado");

-- CreateIndex
CREATE INDEX "SolicitudAltaNegocio_userId_idx" ON "SolicitudAltaNegocio"("userId");

-- CreateIndex
CREATE INDEX "SolicitudAltaNegocio_estado_idx" ON "SolicitudAltaNegocio"("estado");

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

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Negocio" ADD CONSTRAINT "Negocio_aprobadoPorId_fkey" FOREIGN KEY ("aprobadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Negocio" ADD CONSTRAINT "Negocio_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Negocio" ADD CONSTRAINT "Negocio_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Municipio" ADD CONSTRAINT "Municipio_provinciaId_fkey" FOREIGN KEY ("provinciaId") REFERENCES "Provincia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subarea" ADD CONSTRAINT "Subarea_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NegocioSubarea" ADD CONSTRAINT "NegocioSubarea_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NegocioSubarea" ADD CONSTRAINT "NegocioSubarea_subareaId_fkey" FOREIGN KEY ("subareaId") REFERENCES "Subarea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_subareaId_fkey" FOREIGN KEY ("subareaId") REFERENCES "Subarea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Servicio" ADD CONSTRAINT "Servicio_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Servicio" ADD CONSTRAINT "Servicio_subareaId_fkey" FOREIGN KEY ("subareaId") REFERENCES "Subarea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrecioProducto" ADD CONSTRAINT "PrecioProducto_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrecioProducto" ADD CONSTRAINT "PrecioProducto_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreferenciaMonedaUsuario" ADD CONSTRAINT "PreferenciaMonedaUsuario_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventario" ADD CONSTRAINT "Inventario_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Carrito" ADD CONSTRAINT "Carrito_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarritoItem" ADD CONSTRAINT "CarritoItem_carritoId_fkey" FOREIGN KEY ("carritoId") REFERENCES "Carrito"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarritoItem" ADD CONSTRAINT "CarritoItem_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarritoItem" ADD CONSTRAINT "CarritoItem_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProveedorLogistico" ADD CONSTRAINT "ProveedorLogistico_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpcionLogistica" ADD CONSTRAINT "OpcionLogistica_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpcionLogistica" ADD CONSTRAINT "OpcionLogistica_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "ProveedorLogistico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_opcionLogisticaId_fkey" FOREIGN KEY ("opcionLogisticaId") REFERENCES "OpcionLogistica"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoItem" ADD CONSTRAINT "PedidoItem_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoItem" ADD CONSTRAINT "PedidoItem_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoItem" ADD CONSTRAINT "PedidoItem_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoItem" ADD CONSTRAINT "PedidoItem_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Factura" ADD CONSTRAINT "Factura_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Factura" ADD CONSTRAINT "Factura_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Factura" ADD CONSTRAINT "Factura_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacturaItem" ADD CONSTRAINT "FacturaItem_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "Factura"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacturaItem" ADD CONSTRAINT "FacturaItem_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacturaItem" ADD CONSTRAINT "FacturaItem_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReporteVenta" ADD CONSTRAINT "ReporteVenta_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisponibilidadProducto" ADD CONSTRAINT "DisponibilidadProducto_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HorarioNegocio" ADD CONSTRAINT "HorarioNegocio_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Promocion" ADD CONSTRAINT "Promocion_creadaPorId_fkey" FOREIGN KEY ("creadaPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Promocion" ADD CONSTRAINT "Promocion_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromocionUso" ADD CONSTRAINT "PromocionUso_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromocionUso" ADD CONSTRAINT "PromocionUso_promocionId_fkey" FOREIGN KEY ("promocionId") REFERENCES "Promocion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromocionUso" ADD CONSTRAINT "PromocionUso_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cupon" ADD CONSTRAINT "Cupon_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cupon" ADD CONSTRAINT "Cupon_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CuponUso" ADD CONSTRAINT "CuponUso_cuponId_fkey" FOREIGN KEY ("cuponId") REFERENCES "Cupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CuponUso" ADD CONSTRAINT "CuponUso_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CuponUso" ADD CONSTRAINT "CuponUso_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Combo" ADD CONSTRAINT "Combo_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Combo" ADD CONSTRAINT "Combo_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComboItem" ADD CONSTRAINT "ComboItem_comboId_fkey" FOREIGN KEY ("comboId") REFERENCES "Combo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComboItem" ADD CONSTRAINT "ComboItem_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComboItem" ADD CONSTRAINT "ComboItem_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComboUso" ADD CONSTRAINT "ComboUso_comboId_fkey" FOREIGN KEY ("comboId") REFERENCES "Combo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComboUso" ADD CONSTRAINT "ComboUso_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComboUso" ADD CONSTRAINT "ComboUso_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NegocioUsuario" ADD CONSTRAINT "NegocioUsuario_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NegocioUsuario" ADD CONSTRAINT "NegocioUsuario_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_confirmadoPorId_fkey" FOREIGN KEY ("confirmadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "Factura"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitudAltaNegocio" ADD CONSTRAINT "SolicitudAltaNegocio_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitudAltaNegocio" ADD CONSTRAINT "SolicitudAltaNegocio_revisadoPorId_fkey" FOREIGN KEY ("revisadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitudAltaNegocio" ADD CONSTRAINT "SolicitudAltaNegocio_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreferenciaNotificacion" ADD CONSTRAINT "PreferenciaNotificacion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
