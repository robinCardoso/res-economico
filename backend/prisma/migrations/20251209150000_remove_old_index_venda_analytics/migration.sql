-- Migração para remover índice único antigo de VendaAnalytics
-- O índice antigo não inclui grupo e subgrupo, causando conflitos

-- Remover índice antigo se existir
DROP INDEX IF EXISTS "VendaAnalytics_ano_mes_nomeFantasia_marca_uf_key";

-- Verificar se ainda existem índices antigos
DO $$
DECLARE
    index_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE tablename = 'VendaAnalytics'
    AND indexdef LIKE '%UNIQUE%'
    AND indexname != 'VendaAnalytics_ano_mes_nomeFantasia_marca_grupo_subgrupo_uf_key'
    AND indexname != 'VendaAnalytics_pkey';
    
    IF index_count > 0 THEN
        RAISE WARNING 'Ainda existem % índice(s) único(s) antigo(s) na tabela VendaAnalytics!', index_count;
    ELSE
        RAISE NOTICE 'Todos os índices antigos foram removidos. Apenas o novo índice único existe.';
    END IF;
END $$;

