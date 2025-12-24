-- =====================================================
-- PROCESSOS - GARANTIA, DEVOLUÇÃO, RECLAMAÇÃO
-- =====================================================

-- CreateEnum TipoProcesso
DO $$ BEGIN
  CREATE TYPE "TipoProcesso" AS ENUM ('GARANTIA', 'DEVOLUCAO', 'RECLAMACAO');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateEnum SituacaoProcesso
DO $$ BEGIN
  CREATE TYPE "SituacaoProcesso" AS ENUM ('AGUARDANDO_ANALISE', 'EM_ANALISE', 'APROVADO', 'REJEITADO', 'EM_PROCESSAMENTO', 'CONCLUIDO', 'CANCELADO');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateEnum CategoriaReclamacao
DO $$ BEGIN
  CREATE TYPE "CategoriaReclamacao" AS ENUM ('ATENDIMENTO', 'PRODUTOS', 'LOGISTICA', 'FINANCEIRO', 'TECNICO', 'COMUNICACAO');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateEnum PrioridadeProcesso
DO $$ BEGIN
  CREATE TYPE "PrioridadeProcesso" AS ENUM ('BAIXA', 'MEDIA', 'ALTA');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateEnum TipoArquivoProcesso
DO $$ BEGIN
  CREATE TYPE "TipoArquivoProcesso" AS ENUM ('IMAGEM', 'VIDEO', 'DOCUMENTO', 'NOTA_FISCAL', 'PROTOCOLO_FABRICA');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable Processo
CREATE TABLE IF NOT EXISTS "Processo" (
    "id" TEXT NOT NULL,
    "numeroControle" TEXT NOT NULL,
    "protocolo" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "empresaId" TEXT,
    "tipo" "TipoProcesso" NOT NULL,
    "situacao" "SituacaoProcesso" NOT NULL DEFAULT 'AGUARDANDO_ANALISE',
    "nomeClienteAssociado" TEXT NOT NULL,
    "razaoSocial" TEXT NOT NULL,
    "titulo" TEXT,
    "descricao" TEXT,
    "categoria" "CategoriaReclamacao",
    "prioridade" "PrioridadeProcesso",
    "contatoRetorno" TEXT,
    "uf" TEXT,
    "cidade" TEXT,
    "fabrica" TEXT,
    "importacao" TEXT,
    "ano" TEXT,
    "reclamacao" TEXT,
    "responsavel" TEXT,
    "prazoResolucao" TIMESTAMP(3),
    "dataSolucao" TIMESTAMP(3),
    "comentarios" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Processo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Processo_numeroControle_key" ON "Processo"("numeroControle");
CREATE UNIQUE INDEX "Processo_protocolo_key" ON "Processo"("protocolo");
CREATE INDEX "Processo_userId_createdAt_idx" ON "Processo"("userId", "createdAt");
CREATE INDEX "Processo_empresaId_createdAt_idx" ON "Processo"("empresaId", "createdAt");
CREATE INDEX "Processo_tipo_situacao_idx" ON "Processo"("tipo", "situacao");
CREATE INDEX "Processo_situacao_createdAt_idx" ON "Processo"("situacao", "createdAt");
CREATE INDEX "Processo_numeroControle_idx" ON "Processo"("numeroControle");
CREATE INDEX "Processo_protocolo_idx" ON "Processo"("protocolo");

-- CreateTable ProcessoItem
CREATE TABLE IF NOT EXISTS "ProcessoItem" (
    "id" TEXT NOT NULL,
    "processoId" TEXT NOT NULL,
    "nf" TEXT NOT NULL,
    "referencia" TEXT NOT NULL,
    "descricaoProduto" TEXT,
    "qtd" INTEGER NOT NULL,
    "valorUnit" DECIMAL(18,2) NOT NULL,
    "detalhes" TEXT NOT NULL,
    "marca" TEXT,
    "dataInstalacao" TIMESTAMP(3),
    "dataRemocao" TIMESTAMP(3),
    "kmInstalacao" TEXT,
    "kmRemocao" TEXT,
    "modeloVeiculo" TEXT,
    "anoVeiculo" TEXT,
    "marcaVeiculo" TEXT,
    "temCustoGarantia" BOOLEAN NOT NULL DEFAULT false,
    "valorCusto" DECIMAL(18,2),
    "infoPecas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcessoItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProcessoItem_processoId_idx" ON "ProcessoItem"("processoId");

-- CreateTable ProcessoAnexo
CREATE TABLE IF NOT EXISTS "ProcessoAnexo" (
    "id" TEXT NOT NULL,
    "processoId" TEXT NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "urlArquivo" TEXT NOT NULL,
    "tipoArquivo" "TipoArquivoProcesso" NOT NULL,
    "tamanhoArquivo" INTEGER,
    "mimeType" TEXT,
    "uploadedBy" TEXT,
    "metadata" JSONB,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessoAnexo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProcessoAnexo_processoId_idx" ON "ProcessoAnexo"("processoId");

-- CreateTable ProcessoHistorico
CREATE TABLE IF NOT EXISTS "ProcessoHistorico" (
    "id" TEXT NOT NULL,
    "processoId" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "usuarioId" TEXT,
    "usuarioNome" TEXT,
    "dadosAnteriores" JSONB,
    "dadosNovos" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessoHistorico_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProcessoHistorico_processoId_createdAt_idx" ON "ProcessoHistorico"("processoId", "createdAt");
CREATE INDEX "ProcessoHistorico_usuarioId_idx" ON "ProcessoHistorico"("usuarioId");

-- AddForeignKey constraints
DO $$ 
BEGIN
  -- Processo -> Usuario
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Processo_userId_fkey') THEN
    ALTER TABLE "Processo" ADD CONSTRAINT "Processo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  
  -- Processo -> Empresa
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Processo_empresaId_fkey') THEN
    ALTER TABLE "Processo" ADD CONSTRAINT "Processo_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  
  -- ProcessoItem -> Processo
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProcessoItem_processoId_fkey') THEN
    ALTER TABLE "ProcessoItem" ADD CONSTRAINT "ProcessoItem_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "Processo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  
  -- ProcessoAnexo -> Processo
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProcessoAnexo_processoId_fkey') THEN
    ALTER TABLE "ProcessoAnexo" ADD CONSTRAINT "ProcessoAnexo_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "Processo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  
  -- ProcessoHistorico -> Processo
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProcessoHistorico_processoId_fkey') THEN
    ALTER TABLE "ProcessoHistorico" ADD CONSTRAINT "ProcessoHistorico_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "Processo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN others THEN 
    RAISE WARNING 'Error adding foreign key: %', SQLERRM;
END $$;
