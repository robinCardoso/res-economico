-- Script para migrar dados existentes na tabela ContaCatalogo
-- Preencher numeroConta e conta a partir dos dados de LinhaUpload

-- 1. Atualizar numeroConta e conta a partir da primeira LinhaUpload encontrada para cada classificação
UPDATE "ContaCatalogo" cc
SET 
  "numeroConta" = COALESCE(
    (SELECT DISTINCT ON (lu.classificacao) lu.conta 
     FROM "LinhaUpload" lu 
     WHERE lu.classificacao = cc.classificacao 
     LIMIT 1),
    ''
  ),
  "conta" = COALESCE(
    (SELECT DISTINCT ON (lu.classificacao) lu."nomeConta" 
     FROM "LinhaUpload" lu 
     WHERE lu.classificacao = cc.classificacao 
     LIMIT 1),
    ''
  )
WHERE 
  "numeroConta" = '' OR "conta" = '' OR "numeroConta" IS NULL OR "conta" IS NULL;

-- 2. Se ainda houver registros sem numeroConta ou conta, tentar buscar de qualquer LinhaUpload relacionada
-- (caso a classificação tenha mudado ligeiramente)
UPDATE "ContaCatalogo" cc
SET 
  "numeroConta" = COALESCE(cc."numeroConta", ''),
  "conta" = COALESCE(cc."conta", 'Sem nome')
WHERE 
  ("numeroConta" = '' OR "numeroConta" IS NULL) 
  OR ("conta" = '' OR "conta" IS NULL);

