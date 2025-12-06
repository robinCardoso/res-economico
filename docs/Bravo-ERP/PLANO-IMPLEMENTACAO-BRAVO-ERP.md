# 📘 PLANO COMPLETO: Implementação do Módulo Bravo ERP

## 🎯 OBJETIVO

Implementar o sistema completo de sincronização do Bravo ERP no projeto atual, adaptando toda a estrutura do `painel-completo` (que usa Supabase/Vercel) para nosso stack atual (NestJS + Prisma + PostgreSQL + Next.js).

---

## 📊 ANÁLISE DO SISTEMA ATUAL

### Stack Tecnológico Atual
- **Backend:** NestJS + Prisma ORM + PostgreSQL
- **Frontend:** Next.js 16 + TypeScript + Tailwind CSS
- **Autenticação:** JWT com Passport
- **Banco de Dados:** PostgreSQL via Docker
- **Fila de Jobs:** BullMQ + Redis
- **Infraestrutura:** Docker Compose (local)

### Stack do painel-completo (Bravo ERP)
- **Backend:** Next.js API Routes
- **Frontend:** Next.js (mesma stack)
- **Banco de Dados:** Supabase (PostgreSQL gerenciado)
- **Autenticação:** Supabase Auth
- **Storage:** Supabase Storage

### Diferenças Principais a Adaptar
1. ❌ **Supabase** → ✅ **Prisma + PostgreSQL direto**
2. ❌ **Next.js API Routes** → ✅ **NestJS Controllers + Services**
3. ❌ **Supabase Auth** → ✅ **JWT + Passport (já implementado)**
4. ❌ **Supabase Storage** → ✅ **Armazenamento local ou S3**

---

## 🗄️ ESTRUTURA DE BANCO DE DADOS

### 1. Tabelas Necessárias (Schema Prisma)

