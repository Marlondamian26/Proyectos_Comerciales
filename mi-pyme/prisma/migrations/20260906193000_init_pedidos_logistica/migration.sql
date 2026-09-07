-- CreateTable
CREATE TABLE "ProveedorLogistico" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "zonaCobertura" TEXT NOT NULL,
    "contacto" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProveedorLogistico_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OpcionLogistica" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "negocioId" TEXT NOT NULL,
    "proveedorId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "tarifaBase" REAL NOT NULL,
    "tarifaPorDistancia" REAL NOT NULL,
    "tiempoEstimado" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OpcionLogistica_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OpcionLogistica_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "ProveedorLogistico" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pedido" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "total" REAL NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "tipo" TEXT NOT NULL,
    "negocioIds" JSONB NOT NULL,
    "logisticaId" TEXT,
    "direccionEntrega" TEXT NOT NULL,
    "fechaCreacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Pedido_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Pedido_logisticaId_fkey" FOREIGN KEY ("logisticaId") REFERENCES "OpcionLogistica" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PedidoItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pedidoId" TEXT NOT NULL,
    "productoId" TEXT,
    "servicioId" TEXT,
    "cantidad" INTEGER NOT NULL,
    "precioUnitario" REAL NOT NULL,
    "subtotal" REAL NOT NULL,
    "negocioId" TEXT NOT NULL,
    CONSTRAINT "PedidoItem_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PedidoItem_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PedidoItem_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PedidoItem_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
