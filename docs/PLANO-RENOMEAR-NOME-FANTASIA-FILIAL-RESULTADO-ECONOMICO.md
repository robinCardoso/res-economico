# Plano: Renomear "NOME FANTASIA" para "FILIAL" - Módulo Resultado Econômico

## 📋 Objetivo
Renomear o campo `nomeFantasia` para `filial` **apenas no módulo de Resultado Econômico** (`/admin/resultado-economico`).

## ⚠️ Escopo Limitado
Este plano foca **EXCLUSIVAMENTE** no módulo de resultado econômico:
- ✅ Frontend: `frontend/src/app/(app)/admin/resultado-economico/**`
- ✅ Backend: Apenas serviços que alimentam essas páginas
- ❌ **NÃO inclui**: Módulo de vendas, módulo de atas, etc.

## 🔍 Arquivos a Alterar no Frontend

### 1. **`empresas/page.tsx`** ⭐ **PRINCIPAL**
**Localização**: `frontend/src/app/(app)/admin/resultado-economico/empresas/page.tsx`

**Alterações necessárias**:
- Linha 46: Schema Zod `nomeFantasia` → `filial`
- Linha 105: Default value no `reset()`
- Linha 137: Valor no `reset()` ao editar
- Linha 180: Update mutation
- Linha 199: Create mutation
- Linha 295: Header da tabela "Nome Fantasia" → "Filial"
- Linha 318: Exibição `empresa.nomeFantasia` → `empresa.filial`
- Linhas 416-427: Label e input do formulário

**Total**: ~9 alterações

### 2. **`resumos/[id]/page.tsx`**
**Localização**: `frontend/src/app/(app)/admin/resultado-economico/resumos/[id]/page.tsx`

**Alterações necessárias**:
- Linha 133: `resumo.empresa.nomeFantasia` → `resumo.empresa.filial`

**Total**: 1 alteração

### 3. **`resumos/page.tsx`**
**Localização**: `frontend/src/app/(app)/admin/resultado-economico/resumos/page.tsx`

**Alterações necessárias**:
- Linha 238: `resumo.empresa?.nomeFantasia` → `resumo.empresa?.filial`

**Total**: 1 alteração

### 4. **`uploads/page.tsx`**
**Localização**: `frontend/src/app/(app)/admin/resultado-economico/uploads/page.tsx`

**Alterações necessárias**:
- Linha 107: `empresa.nomeFantasia` → `empresa.filial`
- Linhas 217-219: `upload.empresa?.nomeFantasia` → `upload.empresa?.filial`

**Total**: 2 alterações

### 5. **`uploads/novo/page.tsx`**
**Localização**: `frontend/src/app/(app)/admin/resultado-economico/uploads/novo/page.tsx`

**Alterações necessárias**:
- Linha 508: `empresa.nomeFantasia` → `empresa.filial`

**Total**: 1 alteração

### 6. **`templates/page.tsx`**
**Localização**: `frontend/src/app/(app)/admin/resultado-economico/templates/page.tsx`

**Alterações necessárias**:
- Linha 217: `template.empresa.nomeFantasia` → `template.empresa.filial`
- Linha 293: `empresa.nomeFantasia` → `empresa.filial`

**Total**: 2 alterações

### 7. **`analises/page.tsx`**
**Localização**: `frontend/src/app/(app)/admin/resultado-economico/analises/page.tsx`

**Alterações necessárias**:
- Linha 116: `empresa.nomeFantasia` → `empresa.filial`

**Total**: 1 alteração

### 8. **`alertas/page.tsx`**
**Localização**: `frontend/src/app/(app)/admin/resultado-economico/alertas/page.tsx`

**Alterações necessárias**:
- Linha 234: `empresa.nomeFantasia` → `empresa.filial`
- Linha 348: `alerta.upload.empresa.nomeFantasia` → `alerta.upload.empresa.filial`

**Total**: 2 alterações

---

## 🔧 Backend - Alterações Necessárias

### 1. Banco de Dados (Prisma)

**Arquivo**: `backend/prisma/schema.prisma`
- Linha 16: `nomeFantasia String?` → `filial String?`

**Migration**:
```bash
cd backend
npx prisma migrate dev --name rename_nome_fantasia_to_filial_empresa
```

**SQL da Migration**:
```sql
ALTER TABLE "Empresa" RENAME COLUMN "nomeFantasia" TO "filial";
```

**Regenerar Prisma Client**:
```bash
npx prisma generate
```

### 2. DTOs

**Arquivo**: `backend/src/empresas/dto/create-empresa.dto.ts`
- Linha 28: `nomeFantasia?: string;` → `filial?: string;`
- Atualizar validação e mensagem

**Arquivo**: `backend/src/empresas/dto/update-empresa.dto.ts`
- Linha 23: `nomeFantasia?: string;` → `filial?: string;`
- Atualizar validação e mensagem

### 3. Services

**Arquivo**: `backend/src/empresas/empresas.service.ts`
- Linha 54: `nomeFantasia: dto.nomeFantasia || null` → `filial: dto.filial || null`
- Linhas 90-91: Atualizar referências

