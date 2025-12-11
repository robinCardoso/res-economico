-- AlterTable: Adicionar campo tipoOperacao à tabela VendaAnalytics
ALTER TABLE "VendaAnalytics" ADD COLUMN IF NOT EXISTS "tipoOperacao" TEXT;

-- DropIndex: Remover constraint único antigo (sem tipoOperacao)
-- Usar regclass para garantir case-sensitivity correta
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'VendaAnalytics_ano_mes_nomeFantasia_marca_grupo_subgrupo_uf_key'
    AND conrelid = '"VendaAnalytics"'::regclass
  ) THEN
    ALTER TABLE "VendaAnalytics" 
    DROP CONSTRAINT "VendaAnalytics_ano_mes_nomeFantasia_marca_grupo_subgrupo_uf_key";
  END IF;
END $$;

-- CreateIndex: Criar novo constraint único incluindo tipoOperacao
-- PostgreSQL trata NULLs de forma especial: dois NULLs não são considerados iguais em constraints únicos
-- Isso permite múltiplos registros com tipoOperacao NULL para a mesma combinação de outros campos
CREATE UNIQUE INDEX IF NOT EXISTS "VendaAnalytics_ano_mes_nomeFantasia_marca_grupo_subgrupo_tipoOperacao_uf_key" 
ON "VendaAnalytics"("ano", "mes", "nomeFantasia", "marca", "grupo", "subgrupo", "tipoOperacao", "uf");

-- CreateIndex: Criar índice para tipoOperacao para melhor performance em filtros
CREATE INDEX IF NOT EXISTS "VendaAnalytics_tipoOperacao_idx" ON "VendaAnalytics"("tipoOperacao");
