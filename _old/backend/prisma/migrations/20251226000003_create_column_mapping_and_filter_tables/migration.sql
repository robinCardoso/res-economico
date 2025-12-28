-- =====================================================
-- PEDIDOS - COLUMN MAPPING TABLES
-- =====================================================

-- CreateTable PedidoColumnMapping
CREATE TABLE IF NOT EXISTS "PedidoColumnMapping" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "columnMapping" JSONB NOT NULL,
    "filters" JSONB,
    "descricao" TEXT,
    "usuarioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PedidoColumnMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PedidoColumnMapping_usuarioId_idx" ON "PedidoColumnMapping"("usuarioId");
CREATE INDEX "PedidoColumnMapping_createdAt_idx" ON "PedidoColumnMapping"("createdAt");

-- CreateTable PedidoAnalyticsFilter
CREATE TABLE IF NOT EXISTS "PedidoAnalyticsFilter" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "descricao" TEXT,
    "usuarioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PedidoAnalyticsFilter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PedidoAnalyticsFilter_usuarioId_idx" ON "PedidoAnalyticsFilter"("usuarioId");
CREATE INDEX "PedidoAnalyticsFilter_createdAt_idx" ON "PedidoAnalyticsFilter"("createdAt");

-- AddForeignKey constraints
DO $$ 
BEGIN
  -- PedidoColumnMapping -> Usuario
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PedidoColumnMapping_usuarioId_fkey') THEN
    ALTER TABLE "PedidoColumnMapping" ADD CONSTRAINT "PedidoColumnMapping_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  
  -- PedidoAnalyticsFilter -> Usuario
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PedidoAnalyticsFilter_usuarioId_fkey') THEN
    ALTER TABLE "PedidoAnalyticsFilter" ADD CONSTRAINT "PedidoAnalyticsFilter_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN others THEN 
    RAISE WARNING 'Error adding foreign key: %', SQLERRM;
END $$;