```prisma
// =====================================================
// BRAVO ERP - CONFIGURAÇÕES
// =====================================================

model BravoSyncConfig {
  id        String   @id @default(uuid())
  chave     String   @unique // Ex: "bravo_base_url", "bravo_token"
  valor     String
  descricao String?
  tipo      String   @default("string") // string, number, boolean
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([chave])
}

// =====================================================
// BRAVO ERP - MAPEAMENTO DE CAMPOS
// =====================================================

model BravoCampoMapeamento {
  id                 Int      @id @default(autoincrement())
  campo_bravo        String   // Nome do campo na API Bravo
  campo_interno      String   // Nome do campo na tabela produtos
  tipo_transformacao String   @default("direto") // direto, decimal, json, boolean, etc
  ativo              Boolean  @default(true)
  ordem              Int      @default(0)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  @@index([ativo])
  @@index([ordem])
}

// =====================================================
// BRAVO ERP - PRODUTOS
// =====================================================

model Produto {
  id             String   @id @default(uuid())
  referencia     String   @unique // Referência única do produto (obrigatório)
  id_prod        String?  // ID original do Bravo ERP
  descricao      String?
  marca          String?
  grupo          String?
  subgrupo       String?
  ativo          Boolean  @default(true)
  
  // Campos adicionais
  gtin           String?  // Código GTIN/EAN
  ncm            String?  // Código NCM
  cest           String?  // Código CEST
  _data_ult_modif DateTime? // Data da última modificação no Bravo
  
  // Metadata JSONB para campos dinâmicos
  metadata       Json?    // { bravo_id, tipo_produto, preco_venda, peso_bruto, etc }
  
  // Timestamps
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([referencia])
  @@index([id_prod])
  @@index([ativo])
  @@index([marca])
  @@index([grupo])
  @@index([_data_ult_modif])
}

// =====================================================
// BRAVO ERP - LOGS DE SINCRONIZAÇÃO
// =====================================================

model BravoSyncLog {
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
  total_produtos_bravo  Int?     @default(0)
  produtos_filtrados    Int?     @default(0)
  produtos_analisados   Int?     @default(0)
  produtos_inseridos    Int?     @default(0)
  produtos_atualizados  Int?     @default(0)
  produtos_ignorados    Int?     @default(0)
  produtos_com_erro     Int?     @default(0)
  
  // Otimização
  taxa_otimizacao       String?  // Porcentagem de produtos ignorados
  economia_queries      Int?     @default(0)
  
  // Erros
  error_message         String?
  error_details         Json?    // Detalhes do erro
  tipos_erro            Json?    // { duplicate_key: 5, foreign_key_violation: 2 }
  sugestoes_correcao    String[] // Sugestões de correção
  
  // Métricas
  tempo_total_segundos  Int?
  percentual_sucesso    Int?     // 0-100
  
  // Usuário
  triggered_by          String?  // 'admin_user', 'cron', 'api'
  user_agent            String?
  userId                String?  // ID do usuário que iniciou
  
  // Retomada
  can_resume            Boolean  @default(false)
  sync_details          Json?    // Detalhes adicionais da sincronização
  
  // Timestamps
  started_at            DateTime @default(now())
  completed_at          DateTime?
  last_activity_at      DateTime?

  @@index([status])
  @@index([sync_type])
  @@index([started_at])
  @@index([can_resume])
  @@index([userId])
}

// =====================================================
// BRAVO ERP - PROGRESSO DE SINCRONIZAÇÃO
// =====================================================

model BravoSyncProgress {
  id                        String   @id @default(uuid())
  sync_log_id               String
  progress_percentage       Decimal  @db.Decimal(5, 2) // 0.00 a 100.00
  current_step              String?  // "Buscando produtos...", "Processando página 1..."
  current_page              Int?
  total_pages               Int?
  products_processed        Int?     @default(0)
  products_inserted_current_page Int? @default(0)
  total_produtos_bravo      Int?
  estimated_time_remaining  String?  // "5 páginas restantes"
  current_product           String?  // Referência do produto atual
  status_atual              String?
  etapa_atual               String?
  
  createdAt                 DateTime @default(now())
  updatedAt                 DateTime @updatedAt
  
  syncLog                   BravoSyncLog @relation(fields: [sync_log_id], references: [id], onDelete: Cascade)

  @@unique([sync_log_id])
  @@index([sync_log_id])
}

// =====================================================
// BRAVO ERP - AGREGADOS (Marcas, Grupos, Subgrupos)
// =====================================================

model Marca {
  id        String   @id @default(uuid())
  nome      String   @unique
  createdAt DateTime @default(now())
  
  @@index([nome])
}

model Grupo {
  id        String   @id @default(uuid())
  nome      String   @unique
  createdAt DateTime @default(now())
  
  @@index([nome])
}

model Subgrupo {
  id        String   @id @default(uuid())
  nome      String   @unique
  createdAt DateTime @default(now())
  
  @@index([nome])
}

// =====================================================
// RELACIONAMENTOS
// =====================================================

// Adicionar no modelo BravoSyncLog:
// progress    BravoSyncProgress?
```

### 2. Migração do Schema

```bash
# Criar migration
npx prisma migrate dev --name add_bravo_erp_module

# Aplicar no banco
npx prisma migrate deploy
```

---

## 🏗️ ESTRUTURA DE BACKEND (NestJS)

### 1. Módulo Principal

```
backend/
└── src/
    └── bravo-erp/
        ├── bravo-erp.module.ts
        ├── bravo-erp.service.ts
        ├── bravo-erp.controller.ts
        │
        ├── config/
        │   ├── bravo-config.service.ts
        │   └── bravo-config.controller.ts
        │
        ├── sync/
        │   ├── sync.service.ts
        │   ├── sync.controller.ts
        │   ├── sync-lock.manager.ts
        │   └── sync-processor.service.ts
        │
        ├── mapping/
        │   ├── mapping.service.ts
        │   ├── mapping.controller.ts
        │   └── campo-transform.service.ts
        │
        ├── client/
        │   ├── bravo-erp-client-v2.ts
        │   └── bravo-erp-client.interface.ts
        │
        ├── products/
        │   ├── products.service.ts
        │   └── products.controller.ts
        │
        ├── stats/
        │   ├── stats.service.ts
        │   └── stats.controller.ts
        │
        └── dto/
            ├── sync-request.dto.ts
            ├── sync-response.dto.ts
            ├── config.dto.ts
            └── mapping.dto.ts
```

### 2. Serviços Principais

