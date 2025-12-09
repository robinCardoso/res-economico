-- Script definitivo para corrigir o constraint único
-- Passo 1: Listar todos os constraints únicos existentes
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Remover TODOS os constraints únicos existentes
    FOR constraint_name IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'VendaAnalytics'::regclass 
        AND contype = 'u'
    LOOP
        EXECUTE format('ALTER TABLE "VendaAnalytics" DROP CONSTRAINT IF EXISTS %I', constraint_name);
        RAISE NOTICE 'Constraint removido: %', constraint_name;
    END LOOP;
END $$;

-- Passo 2: Adicionar o novo constraint único com grupo e subgrupo
ALTER TABLE "VendaAnalytics" 
ADD CONSTRAINT "VendaAnalytics_ano_mes_nomeFantasia_marca_grupo_subgrupo_uf_key" 
UNIQUE ("ano", "mes", "nomeFantasia", "marca", "grupo", "subgrupo", "uf");

-- Passo 3: Verificar se foi criado corretamente
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'VendaAnalytics'::regclass
AND contype = 'u';
