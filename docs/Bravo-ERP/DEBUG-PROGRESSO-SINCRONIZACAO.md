# Debug - Progresso de Sincronização

## Problema Reportado

O progresso da sincronização não está sendo exibido na tela, mostrando sempre valores em 0.

## Visualização Simplificada

A visualização foi simplificada para mostrar apenas:
- **O que está acontecendo** (status atual)
- **Total de produtos processados**
- **Página atual**
- **Total de produtos encontrados** (quando disponível)

## Como Verificar se Está Funcionando

### 1. Verificar no Console do Navegador (F12)

Ao iniciar uma sincronização, você deve ver logs como:
```
📊 Progresso recebido: { logId: "...", response: {...} }
✅ Progresso encontrado: {...}
```

### 2. Verificar no Backend (Terminal)

Você deve ver logs como:
```
📊 Progresso atualizado: Buscando produtos... | Página: 1 | Processados: 50 | Total: 50
🔍 DEBUG Progress Endpoint: { sync_log_id: "...", tabela_progresso: {...}, tabela_log: {...} }
```

### 3. Verificar no Banco de Dados

Execute no PostgreSQL:

```sql
-- Verificar se progresso está sendo salvo
SELECT 
  sync_log_id,
  current_step,
  current_page,
  products_processed,
  total_produtos_bravo,
  progress_percentage,
  updated_at
FROM "BravoSyncProgress"
ORDER BY updated_at DESC
LIMIT 1;

-- Verificar log de sincronização
SELECT 
  id,
  status,
  pages_processed,
  produtos_inseridos,
  total_produtos_bravo,
  started_at,
  updated_at
FROM "BravoSyncLog"
ORDER BY started_at DESC
LIMIT 1;
```

## Tabelas Verificadas

O endpoint `/bravo-erp/sync/progress` busca dados de **DUAS tabelas**:

1. **`BravoSyncProgress`** - Progresso em tempo real
   - Campo chave: `sync_log_id`
   - Campos principais: `current_page`, `products_processed`, `total_produtos_bravo`, `current_step`

2. **`BravoSyncLog`** - Log geral da sincronização
   - Campo chave: `id`
   - Campos principais: `pages_processed`, `produtos_inseridos`, `total_produtos_bravo`, `status`

## Fluxo de Atualização

1. **Início da sincronização**:
   - Cria log em `BravoSyncLog`
   - Cria progresso inicial em `BravoSyncProgress` com 5%

2. **Durante a sincronização**:
   - Atualiza `BravoSyncProgress` a cada página processada
   - Atualiza `BravoSyncLog` com informações gerais

3. **Endpoint de progresso**:
   - Busca de `BravoSyncProgress` (tempo real)
   - Se não encontrar, busca de `BravoSyncLog` (fallback)
   - Combina os dados e retorna

## Possíveis Problemas

1. **Progresso não está sendo criado**:
   - Verificar se `syncLogId` está sendo retornado na resposta da API
   - Verificar logs do backend para erros

2. **Dados não estão sendo salvos**:
   - Verificar se há erros no `SyncProgressService.updateProgress()`
   - Verificar logs do Prisma

3. **Frontend não está buscando**:
   - Verificar se o polling está ativo (a cada 3 segundos)
   - Verificar console do navegador para erros de rede

4. **Dados não estão sendo exibidos**:
   - Verificar estrutura da resposta da API
   - Verificar logs no console do navegador

## Próximos Passos

1. Iniciar uma sincronização
2. Abrir o console do navegador (F12)
3. Verificar os logs de debug
4. Verificar os logs do backend
5. Comparar com os dados do banco de dados