#### A. Bravo ERP Client Service
**Arquivo:** `backend/src/bravo-erp/client/bravo-erp-client-v2.ts`

**Responsabilidades:**
- Conectar com a API do Bravo ERP
- Consultar produtos com paginação
- Gerenciar autenticação e tokens
- Tratar rate limiting

**Dependências:**
- `axios` (já instalado)
- `@nestjs/config` (já instalado)

#### B. Sync Service
**Arquivo:** `backend/src/bravo-erp/sync/sync.service.ts`

**Responsabilidades:**
- Orquestrar sincronização completa
- Gerenciar páginas e lotes
- Processar produtos em batch
- Atualizar logs de progresso

**Dependências:**
- PrismaService (já existe)
- Bravo ERP Client
- Mapping Service

#### C. Mapping Service
**Arquivo:** `backend/src/bravo-erp/mapping/mapping.service.ts`

**Responsabilidades:**
- Aplicar mapeamentos configurados
- Transformar dados do Bravo para formato interno
- Validar dados antes de inserir

#### D. Config Service
**Arquivo:** `backend/src/bravo-erp/config/bravo-config.service.ts`

**Responsabilidades:**
- Gerenciar configurações do Bravo ERP
- Validar configurações
- Buscar configurações do banco

---

## 🎨 ESTRUTURA DE FRONTEND (Next.js)

### 1. Páginas

```
frontend/
└── src/
    └── app/
        └── (app)/
            └── admin/
                └── importações/
                    ├── bravo-erp/
                    │   ├── produtos/
                    │   │   ├── page.tsx          # Página principal de produtos
                    │   │   └── mapeamento/
                    │   │       └── page.tsx      # Configuração de mapeamento
                    │   ├── vendas/               # Futuro: quando API for liberada
                    │   │   └── page.tsx
                    │   └── pedidos/              # Futuro: quando API for liberada
                    │       └── page.tsx
                    ├── vendas/                   # Temporário: alternativa sem Bravo ERP
                    │   └── page.tsx
                    └── pedidos/                  # Temporário: alternativa sem Bravo ERP
                        └── page.tsx
```

#### 📝 Nota sobre Estrutura de Pastas:

A estrutura foi organizada para suportar:
1. **Bravo ERP - Produtos:** `/admin/importações/bravo-erp/produtos` (implementação atual)
2. **Bravo ERP - Vendas:** `/admin/importações/bravo-erp/vendas` (futuro - quando API for liberada)
3. **Bravo ERP - Pedidos:** `/admin/importações/bravo-erp/pedidos` (futuro - quando API for liberada)
4. **Importações Alternativas:** `/admin/importações/vendas` e `/admin/importações/pedidos` (temporário - sem Bravo ERP)

Isso permite:
- ✅ Organização clara por tipo de importação
- ✅ Preparação para futuras funcionalidades do Bravo ERP
- ✅ Flexibilidade para importações alternativas (sem Bravo ERP)
- ✅ Escalabilidade para adicionar novos tipos de importação

### 2. Componentes

```
frontend/
└── src/
    └── components/
        └── bravo-erp/
            ├── sync-panel.tsx           # Painel de sincronização
            ├── config-panel.tsx         # Painel de configuração
            ├── mapping-panel.tsx        # Painel de mapeamento
            ├── stats-card.tsx           # Card de estatísticas
            ├── sync-log-table.tsx       # Tabela de logs
            └── progress-modal.tsx       # Modal de progresso
```

### 3. Hooks

```
frontend/
└── src/
    └── hooks/
        └── bravo-erp/
            ├── use-bravo-sync.ts       # Hook para sincronização
            ├── use-bravo-config.ts     # Hook para configuração
            ├── use-sync-progress.ts    # Hook para progresso
            └── use-bravo-stats.ts      # Hook para estatísticas
```

### 4. API Client

```
frontend/
└── src/
    └── lib/
        └── api/
            └── bravo-erp.ts            # Cliente API para Bravo ERP
```

---

## 📦 DEPENDÊNCIAS NECESSÁRIAS

### Backend (NestJS)

