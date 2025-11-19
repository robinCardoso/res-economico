-- Renomear campos na tabela ContaCatalogo
-- numeroConta → conta
-- conta → nomeConta

-- 1. Renomear numeroConta para conta
ALTER TABLE "ContaCatalogo" RENAME COLUMN "numeroConta" TO "conta";

-- 2. Renomear conta para nomeConta
ALTER TABLE "ContaCatalogo" RENAME COLUMN "conta" TO "nomeConta";

-- 3. Recriar índice único com os novos nomes de colunas
DROP INDEX IF EXISTS "ContaCatalogo_classificacao_numeroConta_subConta_key";
CREATE UNIQUE INDEX "ContaCatalogo_classificacao_conta_subConta_key" ON "ContaCatalogo"("classificacao", "conta", "subConta");

