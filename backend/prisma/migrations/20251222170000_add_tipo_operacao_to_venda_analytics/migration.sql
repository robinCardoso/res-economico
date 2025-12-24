-- AlterTable: Adicionar campo tipoOperacao à tabela VendaAnalytics
ALTER TABLE "VendaAnalytics" ADD COLUMN IF NOT EXISTS "tipoOperacao" TEXT;

-- DropIndex: Remover constraints únicos antigos (sem tipoOperacao)
DO $$
BEGIN
  -- Constraint sem tipoOperacao e sem empresaId
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'VendaAnalytics_ano_mes_nomeFantasia_marca_grupo_subgrupo_uf_key'
    AND conrelid = '"VendaAnalytics"'::regclass
  ) THEN
    ALTER TABLE "VendaAnalytics" 
    DROP CONSTRAINT "VendaAnalytics_ano_mes_nomeFantasia_marca_grupo_subgrupo_uf_key";
  END IF;
  
  -- Constraint temporária com empresaId mas sem tipoOperacao
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'VendaAnalytics_ano_mes_nomeFantasia_marca_grupo_subgrupo_uf_empresaId_key'
    AND conrelid = '"VendaAnalytics"'::regclass
  ) THEN
    ALTER TABLE "VendaAnalytics" 
    DROP CONSTRAINT "VendaAnalytics_ano_mes_nomeFantasia_marca_grupo_subgrupo_uf_empresaId_key";
  END IF;
END $$;

-- CreateConstraint: Criar constraint único FINAL incluindo tipoOperacao E empresaId
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'VendaAnalytics_ano_mes_nomeFantasia_marca_grupo_subgrupo_tipoOperacao_uf_empresaId_key'
    AND conrelid = '"VendaAnalytics"'::regclass
  ) THEN
    ALTER TABLE "VendaAnalytics" 
    ADD CONSTRAINT "VendaAnalytics_ano_mes_nomeFantasia_marca_grupo_subgrupo_tipoOperacao_uf_empresaId_key" 
    UNIQUE ("ano", "mes", "nomeFantasia", "marca", "grupo", "subgrupo", "tipoOperacao", "uf", "empresaId");
  END IF;
END $$;

-- CreateIndex: Criar índice para tipoOperacao para melhor performance em filtros
CREATE INDEX IF NOT EXISTS "VendaAnalytics_tipoOperacao_idx" ON "VendaAnalytics"("tipoOperacao");