```json
{
  "dependencies": {
    "axios": "^1.13.2",              // ✅ Já instalado
    "@nestjs/common": "^11.0.1",     // ✅ Já instalado
    "@nestjs/config": "^4.0.2",      // ✅ Já instalado
    "@prisma/client": "^6.19.0",     // ✅ Já instalado
    "class-validator": "^0.14.2",    // ✅ Já instalado
    "class-transformer": "^0.5.1"    // ✅ Já instalado
  }
}
```

**Nenhuma dependência adicional necessária!** ✅

### Frontend (Next.js)

```json
{
  "dependencies": {
    "axios": "^1.13.2",              // ✅ Já instalado
    "@tanstack/react-query": "^5.90.8", // ✅ Já instalado
    "react-hook-form": "^7.66.0",    // ✅ Já instalado
    "zod": "^4.1.12",                // ✅ Já instalado
    "lucide-react": "^0.553.0",      // ✅ Já instalado
    "date-fns": "^4.1.0"             // ✅ Já instalado
  }
}
```

**Nenhuma dependência adicional necessária!** ✅

---

## 🔄 ADAPTAÇÕES NECESSÁRIAS

### 1. Substituir Supabase por Prisma

#### ❌ Código Original (Supabase):
```typescript
const supabase = createSupabaseAdmin();
const { data, error } = await supabase
  .schema('api')
  .from('produtos')
  .select('*')
  .eq('referencia', ref);
```

#### ✅ Código Adaptado (Prisma):
```typescript
const produto = await this.prisma.produto.findUnique({
  where: { referencia: ref }
});
```

### 2. Adaptar API Routes para NestJS Controllers

#### ❌ Código Original (Next.js API Route):
```typescript
// app/api/bravo-erp/sincronizar/route.ts
export async function POST(request: Request) {
  const body = await request.json();
  // ...
}
```

#### ✅ Código Adaptado (NestJS Controller):
```typescript
// bravo-erp.controller.ts
@Controller('bravo-erp')
export class BravoErpController {
  @Post('sincronizar')
  async sincronizar(@Body() dto: SyncRequestDto) {
    // ...
  }
}
```

### 3. Adaptar Autenticação

#### ❌ Código Original (Supabase Auth):
```typescript
const user = await authContext.getUserFromRequest(request);
```

#### ✅ Código Adaptado (JWT + Passport):
```typescript
@UseGuards(JwtAuthGuard)
@Post('sincronizar')
async sincronizar(
  @Request() req, // req.user já vem do JWT guard
  @Body() dto: SyncRequestDto
) {
  const userId = req.user.id;
  // ...
}
```

### 4. Adaptar Storage (se necessário)

Se houver upload de arquivos:
- ❌ Supabase Storage → ✅ Armazenamento local ou S3
- Usar `multer` (já instalado) para uploads locais

---

## 🚀 PLANO DE IMPLEMENTAÇÃO - FASE POR FASE

### **FASE 1: Estrutura Base do Banco de Dados** ⏱️ ~2 horas

#### Tarefas:
1. ✅ Criar schema Prisma com todas as tabelas
2. ✅ Criar migration
3. ✅ Aplicar migration no banco
4. ✅ Verificar índices e constraints

#### Arquivos:
- `backend/prisma/schema.prisma` (adicionar modelos)
- `backend/prisma/migrations/XXX_add_bravo_erp_module/migration.sql`

---

### **FASE 2: Cliente API do Bravo ERP** ⏱️ ~3 horas

#### Tarefas:
1. ✅ Criar `BravoErpClientService` baseado no código original
2. ✅ Adaptar métodos de consulta de produtos
3. ✅ Implementar autenticação com token
4. ✅ Implementar rate limiting
5. ✅ Tratar erros e retries

#### Arquivos:
- `backend/src/bravo-erp/client/bravo-erp-client-v2.ts`
- `backend/src/bravo-erp/client/bravo-erp-client.interface.ts`

#### Dependências:
- Clonar e adaptar código de:
  - `painel-completo/src/lib/bravo-erp/bravo-erp-client-v2.ts`

---

### **FASE 3: Serviço de Configuração** ⏱️ ~2 horas

#### Tarefas:
1. ✅ Criar `BravoConfigService`
2. ✅ Criar `BravoConfigController`
3. ✅ Implementar CRUD de configurações
4. ✅ Validar configurações obrigatórias

