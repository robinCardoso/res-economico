# 📊 Guia de Otimizações de Performance - Sistema de Analytics de Clientes

**Data:** Dezembro 2025  
**Versão:** 1.0  
**Status:** Implementação em Andamento

---

## 🎯 Objetivos

✅ **Reduzir tempo de carregamento** do dashboard em 50%  
✅ **Otimizar queries** do banco de dados  
✅ **Implementar caching inteligente** de dados  
✅ **Melhorar renderização** no frontend  
✅ **Implementar virtualização** de listas  

---

## 📋 Fase 1: Otimizações de Banco de Dados (DIA 1)

### 1.1 **Problema Identificado**

Queries fazem `SELECT *` desnecessários, carregando campos não usados:

```typescript
// ❌ ANTES: Carrega TUDO
const vendas = await this.prisma.venda.findMany({
  where: { nomeFantasia: cliente },
});
// Carrega: id, dataVenda, nomeFantasia, cnpjCliente, ufDestino, descricaoProduto, etc.
```

### 1.2 **Solução: Select Específico**

```typescript
// ✅ DEPOIS: Carrega apenas o necessário
const vendas = await this.prisma.venda.findMany({
  where: { nomeFantasia: cliente },
  select: {
    dataVenda: true,
    nomeFantasia: true,
    valorTotal: true,
    quantidade: true,
    // ... apenas campos usados
  },
});
```

**Impacto:** ⚡ 30-40% mais rápido

### 1.3 **Implementação: Selects Otimizados**

**Arquivo:** `cliente-metricas-financeiras.service.ts`

```typescript
// Otimizar busca de vendas reais
const vendasReais = await this.prisma.venda.findMany({
  where: {
    nomeFantasia: nomeFantasiaCliente,
    ...(dados.empresaId ? { empresaId: dados.empresaId } : {}),
  },
  select: {
    dataVenda: true, // ← Apenas campo necessário
  },
  orderBy: {
    dataVenda: 'asc',
  },
});
```

### 1.4 **Batch Queries**

Ao invés de múltiplas queries:

```typescript
// ❌ ANTES: 3 queries sequenciais
const metricas = await metricasService.get(cliente);
const comportamento = await comportamentoService.get(cliente);
const segmentacao = await segmentacaoService.get(cliente);

// ✅ DEPOIS: 3 queries em paralelo
const [metricas, comportamento, segmentacao] = await Promise.all([
  metricasService.get(cliente),
  comportamentoService.get(cliente),
  segmentacaoService.get(cliente),
]);
```

**Impacto:** ⚡ 60% redução em latência

---

## 💾 Fase 2: Caching Inteligente (DIA 1-2)

### 2.1 **Estratégia de Cache TTL**

```
┌─────────────────────────────────┐
│   VISÃO GERAL (Dashboard)      │
│   TTL: 1 HORA (3600s)          │
│   ✓ Dados agregados, pouca mudança │
└─────────────────────────────────┘
        ↓
┌─────────────────────────────────┐
│   RELATÓRIOS (Por Cliente)      │
│   TTL: 30 MINUTOS (1800s)       │
│   ✓ Dados individuais de clientes │
└─────────────────────────────────┘
        ↓
┌─────────────────────────────────┐
│   ALERTAS (Críticos)            │
│   TTL: 5 MINUTOS (300s)         │
│   ✓ Dados mais frescos           │
└─────────────────────────────────┘
        ↓
┌─────────────────────────────────┐
│   SEGMENTAÇÃO (RFM)             │
│   TTL: 30 MINUTOS (1800s)       │
│   ✓ Dados de análise            │
└─────────────────────────────────┘
```

### 2.2 **Service: CacheAnalyticsService**

**Arquivo:** `backend/src/vendas/analytics/caching/cache-analytics.service.ts`

```typescript
// ✅ Usar cache com TTL
const visaoGeral = await this.cacheService.getOrSetCache(
  'analytics:visao-geral:filtros-xxx',
  async () => {
    // Query custosa aqui
    return this.gerarVisaoGeral(filtros);
  },
  3600, // 1 hora
);
```

### 2.3 **Invalidação Inteligente**

