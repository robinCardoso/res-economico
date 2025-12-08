# 📊 ANÁLISE COMPLETA: Implementação de Importação de Vendas

## 🎯 OBJETIVO

Implementar a importação de vendas no sistema res-economico, adaptando a estrutura existente do painel-completo que utiliza Supabase para o sistema atual que utiliza PostgreSQL/Prisma. **IMPORTANTE:** Não existe API BRAVO para vendas - a importação é feita via planilha Excel.

## ⚠️ NOTA IMPORTANTE

**NÃO EXISTE API BRAVO PARA VENDAS.** A importação de vendas é feita via planilha Excel, similar ao sistema de uploads já existente no res-economico. Este documento foi atualizado para refletir essa realidade.

---

## 📋 SUMÁRIO

1. [Análise da Estrutura Atual](#1-análise-da-estrutura-atual)
2. [Análise do Banco de Dados](#2-análise-do-banco-de-dados)
3. [Dependências e Referências](#3-dependências-e-referências)
4. [Estrutura Proposta](#4-estrutura-proposta)
5. [Plano de Implementação](#5-plano-de-implementação)
6. [Checklist Completo](#6-checklist-completo)

---

## 1. ANÁLISE DA ESTRUTURA ATUAL

### 1.1. Estrutura de Vendas Existente (painel-completo)

#### Frontend - Página de Vendas
**Localização:** `painel-completo/src/app/admin/vendas/page.tsx`

**Características:**
- ✅ Usa componente `ImportStepper` (genérico para importações)
- ✅ Usa `importSales` do `@/server/actions/imports/import-sales-supabase`
- ✅ Campos de banco de dados definidos:
  - `NFE` - Nota Fiscal Eletrônica
  - `DATA` - Data da Venda
  - `ID_DOC` - ID do Documento
  - `ID_PROD` - ID do Produto
  - `REFERENCIA` - Referência do Produto
  - `QTD` - Quantidade
  - `VALOR_UNIT` - Valor Unitário
  - `VALOR_TOTAL` - Valor Total
  - `RAZAO_SOCIAL` - Razão Social (Cliente)
  - `NOME_FANTASIA` - Nome Fantasia (Cliente)
  - `UF_Destino` - UF de Destino
  - `UF_Origem` - UF de Origem

- ✅ Tipos de dados suportados:
  - `text` - Texto
  - `integer` - Número Inteiro
  - `decimal` - Número Decimal
  - `currency` - Moeda (R$)
  - `date` - Data

- ✅ Campos obrigatórios: `['NFE', 'DATA', 'RAZAO_SOCIAL']`
- ✅ Usa utilitários: `import-vendas-utils.ts`
- ✅ Tem aba de gerenciamento: `GerenciarVendasTab`

#### Backend - Importação de Vendas (Supabase)
**Localização:** `painel-completo/src/server/actions/imports/import-sales-supabase.ts`

**Características:**
- ✅ Usa Supabase para armazenamento
- ✅ Processa planilhas Excel
- ✅ Valida e transforma dados
- ✅ Denormaliza `MARCA` da tabela `products` para `vendas`
- ✅ Atualiza tabela `analytics` em tempo real durante importação
- ✅ Usa UPSERT com chave composta: `nfe,id_prod,id_doc`
- ✅ Processa em lotes de 400 registros
- ✅ Retorna estatísticas de importação
- ✅ Salva histórico em `historico_importacao`

### 1.2. Estrutura Atual do Projeto (res-economico)

#### Frontend
- ✅ Página de vendas existe: `painel-completo/src/app/admin/vendas/page.tsx`
- ✅ Componente `ImportStepper` disponível
- ✅ Componente `ImportHistoryTable` disponível
- ✅ Utilitários de importação disponíveis

#### Backend
- ✅ Módulo Bravo ERP implementado: `backend/src/bravo-erp/` (apenas para produtos)
- ✅ Estrutura de sincronização de produtos já existe
- ✅ Sistema de lock e progresso implementado
- ✅ Cliente API do Bravo ERP implementado (apenas para produtos)
- ✅ Sistema de upload de planilhas Excel já existe (`backend/src/uploads/`)
- ❌ **NÃO existe API BRAVO para vendas** - importação é via Excel

---

## 2. ANÁLISE DO BANCO DE DADOS

### 2.1. Tabelas Necessárias

#### 2.1.1. Tabela `Venda` (Nova)

```prisma
model Venda {
  id              String   @id @default(uuid())
  
  // Identificação da Venda
  nfe             String   // Nota Fiscal Eletrônica (obrigatório)
  idDoc           String?  // ID do Documento no sistema origem
  dataVenda       DateTime // Data da Venda (obrigatório)
  
  // Cliente
  razaoSocial     String   // Razão Social do Cliente (obrigatório)
  nomeFantasia    String?  // Nome Fantasia do Cliente
  cnpjCliente     String?  // CNPJ do Cliente
  ufDestino       String?  // UF de Destino
  ufOrigem        String?  // UF de Origem
  
  // Produto
  idProd          String?  // ID do Produto no sistema origem
  referencia      String?  // Referência do Produto
  descricaoProduto String? // Descrição do Produto
  marca           String?  // Marca do Produto (denormalizada)
  
  // Valores
  quantidade      Decimal  @db.Decimal(18, 3) // Quantidade vendida
  valorUnitario   Decimal  @db.Decimal(18, 2) // Valor unitário
  valorTotal      Decimal  @db.Decimal(18, 2) // Valor total
  
  // Relacionamentos
  empresaId       String?  // Empresa relacionada
  produtoId       String?  // Produto relacionado (se existir na tabela Produto)
  
  // Metadata JSONB para campos dinâmicos
  metadata        Json?    // { bravo_id, tipo_venda, desconto, etc }
  
  // Timestamps
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relacionamentos
  empresa         Empresa? @relation(fields: [empresaId], references: [id])
  produto         Produto? @relation(fields: [produtoId], references: [id])
  
  @@index([nfe])
  @@index([dataVenda])
  @@index([empresaId, dataVenda])
  @@index([referencia])
  @@index([razaoSocial])
  @@index([idDoc])
  @@index([marca])
  @@unique([nfe, idDoc, referencia]) // Evita duplicatas (mesma chave do Supabase)
}
```

#### 2.1.2. Tabela `VendaAnalytics` (Nova - Agregações)

```prisma
model VendaAnalytics {
  id              String   @id @default(uuid())
  
  // Agregação temporal
  ano              Int
  mes              Int      // 1-12
  
  // Agregação por cliente
  nomeFantasia     String   // Nome fantasia do cliente
  
  // Agregação por produto
  marca            String   // Marca do produto
  
  // Agregação geográfica
  uf               String   // UF
  
  // Valores agregados
  totalValor       Decimal  @db.Decimal(18, 2)
  totalQuantidade  Decimal  @db.Decimal(18, 3)
  
  // Timestamps
  updatedAt        DateTime @updatedAt
  createdAt        DateTime @default(now())
  
  @@unique([ano, mes, nomeFantasia, marca, uf])
  @@index([ano, mes])
  @@index([marca])
  @@index([uf])
  @@index([nomeFantasia])
}
```

#### 2.1.3. Tabela `VendaImportacaoLog` (Nova - Histórico)

```prisma
model VendaImportacaoLog {
  id                String   @id @default(uuid())
  
  // Informações do arquivo
  nomeArquivo       String
  mappingName       String?  // Nome do mapeamento usado
  totalLinhas       Int
  
  // Resultados
  sucessoCount      Int      @default(0)
  erroCount         Int      @default(0)
  
  // Usuário
  usuarioEmail      String
  usuarioId         String?
  
  // Timestamps
  createdAt         DateTime @default(now())
  
  // Relacionamentos
  usuario           Usuario? @relation(fields: [usuarioId], references: [id])
  
  @@index([createdAt])
  @@index([usuarioId])
}
```

#### 2.1.4. Tabela `BravoSyncLogVendas` (NÃO NECESSÁRIA - Removida)

```prisma
model BravoSyncLogVendas {
  id                    String   @id @default(uuid())
  sync_type             String   // 'complete' | 'quick' | 'automatica'
  status                String   @default("running") // running, completed, failed, cancelled
  status_detalhado      String?  // completed_successfully, completed_with_errors, etc
  
  // Configuração da sincronização
  apenas_ativos         Boolean  @default(true)
  limit_requested       Int?
  pages_requested       Int?
  effective_limit       Int?
  
  // Progresso
  current_page          Int?     @default(1)
  pages_processed       Int?     @default(0)
  total_pages_found     Int?
  resume_from_page      Int?     // Para retomada de sincronização
  
  // Estatísticas
  total_vendas_bravo    Int?     @default(0)
  vendas_filtradas      Int?     @default(0)
  vendas_analisadas     Int?     @default(0)
  vendas_inseridas      Int?     @default(0)
  vendas_atualizadas    Int?     @default(0)
  vendas_ignoradas      Int?     @default(0)
  vendas_com_erro       Int?     @default(0)
  
  // Otimização
  taxa_otimizacao       String?  // Porcentagem de vendas ignoradas
  economia_queries      Int?     @default(0)
  
  // Erros
  error_message         String?
  error_details         Json?    // Detalhes do erro
  tipos_erro            Json?    // { duplicate_key: 5, foreign_key_violation: 2 }
  sugestoes_correcao    String[] // Sugestões de correção
  
  // Métricas
  tempo_total_segundos  Int?
  percentual_sucesso   Int?     // 0-100
  
  // Usuário
  triggered_by          String?  // 'admin_user', 'cron', 'api'
  user_agent            String?
  userId                String?  // ID do usuário que iniciou
  
  // Retomada
  can_resume            Boolean  @default(false)
  sync_details          Json?    // Detalhes adicionais da sincronização
  
  // Filtros de data
  data_inicio           DateTime? // Data inicial para sincronização
  data_fim              DateTime? // Data final para sincronização
  
  // Timestamps
  started_at            DateTime @default(now())
  completed_at          DateTime?
  last_activity_at       DateTime?

  // Relacionamentos
  progress    BravoSyncProgressVendas?

  @@index([status])
  @@index([sync_type])
  @@index([started_at])
  @@index([can_resume])
  @@index([userId])
  @@index([data_inicio, data_fim])
}
```

#### 2.1.3. Tabela `BravoSyncProgressVendas` (Nova)

```prisma
model BravoSyncProgressVendas {
  id                        String   @id @default(uuid())
  sync_log_id               String   @unique
  progress_percentage       Decimal  @db.Decimal(5, 2) // 0.00 a 100.00
  current_step              String?  // "Buscando vendas...", "Processando página 1..."
  current_page              Int?
  total_pages               Int?
  vendas_processed          Int?     @default(0)
  vendas_inserted_current_page Int? @default(0)
  total_vendas_bravo        Int?
  estimated_time_remaining  String?  // "5 páginas restantes"
  current_venda             String?  // NFE da venda atual
  status_atual              String?
  etapa_atual               String?
  
  createdAt                 DateTime @default(now())
  updatedAt                 DateTime @updatedAt
  
  syncLog                   BravoSyncLogVendas @relation(fields: [sync_log_id], references: [id], onDelete: Cascade)

  @@index([sync_log_id])
}
```

#### 2.1.4. Tabela `BravoCampoMapeamentoVendas` (Nova)

```prisma
model BravoCampoMapeamentoVendas {
  id                 Int      @id @default(autoincrement())
  campo_bravo        String   // Nome do campo na API Bravo
  campo_interno      String   // Nome do campo na tabela vendas
  tipo_transformacao String   @default("direto") // direto, decimal, json, boolean, date, etc
  ativo              Boolean  @default(true)
  ordem              Int      @default(0)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  @@index([ativo])
  @@index([ordem])
}
```

### 2.2. Relacionamentos com Tabelas Existentes

#### 2.2.1. Relacionamento com `Empresa`
- Uma venda pode pertencer a uma empresa
- Relacionamento opcional (pode ser null)

#### 2.2.2. Relacionamento com `Produto`
- Uma venda pode estar relacionada a um produto
- Relacionamento opcional (pode ser null)
- Usa `referencia` ou `idProd` para fazer o match

#### 2.2.3. Relacionamento com `Usuario`
- Logs de sincronização relacionam com usuário que iniciou
- Usado para auditoria

### 2.3. Índices Necessários

**Tabela `Venda`:**
- `@@index([nfe])` - Busca rápida por NFE
- `@@index([dataVenda])` - Filtros por data
- `@@index([empresaId, dataVenda])` - Relatórios por empresa e período
- `@@index([referencia])` - Busca por produto
- `@@index([razaoSocial])` - Busca por cliente
- `@@index([idDoc])` - Busca por ID do documento Bravo

**Tabela `BravoSyncLogVendas`:**
- `@@index([status])` - Filtros por status
- `@@index([sync_type])` - Filtros por tipo
- `@@index([started_at])` - Ordenação por data
- `@@index([can_resume])` - Busca de sincronizações retomáveis
- `@@index([userId])` - Filtros por usuário
- `@@index([data_inicio, data_fim])` - Filtros por período

---

## 3. DEPENDÊNCIAS E REFERÊNCIAS

### 3.1. Dependências do Backend

#### 3.1.1. Módulos NestJS Necessários
- ✅ `@nestjs/common` - Já instalado
- ✅ `@nestjs/config` - Já instalado
- ✅ `@prisma/client` - Já instalado
- ✅ `axios` - Já instalado (para cliente HTTP)
- ✅ `class-validator` - Já instalado
- ✅ `class-transformer` - Já instalado

#### 3.1.2. Serviços Existentes que Podem Ser Reutilizados
- ✅ `PrismaService` - Serviço de banco de dados
- ✅ Sistema de upload de planilhas Excel (`backend/src/uploads/`) - Reutilizar lógica de processamento
- ❌ Não há sincronização de vendas (apenas produtos)
- ❌ Não há sistema de lock para vendas (pode reutilizar lógica de produtos se necessário)
- ❌ Não há sistema de progresso para vendas (pode reutilizar lógica de produtos se necessário)

### 3.2. Dependências do Frontend

#### 3.2.1. Componentes Existentes
- ✅ `ImportStepper` - Componente genérico de importação
- ✅ `ImportHistoryTable` - Tabela de histórico
- ✅ `GerenciarVendasTab` - Componente de gerenciamento (já existe no painel-completo)

#### 3.2.2. Utilitários Existentes
- ✅ `import-vendas-utils.ts` - Utilitários de importação de vendas
- ✅ Cliente HTTP genérico (`lib/http.ts`)

### 3.3. Referências de Código

#### 3.3.1. Código de Referência - painel-completo (vendas)
- `painel-completo/src/app/admin/vendas/page.tsx` - Página de vendas
- `painel-completo/src/server/actions/imports/import-sales-supabase.ts` - Importação de vendas
- `painel-completo/src/lib/imports/utils/import-vendas-utils.ts` - Utilitários

#### 3.3.2. Código de Referência - res-economico (uploads)
- `backend/src/uploads/` - Sistema de upload de planilhas Excel (já existe)
- `frontend/src/app/(app)/admin/resultado-economico/uploads/` - Interface de uploads

#### 3.3.3. Código de Referência - res-economico (produtos - apenas estrutura)
- `backend/src/bravo-erp/sync/sync.service.ts` - Serviço de sincronização (referência para estrutura)
- `backend/src/bravo-erp/sync/sync-processor.service.ts` - Processador (referência para estrutura)

---

## 4. ESTRUTURA PROPOSTA

### 4.1. Estrutura de Backend (NestJS)

```
backend/
└── src/
    └── vendas/
        ├── vendas.module.ts
        ├── vendas.service.ts
        ├── vendas.controller.ts
        │
        ├── import/
        │   ├── vendas-import.service.ts      # Serviço principal de importação
        │   ├── vendas-import.controller.ts   # Controller de importação
        │   ├── vendas-processor.service.ts    # Processador de planilhas
        │   ├── vendas-validator.service.ts    # Validador de dados
        │   └── vendas-analytics.service.ts    # Atualização de analytics
        │
        ├── analytics/
        │   ├── vendas-analytics.service.ts    # Serviço de analytics
        │   └── vendas-analytics.controller.ts
        │
        └── dto/
            ├── vendas-import-request.dto.ts
            ├── vendas-import-response.dto.ts
            └── vendas-mapping.dto.ts
```

### 4.2. Estrutura de Frontend (Next.js)

```
frontend/
└── src/
    └── app/
        └── (app)/
            └── admin/
                └── vendas/
                    ├── page.tsx              # Página principal
                    ├── importar/
                    │   └── page.tsx          # Página de importação
                    └── gerenciar/
                        └── page.tsx          # Página de gerenciamento
```

### 4.3. Componentes Frontend

```
frontend/
└── src/
    └── components/
        └── vendas/
            ├── vendas-import-panel.tsx        # Painel de importação
            ├── vendas-stats-card.tsx          # Card de estatísticas
            ├── vendas-log-table.tsx           # Tabela de logs
            └── vendas-list.tsx                # Lista de vendas
```

### 4.4. Serviços Frontend

```
frontend/
└── src/
    └── services/
        └── vendas.service.ts                    # Cliente API para vendas
```

---

## 5. PLANO DE IMPLEMENTAÇÃO

### FASE 1: Estrutura Base do Banco de Dados ⏱️ ~2 horas

#### Tarefas:
1. ✅ Criar schema Prisma com tabelas de vendas
2. ✅ Criar migration
3. ✅ Aplicar migration no banco
4. ✅ Verificar índices e constraints

#### Arquivos:
- `backend/prisma/schema.prisma` (adicionar modelos)
- `backend/prisma/migrations/XXX_add_vendas_module/migration.sql`

---

### FASE 2: Backend - Serviço de Processamento de Planilhas ⏱️ ~3 horas

#### Tarefas:
1. ✅ Criar `VendasProcessorService` para processar Excel
2. ✅ Implementar parser de planilhas (usar xlsx ou exceljs)
3. ✅ Implementar validação de dados
4. ✅ Implementar transformação de dados

#### Arquivos:
- `backend/src/vendas/import/vendas-processor.service.ts`
- `backend/src/vendas/import/vendas-validator.service.ts`

#### Dependências:
- Reutilizar lógica de processamento de Excel do módulo de uploads
- Adaptar para estrutura de vendas

**NOTA:** Não há API BRAVO para vendas. A importação é feita via planilha Excel.

---

### FASE 3: Backend - Serviço de Importação ⏱️ ~4 horas

#### Tarefas:
1. ✅ Criar `VendasImportService` principal
2. ✅ Implementar processamento em lotes
3. ✅ Implementar UPSERT com chave composta
4. ✅ Denormalizar marca de produtos
5. ✅ Atualizar analytics em tempo real
6. ✅ Salvar logs de importação

#### Arquivos:
- `backend/src/vendas/import/vendas-import.service.ts`
- `backend/src/vendas/import/vendas-import.controller.ts`
- `backend/src/vendas/import/vendas-analytics.service.ts`
- `backend/src/vendas/dto/vendas-import-request.dto.ts`
- `backend/src/vendas/dto/vendas-import-response.dto.ts`

#### Dependências:
- Reutilizar lógica de processamento em lotes do módulo de uploads
- Adaptar para estrutura de vendas

---

### FASE 4: Backend - Serviço de Analytics ⏱️ ~2 horas

#### Tarefas:
1. ✅ Criar `VendasAnalyticsService`
2. ✅ Implementar agregação de dados
3. ✅ Implementar atualização em tempo real durante importação
4. ✅ Criar endpoints de consulta

#### Arquivos:
- `backend/src/vendas/analytics/vendas-analytics.service.ts`
- `backend/src/vendas/analytics/vendas-analytics.controller.ts`

---

### FASE 5: Frontend - Estrutura Base ⏱️ ~2 horas

#### Tarefas:
1. ✅ Criar estrutura de pastas (`/admin/vendas`)
2. ✅ Criar API client (`vendas.service.ts`)
3. ✅ Criar hooks (`use-vendas.ts`)

#### Arquivos:
- `frontend/src/services/vendas.service.ts`
- `frontend/src/hooks/use-vendas.ts`

---

### FASE 6: Frontend - Página de Importação ⏱️ ~4 horas

#### Tarefas:
1. ✅ Criar página principal (`/admin/vendas`)
2. ✅ Adaptar componente `ImportStepper` (ou criar novo)
3. ✅ Implementar upload de planilha
4. ✅ Implementar mapeamento de colunas
5. ✅ Implementar preview de dados
6. ✅ Implementar processamento assíncrono

#### Arquivos:
- `frontend/src/app/(app)/admin/vendas/page.tsx`
- `frontend/src/app/(app)/admin/vendas/importar/page.tsx`
- `frontend/src/components/vendas/vendas-import-panel.tsx`

#### Dependências:
- Reutilizar estrutura do painel-completo
- Adaptar para API do res-economico

---

### FASE 7: Frontend - Página de Gerenciamento ⏱️ ~3 horas

#### Tarefas:
1. ✅ Criar página de gerenciamento
2. ✅ Implementar listagem de vendas
3. ✅ Implementar filtros (data, cliente, produto, etc)
4. ✅ Implementar paginação
5. ✅ Implementar exportação

#### Arquivos:
- `frontend/src/app/(app)/admin/vendas/gerenciar/page.tsx`
- `frontend/src/components/vendas/vendas-list.tsx`

---

### FASE 8: Frontend - Analytics e Estatísticas ⏱️ ~2 horas

#### Tarefas:
1. ✅ Criar componente de estatísticas
2. ✅ Implementar gráficos (opcional)
3. ✅ Implementar filtros de analytics

#### Arquivos:
- `frontend/src/components/vendas/vendas-stats-card.tsx`

---

### FASE 9: Testes e Ajustes ⏱️ ~3 horas

#### Tarefas:
1. ✅ Testar importação de planilha
2. ✅ Testar validação de dados
3. ✅ Testar atualização de analytics
4. ✅ Testar relacionamento com produtos
5. ✅ Testar performance com grandes volumes
6. ✅ Corrigir bugs

---

## 6. CHECKLIST COMPLETO

### Banco de Dados
- [ ] Criar schema Prisma com tabela `Venda`
- [ ] Criar schema Prisma com tabela `VendaAnalytics`
- [ ] Criar schema Prisma com tabela `VendaImportacaoLog`
- [ ] Criar migration
- [ ] Aplicar migration
- [ ] Verificar índices
- [ ] Verificar constraints
- [ ] Verificar relacionamentos

### Backend - Core
- [ ] Criar módulo `VendasModule`
- [ ] Configurar imports e exports
- [ ] Adicionar ao `AppModule`

### Backend - Import
- [ ] Criar `VendasProcessorService`
- [ ] Criar `VendasValidatorService`
- [ ] Criar `VendasImportService`
- [ ] Criar `VendasImportController`
- [ ] Implementar processamento de Excel
- [ ] Implementar validação
- [ ] Implementar UPSERT
- [ ] Implementar denormalização de marca
- [ ] Implementar atualização de analytics

### Backend - Analytics
- [ ] Criar `VendasAnalyticsService`
- [ ] Criar `VendasAnalyticsController`
- [ ] Implementar agregação
- [ ] Implementar endpoints de consulta

### Frontend - Estrutura
- [ ] Criar estrutura de pastas (`/admin/importacoes/bravo-erp/vendas`)
- [ ] Criar API client
- [ ] Criar hooks

### Frontend - Páginas
- [ ] Criar página principal (`/admin/importacoes/bravo-erp/vendas`)
- [ ] Criar página de mapeamento
- [ ] Implementar tabs

### Frontend - Componentes
- [ ] Criar painel de sincronização
- [ ] Criar painel de configuração
- [ ] Criar painel de mapeamento
- [ ] Criar card de estatísticas
- [ ] Criar tabela de logs

### Testes
- [ ] Testar configuração
- [ ] Testar mapeamento
- [ ] Testar sincronização rápida
- [ ] Testar sincronização completa
- [ ] Testar retomada
- [ ] Testar cancelamento
- [ ] Testar filtros de data
- [ ] Testar erros

---

## 📊 ESTIMATIVA DE ESFORÇO

| Componente | Estimativa |
|------------|-----------|
| Backend (NestJS) | ~11 horas |
| Frontend (Next.js) | ~11 horas |
| Testes e Ajustes | ~3 horas |
| **TOTAL** | **~25 horas** |

---

## ⚠️ CONSIDERAÇÕES IMPORTANTES

### 1. Diferenças entre painel-completo e res-economico

**painel-completo:**
- Usa Supabase (PostgreSQL gerenciado)
- Tabela `vendas` no Supabase
- Tabela `analytics` no Supabase
- Importação via Server Actions (Next.js)

**res-economico:**
- Usa PostgreSQL direto (via Prisma)
- Tabelas no próprio banco
- Importação via API REST (NestJS)

### 2. Migração de Dados

Se houver necessidade de migrar dados do painel-completo:
- Exportar dados do Supabase
- Transformar para formato do res-economico
- Importar via API ou script

### 3. Performance

- Processar vendas em lotes (400 registros por vez)
- Usar UPSERT para evitar duplicatas
- Atualizar analytics em tempo real (otimizado)
- Denormalizar marca para evitar joins

### 4. Validação

- Validar campos obrigatórios: `NFE`, `DATA`, `RAZAO_SOCIAL`
- Validar formatos de data
- Validar valores numéricos
- Validar relacionamento com produtos (opcional)

### 5. Relacionamento com Produtos

- Tentar fazer match automático com produtos existentes
- Usar `referencia` ou `idProd` para relacionar
- Manter relacionamento opcional (pode ser null)
- Denormalizar marca para performance

---

## 📚 DOCUMENTAÇÃO DE REFERÊNCIA

### Arquivos de Referência do painel-completo:
1. **Frontend:**
   - `src/app/admin/vendas/page.tsx` - Página de vendas
   - `src/lib/imports/utils/import-vendas-utils.ts` - Utilitários

2. **Backend:**
   - `src/server/actions/imports/import-sales-supabase.ts` - Importação de vendas

### Arquivos de Referência do res-economico:
1. **Backend:**
   - `backend/src/uploads/` - Sistema de upload de planilhas Excel
   - `backend/src/bravo-erp/sync/` - Sistema de sincronização (referência para estrutura)

2. **Frontend:**
   - `frontend/src/app/(app)/admin/resultado-economico/uploads/` - Interface de uploads

---

## 🎯 PRÓXIMOS PASSOS

1. ✅ **Revisar este documento** com o time
2. ✅ **Validar estrutura** de banco de dados proposta
3. ✅ **Iniciar FASE 1** - Estrutura Base do Banco
4. ✅ **Seguir fases** sequencialmente
5. ✅ **Testar cada fase** antes de avançar

---

**Última Atualização:** 2025-01-XX  
**Versão:** 1.0.0  
**Status:** 📋 Pronto para Implementação