#### Arquivos:
- `backend/src/bravo-erp/config/bravo-config.service.ts`
- `backend/src/bravo-erp/config/bravo-config.controller.ts`
- `backend/src/bravo-erp/dto/config.dto.ts`

---

### **FASE 4: Serviço de Mapeamento** ⏱️ ~3 horas

#### Tarefas:
1. ✅ Criar `MappingService`
2. ✅ Criar `MappingController`
3. ✅ Implementar transformações de dados
4. ✅ Criar serviço de transformação de campos

#### Arquivos:
- `backend/src/bravo-erp/mapping/mapping.service.ts`
- `backend/src/bravo-erp/mapping/mapping.controller.ts`
- `backend/src/bravo-erp/mapping/campo-transform.service.ts`
- `backend/src/bravo-erp/dto/mapping.dto.ts`

#### Dependências:
- Clonar e adaptar código de:
  - `painel-completo/src/lib/bravo-erp/bravo-erp-mapping.ts`

---

### **FASE 5: Serviço de Sincronização** ⏱️ ~6 horas

#### Tarefas:
1. ✅ Criar `SyncService` principal
2. ✅ Implementar processamento página por página
3. ✅ Implementar sistema de lock (usar Redis)
4. ✅ Criar `SyncProcessorService` para processar lotes
5. ✅ Implementar retomada de sincronização
6. ✅ Atualizar logs de progresso

#### Arquivos:
- `backend/src/bravo-erp/sync/sync.service.ts`
- `backend/src/bravo-erp/sync/sync.controller.ts`
- `backend/src/bravo-erp/sync/sync-lock.manager.ts`
- `backend/src/bravo-erp/sync/sync-processor.service.ts`
- `backend/src/bravo-erp/dto/sync-request.dto.ts`
- `backend/src/bravo-erp/dto/sync-response.dto.ts`

#### Dependências:
- Clonar e adaptar código de:
  - `painel-completo/src/app/api/bravo-erp/sincronizar/route.ts`
  - `painel-completo/src/lib/core/sync-lock.ts`

---

### **FASE 6: Endpoints de Progresso e Status** ⏱️ ~2 horas

#### Tarefas:
1. ✅ Criar endpoint de progresso
2. ✅ Criar endpoint de status
3. ✅ Criar endpoint de logs
4. ✅ Criar endpoint de estatísticas

#### Arquivos:
- `backend/src/bravo-erp/sync/sync-progress.controller.ts`
- `backend/src/bravo-erp/stats/stats.service.ts`
- `backend/src/bravo-erp/stats/stats.controller.ts`

---

### **FASE 7: Frontend - Página Principal** ⏱️ ~4 horas

#### Tarefas:
1. ✅ Criar página principal (`/admin/importacoes/bravo-erp/produtos`)
2. ✅ Implementar tabs (Configuração, Sincronização, Mapeamento)
3. ✅ Criar componente de estatísticas
4. ✅ Criar componente de logs
5. ✅ Adicionar link no sidebar (menu Importações)

#### Arquivos:
- `frontend/src/app/(app)/admin/importacoes/bravo-erp/produtos/page.tsx`
- `frontend/src/components/bravo-erp/sync-panel.tsx`
- `frontend/src/components/bravo-erp/config-panel.tsx`
- `frontend/src/components/bravo-erp/stats-card.tsx`
- `frontend/src/components/layout/admin-sidebar.tsx` (atualizado com menu Importações)

#### Dependências:
- Clonar e adaptar código de:
  - `painel-completo/src/app/admin/bravo-erp/page.tsx`

#### Nota sobre estrutura:
- Estrutura preparada para futuro: `/bravo-erp/vendas` e `/bravo-erp/pedidos`
- Estrutura temporária também disponível: `/importacoes/vendas` e `/importacoes/pedidos`
- **IMPORTANTE**: Pasta renomeada de "importações" para "importacoes" (sem acento) para evitar problemas com URLs

---

### **FASE 8: Frontend - Painel de Configuração** ⏱️ ~2 horas

#### Tarefas:
1. ✅ Criar formulário de configuração
2. ✅ Implementar validação
3. ✅ Conectar com API
4. ✅ Adicionar feedback visual

