-- Migração de dados: Atualizar registros antigos de VendaAnalytics
-- Registros criados antes da migração podem ter grupo/subgrupo NULL
-- Este script atualiza esses registros para usar valores padrão e consolida duplicatas

-- Passo 1: Atualizar registros com grupo NULL para 'DESCONHECIDO'
UPDATE "VendaAnalytics"
SET "grupo" = 'DESCONHECIDO'
WHERE "grupo" IS NULL;

-- Passo 2: Atualizar registros com subgrupo NULL para 'DESCONHECIDO'
UPDATE "VendaAnalytics"
SET "subgrupo" = 'DESCONHECIDO'
WHERE "subgrupo" IS NULL;

-- Passo 3: Consolidação de registros duplicados
-- Se existirem múltiplos registros com os mesmos valores de chave única
-- (ano, mes, nomeFantasia, marca, grupo, subgrupo, uf),
-- mas com IDs diferentes, precisamos consolidá-los somando os valores
DO $$
DECLARE
    duplicate_record RECORD;
    consolidated_id TEXT;
    total_valor_sum NUMERIC;
    total_quantidade_sum NUMERIC;
BEGIN
    -- Encontrar grupos de registros duplicados
    FOR duplicate_record IN
        SELECT 
            "ano",
            "mes",
            "nomeFantasia",
            "marca",
            "grupo",
            "subgrupo",
            "uf",
            COUNT(*) as count,
            MIN("id") as first_id,
            SUM("totalValor") as sum_valor,
            SUM("totalQuantidade") as sum_quantidade
        FROM "VendaAnalytics"
        GROUP BY "ano", "mes", "nomeFantasia", "marca", "grupo", "subgrupo", "uf"
        HAVING COUNT(*) > 1
    LOOP
        -- Usar o primeiro ID como ID consolidado
        consolidated_id := duplicate_record.first_id;
        total_valor_sum := duplicate_record.sum_valor;
        total_quantidade_sum := duplicate_record.sum_quantidade;
        
        -- Atualizar o primeiro registro com os valores somados
        UPDATE "VendaAnalytics"
        SET 
            "totalValor" = total_valor_sum,
            "totalQuantidade" = total_quantidade_sum
        WHERE "id" = consolidated_id;
        
        -- Deletar os registros duplicados (exceto o primeiro)
        DELETE FROM "VendaAnalytics"
        WHERE "ano" = duplicate_record."ano"
          AND "mes" = duplicate_record."mes"
          AND "nomeFantasia" = duplicate_record."nomeFantasia"
          AND "marca" = duplicate_record."marca"
          AND "grupo" = duplicate_record."grupo"
          AND "subgrupo" = duplicate_record."subgrupo"
          AND "uf" = duplicate_record."uf"
          AND "id" != consolidated_id;
        
        RAISE NOTICE 'Consolidados % registros duplicados para chave: ano=%, mes=%, nomeFantasia=%, marca=%, grupo=%, subgrupo=%, uf=%',
            duplicate_record.count,
            duplicate_record."ano",
            duplicate_record."mes",
            duplicate_record."nomeFantasia",
            duplicate_record."marca",
            duplicate_record."grupo",
            duplicate_record."subgrupo",
            duplicate_record."uf";
    END LOOP;
END $$;

-- Passo 4: Verificar se ainda existem registros com NULL (não deveria acontecer após os passos anteriores)
DO $$
DECLARE
    null_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_count
    FROM "VendaAnalytics"
    WHERE "grupo" IS NULL OR "subgrupo" IS NULL;
    
    IF null_count > 0 THEN
        RAISE WARNING 'Ainda existem % registros com grupo ou subgrupo NULL. Isso pode causar problemas com o constraint único.', null_count;
    ELSE
        RAISE NOTICE 'Todos os registros foram atualizados com sucesso. Nenhum registro com NULL encontrado.';
    END IF;
END $$;