**Arquivo**: `backend/src/resumos/resumos.service.ts`
- Linha 71: `nomeFantasia: true` → `filial: true`
- Linha 139: `nomeFantasia: true` → `filial: true`
- Linha 177: `nomeFantasia: true` → `filial: true`
- Linha 229: `nomeFantasia: true` → `filial: true`
- Linha 545: `nomeFantasia: resumo.empresa.nomeFantasia` → `filial: resumo.empresa.filial`

**Arquivo**: `backend/src/uploads/uploads.service.ts`
- Linha 617: `nomeFantasia: true` → `filial: true`
- Linha 686: `upload.empresa.nomeFantasia` → `upload.empresa.filial`

---

## 📝 Plano de Implementação

### FASE 1: Preparação

1. **Criar Branch**
   ```bash
   git checkout -b refactor/renomear-nome-fantasia-filial-resultado-economico
   ```

2. **Verificar Banco de Dados**
   - Confirmar que a coluna `Empresa.nomeFantasia` já foi renomeada para `Empresa.filial` no banco
   - Se não, executar migration primeiro

### FASE 2: Banco de Dados

1. **Atualizar Schema Prisma**
   - `backend/prisma/schema.prisma` - Modelo `Empresa`
   - `nomeFantasia String?` → `filial String?`

2. **Criar e Executar Migration**
   ```bash
   cd backend
   npx prisma migrate dev --name rename_nome_fantasia_to_filial_empresa
   ```

3. **Regenerar Prisma Client**
   ```bash
   npx prisma generate
   ```

### FASE 3: Backend - DTOs e Services

1. **Atualizar DTOs**
   - `create-empresa.dto.ts`
   - `update-empresa.dto.ts`

2. **Atualizar Services**
   - `empresas.service.ts`
   - `resumos.service.ts`
   - `uploads.service.ts`

3. **Testar Endpoints**
   - Verificar se os endpoints retornam `filial` ao invés de `nomeFantasia`
   - Testar criação/edição de empresa

### FASE 4: Frontend - Types

1. **Atualizar Types**
   - `frontend/src/types/api.ts`
   - Interface `Empresa`: `nomeFantasia: string | null` → `filial: string | null`

### FASE 5: Frontend - Páginas

**Ordem de implementação recomendada**:

1. **`empresas/page.tsx`** (mais complexo)
   - Atualizar schema Zod
   - Atualizar formulário
   - Atualizar tabela
   - Atualizar mutations

2. **Páginas de visualização** (mais simples)
   - `resumos/[id]/page.tsx`
   - `resumos/page.tsx`
   - `uploads/page.tsx`
   - `uploads/novo/page.tsx`
   - `templates/page.tsx`
   - `analises/page.tsx`
   - `alertas/page.tsx`

### FASE 6: Verificação

1. **Build do Frontend**
   ```bash
   cd frontend
   npm run build
   ```

2. **Verificar Referências Restantes**
   ```bash
   grep -r "nomeFantasia" frontend/src/app/(app)/admin/resultado-economico/
   ```

3. **Testes Funcionais**
   - Criar/editar empresa e verificar campo "Filial"
   - Verificar exibição em todas as páginas
   - Verificar que dados antigos ainda aparecem corretamente

---

## ✅ Checklist

### Backend - Banco de Dados
- [ ] Atualizar `schema.prisma` - Modelo `Empresa`
- [ ] Criar migration
- [ ] Executar migration
- [ ] Regenerar Prisma Client

### Backend - DTOs e Services
- [ ] Atualizar `create-empresa.dto.ts`
- [ ] Atualizar `update-empresa.dto.ts`
- [ ] Atualizar `empresas.service.ts`
- [ ] Atualizar `resumos.service.ts`
- [ ] Atualizar `uploads.service.ts`
- [ ] Testar endpoints

### Frontend - Types
- [ ] Atualizar `types/api.ts` - Interface `Empresa`

### Frontend - Páginas
- [ ] `empresas/page.tsx` - Schema Zod
- [ ] `empresas/page.tsx` - Formulário
- [ ] `empresas/page.tsx` - Tabela
- [ ] `resumos/[id]/page.tsx`
- [ ] `resumos/page.tsx`
- [ ] `uploads/page.tsx`
- [ ] `uploads/novo/page.tsx`
- [ ] `templates/page.tsx`
- [ ] `analises/page.tsx`
- [ ] `alertas/page.tsx`

### Verificação
- [ ] Build do frontend sem erros
- [ ] Nenhuma referência a `nomeFantasia` restante no módulo
- [ ] Testes funcionais passando
- [ ] Dados antigos sendo exibidos corretamente

---

## 🚀 Ordem de Execução

1. **Banco de Dados** (Schema + Migration)
2. **Backend DTOs** (create/update empresa)
3. **Backend Services** (empresas, resumos, uploads)
4. **Frontend Types** (interface Empresa)
5. **Frontend - Página Empresas** (mais complexa)
6. **Frontend - Outras Páginas** (visualização)
7. **Verificação e Testes**

---

**Data de Criação**: 2025-01-XX
**Status**: 📋 Planejado
**Escopo**: Apenas módulo Resultado Econômico

