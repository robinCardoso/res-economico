-- Renomear campos no ContaCatalogo para manter padrão igual LinhaUpload
-- 1. Renomear "conta" (número) para "numeroConta"
ALTER TABLE "ContaCatalogo" RENAME COLUMN "conta" TO "numeroConta";

-- 2. Renomear "nome" para "conta" (nome da conta)
ALTER TABLE "ContaCatalogo" RENAME COLUMN "nome" TO "conta";

-- 3. Remover constraint unique antiga e criar nova com numeroConta
DROP INDEX IF EXISTS "ContaCatalogo_classificacao_conta_subConta_key";
CREATE UNIQUE INDEX IF NOT EXISTS "ContaCatalogo_classificacao_numeroConta_subConta_key" 
ON "ContaCatalogo"("classificacao", "numeroConta", "subConta");

