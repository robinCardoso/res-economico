-- Remover o índice único se existir (pode ter sido criado como índice)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'VendaAnalytics_ano_mes_nomeFantasia_marca_grupo_subgrupo_tipoOperacao_uf_empresaId_key'
    AND tablename = 'VendaAnalytics'
  ) THEN
    DROP INDEX IF EXISTS "VendaAnalytics_ano_mes_nomeFantasia_marca_grupo_subgrupo_tipoOperacao_uf_empresaId_key";
  END IF;
END $$;

-- Remover constraint se existir (pode ter sido criado como constraint)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'VendaAnalytics_ano_mes_nomeFantasia_marca_grupo_subgrupo_tipoOperacao_uf_empresaId_key'
    AND conrelid = '"VendaAnalytics"'::regclass
  ) THEN
    ALTER TABLE "VendaAnalytics" 
    DROP CONSTRAINT "VendaAnalytics_ano_mes_nomeFantasia_marca_grupo_subgrupo_tipoOperacao_uf_empresaId_key";
  END IF;
END $$;

-- Criar constraint único (não índice) - necessário para ON CONFLICT
-- PostgreSQL trata NULLs de forma especial: dois NULLs não são considerados iguais em constraints únicos
ALTER TABLE "VendaAnalytics" 
ADD CONSTRAINT "VendaAnalytics_ano_mes_nomeFantasia_marca_grupo_subgrupo_tipoOperacao_uf_empresaId_key" 
UNIQUE ("ano", "mes", "nomeFantasia", "marca", "grupo", "subgrupo", "tipoOperacao", "uf", "empresaId");
