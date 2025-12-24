-- AlterTable: Adicionar campo empresaId à tabela VendaAnalytics
ALTER TABLE "VendaAnalytics" ADD COLUMN IF NOT EXISTS "empresaId" TEXT;

-- Adicionar foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'VendaAnalytics_empresaId_fkey'
    AND conrelid = '"VendaAnalytics"'::regclass
  ) THEN
    ALTER TABLE "VendaAnalytics" 
    ADD CONSTRAINT "VendaAnalytics_empresaId_fkey" 
    FOREIGN KEY ("empresaId") 
    REFERENCES "Empresa"("id") 
    ON DELETE SET NULL 
    ON UPDATE CASCADE;
  END IF;
END $$;

-- DropIndex: Remover constraint único antigo (sem empresaId e sem tipoOperacao se existir)
DO $$
BEGIN
  -- Remover constraint antigo que PODE ter tipoOperacao
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'VendaAnalytics_ano_mes_nomeFantasia_marca_grupo_subgrupo_tipoOperacao_uf_key'
    AND conrelid = '"VendaAnalytics"'::regclass
  ) THEN
    ALTER TABLE "VendaAnalytics" 
    DROP CONSTRAINT "VendaAnalytics_ano_mes_nomeFantasia_marca_grupo_subgrupo_tipoOperacao_uf_key";
  END IF;
  
  -- Remover constraint mais antiga (sem tipoOperacao)
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'VendaAnalytics_ano_mes_nomeFantasia_marca_uf_key'
    AND conrelid = '"VendaAnalytics"'::regclass
  ) THEN
    ALTER TABLE "VendaAnalytics" 
    DROP CONSTRAINT "VendaAnalytics_ano_mes_nomeFantasia_marca_uf_key";
  END IF;
END $$;

-- CreateConstraint: Criar constraint único TEMPORÁRIO (sem tipoOperacao, pois ainda não existe)
-- Esta constraint será substituída quando tipoOperacao for adicionado
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'VendaAnalytics_ano_mes_nomeFantasia_marca_grupo_subgrupo_uf_empresaId_key'
    AND conrelid = '"VendaAnalytics"'::regclass
  ) THEN
    ALTER TABLE "VendaAnalytics" 
    ADD CONSTRAINT "VendaAnalytics_ano_mes_nomeFantasia_marca_grupo_subgrupo_uf_empresaId_key" 
    UNIQUE ("ano", "mes", "nomeFantasia", "marca", "grupo", "subgrupo", "uf", "empresaId");
  END IF;
END $$;

-- CreateIndex: Criar índice para empresaId para melhor performance em filtros
CREATE INDEX IF NOT EXISTS "VendaAnalytics_empresaId_ano_mes_idx" ON "VendaAnalytics"("empresaId", "ano", "mes");
