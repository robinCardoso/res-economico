-- =====================================================
-- BRAVO ERP - MÓDULO DE SINCRONIZAÇÃO
-- Migration: add_bravo_erp_module
-- =====================================================

-- =====================================================
-- BRAVO ERP - CONFIGURAÇÕES
-- =====================================================

-- CreateTable
CREATE TABLE "BravoSyncConfig" (
    "id" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'string',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BravoSyncConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BravoSyncConfig_chave_key" ON "BravoSyncConfig"("chave");

-- CreateIndex
CREATE INDEX "BravoSyncConfig_chave_idx" ON "BravoSyncConfig"("chave");

-- =====================================================
-- BRAVO ERP - MAPEAMENTO DE CAMPOS
-- =====================================================

-- CreateTable
CREATE TABLE "BravoCampoMapeamento" (
    "id" SERIAL NOT NULL,
    "campo_bravo" TEXT NOT NULL,
    "campo_interno" TEXT NOT NULL,
    "tipo_transformacao" TEXT NOT NULL DEFAULT 'direto',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BravoCampoMapeamento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BravoCampoMapeamento_ativo_idx" ON "BravoCampoMapeamento"("ativo");

-- CreateIndex
CREATE INDEX "BravoCampoMapeamento_ordem_idx" ON "BravoCampoMapeamento"("ordem");

-- =====================================================
-- BRAVO ERP - PRODUTOS
-- =====================================================

-- CreateTable
CREATE TABLE "Produto" (
    "id" TEXT NOT NULL,
    "referencia" TEXT NOT NULL,
    "id_prod" TEXT,
    "descricao" TEXT,
    "marca" TEXT,
    "grupo" TEXT,
    "subgrupo" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "gtin" TEXT,
    "ncm" TEXT,
    "cest" TEXT,
    "dataUltModif" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Produto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Produto_referencia_key" ON "Produto"("referencia");

-- CreateIndex
CREATE INDEX "Produto_referencia_idx" ON "Produto"("referencia");

-- CreateIndex
CREATE INDEX "Produto_id_prod_idx" ON "Produto"("id_prod");

-- CreateIndex
CREATE INDEX "Produto_ativo_idx" ON "Produto"("ativo");

-- CreateIndex
CREATE INDEX "Produto_marca_idx" ON "Produto"("marca");

-- CreateIndex
CREATE INDEX "Produto_grupo_idx" ON "Produto"("grupo");

-- CreateIndex
CREATE INDEX "Produto_dataUltModif_idx" ON "Produto"("dataUltModif");

-- =====================================================
-- BRAVO ERP - LOGS DE SINCRONIZAÇÃO
-- =====================================================

-- CreateTable
CREATE TABLE "BravoSyncLog" (
    "id" TEXT NOT NULL,
    "sync_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "status_detalhado" TEXT,
    "apenas_ativos" BOOLEAN NOT NULL DEFAULT true,
    "limit_requested" INTEGER,
    "pages_requested" INTEGER,
    "effective_limit" INTEGER,
    "current_page" INTEGER DEFAULT 1,
    "pages_processed" INTEGER,
    "total_pages_found" INTEGER,
    "resume_from_page" INTEGER,
    "total_produtos_bravo" INTEGER DEFAULT 0,
    "produtos_filtrados" INTEGER DEFAULT 0,
    "produtos_analisados" INTEGER DEFAULT 0,
    "produtos_inseridos" INTEGER DEFAULT 0,
    "produtos_atualizados" INTEGER DEFAULT 0,
    "produtos_ignorados" INTEGER DEFAULT 0,
    "produtos_com_erro" INTEGER DEFAULT 0,
    "taxa_otimizacao" TEXT,
    "economia_queries" INTEGER DEFAULT 0,
    "error_message" TEXT,
    "error_details" JSONB,
    "tipos_erro" JSONB,
    "sugestoes_correcao" TEXT[],
    "tempo_total_segundos" INTEGER,
    "percentual_sucesso" INTEGER,
    "triggered_by" TEXT,
    "user_agent" TEXT,
    "userId" TEXT,
    "can_resume" BOOLEAN NOT NULL DEFAULT false,
    "sync_details" JSONB,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "last_activity_at" TIMESTAMP(3),

    CONSTRAINT "BravoSyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BravoSyncLog_status_idx" ON "BravoSyncLog"("status");

-- CreateIndex
CREATE INDEX "BravoSyncLog_sync_type_idx" ON "BravoSyncLog"("sync_type");

-- CreateIndex
CREATE INDEX "BravoSyncLog_started_at_idx" ON "BravoSyncLog"("started_at");

-- CreateIndex
CREATE INDEX "BravoSyncLog_can_resume_idx" ON "BravoSyncLog"("can_resume");

-- CreateIndex
CREATE INDEX "BravoSyncLog_userId_idx" ON "BravoSyncLog"("userId");

-- =====================================================
-- BRAVO ERP - PROGRESSO DE SINCRONIZAÇÃO
-- =====================================================

-- CreateTable
CREATE TABLE "BravoSyncProgress" (
    "id" TEXT NOT NULL,
    "sync_log_id" TEXT NOT NULL,
    "progress_percentage" DECIMAL(5,2) NOT NULL,
    "current_step" TEXT,
    "current_page" INTEGER,
    "total_pages" INTEGER,
    "products_processed" INTEGER DEFAULT 0,
    "products_inserted_current_page" INTEGER DEFAULT 0,
    "total_produtos_bravo" INTEGER,
    "estimated_time_remaining" TEXT,
    "current_product" TEXT,
    "status_atual" TEXT,
    "etapa_atual" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BravoSyncProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BravoSyncProgress_sync_log_id_key" ON "BravoSyncProgress"("sync_log_id");

-- CreateIndex
CREATE INDEX "BravoSyncProgress_sync_log_id_idx" ON "BravoSyncProgress"("sync_log_id");

-- AddForeignKey
ALTER TABLE "BravoSyncProgress" ADD CONSTRAINT "BravoSyncProgress_sync_log_id_fkey" FOREIGN KEY ("sync_log_id") REFERENCES "BravoSyncLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- =====================================================
-- BRAVO ERP - AGREGADOS (Marcas, Grupos, Subgrupos)
-- =====================================================

-- CreateTable
CREATE TABLE "Marca" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Marca_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Marca_nome_key" ON "Marca"("nome");

-- CreateIndex
CREATE INDEX "Marca_nome_idx" ON "Marca"("nome");

-- CreateTable
CREATE TABLE "Grupo" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Grupo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Grupo_nome_key" ON "Grupo"("nome");

-- CreateIndex
CREATE INDEX "Grupo_nome_idx" ON "Grupo"("nome");

-- CreateTable
CREATE TABLE "Subgrupo" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subgrupo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subgrupo_nome_key" ON "Subgrupo"("nome");

-- CreateIndex
CREATE INDEX "Subgrupo_nome_idx" ON "Subgrupo"("nome");
