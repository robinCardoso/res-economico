-- =====================================================
-- PEDIDOS TABLES
-- =====================================================

-- CreateTable Pedido
CREATE TABLE IF NOT EXISTS "Pedido" (
    "id" TEXT NOT NULL,
    "numeroPedido" TEXT NOT NULL,
    "idDoc" TEXT,
    "dataPedido" TIMESTAMP(3) NOT NULL,
    "nomeFantasia" TEXT NOT NULL,
    "idProd" TEXT,
    "referencia" TEXT,
    "descricaoProduto" TEXT,
    "marca" TEXT,
    "grupo" TEXT,
    "subgrupo" TEXT,
    "quantidade" DECIMAL(18,3) NOT NULL,
    "valorUnitario" DECIMAL(18,2) NOT NULL,
    "valorTotal" DECIMAL(18,2) NOT NULL,
    "empresaId" TEXT,
    "produtoId" TEXT,
    "importacaoLogId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pedido_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Pedido_numeroPedido_idDoc_referencia_key" ON "Pedido"("numeroPedido", "idDoc", "referencia");
CREATE INDEX "Pedido_numeroPedido_idx" ON "Pedido"("numeroPedido");
CREATE INDEX "Pedido_dataPedido_idx" ON "Pedido"("dataPedido");
CREATE INDEX "Pedido_empresaId_dataPedido_idx" ON "Pedido"("empresaId", "dataPedido");
CREATE INDEX "Pedido_referencia_idx" ON "Pedido"("referencia");
CREATE INDEX "Pedido_nomeFantasia_idx" ON "Pedido"("nomeFantasia");
CREATE INDEX "Pedido_idDoc_idx" ON "Pedido"("idDoc");
CREATE INDEX "Pedido_marca_idx" ON "Pedido"("marca");
CREATE INDEX "Pedido_grupo_idx" ON "Pedido"("grupo");
CREATE INDEX "Pedido_subgrupo_idx" ON "Pedido"("subgrupo");
CREATE INDEX "Pedido_importacaoLogId_idx" ON "Pedido"("importacaoLogId");
CREATE INDEX "Pedido_numeroPedido_dataPedido_referencia_idx" ON "Pedido"("numeroPedido", "dataPedido", "referencia");

-- CreateTable PedidoAnalytics
CREATE TABLE IF NOT EXISTS "PedidoAnalytics" (
    "id" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "nomeFantasia" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "grupo" TEXT,
    "subgrupo" TEXT,
    "empresaId" TEXT,
    "totalValor" DECIMAL(18,2) NOT NULL,
    "totalQuantidade" DECIMAL(18,3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PedidoAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PedidoAnalytics_ano_mes_nomeFantasia_marca_grupo_subgrupo_empresaId_key" ON "PedidoAnalytics"("ano", "mes", "nomeFantasia", "marca", "grupo", "subgrupo", "empresaId");
CREATE INDEX "PedidoAnalytics_ano_mes_idx" ON "PedidoAnalytics"("ano", "mes");
CREATE INDEX "PedidoAnalytics_empresaId_ano_mes_idx" ON "PedidoAnalytics"("empresaId", "ano", "mes");
CREATE INDEX "PedidoAnalytics_marca_idx" ON "PedidoAnalytics"("marca");
CREATE INDEX "PedidoAnalytics_grupo_idx" ON "PedidoAnalytics"("grupo");
CREATE INDEX "PedidoAnalytics_subgrupo_idx" ON "PedidoAnalytics"("subgrupo");
CREATE INDEX "PedidoAnalytics_nomeFantasia_idx" ON "PedidoAnalytics"("nomeFantasia");

-- CreateTable PedidoImportacaoLog
CREATE TABLE IF NOT EXISTS "PedidoImportacaoLog" (
    "id" TEXT NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "mappingName" TEXT,
    "totalLinhas" INTEGER NOT NULL,
    "sucessoCount" INTEGER NOT NULL DEFAULT 0,
    "erroCount" INTEGER NOT NULL DEFAULT 0,
    "produtosNaoEncontrados" INTEGER NOT NULL DEFAULT 0,
    "duplicatasCount" INTEGER NOT NULL DEFAULT 0,
    "novosCount" INTEGER NOT NULL DEFAULT 0,
    "progresso" INTEGER NOT NULL DEFAULT 0,
    "linhasProcessadas" INTEGER NOT NULL DEFAULT 0,
    "usuarioEmail" TEXT NOT NULL,
    "usuarioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PedidoImportacaoLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PedidoImportacaoLog_createdAt_idx" ON "PedidoImportacaoLog"("createdAt");
CREATE INDEX "PedidoImportacaoLog_usuarioId_idx" ON "PedidoImportacaoLog"("usuarioId");

-- AddForeignKey constraints
DO $$ 
BEGIN
  -- Pedido -> Empresa
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Pedido_empresaId_fkey') THEN
    ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  
  -- Pedido -> Produto
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Pedido_produtoId_fkey') THEN
    ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  
  -- Pedido -> PedidoImportacaoLog
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Pedido_importacaoLogId_fkey') THEN
    ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_importacaoLogId_fkey" FOREIGN KEY ("importacaoLogId") REFERENCES "PedidoImportacaoLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  
  -- PedidoAnalytics -> Empresa
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PedidoAnalytics_empresaId_fkey') THEN
    ALTER TABLE "PedidoAnalytics" ADD CONSTRAINT "PedidoAnalytics_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  
  -- PedidoImportacaoLog -> Usuario
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PedidoImportacaoLog_usuarioId_fkey') THEN
    ALTER TABLE "PedidoImportacaoLog" ADD CONSTRAINT "PedidoImportacaoLog_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN others THEN 
    RAISE WARNING 'Error adding foreign key: %', SQLERRM;
END $$;
