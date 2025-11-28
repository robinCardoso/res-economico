# Plano de Estruturação - Usuários e Menus Hierárquicos

## 📋 Objetivo

Estruturar o projeto `painel-rede-uniao` para trabalhar com múltiplos tipos de usuários (admin, associado, fornecedor) e implementar um sistema de menus hierárquicos, começando pelo acesso admin.

## 🔍 Análise do Painel-Completo

### Estrutura de Usuários

O `painel-completo` utiliza (como REFERÊNCIA):
- **Roles definidos**: `admin`, `associado`, `fornecedor`, `supervisor`
- **Rotas por role**: `/admin/*`, `/associado/*`, `/fornecedor/*`
- **Layouts separados**: Cada role tem seu próprio `layout.tsx`
- **Sidebar com menus colapsáveis**: Usando componentes do shadcn/ui

**IMPORTANTE**: Usaremos o painel-completo apenas como REFERÊNCIA visual e funcional. A implementação será feita usando:
- **Backend atual**: NestJS + Prisma + PostgreSQL (sem Supabase)
- **Autenticação atual**: JWT com roles no campo `Usuario.roles` (array de strings)
- **Estrutura atual**: Manter a arquitetura existente do painel-rede-uniao

### Estrutura de Menus no Admin

```
Dashboard (página inicial)
├── Campanhas (colapsável)
│   ├── Criar / Gerenciar
│   ├── Análise de Desempenho
│   └── Sorteios
├── Importações (colapsável)
│   ├── Produtos
│   ├── Vendas
│   ├── Pedidos
│   └── Histórico
├── Gestão de Entidades
├── Fornecedores (colapsável)
│   └── Logos dos Fornecedores
├── Processos (colapsável) ⭐
│   ├── Gestão de Processos
│   ├── Relatórios SLA
│   └── Notificações
├── Atas e Reuniões ⭐
├── Configurações (colapsável) ⭐
│   ├── Montadoras
│   ├── Cargos
│   ├── Protocolos
│   └── Bravo ERP
├── Auditoria (colapsável)
│   └── Histórico de Logins
└── Funções Admin (colapsável)
    ├── Status do Sistema Analytics
    └── Monitoramento
```

## 🎯 Estrutura Proposta para Painel-Rede-Uniao

### Fase 1: Estruturação Base

#### 1.1 Sistema de Roles e Autenticação

**Estrutura atual do backend:**
- ✅ Já existe: `Usuario.roles` (array de strings) no Prisma
- ✅ Já existe: Autenticação JWT com roles no payload
- ✅ Já existe: `AuthService` e `JwtStrategy` no backend

**Arquivos a criar no frontend:**
- `frontend/src/lib/core/roles.ts` - Definição de roles (constantes)
- `frontend/src/lib/core/auth.ts` - Utilitários de autenticação (usar API atual)
- `frontend/src/types/user.ts` - Tipos de usuário

**Estrutura de roles (compatível com backend atual):**
```typescript
export const USER_ROLES = {
  ADMIN: 'admin',
  ASSOCIADO: 'associado',
  FORNECEDOR: 'fornecedor',
  USER: 'user', // Role padrão já existente
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// Helper para verificar roles
export const hasRole = (userRoles: string[], requiredRole: UserRole): boolean => {
  return userRoles.includes(requiredRole);
};
```

**Backend - Verificação de role:**
- Usar `@Roles()` decorator do NestJS (criar se não existir)
- Ou verificar manualmente no controller usando `req.user.roles`

#### 1.2 Estrutura de Rotas

**Reorganização proposta:**
```
frontend/src/app/
├── (auth)/              # Rotas públicas
│   ├── login/
│   └── register/
├── (app)/               # Rotas protegidas (atual)
│   ├── admin/           # NOVO: Área admin
│   │   ├── layout.tsx   # Layout específico do admin
│   │   ├── page.tsx     # Dashboard admin
│   │   ├── resultado-economico/  # Menu principal
│   │   │   ├── dashboard/
│   │   │   ├── uploads/
│   │   │   ├── alertas/
│   │   │   ├── templates/
│   │   │   ├── contas/
│   │   │   ├── empresas/
│   │   │   ├── auditoria/
│   │   │   ├── relatorios/
│   │   │   └── configuracoes/
│   │   ├── processos/   # Clonado do painel-completo
│   │   ├── atas/        # Clonado do painel-completo
│   │   └── configuracoes/  # Clonado do painel-completo
│   ├── associado/       # FUTURO: Área associado
│   └── fornecedor/      # FUTURO: Área fornecedor
└── page.tsx             # Landing page (pública)
```

