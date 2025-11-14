-- Script para consolidar contas duplicadas antes de unificar o catálogo
-- Execute este script ANTES de rodar a migration

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

-- Verificar se ainda há duplicatas
SELECT classificacao, COUNT(*) as total
FROM "ContaCatalogo"
GROUP BY classificacao
HAVING COUNT(*) > 1;