#### Arquivos:
- `frontend/src/components/bravo-erp/config-panel.tsx`
- `frontend/src/hooks/bravo-erp/use-bravo-config.ts`

---

### **FASE 9: Frontend - Painel de Mapeamento** ⏱️ ~3 horas ✅ **CONCLUÍDA**

#### Tarefas:
1. ✅ Criar interface de mapeamento
2. ✅ Implementar drag & drop (opcional)
3. ⏳ Adicionar preview de dados (opcional - requer endpoint no backend)
4. ✅ Conectar com API

#### Arquivos Criados:
- ✅ `frontend/src/components/bravo-erp/mapping-panel.tsx`
- ✅ `frontend/src/components/ui/checkbox.tsx`
- ✅ `frontend/src/components/ui/separator.tsx`

#### Status:
- ✅ Componente criado e funcional
- ✅ Integrado na página principal
- ⏳ Preview automático pendente (requer endpoint no backend)

---

### **FASE 10: Frontend - Sincronização e Progresso** ⏱️ ~4 horas ✅ **CONCLUÍDA**

#### Tarefas:
1. ✅ Criar interface de sincronização
2. ✅ Implementar polling de progresso
3. ✅ Adicionar cancelamento de sincronização
4. ✅ Implementar retomada de sincronização

#### Arquivos Criados:
- ✅ `frontend/src/components/bravo-erp/sync-panel.tsx`

#### Status:
- ✅ Componente criado e funcional
- ✅ Sincronização rápida e completa implementadas
- ✅ Polling de progresso em tempo real
- ✅ Cancelamento de sincronização
- ✅ Integrado na página principal

---

### **FASE 11: Frontend - API Client** ⏱️ ~2 horas ✅ **CONCLUÍDA**

#### Tarefas:
1. ✅ Cliente API já existente (`lib/http.ts`)
2. ✅ Métodos de requisição implementados
3. ✅ Tratamento de erros implementado
4. ✅ Interceptors configurados

#### Status:
- ✅ Cliente HTTP genérico com interceptors já existia
- ✅ Serviço `bravo-erp.service.ts` criado e usando o cliente
- ✅ Todos os métodos necessários implementados
- ✅ **Status:** Implementado via serviço existente

---

### **FASE 12: Testes e Ajustes** ⏱️ ~4 horas

#### Tarefas:
1. ✅ Testar sincronização completa
2. ✅ Testar sincronização rápida
3. ✅ Testar retomada
4. ✅ Testar cancelamento
5. ✅ Ajustar rate limiting
6. ✅ Otimizar performance
7. ✅ Corrigir bugs

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Banco de Dados
- [ ] Criar schema Prisma com todas as tabelas
- [ ] Criar migration
- [ ] Aplicar migration
- [ ] Verificar índices
- [ ] Verificar constraints

### Backend - Core
- [ ] Criar módulo `BravoErpModule`
- [ ] Configurar imports e exports
- [ ] Adicionar ao `AppModule`

### Backend - Client
- [ ] Criar `BravoErpClientService`
- [ ] Implementar autenticação
- [ ] Implementar consulta de produtos
- [ ] Implementar rate limiting

### Backend - Config
- [ ] Criar `BravoConfigService`
- [ ] Criar `BravoConfigController`
- [ ] Implementar CRUD
- [ ] Validar configurações

### Backend - Mapping
- [ ] Criar `MappingService`
- [ ] Criar `MappingController`
- [ ] Implementar transformações
- [ ] Testar mapeamentos

### Backend - Sync
- [ ] Criar `SyncService`
- [ ] Criar `SyncController`
- [ ] Implementar processamento
- [ ] Implementar lock manager
- [ ] Implementar retomada
- [ ] Atualizar progresso

### Backend - Stats
- [ ] Criar `StatsService`
- [ ] Criar `StatsController`
- [ ] Implementar estatísticas

### Frontend - Estrutura
- [ ] Criar estrutura de pastas (`/admin/importações/bravo-erp/produtos`)
- [ ] Criar API client
- [ ] Criar hooks
- [ ] Preparar estrutura para vendas e pedidos (futuro)