```typescript
// Ao importar vendas → invalida TODOS os caches
async importarVendas(arquivo) {
  await this.vendaService.importar(arquivo);
  
  // 🗑️ Invalidar todos os caches
  this.cacheService.invalidateAllCache();
}

// Ao atualizar cliente → invalida cache daquele cliente
async atualizarCliente(nomeFantasia) {
  await this.clienteService.atualizar(nomeFantasia);
  
  // 🗑️ Invalidar cache específico
  this.cacheService.invalidateClientCache(nomeFantasia);
}
```

**Impacto:** ⚡ Resposta em < 50ms para dados em cache

---

## ⚡ Fase 3: Otimizações Frontend (DIA 2-3)

### 3.1 **useMemo para Cálculos Pesados**

```typescript
// ❌ ANTES: Recalcula a cada render
const dadosFiltrados = metricasArray.filter(m => m.receita > 1000);

// ✅ DEPOIS: Calcula apenas quando deps mudam
const dadosFiltrados = useMemo(
  () => metricasArray.filter(m => m.receita > 1000),
  [metricasArray],
);
```

### 3.2 **useCallback para Event Handlers**

```typescript
// ❌ ANTES: Cria nova função a cada render
const handleFilter = (filters) => {
  setFiltros(filters);
};

// ✅ DEPOIS: Mesma referência de função
const handleFilter = useCallback((filters) => {
  setFiltros(filters);
}, []);
```

### 3.3 **React Query Optimization**

```typescript
// Aumentar stale time
export function useClienteAnalyticsVisaoGeral(filters?: ClienteAnalyticsFilters) {
  return useQuery({
    queryKey: ['cliente-analytics', 'visao-geral', filters],
    queryFn: () => clienteAnalyticsService.getVisaoGeral(filters),
    staleTime: 1000 * 60 * 60, // ← 1 HORA (antes: 5 min)
    gcTime: 1000 * 60 * 60 * 24, // Cache por 24h
  });
}

// Alertas: Ficar frescos (2 minutos)
export function useClienteAnalyticsAlertas(filters?: ClienteAnalyticsFilters) {
  return useQuery({
    queryKey: ['cliente-analytics', 'alertas', filters],
    queryFn: () => clienteAnalyticsService.getAlertas(filters),
    staleTime: 1000 * 60 * 2, // 2 minutos (alertas críticos)
    refetchInterval: 1000 * 60 * 5, // Refetch a cada 5 min
  });
}
```

### 3.4 **Code Splitting & Lazy Loading**

```typescript
// Lazy load componentes pesados
const GraficosAvancados = lazy(() => import('./GraficosAvancados'));
const TabelaAnalytics = lazy(() => import('./TabelaAnalytics'));

export default function Dashboard() {
  return (
    <>
      <Suspense fallback={<Skeleton />}>
        <GraficosAvancados />
      </Suspense>
      <Suspense fallback={<Skeleton />}>
        <TabelaAnalytics />
      </Suspense>
    </>
  );
}
```

---

## 📄 Fase 4: Virtualização de Listas (DIA 3)

### 4.1 **Window Virtualization**

Para tabelas com **1000+ linhas**:

```typescript
// ❌ ANTES: Renderiza TODOS os 1000 rows
<div>
  {clientes.map(cliente => (
    <div key={cliente.id}>{cliente.nome}</div>
  ))}
</div>

// ✅ DEPOIS: Renderiza apenas ~20 visíveis
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={clientes.length}
  itemSize={35}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      {clientes[index].nome}
    </div>
  )}
</FixedSizeList>
```

**Impacto:** ⚡ 99% redução em renderizações

---

## 🚀 Fase 5: Batching & Debouncing (DIA 3)

### 5.1 **Debounce em Filtros de Busca**

```typescript
// ❌ ANTES: 1 query por caractere digitado
const handleSearch = (query: string) => {
  refetch({ busca: query }); // 5 queries = 5 requisições!
};

// ✅ DEPOIS: 1 query após parar de digitar
const debouncedSearch = useDebouncedCallback(
  (query: string) => {
    refetch({ busca: query });
  },
  500, // 500ms debounce
);

const handleSearch = (query: string) => {
  debouncedSearch(query); // Apenas 1 requisição final!
};
```

