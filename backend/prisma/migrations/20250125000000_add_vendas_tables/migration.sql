-- =====================================================
-- VENDAS - IMPORTAÇÃO DE VENDAS
-- Migration: add_vendas_tables
-- =====================================================

-- =====================================================
-- TABELA VENDA
-- =====================================================

-- CreateTable
CREATE TABLE "Venda" (
    "id" TEXT NOT NULL,
    "nfe" TEXT NOT NULL,
    "idDoc" TEXT,
    "dataVenda" TIMESTAMP(3) NOT NULL,
    "razaoSocial" TEXT NOT NULL,
    "nomeFantasia" TEXT,
    "cnpjCliente" TEXT,
    "ufDestino" TEXT,
    "ufOrigem" TEXT,
    "idProd" TEXT,
    "referencia" TEXT,
    "prodCodMestre" TEXT,
    "descricaoProduto" TEXT,
    "marca" TEXT,
    "grupo" TEXT,
    "subgrupo" TEXT,
    "tipoOperacao" TEXT,
    "quantidade" DECIMAL(18,3) NOT NULL,
    "valorUnitario" DECIMAL(18,2) NOT NULL,
    "valorTotal" DECIMAL(18,2) NOT NULL,
    "empresaId" TEXT,
    "produtoId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Venda_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Venda_nfe_idx" ON "Venda"("nfe");

-- CreateIndex
CREATE INDEX "Venda_dataVenda_idx" ON "Venda"("dataVenda");

-- CreateIndex
CREATE INDEX "Venda_empresaId_dataVenda_idx" ON "Venda"("empresaId", "dataVenda");

-- CreateIndex
CREATE INDEX "Venda_referencia_idx" ON "Venda"("referencia");

-- CreateIndex
CREATE INDEX "Venda_razaoSocial_idx" ON "Venda"("razaoSocial");

-- CreateIndex
CREATE INDEX "Venda_idDoc_idx" ON "Venda"("idDoc");

-- CreateIndex
CREATE INDEX "Venda_marca_idx" ON "Venda"("marca");

-- CreateIndex
CREATE INDEX "Venda_grupo_idx" ON "Venda"("grupo");

-- CreateIndex
CREATE INDEX "Venda_subgrupo_idx" ON "Venda"("subgrupo");

-- CreateIndex
CREATE INDEX "Venda_prodCodMestre_idx" ON "Venda"("prodCodMestre");

-- CreateIndex
CREATE INDEX "Venda_tipoOperacao_idx" ON "Venda"("tipoOperacao");

-- CreateIndex
CREATE INDEX "Venda_nfe_dataVenda_referencia_idx" ON "Venda"("nfe", "dataVenda", "referencia");

-- CreateIndex
CREATE UNIQUE INDEX "Venda_nfe_idDoc_referencia_key" ON "Venda"("nfe", "idDoc", "referencia");

-- AddForeignKey
ALTER TABLE "Venda" ADD CONSTRAINT "Venda_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venda" ADD CONSTRAINT "Venda_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- =====================================================
-- TABELA VENDA ANALYTICS
-- =====================================================

-- CreateTable
CREATE TABLE "VendaAnalytics" (
    "id" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "nomeFantasia" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "grupo" TEXT,
    "subgrupo" TEXT,
    "uf" TEXT NOT NULL,
    "totalValor" DECIMAL(18,2) NOT NULL,
    "totalQuantidade" DECIMAL(18,3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendaAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VendaAnalytics_ano_mes_nomeFantasia_marca_uf_key" ON "VendaAnalytics"("ano", "mes", "nomeFantasia", "marca", "uf");

-- CreateIndex
CREATE INDEX "VendaAnalytics_ano_mes_idx" ON "VendaAnalytics"("ano", "mes");

-- CreateIndex
CREATE INDEX "VendaAnalytics_marca_idx" ON "VendaAnalytics"("marca");

-- CreateIndex
CREATE INDEX "VendaAnalytics_grupo_idx" ON "VendaAnalytics"("grupo");

-- CreateIndex
CREATE INDEX "VendaAnalytics_subgrupo_idx" ON "VendaAnalytics"("subgrupo");

-- CreateIndex
CREATE INDEX "VendaAnalytics_uf_idx" ON "VendaAnalytics"("uf");

-- CreateIndex
CREATE INDEX "VendaAnalytics_nomeFantasia_idx" ON "VendaAnalytics"("nomeFantasia");

-- =====================================================
-- TABELA VENDA IMPORTACAO LOG
-- =====================================================

-- CreateTable
CREATE TABLE "VendaImportacaoLog" (
    "id" TEXT NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "mappingName" TEXT,
    "totalLinhas" INTEGER NOT NULL,
    "sucessoCount" INTEGER NOT NULL DEFAULT 0,
    "erroCount" INTEGER NOT NULL DEFAULT 0,
    "produtosNaoEncontrados" INTEGER NOT NULL DEFAULT 0,
    "usuarioEmail" TEXT NOT NULL,
    "usuarioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendaImportacaoLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VendaImportacaoLog_createdAt_idx" ON "VendaImportacaoLog"("createdAt");

-- CreateIndex
CREATE INDEX "VendaImportacaoLog_usuarioId_idx" ON "VendaImportacaoLog"("usuarioId");

-- AddForeignKey
ALTER TABLE "VendaImportacaoLog" ADD CONSTRAINT "VendaImportacaoLog_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
