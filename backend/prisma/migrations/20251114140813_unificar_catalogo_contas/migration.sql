/*
  Warnings:

  - You are about to drop the column `empresaId` on the `ContaCatalogo` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[classificacao]` on the `ContaCatalogo` table will be added. If there are existing duplicate values, this will fail.

*/

-- Step 1: Consolidar contas duplicadas (manter apenas uma por classificação)
-- Para cada classificação duplicada, manter a conta com a última importação mais recente
DELETE FROM "ContaCatalogo" 
WHERE id IN (
  SELECT id FROM (
    SELECT id, 
           ROW_NUMBER() OVER (
             PARTITION BY classificacao 
             ORDER BY "ultimaImportacao" DESC, "primeiraImportacao" DESC
           ) as rn
    FROM "ContaCatalogo"
  ) t
  WHERE rn > 1
);

-- Step 2: Remover foreign key
ALTER TABLE "ContaCatalogo" DROP CONSTRAINT IF EXISTS "ContaCatalogo_empresaId_fkey";

-- Step 3: Remover coluna empresaId
ALTER TABLE "ContaCatalogo" DROP COLUMN "empresaId";

-- Step 4: Adicionar índice único em classificacao
CREATE UNIQUE INDEX "ContaCatalogo_classificacao_key" ON "ContaCatalogo"("classificacao");
