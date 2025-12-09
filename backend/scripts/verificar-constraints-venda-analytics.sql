-- Script para verificar e remover constraints antigos de VendaAnalytics

-- 1. Listar todos os constraints únicos
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = '"VendaAnalytics"'::regclass
AND contype = 'u'
ORDER BY conname;

-- 2. Remover constraint antigo se existir (sem grupo/subgrupo)
DO $$
BEGIN
    -- Remover constraint antigo
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = '"VendaAnalytics"'::regclass
        AND conname = 'VendaAnalytics_ano_mes_nomeFantasia_marca_uf_key'
    ) THEN
        ALTER TABLE "VendaAnalytics" DROP CONSTRAINT "VendaAnalytics_ano_mes_nomeFantasia_marca_uf_key";
        RAISE NOTICE 'Constraint antigo removido: VendaAnalytics_ano_mes_nomeFantasia_marca_uf_key';
    END IF;
    
    -- Remover qualquer outro constraint único que não inclua grupo e subgrupo
    FOR constraint_name IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = '"VendaAnalytics"'::regclass 
        AND contype = 'u'
        AND conname != 'VendaAnalytics_ano_mes_nomeFantasia_marca_grupo_subgrupo_uf_key'
    LOOP
        EXECUTE format('ALTER TABLE "VendaAnalytics" DROP CONSTRAINT IF EXISTS %I', constraint_name);
        RAISE NOTICE 'Constraint removido: %', constraint_name;
    END LOOP;
END $$;

-- 3. Verificar novamente os constraints restantes
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = '"VendaAnalytics"'::regclass
AND contype = 'u'
ORDER BY conname;

