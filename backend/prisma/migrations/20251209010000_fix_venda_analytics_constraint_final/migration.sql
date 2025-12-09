-- Migration para corrigir constraint único de VendaAnalytics
-- Removendo constraint antigo (sem grupo e subgrupo)
-- Adicionando novo constraint (com grupo e subgrupo)

-- Passo 1: Remover constraint antigo se existir
DO $$ 
BEGIN
    -- Remover constraint antigo
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = '"VendaAnalytics"'::regclass
        AND conname = 'VendaAnalytics_ano_mes_nomeFantasia_marca_uf_key'
    ) THEN
        ALTER TABLE "VendaAnalytics" DROP CONSTRAINT "VendaAnalytics_ano_mes_nomeFantasia_marca_uf_key";
        RAISE NOTICE 'Constraint antigo removido';
    END IF;
END $$;

-- Passo 2: Remover qualquer outro constraint único que possa existir
DO $$ 
DECLARE
    constraint_name TEXT;
BEGIN
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

-- Passo 3: Adicionar novo constraint único com grupo e subgrupo
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