**Impacto:** ⚡ 80% menos requisições

### 5.2 **Request Batching**

```typescript
// Agrupar múltiplas requisições em uma
const batchQuery = async (clienteIds: string[]) => {
  // Em vez de: Promise.all(clienteIds.map(id => getCliente(id)))
  // Fazer: POST /api/batch com lista toda
  return api.post('/vendas/cliente-analytics/batch', {
    clientes: clienteIds,
  });
};
```

---

## 📊 Checklist de Implementação

### ✅ DIA 1 (Backend Database)

- [ ] Adicionar select específicos em todas queries
- [ ] Implementar CacheAnalyticsService
- [ ] Integrar caching em cliente-perfil-analytics.service
- [ ] Adicionar índices compostos no PostgreSQL
- [ ] Testar com 10k+ registros

### ⚠️ DIA 2 (Frontend & React Query)

- [ ] Aumentar stale time em React Query hooks
- [ ] Implementar useMemo em componentes pesados
- [ ] Implementar useCallback em event handlers
- [ ] Lazy load componentes grandes
- [ ] Code splitting de chunks grandes

### 🔄 DIA 3 (Advanced)

- [ ] Implementar window virtualization em tabelas
- [ ] Adicionar debouncing a filtros de busca
- [ ] Implementar request batching
- [ ] Compressão de respostas (gzip)

---

## 🧪 Como Testar Performance

### Browser DevTools

```javascript
// 1. Chrome DevTools → Performance → Record
// 2. Interagir com o app
// 3. Análise de:
//    - FCP (First Contentful Paint): < 2s
//    - LCP (Largest Contentful Paint): < 2.5s
//    - CLS (Cumulative Layout Shift): < 0.1
```

### Lighthouse

```bash
# Instalar
npm install -g lighthouse

# Executar teste
lighthouse http://localhost:3000/admin/clientes --view
```

### React Profiler

```typescript
import { Profiler } from 'react';

<Profiler id="Dashboard" onRender={(id, phase, duration) => {
  console.log(`${id} (${phase}) levou ${duration}ms`);
}}>
  <Dashboard />
</Profiler>
```

---

## 📈 Métricas Esperadas

| Métrica | ANTES | DEPOIS | Melhoria |
|---------|-------|--------|----------|
| Dashboard carregamento | 5s | 2s | **60% ↓** |
| Lista de clientes (1000 linhas) | 3s | 800ms | **73% ↓** |
| Filtro em tempo real | 1s + debounce | 200ms | **80% ↓** |
| Cache hit rate | 0% | 75%+ | **Alto impacto** |
| Memória do frontend | 120MB | 60MB | **50% ↓** |

---

## 🔗 Índices PostgreSQL Recomendados

```sql
-- Índices para melhorar performance de queries

-- Analytics
CREATE INDEX idx_vendaanalytics_ano_mes_cliente 
  ON "VendaAnalytics"(ano, mes, "nomeFantasia");

CREATE INDEX idx_vendaanalytics_empresa_ano_mes 
  ON "VendaAnalytics"("empresaId", ano, mes);

-- Vendas
CREATE INDEX idx_venda_cliente_data 
  ON "Venda"("nomeFantasia", "dataVenda" DESC);

CREATE INDEX idx_venda_empresa_data 
  ON "Venda"("empresaId", "dataVenda" DESC);

-- Vendas Analytics
CREATE INDEX idx_vendaanalytics_marca 
  ON "VendaAnalytics"(marca) WHERE "totalValor" > 0;

CREATE INDEX idx_vendaanalytics_uf 
  ON "VendaAnalytics"(uf);
```

---

## 🎯 Próximos Passos

1. ✅ Implementar CacheAnalyticsService
2. ✅ Otimizar queries com selects específicos
3. ⏳ Integrar caching em endpoints críticos
4. ⏳ Otimizar frontend com useMemo/useCallback
5. ⏳ Implementar window virtualization
6. ⏳ Testar com Chrome DevTools & Lighthouse

---

**Criado:** 23 de Dezembro de 2025  
**Responsável:** Sistema de Analytics  
**Próxima revisão:** Após implementação completa
