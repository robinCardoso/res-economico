-- Migração agressiva para remover TODOS os constraints antigos de VendaAnalytics
-- Esta migração força a remoção de qualquer constraint único que não inclua grupo e subgrupo

-- Passo 1: Remover TODOS os constraints únicos existentes
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    FOR constraint_record IN 
        SELECT conname, pg_get_constraintdef(oid) as def
        FROM pg_constraint 
        WHERE conrelid = '"VendaAnalytics"'::regclass 
        AND contype = 'u'
    LOOP
        -- Log do constraint antes de remover
        RAISE NOTICE 'Removendo constraint: % - Definição: %', constraint_record.conname, constraint_record.def;
        
        -- Remover o constraint
        EXECUTE format('ALTER TABLE "VendaAnalytics" DROP CONSTRAINT IF EXISTS %I', constraint_record.conname);
        RAISE NOTICE 'Constraint removido: %', constraint_record.conname;
    END LOOP;
END $$;

-- Passo 2: Garantir que grupo e subgrupo não sejam NULL
UPDATE "VendaAnalytics" SET "grupo" = 'DESCONHECIDO' WHERE "grupo" IS NULL;
UPDATE "VendaAnalytics" SET "subgrupo" = 'DESCONHECIDO' WHERE "subgrupo" IS NULL;

-- Passo 3: Adicionar APENAS o novo constraint único com grupo e subgrupo
DO $$
BEGIN
    -- Verificar se o constraint novo já existe
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

-- Passo 4: Verificar se ainda existem constraints antigos (não deveria)
DO $$
DECLARE
    constraint_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO constraint_count
    FROM pg_constraint 
    WHERE conrelid = '"VendaAnalytics"'::regclass 
    AND contype = 'u'
    AND conname != 'VendaAnalytics_ano_mes_nomeFantasia_marca_grupo_subgrupo_uf_key';
    
    IF constraint_count > 0 THEN
        RAISE WARNING 'Ainda existem % constraint(s) único(s) antigo(s) na tabela VendaAnalytics!', constraint_count;
    ELSE
        RAISE NOTICE 'Todos os constraints antigos foram removidos. Apenas o novo constraint existe.';
    END IF;
END $$;

