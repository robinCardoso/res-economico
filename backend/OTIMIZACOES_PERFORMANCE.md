# Otimizações de Performance

## Índices no Banco de Dados

Foram adicionados índices na tabela `Upload` para otimizar queries de relatórios:

```prisma
@@index([status, ano])
@@index([ano, mes])
@@index([empresaId, ano, mes])
@@index([status, empresaId, ano])
```

### Como aplicar os índices

Execute a migration:

```bash
npx prisma migrate dev --name add_upload_indexes
```

Ou se preferir aplicar diretamente no banco:

```sql
CREATE INDEX IF NOT EXISTS "Upload_status_ano_idx" ON "Upload"("status", "ano");
CREATE INDEX IF NOT EXISTS "Upload_ano_mes_idx" ON "Upload"("ano", "mes");
CREATE INDEX IF NOT EXISTS "Upload_empresaId_ano_mes_idx" ON "Upload"("empresaId", "ano", "mes");
CREATE INDEX IF NOT EXISTS "Upload_status_empresaId_ano_idx" ON "Upload"("status", "empresaId", "ano");
```

## Cache com Redis

Foi implementado um sistema de cache usando Redis para armazenar resultados de queries frequentes:

### Funcionalidades

1. **Cache de Anos Disponíveis**
   - TTL: 5 minutos
   - Chave: `relatorios:anos-disponiveis`
   - Invalidado automaticamente quando novos uploads são criados

2. **Cache de Meses Disponíveis**
   - TTL: 3 minutos
   - Chave: `relatorios:meses-disponiveis:{ano}` ou `relatorios:meses-disponiveis:{ano}:{empresaId}`
   - Invalidado automaticamente quando novos uploads são criados

### Invalidação Automática

O cache é invalidado automaticamente quando:
- Um novo upload é criado
- Um upload é processado e concluído (status CONCLUIDO ou COM_ALERTAS)

### Configuração

O cache usa o mesmo Redis configurado para a fila de processamento:
- `REDIS_HOST` (padrão: localhost)
- `REDIS_PORT` (padrão: 6379)

Se o Redis não estiver disponível, o sistema continua funcionando normalmente sem cache.

## Otimizações de Query

### Query Raw SQL

As queries de anos e meses disponíveis foram otimizadas para usar SQL raw ao invés do ORM:

**Antes:**
```typescript
const uploads = await this.prisma.upload.findMany({
  where: { status: { in: ['CONCLUIDO', 'COM_ALERTAS'] } },
  select: { ano: true },
  distinct: ['ano'],
});
```

**Depois:**
```typescript
const result = await this.prisma.$queryRaw<Array<{ ano: number }>>`
  SELECT DISTINCT ano
  FROM "Upload"
  WHERE status IN ('CONCLUIDO', 'COM_ALERTAS')
  ORDER BY ano DESC
`;
```

### Benefícios

1. **Menos overhead**: Query raw é mais rápida que ORM
2. **Uso de índices**: PostgreSQL pode usar os índices criados de forma mais eficiente
3. **Menos dados transferidos**: Apenas os campos necessários são retornados
4. **Cache**: Resultados são armazenados em cache, evitando queries repetidas

## Performance Esperada

Com 3700 linhas de dados:

- **Sem otimizações**: ~200-500ms por query
- **Com índices**: ~50-100ms por query
- **Com cache**: ~1-5ms (quando em cache)

### Redução de Carga no Banco

- **Antes**: Cada requisição fazia uma query completa
- **Depois**: 
  - Primeira requisição: query otimizada com índices
  - Requisições subsequentes (até 5 min): retorno do cache (sem query no banco)

## Monitoramento

Os logs do sistema mostram quando o cache é usado:

```
[RelatoriosService] Anos disponíveis retornados do cache
[RelatoriosService] Meses disponíveis para ano 2024 retornados do cache
```

