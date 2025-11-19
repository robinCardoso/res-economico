-- AlterTable
-- Remover a constraint unique antiga de classificacao
ALTER TABLE "ContaCatalogo" DROP CONSTRAINT IF EXISTS "ContaCatalogo_classificacao_key";

-- Adicionar colunas conta e subConta se não existirem
ALTER TABLE "ContaCatalogo" 
ADD COLUMN IF NOT EXISTS "conta" TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS "subConta" TEXT NOT NULL DEFAULT '';

-- Atualizar valores vazios/nulos
UPDATE "ContaCatalogo" SET "conta" = '' WHERE "conta" IS NULL;
UPDATE "ContaCatalogo" SET "subConta" = '' WHERE "subConta" IS NULL;

-- Criar a constraint unique composta
CREATE UNIQUE INDEX IF NOT EXISTS "ContaCatalogo_classificacao_conta_subConta_key" 
ON "ContaCatalogo"("classificacao", "conta", "subConta");