#### 1.3 Migração das Páginas Atuais

**Páginas a mover:**
- `/dashboard` → `/admin/resultado-economico/dashboard`
- `/uploads` → `/admin/resultado-economico/uploads`
- `/alertas` → `/admin/resultado-economico/alertas`
- `/templates` → `/admin/resultado-economico/templates`
- `/contas` → `/admin/resultado-economico/contas`
- `/empresas` → `/admin/resultado-economico/empresas`
- `/auditoria` → `/admin/resultado-economico/auditoria`
- `/relatorios` → `/admin/resultado-economico/relatorios`
- `/configuracoes` → `/admin/resultado-economico/configuracoes`

### Fase 2: Sidebar Hierárquico

#### 2.1 Componentes Necessários

**Arquivos a criar/adaptar:**
- `frontend/src/components/ui/sidebar.tsx` - Componentes do shadcn (se não existir)
- `frontend/src/components/layout/admin-sidebar.tsx` - Sidebar específica do admin
- `frontend/src/components/layout/admin-layout.tsx` - Layout wrapper do admin

#### 2.2 Estrutura de Menu Proposta

```typescript
const adminMenuItems = [
  {
    type: 'link',
    label: 'Dashboard',
    href: '/admin',
    icon: Home,
  },
  {
    type: 'collapsible',
    label: 'Resultado Econômico',
    icon: BarChart3,
    items: [
      { label: 'Dashboard', href: '/admin/resultado-economico/dashboard', icon: LayoutDashboard },
      { label: 'Uploads', href: '/admin/resultado-economico/uploads', icon: Upload },
      { label: 'Alertas', href: '/admin/resultado-economico/alertas', icon: Bell },
      { label: 'Templates', href: '/admin/resultado-economico/templates', icon: FileText },
      { label: 'Contas', href: '/admin/resultado-economico/contas', icon: Layers },
      { label: 'Empresas', href: '/admin/resultado-economico/empresas', icon: Building2 },
      { label: 'Auditoria', href: '/admin/resultado-economico/auditoria', icon: Shield },
      { label: 'Relatórios', href: '/admin/resultado-economico/relatorios', icon: FileBarChart },
      { label: 'Configurações', href: '/admin/resultado-economico/configuracoes', icon: Settings },
    ],
  },
  {
    type: 'collapsible',
    label: 'Processos',
    icon: ShieldCheck,
    items: [
      { label: 'Gestão de Processos', href: '/admin/processos', icon: ShieldCheck },
      { label: 'Relatórios SLA', href: '/admin/processos/relatorios-sla', icon: BarChart3 },
      { label: 'Notificações', href: '/admin/processos/notificacoes', icon: Bell },
    ],
  },
  {
    type: 'link',
    label: 'Atas e Reuniões',
    href: '/admin/atas',
    icon: ClipboardList,
  },
  {
    type: 'collapsible',
    label: 'Configurações',
    icon: Settings,
    items: [
      { label: 'Montadoras', href: '/admin/configuracoes/montadoras', icon: Car },
      { label: 'Cargos', href: '/admin/configuracoes/cargos', icon: UserCog },
      { label: 'Protocolos', href: '/admin/configuracoes', icon: FileText },
      { label: 'Bravo ERP', href: '/admin/configuracoes/bravo-erp', icon: Database },
    ],
  },
];
```

### Fase 3: Adaptação de Páginas do Painel-Completo

**IMPORTANTE**: As páginas do painel-completo serão usadas como REFERÊNCIA visual e funcional. A implementação será ADAPTADA para nossa estrutura atual.

#### 3.1 Processos

**Arquivos de referência (painel-completo):**
- `painel-completo/src/app/admin/processos/page.tsx` - UI/UX de referência
- `painel-completo/src/app/admin/processos/_components/*` - Componentes de referência
- `painel-completo/src/app/api/processos/**/*` - Lógica de negócio de referência
- `painel-completo/src/schemas/processo-schema.ts` - Estrutura de dados de referência

**Adaptação para painel-rede-uniao:**
- **Frontend**: 
  - Copiar UI/UX do `page.tsx` e componentes
  - Substituir chamadas Supabase por chamadas à API NestJS (`/api/processos`)
  - Adaptar hooks e queries para usar React Query com endpoints NestJS
- **Backend**:
  - Criar módulo `backend/src/processos/`
  - Adaptar lógica de `server/actions` para services NestJS
  - Criar DTOs baseados nos schemas Zod do painel-completo
  - Criar schema Prisma se necessário

