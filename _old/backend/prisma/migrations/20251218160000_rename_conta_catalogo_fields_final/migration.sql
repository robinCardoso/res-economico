-- Renomear campos na tabela ContaCatalogo (idempotent)
-- Objetivo final:
--   Ter uma coluna "conta" (era numeroConta)
--   Ter uma coluna "nomeConta" (era conta)

DO $$ 
DECLARE
  has_numeroConta boolean;
  has_conta boolean;
  has_nomeConta boolean;
BEGIN
  -- Verificar quais colunas existem
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ContaCatalogo' AND column_name = 'numeroConta') INTO has_numeroConta;
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ContaCatalogo' AND column_name = 'conta') INTO has_conta;
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ContaCatalogo' AND column_name = 'nomeConta') INTO has_nomeConta;

  -- Cenário 1: numeroConta e conta existem, nomeConta não existe
  --   Ação: renomear conta→nomeConta, depois numeroConta→conta
  IF has_numeroConta AND has_conta AND NOT has_nomeConta THEN
    ALTER TABLE "ContaCatalogo" RENAME COLUMN "conta" TO "nomeConta";
    ALTER TABLE "ContaCatalogo" RENAME COLUMN "numeroConta" TO "conta";
  
  -- Cenário 2: Apenas numeroConta existe
  --   Ação: renomear numeroConta→conta
  ELSIF has_numeroConta AND NOT has_conta THEN
    ALTER TABLE "ContaCatalogo" RENAME COLUMN "numeroConta" TO "conta";
  
  -- Cenário 3: conta existe mas nomeConta não, e numeroConta não existe
  --   Ação: Assumir que conta antiga precisa virar nomeConta (mas não temos numeroConta para renomear)
  --   Deixar como está ou dar erro? Vamos deixar como está.
  
  -- Outros cenários: já está no estado final, não fazer nada
  END IF;
END $$;

-- 3. Recriar índice único com os novos nomes de colunas
DROP INDEX IF EXISTS "ContaCatalogo_classificacao_numeroConta_subConta_key";
DROP INDEX IF EXISTS "ContaCatalogo_classificacao_conta_subConta_key";
CREATE UNIQUE INDEX IF NOT EXISTS "ContaCatalogo_classificacao_conta_subConta_key" ON "ContaCatalogo"("classificacao", "conta", "subConta");

