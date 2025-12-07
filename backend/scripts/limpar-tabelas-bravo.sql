-- =====================================================
-- Script para limpar tabelas do módulo Bravo ERP
-- =====================================================
-- 
-- Este script deleta TODOS os registros das tabelas:
--   - BravoSyncProgress (progresso de sincronização)
--   - BravoSyncLog (logs de sincronização)
--   - Produto (produtos sincronizados)
--
-- ⚠️ ATENÇÃO: Esta operação é IRREVERSÍVEL!
-- ⚠️ Faça um backup antes de executar se precisar dos dados!
--
-- =====================================================

-- Desabilitar triggers temporariamente (se houver)
-- SET session_replication_role = 'replica';

BEGIN;

-- 1. Limpar BravoSyncProgress primeiro (tabela dependente)
-- Como tem foreign key para BravoSyncLog, deletamos primeiro
TRUNCATE TABLE "BravoSyncProgress" CASCADE;

-- 2. Limpar BravoSyncLog (logs de sincronização)
TRUNCATE TABLE "BravoSyncLog" CASCADE;

-- 3. Limpar Produto (produtos sincronizados)
-- Esta tabela não tem dependências das outras tabelas Bravo
TRUNCATE TABLE "Produto" CASCADE;

COMMIT;

-- Reabilitar triggers
-- SET session_replication_role = 'origin';

-- Verificar que as tabelas estão vazias
SELECT 
    'BravoSyncProgress' as tabela, 
    COUNT(*) as registros 
FROM "BravoSyncProgress"
UNION ALL
SELECT 
    'BravoSyncLog' as tabela, 
    COUNT(*) as registros 
FROM "BravoSyncLog"
UNION ALL
SELECT 
    'Produto' as tabela, 
    COUNT(*) as registros 
FROM "Produto";

-- =====================================================
-- Script concluído!
-- =====================================================
-- Todas as tabelas foram limpas e estão prontas para novos testes.
-- =====================================================