**Destino:**
- `frontend/src/app/(app)/admin/processos/page.tsx`
- `frontend/src/app/(app)/admin/processos/_components/*`
- `backend/src/processos/**/*`

#### 3.2 Atas e Reuniões

**Arquivos de referência (painel-completo):**
- `painel-completo/src/app/admin/atas/page.tsx`
- `painel-completo/src/app/admin/atas/_components/*`
- `painel-completo/src/app/admin/atas/[id]/page.tsx`
- `painel-completo/src/app/admin/atas/nova/page.tsx`
- `painel-completo/src/app/admin/atas/importar/page.tsx`
- `painel-completo/src/server/actions/atas/**/*`

**Adaptação para painel-rede-uniao:**
- **Frontend**: 
  - Copiar UI/UX de todas as páginas
  - Substituir chamadas Supabase por chamadas à API NestJS
  - Adaptar hooks e queries
- **Backend**:
  - Criar módulo `backend/src/atas/`
  - Adaptar lógica para services NestJS
  - Criar DTOs e schema Prisma

**Destino:**
- `frontend/src/app/(app)/admin/atas/**/*`
- `backend/src/atas/**/*`

#### 3.3 Configurações

**Arquivos de referência (painel-completo):**
- `painel-completo/src/app/admin/configuracoes/page.tsx`
- `painel-completo/src/app/admin/configuracoes/montadoras/page.tsx`
- `painel-completo/src/app/admin/configuracoes/cargos/page.tsx`
- APIs relacionadas

**Adaptação para painel-rede-uniao:**
- **Frontend**: 
  - Copiar UI/UX
  - Substituir chamadas Supabase por chamadas à API NestJS
- **Backend**:
  - Expandir módulo `backend/src/configuracoes/` existente
  - Adicionar endpoints para Montadoras, Cargos, Protocolos
  - Criar schemas Prisma se necessário

**Destino:**
- `frontend/src/app/(app)/admin/configuracoes/**/*`
- `backend/src/configuracoes/**/*`

## 📝 Plano de Implementação

### Etapa 1: Preparação (1-2 dias)

1. ✅ Criar estrutura de roles no frontend (`lib/core/roles.ts`)
2. ✅ Criar tipos de usuário (`types/user.ts`)
3. ✅ Verificar/ajustar verificação de role no backend (usar estrutura atual)
4. ✅ Criar guard/decorator para verificação de role no NestJS (se necessário)
5. ✅ Atualizar store de autenticação no frontend para incluir roles

### Etapa 2: Reestruturação de Rotas (2-3 dias)

1. ✅ Criar estrutura `/admin/*`
2. ✅ Criar layout do admin
3. ✅ Mover páginas atuais para `/admin/resultado-economico/*`
4. ✅ Criar redirects temporários das rotas antigas
5. ✅ Atualizar todos os links internos

### Etapa 3: Sidebar Hierárquico (2-3 dias)

1. ✅ Instalar/verificar componentes do shadcn sidebar
2. ✅ Criar componente `AdminSidebar`
3. ✅ Implementar menus colapsáveis
4. ✅ Adicionar verificação de role
5. ✅ Integrar com layout do admin

### Etapa 4: Clonagem de Processos (3-4 dias)

1. ✅ **Copiar arquivos do painel-completo** (como referência)
2. ✅ **Adaptar para estrutura atual**:
   - Substituir chamadas Supabase por chamadas à API NestJS atual
   - Adaptar `server/actions` do painel-completo para services do NestJS
   - Adaptar schemas Zod para DTOs do NestJS
   - Manter a UI/UX igual ao painel-completo
3. ✅ **Criar módulo no backend**: `backend/src/processos/`
   - `processos.module.ts`
   - `processos.service.ts`
   - `processos.controller.ts`
   - `dto/*.ts`
4. ✅ **Criar schema no Prisma**: Tabela `Processo` (se necessário)
5. ✅ **Testar funcionalidades**

### Etapa 5: Clonagem de Atas (3-4 dias)

1. ✅ **Copiar arquivos do painel-completo** (como referência)
2. ✅ **Adaptar para estrutura atual**:
   - Substituir chamadas Supabase por chamadas à API NestJS atual
   - Adaptar `server/actions/atas` para services do NestJS
   - Adaptar schemas para DTOs do NestJS
   - Manter a UI/UX igual ao painel-completo
3. ✅ **Criar módulo no backend**: `backend/src/atas/`
   - `atas.module.ts`
   - `atas.service.ts`
   - `atas.controller.ts`
   - `dto/*.ts`