### Frontend - Páginas
- [ ] Criar página principal (`/admin/importações/bravo-erp/produtos`)
- [ ] Criar página de mapeamento
- [ ] Implementar tabs
- [ ] Documentar estrutura futura para vendas/pedidos

### Frontend - Componentes
- [ ] Criar painel de configuração
- [ ] Criar painel de sincronização
- [ ] Criar painel de mapeamento
- [ ] Criar modal de progresso
- [ ] Criar card de estatísticas
- [ ] Criar tabela de logs

### Testes
- [ ] Testar configuração
- [ ] Testar mapeamento
- [ ] Testar sincronização rápida
- [ ] Testar sincronização completa
- [ ] Testar retomada
- [ ] Testar cancelamento
- [ ] Testar erros

---

## 🔧 CONFIGURAÇÕES NECESSÁRIAS

### Variáveis de Ambiente (Backend)

```env
# Bravo ERP (será configurado via interface, mas pode ter defaults)
BRAVO_BASE_URL=https://v2.bravoerp.com.br
BRAVO_DEFAULT_CLIENTE=redeuniao_sc
BRAVO_DEFAULT_TIMEOUT=30

# Redis (para lock manager - já deve existir)
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Variáveis de Ambiente (Frontend)

```env
# Base URL da API (já deve existir)
NEXT_PUBLIC_API_URL=http://localhost:3000
```

---

## 📚 DOCUMENTAÇÃO ADICIONAL

### Arquivos de Referência do painel-completo

1. **Cliente API:**
   - `painel-completo/src/lib/bravo-erp/bravo-erp-client-v2.ts`
   - `painel-completo/src/lib/bravo-erp/bravo-erp-client.ts`

2. **Mapeamento:**
   - `painel-completo/src/lib/bravo-erp/bravo-erp-mapping.ts`
   - `painel-completo/src/schemas/bravo-erp-schema.ts`

3. **Sincronização:**
   - `painel-completo/src/app/api/bravo-erp/sincronizar/route.ts`
   - `painel-completo/src/lib/core/sync-lock.ts`

4. **Frontend:**
   - `painel-completo/src/app/admin/bravo-erp/page.tsx` → Adaptar para `/admin/importações/bravo-erp/produtos/page.tsx`
   - `painel-completo/src/app/admin/bravo-erp/mapeamento/page.tsx` → Adaptar para `/admin/importações/bravo-erp/produtos/mapeamento/page.tsx`

5. **Documentação:**
   - `painel-completo/src/app/admin/bravo-erp/GUIA_SINCRONIZACAO_BRAVO_ERP.md`

---

## ⚠️ CONSIDERAÇÕES IMPORTANTES

### 1. Performance
- Sincronização completa pode levar 1-2 horas para 30.000 produtos
- Implementar rate limiting (10 segundos entre páginas)
- Processar produtos em lotes
- Usar UPSERT para evitar erros de duplicação

### 2. Rate Limiting
- API do Bravo ERP tem limite de requisições
- Implementar delay entre páginas (10 segundos)
- Respeitar limites da API

### 3. Duplicatas
- API do Bravo pode retornar produtos duplicados
- Usar UPSERT baseado em `referencia`
- Verificar `_data_ult_modif` para otimização

### 4. Retomada de Sincronização
- Implementar sistema de logs detalhados
- Permitir retomada de sincronização interrompida
- Salvar progresso página por página

### 5. Lock Manager
- Usar Redis para lock de sincronização
- Impedir múltiplas sincronizações simultâneas
- Permitir cancelamento

---

## 🎯 PRÓXIMOS PASSOS

1. ✅ **Revisar este plano** com o time
2. ✅ **Aprovar estrutura** de banco de dados
3. ✅ **Iniciar FASE 1** - Estrutura Base do Banco
4. ✅ **Seguir fases** sequencialmente
5. ✅ **Testar cada fase** antes de avançar

---

## 📞 SUPORTE

Para dúvidas durante a implementação:
- Consultar código fonte do `painel-completo`
- Consultar `GUIA_SINCRONIZACAO_BRAVO_ERP.md`
- Revisar este documento

---

**Última Atualização:** 2025-01-XX  
**Versão do Plano:** 1.0.0  
**Status:** 📋 Pronto para Implementação