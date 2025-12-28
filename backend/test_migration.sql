-- Teste completo de migração do banco de dados
-- Verificar se todas as tabelas principais existem

\echo '=== VERIFICAÇÃO DE TABELAS PRINCIPAIS ==='

SELECT 
  schemaname,
  tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

\echo ''
\echo '=== CONTAGEM DE REGISTROS POR TABELA ==='

SELECT 
  schemaname,
  tablename,
  (SELECT COUNT(*) FROM information_schema.tables t 
   WHERE t.table_schema = schemaname AND t.table_name = tablename) as registro_contagem
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

\echo ''
\echo '=== VERIFICAÇÃO DE RELACIONAMENTOS (FOREIGN KEYS) ==='

SELECT 
  constraint_name,
  table_name,
  column_name,
  referenced_table_name,
  referenced_column_name
FROM information_schema.key_column_usage
WHERE table_schema = 'public' 
  AND referenced_table_name IS NOT NULL
ORDER BY table_name, constraint_name;

\echo ''
\echo '=== VERIFICAÇÃO DE ÍNDICES ==='

SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

\echo ''
\echo '=== VERIFICAÇÃO DE ENUMS ==='

SELECT 
  n.nspname as schema,
  t.typname as enum_name,
  e.enumlabel as value
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY t.typname, e.enumsortorder;