4. ✅ **Criar schema no Prisma**: Tabela `AtaReuniao` (se necessário)
5. ✅ **Testar funcionalidades**

### Etapa 6: Clonagem de Configurações (2-3 dias)

1. ✅ **Copiar arquivos do painel-completo** (como referência)
2. ✅ **Adaptar para estrutura atual**:
   - Substituir chamadas Supabase por chamadas à API NestJS atual
   - Adaptar `server/actions/configuracoes` para services do NestJS
   - Adaptar schemas para DTOs do NestJS
   - Manter a UI/UX igual ao painel-completo
3. ✅ **Criar/expandir módulo no backend**: `backend/src/configuracoes/`
   - Adicionar endpoints para Montadoras, Cargos, Protocolos
   - Usar estrutura existente se já houver
4. ✅ **Criar schemas no Prisma**: Tabelas necessárias (se não existirem)
5. ✅ **Testar funcionalidades**

### Etapa 7: Testes e Ajustes (2-3 dias)

1. ✅ Testar navegação entre menus
2. ✅ Verificar permissões por role
3. ✅ Ajustar estilos e responsividade
4. ✅ Documentar mudanças

## 🔧 Dependências Necessárias

### Frontend
- `@radix-ui/react-collapsible` - Para menus colapsáveis (instalar se não existir)
- Componentes do shadcn/ui sidebar (instalar se não existir)
- Manter dependências atuais (React Query, etc.)

### Backend
- ✅ Sistema de autenticação já existe (JWT + roles)
- Criar guards/decorators para verificação de role (se necessário)
- Manter estrutura NestJS atual

## 📌 Notas Importantes

1. **Compatibilidade**: Manter redirects das rotas antigas por um período de transição
2. **Permissões**: Implementar verificação de role em todas as rotas protegidas (usar estrutura atual)
3. **Estilos**: Manter consistência visual com o tema atual (dark mode)
4. **Performance**: Lazy loading dos componentes de menu quando possível
5. **Testes**: Testar cada etapa antes de prosseguir
6. **Adaptação**: As páginas do painel-completo serão ADAPTADAS, não copiadas diretamente:
   - Substituir Supabase por chamadas à API NestJS
   - Adaptar `server/actions` para services do NestJS
   - Manter UI/UX idêntica ao painel-completo
   - Usar estrutura de dados atual (Prisma)

## 🎨 Considerações de UI/UX

- Sidebar deve ser responsiva (colapsável em mobile)
- Indicar página ativa no menu
- Animações suaves para expansão/colapso
- Manter tema dark mode consistente
- Ícones apropriados para cada menu

## 🔄 Processo de Adaptação

### Exemplo: Adaptando uma página do painel-completo

**No painel-completo (Supabase):**
```typescript
// server/actions/processos.ts
import { getSupabaseAdmin } from '@/lib/core/supabase';

export async function buscarProcessos() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('processos')
    .select('*');
  return { data, error };
}
```

**No painel-rede-uniao (NestJS):**
```typescript
// frontend/src/services/processos.service.ts
import { api } from '@/lib/api';

export async function buscarProcessos() {
  const response = await api.get('/processos');
  return response.data;
}

// backend/src/processos/processos.service.ts
@Injectable()
export class ProcessosService {
  constructor(private prisma: PrismaService) {}
  
  async findAll() {
    return this.prisma.processo.findMany();
  }
}
```

### Padrão de Adaptação

1. **Frontend - Substituir Supabase por API NestJS:**
   - ❌ `getSupabaseAdmin().from('tabela').select()`
   - ✅ `api.get('/endpoint')` ou `api.post('/endpoint', data)`

2. **Backend - Adaptar server/actions para Services:**
   - ❌ `server/actions/` (Next.js Server Actions)
   - ✅ `backend/src/modulo/modulo.service.ts` (NestJS Service)

3. **Schemas - Adaptar Zod para DTOs:**
   - ❌ `z.object({ ... })` (Zod schema)
   - ✅ `class CreateDto { @IsString() campo: string }` (NestJS DTO com class-validator)

4. **Manter UI/UX:**
   - ✅ Copiar componentes React exatamente como estão
   - ✅ Manter estilos e estrutura visual
   - ✅ Adaptar apenas as chamadas de dados

## 📚 Referências

- Estrutura do `painel-completo/src/app/admin/layout.tsx` (referência visual)
- Componentes do shadcn/ui sidebar
- Documentação do Next.js App Router
- Estrutura atual do painel-rede-uniao (NestJS + Prisma)

