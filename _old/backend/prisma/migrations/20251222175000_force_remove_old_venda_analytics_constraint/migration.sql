-- Migração para forçar remoção do constraint antigo de VendaAnalytics
-- Este constraint antigo não inclui grupo e subgrupo, causando conflitos

-- Passo 1: Remover TODOS os constraints únicos existentes (incluindo o antigo)
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    FOR constraint_name IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = '"VendaAnalytics"'::regclass 
        AND contype = 'u'
    LOOP
        EXECUTE format('ALTER TABLE "VendaAnalytics" DROP CONSTRAINT IF EXISTS %I', constraint_name);
        RAISE NOTICE 'Constraint removido: %', constraint_name;
    END LOOP;
END $$;

-- Passo 2: Consolidar registros duplicados (mesmos valores de ano, mes, nomeFantasia, marca, uf)
-- Somar valores e manter apenas um registro por combinação
DO $$
DECLARE
    duplicate_record RECORD;
    consolidated_id TEXT;
    total_valor_sum NUMERIC;
    total_quantidade_sum NUMERIC;
    grupo_final TEXT;
    subgrupo_final TEXT;
BEGIN
    -- Encontrar grupos de registros duplicados (sem considerar grupo/subgrupo)
    FOR duplicate_record IN
        SELECT 
            "ano",
            "mes",
            "nomeFantasia",
            "marca",
            "uf",
            COUNT(*) as count,
            MIN("id") as first_id,
            SUM("totalValor") as sum_valor,
            SUM("totalQuantidade") as sum_quantidade,
            -- Pegar o primeiro grupo/subgrupo não-nulo ou 'DESCONHECIDO'
            COALESCE(
                (SELECT "grupo" FROM "VendaAnalytics" 
                 WHERE "ano" = t."ano" 
                   AND "mes" = t."mes" 
                   AND "nomeFantasia" = t."nomeFantasia" 
                   AND "marca" = t."marca" 
                   AND "uf" = t."uf" 
                   AND "grupo" IS NOT NULL 
                   AND "grupo" != 'DESCONHECIDO'
                 LIMIT 1),
                'DESCONHECIDO'
            ) as grupo_consolidado,
            COALESCE(
                (SELECT "subgrupo" FROM "VendaAnalytics" 
                 WHERE "ano" = t."ano" 
                   AND "mes" = t."mes" 
                   AND "nomeFantasia" = t."nomeFantasia" 
                   AND "marca" = t."marca" 
                   AND "uf" = t."uf" 
                   AND "subgrupo" IS NOT NULL 
                   AND "subgrupo" != 'DESCONHECIDO'
                 LIMIT 1),
                'DESCONHECIDO'
            ) as subgrupo_consolidado
        FROM "VendaAnalytics" t
        GROUP BY "ano", "mes", "nomeFantasia", "marca", "uf"
        HAVING COUNT(*) > 1
    LOOP
        -- Usar o primeiro ID como ID consolidado
        consolidated_id := duplicate_record.first_id;
        total_valor_sum := duplicate_record.sum_valor;
        total_quantidade_sum := duplicate_record.sum_quantidade;
        grupo_final := duplicate_record.grupo_consolidado;
        subgrupo_final := duplicate_record.subgrupo_consolidado;
        
        -- Atualizar o primeiro registro com os valores somados e grupo/subgrupo consolidados
        UPDATE "VendaAnalytics"
        SET 
            "grupo" = grupo_final,
            "subgrupo" = subgrupo_final,
            "totalValor" = total_valor_sum,
            "totalQuantidade" = total_quantidade_sum
        WHERE "id" = consolidated_id;
        
        -- Deletar os registros duplicados (exceto o primeiro)
        DELETE FROM "VendaAnalytics"
        WHERE "ano" = duplicate_record."ano"
          AND "mes" = duplicate_record."mes"
          AND "nomeFantasia" = duplicate_record."nomeFantasia"
          AND "marca" = duplicate_record."marca"
          AND "uf" = duplicate_record."uf"
          AND "id" != consolidated_id;
        
        RAISE NOTICE 'Consolidados % registros duplicados para chave: ano=%, mes=%, nomeFantasia=%, marca=%, uf=%',
            duplicate_record.count,
            duplicate_record."ano",
            duplicate_record."mes",
            duplicate_record."nomeFantasia",
            duplicate_record."marca",
            duplicate_record."uf";
    END LOOP;
END $$;

-- Passo 3: Garantir que grupo e subgrupo não sejam NULL
UPDATE "VendaAnalytics" SET "grupo" = 'DESCONHECIDO' WHERE "grupo" IS NULL;
UPDATE "VendaAnalytics" SET "subgrupo" = 'DESCONHECIDO' WHERE "subgrupo" IS NULL;

-- Passo 4: Adicionar o novo constraint único com grupo e subgrupo
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = '"VendaAnalytics"'::regclass
        AND conname = 'VendaAnalytics_ano_mes_nomeFantasia_marca_grupo_subgrupo_uf_key'
    ) THEN
        ALTER TABLE "VendaAnalytics" 
        ADD CONSTRAINT "VendaAnalytics_ano_mes_nomeFantasia_marca_grupo_subgrupo_uf_key" 
        UNIQUE ("ano", "mes", "nomeFantasia", "marca", "grupo", "subgrupo", "uf");
        RAISE NOTICE 'Novo constraint adicionado com sucesso';
    ELSE
        RAISE NOTICE 'Novo constraint já existe';
    END IF;
END $$;

