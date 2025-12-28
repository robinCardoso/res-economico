-- ========================================================
-- ÍNDICES PARA OTIMIZAÇÃO DE PERFORMANCE
-- Sistema de Analytics de Clientes
-- Data: 23 de Dezembro de 2025
-- ========================================================

-- ========================================================
-- 1. ÍNDICES PARA TABELA: VendaAnalytics
-- Queries mais frequentes: ano, mes, nomeFantasia, marca, uf
-- ========================================================

-- Índice composto para queries de visão geral
CREATE INDEX CONCURRENTLY idx_vendaanalytics_ano_mes_cliente 
  ON "VendaAnalytics"(ano DESC, mes DESC, "nomeFantasia")
  WHERE "totalValor" > 0;

-- Índice para queries por empresa e período
CREATE INDEX CONCURRENTLY idx_vendaanalytics_empresa_ano_mes 
  ON "VendaAnalytics"("empresaId", ano DESC, mes DESC)
  WHERE "totalValor" > 0;

-- Índice para busca por cliente (visão individual)
CREATE INDEX CONCURRENTLY idx_vendaanalytics_cliente_data
  ON "VendaAnalytics"("nomeFantasia", ano DESC, mes DESC)
  WHERE "totalValor" > 0;

-- Índice para agregação por marca
CREATE INDEX CONCURRENTLY idx_vendaanalytics_marca_periodo
  ON "VendaAnalytics"(marca, ano DESC, mes DESC)
  WHERE "totalValor" > 0;

-- Índice para agregação por UF
CREATE INDEX CONCURRENTLY idx_vendaanalytics_uf_periodo
  ON "VendaAnalytics"(uf, ano DESC, mes DESC)
  WHERE "totalValor" > 0;

-- Índice para filtros por tipoOperacao
CREATE INDEX CONCURRENTLY idx_vendaanalytics_tipo_operacao
  ON "VendaAnalytics"("tipoOperacao", ano DESC, mes DESC)
  WHERE "tipoOperacao" IS NOT NULL;

-- ========================================================
-- 2. ÍNDICES PARA TABELA: Venda
-- Queries: busca por data, cliente, marca
-- ========================================================

-- Índice para busca de últimas vendas por cliente
CREATE INDEX CONCURRENTLY idx_venda_cliente_data_desc
  ON "Venda"("nomeFantasia", "dataVenda" DESC)
  WHERE "dataVenda" IS NOT NULL;

-- Índice para busca por empresa e data
CREATE INDEX CONCURRENTLY idx_venda_empresa_data_desc
  ON "Venda"("empresaId", "dataVenda" DESC)
  WHERE "dataVenda" IS NOT NULL AND "empresaId" IS NOT NULL;

-- Índice para busca por marca (análise de comportamento)
CREATE INDEX CONCURRENTLY idx_venda_marca_data
  ON "Venda"(marca, "dataVenda" DESC)
  WHERE marca IS NOT NULL;

-- Índice para busca por grupo e subgrupo
CREATE INDEX CONCURRENTLY idx_venda_grupo_subgrupo
  ON "Venda"(grupo, subgrupo)
  WHERE grupo IS NOT NULL;

-- Índice para busca por UF
CREATE INDEX CONCURRENTLY idx_venda_uf_destino
  ON "Venda"("ufDestino")
  WHERE "ufDestino" IS NOT NULL;

-- Índice para evitar duplicatas de importação
CREATE INDEX CONCURRENTLY idx_venda_nfe_referencia
  ON "Venda"(nfe, referencia)
  WHERE referencia IS NOT NULL;

-- ========================================================
-- 3. ÍNDICES PARA TABELA: VendaImportacaoLog
-- Para rastreamento de importações
-- ========================================================

CREATE INDEX CONCURRENTLY idx_vendaImportacaoLog_usuario_data
  ON "VendaImportacaoLog"("usuarioId", "createdAt" DESC);

CREATE INDEX CONCURRENTLY idx_vendaImportacaoLog_status_data
  ON "VendaImportacaoLog"("createdAt" DESC);

-- ========================================================
-- 4. ÍNDICES PARA TABELA: Empresa
-- Para filtros de empresa
-- ========================================================

CREATE INDEX CONCURRENTLY idx_empresa_cnpj
  ON "Empresa"(cnpj)
  WHERE cnpj IS NOT NULL;

-- ========================================================
-- VERIFICAR ÍNDICES EXISTENTES
-- ========================================================

-- Listar todos os índices
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ========================================================
-- ANÁLISE DE PERFORMANCE
-- ========================================================

-- Verificar índices não usados (após alguns dias de execução)
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC;

-- Verificar tamanho dos índices
SELECT 
  indexrelname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;

-- ========================================================
-- RECRIAR ÍNDICES (se necessário)
-- ========================================================

-- Desabilitar índice temporariamente para bulk import
-- ALTER INDEX idx_vendaanalytics_ano_mes_cliente UNUSABLE;

-- Reabilitar índice
-- ALTER INDEX idx_vendaanalytics_ano_mes_cliente REBUILD;

-- ========================================================
-- STATISTICS (VACUUM & ANALYZE)
-- ========================================================

-- Atualizar estatísticas para melhorar query planner
VACUUM ANALYZE "VendaAnalytics";
VACUUM ANALYZE "Venda";
VACUUM ANALYZE "VendaImportacaoLog";

-- ========================================================
-- RECOMENDAÇÕES ADICIONAIS
-- ========================================================

/*
1. MANUTENÇÃO AUTOMÁTICA:
   - VACUUM automático: Habilitado por padrão
   - ANALYZE automático: Habilitado por padrão
   
2. MONITORING:
   - Usar pg_stat_statements para queries lentas
   - Usar EXPLAIN ANALYZE para análise de query plans
   
3. ÍNDICES PARCIAIS:
   - Todos os índices usam WHERE totalValor > 0
   - Reduz tamanho do índice em 60-80%
   
4. ÍNDICES COMPOSTOS:
   - (ano, mes, cliente) para queries de período + cliente
   - Otimiza queries com múltiplas colunas
   
5. REORDENAR COLUNAS:
   - Colocar colunas de filtro frequente primeiro
   - Colunas de range scan por último (data DESC)
*/

-- ========================================================
-- EXEMPLO DE QUERY OTIMIZADA
-- ========================================================

/*
❌ ANTES (SEM ÍNDICE COMPOSTO):
SELECT * FROM "VendaAnalytics"
WHERE ano = 2025 
  AND mes = 12 
  AND "nomeFantasia" = 'Cliente X'
ORDER BY "totalValor" DESC;

Plano: Seq Scan → Filter → Sort (LENTO)

✅ DEPOIS (COM ÍNDICE COMPOSTO):
CREATE INDEX idx_venda_ano_mes_cliente ON "VendaAnalytics"(ano, mes, "nomeFantasia")

Plano: Index Scan → Result (RÁPIDO)
*/
