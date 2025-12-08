# Plano Detalhado: Renomear "NOME FANTASIA" para "FILIAL"

## 📋 Objetivo
Renomear o campo `nomeFantasia` para `filial` em todo o sistema, incluindo banco de dados, backend, frontend e todas as referências.

## 🔍 Análise das Referências

### ⚠️ **IMPORTANTE: Diferença entre Campos**

**NÃO CONFUNDIR:**

1. **`Venda.nomeFantasia`** (linha 1098 do schema)
   - ✅ **NÃO MEXER** - É o nome fantasia do **CLIENTE** da venda
   - Este campo não tem relação com `Empresa.nomeFantasia`

2. **`VendaAnalytics.nomeFantasia`** (linha 1173 do schema)
   - ✅ **NÃO MEXER** - É o nome fantasia do **CLIENTE** (agregado de `Venda.nomeFantasia`)
   - Populado a partir de `Venda.nomeFantasia` (ver `vendas-analytics.service.ts` linha 53)
   - Este campo não tem relação com `Empresa.nomeFantasia`

3. **`Empresa.nomeFantasia`** (linha 16 do schema)
   - ✅ **RENOMEAR PARA `filial`** - É o campo da empresa (matriz/filial)
   - Relacionado via `Venda.empresaId` → `Empresa.id` → `Empresa.nomeFantasia` (que será `filial`)

### Banco de Dados
- **Schema Prisma**: 
  - Modelo `Empresa` linha 16: `nomeFantasia String?` → **RENOMEAR PARA `filial`**
  - Modelo `Venda` linha 1098: `nomeFantasia String?` → **NÃO MEXER** (é do cliente)
  - Modelo `VendaAnalytics` linha 1173: `nomeFantasia String` → **NÃO MEXER** (é do cliente)
- **Migrations**: Possíveis migrations antigas que referenciam `nomeFantasia`
- **Índices e Constraints**:
  - `VendaAnalytics`: Constraint único `@@unique([ano, mes, nomeFantasia, marca, uf])` → **NÃO MEXER** (nomeFantasia é do cliente)
  - `VendaAnalytics`: Índice `@@index([nomeFantasia])` → **NÃO MEXER** (nomeFantasia é do cliente)

### Backend
1. **DTOs**:
   - `backend/src/empresas/dto/create-empresa.dto.ts` - linha 28
   - `backend/src/empresas/dto/update-empresa.dto.ts` - linha 23

2. **Services**:
   - `backend/src/empresas/empresas.service.ts` - linhas 54, 90-91
   - `backend/src/vendas/vendas.service.ts` - linhas 94, 128
   - `backend/src/vendas/analytics/vendas-analytics.service.ts` - múltiplas referências
   - `backend/src/vendas/import/vendas-import.service.ts` - múltiplas referências
   - `backend/src/vendas/import/vendas-validator.service.ts` - linhas 15, 146-147
   - `backend/src/vendas/import/column-mapper.service.ts` - linhas 15, 146-152
   - `backend/src/vendas/dto/create-venda.dto.ts` - linha 26
   - `backend/src/atas/atas.service.ts` - múltiplas referências
   - `backend/src/atas/modelo-ata.service.ts` - múltiplas referências
   - `backend/src/resumos/resumos.service.ts` - múltiplas referências
   - `backend/src/processos/processos.service.ts` - múltiplas referências
   - `backend/src/ai/ai.service.ts` - múltiplas referências

3. **Controllers**:
   - `backend/src/vendas/analytics/vendas-analytics.controller.ts` - linha 22

### Frontend
1. **Types**:
   - `frontend/src/types/api.ts` - linha 42, 490

2. **Services**:
   - `frontend/src/services/empresas.service.ts` - linhas 7, 25
   - `frontend/src/services/vendas.service.ts` - múltiplas referências

3. **Hooks**:
   - `frontend/src/hooks/use-vendas.ts` - linha 98

4. **Páginas/Componentes**:
   - `frontend/src/app/(app)/admin/resultado-economico/empresas/page.tsx` - **PRINCIPAL** (linhas 46, 105, 137, 180, 199, 295, 318, 416-427)
   - `frontend/src/app/(app)/admin/importacoes/vendas/importar/page.tsx` - linha 234
   - `frontend/src/app/(app)/admin/importacoes/vendas/gerenciar/page.tsx` - linhas 208, 359-360
   - `frontend/src/app/(app)/admin/resultado-economico/resumos/[id]/page.tsx` - linha 133
   - `frontend/src/app/(app)/admin/resultado-economico/uploads/page.tsx` - linhas 107, 217-219
   - `frontend/src/app/(app)/admin/resultado-economico/uploads/novo/page.tsx` - linha 508
   - `frontend/src/app/(app)/admin/resultado-economico/templates/page.tsx` - linhas 217, 293
   - `frontend/src/app/(app)/admin/resultado-economico/resumos/page.tsx` - linha 238
   - `frontend/src/app/(app)/admin/resultado-economico/analises/page.tsx` - linha 116
   - `frontend/src/app/(app)/admin/resultado-economico/alertas/page.tsx` - linhas 234, 348
   - `frontend/src/app/(app)/admin/processos/page.tsx` - linha 47

### Documentação
- Vários arquivos de documentação que mencionam `nomeFantasia`

---

## 📝 Plano de Implementação

### FASE 1: Preparação e Backup ⚠️

1. **Backup do Banco de Dados**
   ```bash
   # Criar backup antes de qualquer alteração
   pg_dump -h localhost -U usuario -d database > backup_pre_renomeacao_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Verificar Dependências**
   - Verificar se há scripts ou processos externos que usam `nomeFantasia`
   - Verificar integrações com sistemas externos

3. **Criar Branch de Trabalho**
   ```bash
   git checkout -b refactor/renomear-nome-fantasia-para-filial
   ```

---

### FASE 2: Banco de Dados 🗄️

#### 2.1. Atualizar Schema Prisma
**Arquivo**: `backend/prisma/schema.prisma`

**Modelo `Empresa`** (linha ~16):
```prisma
model Empresa {
  // ... outros campos ...
  filial          String?  // Renomeado de nomeFantasia
  // ... outros campos ...
}
```

**⚠️ ATENÇÃO**: O modelo `VendaAnalytics` **NÃO** deve ser alterado!
- `VendaAnalytics.nomeFantasia` é o nome fantasia do **CLIENTE**, não da empresa
- Este campo vem de `Venda.nomeFantasia` (cliente)
- **NÃO tem relação com `Empresa.nomeFantasia`**

#### 2.2. Criar Migration
```bash
cd backend
npx prisma migrate dev --name rename_nome_fantasia_to_filial --create-only
```

**Arquivo de Migration**: `backend/prisma/migrations/YYYYMMDDHHMMSS_rename_nome_fantasia_to_filial/migration.sql`

```sql
-- Renomear coluna APENAS na tabela Empresa
-- ⚠️ NÃO renomear Venda.nomeFantasia (é do cliente)
-- ⚠️ NÃO renomear VendaAnalytics.nomeFantasia (é do cliente)
ALTER TABLE "Empresa" RENAME COLUMN "nomeFantasia" TO "filial";
```

**⚠️ NÃO execute**:
- ❌ `ALTER TABLE "VendaAnalytics" RENAME COLUMN "nomeFantasia" TO "filial";` (NÃO FAZER! É do cliente)
- ❌ `ALTER TABLE "Venda" RENAME COLUMN "nomeFantasia" TO "filial";` (NÃO FAZER! É do cliente)

#### 2.3. Executar Migration
```bash
npx prisma migrate dev
```

#### 2.4. Regenerar Prisma Client
```bash
npx prisma generate
```

---

### FASE 3: Backend 🔧

#### 3.1. Atualizar DTOs

**Arquivo**: `backend/src/empresas/dto/create-empresa.dto.ts`
- Renomear `nomeFantasia` para `filial`
- Atualizar validações e mensagens

**Arquivo**: `backend/src/empresas/dto/update-empresa.dto.ts`
- Renomear `nomeFantasia` para `filial`
- Atualizar validações e mensagens

#### 3.2. Atualizar Services

**Arquivo**: `backend/src/empresas/empresas.service.ts`
- Linha 54: `nomeFantasia: dto.nomeFantasia || null` → `filial: dto.filial || null`
- Linhas 90-91: Atualizar referências

**Arquivo**: `backend/src/vendas/vendas.service.ts`
- Atualizar todas as referências em `select` e `where`

**Arquivo**: `backend/src/vendas/analytics/vendas-analytics.service.ts` ⚠️ **ATENÇÃO**
- **NÃO ALTERAR** as referências a `nomeFantasia` neste arquivo
- Este `nomeFantasia` é do **CLIENTE** (vem de `Venda.nomeFantasia`), não da empresa
- As referências em linhas 7, 39, 53, 60, 66, 99, 113, 146, 174, 200-202, 250 são do **CLIENTE**
- **AÇÃO**: Apenas verificar se há alguma referência a `Empresa.nomeFantasia` (não deve haver)

**Arquivo**: `backend/src/vendas/import/vendas-import.service.ts`
- Atualizar interfaces e mapeamentos

**Arquivo**: `backend/src/vendas/import/vendas-validator.service.ts`
- Atualizar validações

**Arquivo**: `backend/src/vendas/import/column-mapper.service.ts`
- Atualizar mapeamento de colunas (buscar por "NOME FANTASIA", "NOME_FANTASIA", etc.)

**Arquivo**: `backend/src/vendas/dto/create-venda.dto.ts`
- Renomear propriedade

**Arquivo**: `backend/src/atas/atas.service.ts`
- Atualizar todas as referências em `select`

**Arquivo**: `backend/src/atas/modelo-ata.service.ts`
- Atualizar todas as referências em `select`

**Arquivo**: `backend/src/resumos/resumos.service.ts`
- Atualizar todas as referências em `select`

**Arquivo**: `backend/src/processos/processos.service.ts`
- Atualizar todas as referências em `select`

**Arquivo**: `backend/src/ai/ai.service.ts`
- Atualizar contexto de IA que usa `nomeFantasia`

#### 3.3. Atualizar Controllers

**Arquivo**: `backend/src/vendas/analytics/vendas-analytics.controller.ts` ⚠️ **ATENÇÃO**
- **VERIFICAR**: O parâmetro `nomeFantasia` na linha 22 é do **CLIENTE** (filtro por nome fantasia do cliente)
- **AÇÃO**: Se for filtro por cliente, **NÃO ALTERAR**
- **AÇÃO**: Se for filtro por empresa, verificar se há outro parâmetro ou se precisa adicionar `empresaId`

---

### FASE 4: Frontend 🎨

#### 4.1. Atualizar Types

**Arquivo**: `frontend/src/types/api.ts`
- Interface `Empresa`: `nomeFantasia: string | null` → `filial: string | null`
- Outras interfaces que referenciam `nomeFantasia`

#### 4.2. Atualizar Services

**Arquivo**: `frontend/src/services/empresas.service.ts`
- Interfaces `CreateEmpresaDto` e `UpdateEmpresaDto`
- Renomear propriedades

**Arquivo**: `frontend/src/services/vendas.service.ts`
- Atualizar todas as interfaces e referências

#### 4.3. Atualizar Hooks

**Arquivo**: `frontend/src/hooks/use-vendas.ts`
- Atualizar interface de filtros

#### 4.4. Atualizar Páginas e Componentes

**Arquivo**: `frontend/src/app/(app)/admin/resultado-economico/empresas/page.tsx` ⭐ **PRIORITÁRIO**
- Linha 46: Schema Zod `nomeFantasia` → `filial`
- Linha 105: Default value
- Linha 137: Reset form
- Linha 180: Update mutation
- Linha 199: Create mutation
- Linha 295: Header da tabela "Nome Fantasia" → "Filial"
- Linha 318: Exibição `empresa.nomeFantasia` → `empresa.filial`
- Linhas 416-427: Label e input do formulário

**Arquivo**: `frontend/src/app/(app)/admin/importacoes/vendas/importar/page.tsx`
- Atualizar exibição de empresa

**Arquivo**: `frontend/src/app/(app)/admin/importacoes/vendas/gerenciar/page.tsx`
- Atualizar exibição de empresa e vendas

**Arquivo**: `frontend/src/app/(app)/admin/resultado-economico/resumos/[id]/page.tsx`
- Atualizar exibição

**Arquivo**: `frontend/src/app/(app)/admin/resultado-economico/uploads/page.tsx`
- Atualizar exibição

**Arquivo**: `frontend/src/app/(app)/admin/resultado-economico/uploads/novo/page.tsx`
- Atualizar exibição

**Arquivo**: `frontend/src/app/(app)/admin/resultado-economico/templates/page.tsx`
- Atualizar exibição

**Arquivo**: `frontend/src/app/(app)/admin/resultado-economico/resumos/page.tsx`
- Atualizar exibição

**Arquivo**: `frontend/src/app/(app)/admin/resultado-economico/analises/page.tsx`
- Atualizar exibição

**Arquivo**: `frontend/src/app/(app)/admin/resultado-economico/alertas/page.tsx`
- Atualizar exibição

**Arquivo**: `frontend/src/app/(app)/admin/processos/page.tsx`
- Atualizar interface

---

### FASE 5: Verificação e Testes ✅

#### 5.1. Verificação de Referências
```bash
# Buscar todas as referências restantes
grep -r "nomeFantasia" --include="*.ts" --include="*.tsx" --include="*.prisma" .
grep -r "nome_fantasia" --include="*.ts" --include="*.tsx" --include="*.prisma" .
grep -r "NOME FANTASIA" --include="*.ts" --include="*.tsx" --include="*.prisma" .
grep -r "NOME_FANTASIA" --include="*.ts" --include="*.tsx" --include="*.prisma" .
```

#### 5.2. Testes Funcionais

1. **Teste de CRUD de Empresas**
   - Criar empresa com `filial`
   - Editar empresa alterando `filial`
   - Listar empresas e verificar coluna "Filial"
   - Verificar que dados antigos ainda aparecem corretamente

2. **Teste de Importação de Vendas**
   - Verificar mapeamento de colunas
   - Verificar que vendas são importadas corretamente

3. **Teste de Analytics de Vendas**
   - Verificar filtros por `filial`
   - Verificar agrupamentos

4. **Teste de Outros Módulos**
   - Atas de Reunião
   - Resumos Econômicos
   - Processos
   - Uploads
   - Templates

#### 5.3. Testes de Build
```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

---

### FASE 6: Documentação 📚

#### 6.1. Atualizar Documentação
- Atualizar referências em arquivos `.md`
- Atualizar diagramas se houver
- Atualizar comentários no código

#### 6.2. Changelog
- Documentar a mudança no CHANGELOG.md (se existir)

---

### FASE 7: Deploy 🚀

#### 7.1. Commit e Push
```bash
git add .
git commit -m "refactor: renomear nomeFantasia para filial em todo o sistema"
git push origin refactor/renomear-nome-fantasia-para-filial
```

#### 7.2. Revisão
- Criar Pull Request
- Revisar alterações
- Testar em ambiente de staging

#### 7.3. Deploy em Produção
- Executar migration em produção
- Verificar se não há erros
- Monitorar logs

---

## ⚠️ Pontos de Atenção

### 1. Campos com Nome Similar ⚠️ **CRÍTICO - NÃO CONFUNDIR**

**Tabela `Empresa`**:
- `nomeFantasia String?` → **RENOMEAR PARA `filial`**
- Este é o campo que queremos alterar

**Tabela `Venda`**:
- `nomeFantasia String?` → **NÃO MEXER** (é nome fantasia do CLIENTE)
- Relaciona com `Empresa` via `empresaId`, mas o campo `nomeFantasia` é do cliente

**Tabela `VendaAnalytics`**:
- `nomeFantasia String` → **NÃO MEXER** (é nome fantasia do CLIENTE)
- Constraint único: `@@unique([ano, mes, nomeFantasia, marca, uf])` → **NÃO MEXER**
- Índice: `@@index([nomeFantasia])` → **NÃO MEXER**
- Este campo vem de `Venda.nomeFantasia` (cliente), não de `Empresa.nomeFantasia`

**AÇÃO**: Migration deve renomear APENAS `Empresa.nomeFantasia` → `Empresa.filial`

### 2. Dados Existentes
- Os dados existentes serão preservados (apenas renomeação de coluna)
- Não é necessário migração de dados

### 3. Compatibilidade com APIs Externas
- Se houver integrações que esperam `nomeFantasia`, considerar manter compatibilidade temporária
- Ou documentar breaking change

### 4. Mapeamento de Colunas em Importações
- O `column-mapper.service.ts` busca por "NOME FANTASIA", "NOME_FANTASIA", etc.
- **AÇÃO**: Manter busca por esses termos para compatibilidade, mas mapear para `filial`

---

## 📊 Checklist de Implementação

### Banco de Dados
- [ ] Backup criado
- [ ] Schema Prisma atualizado (APENAS Empresa, NÃO VendaAnalytics)
- [ ] Migration criada (APENAS renomear `Empresa.nomeFantasia` → `Empresa.filial`)
- [ ] Verificado que `Venda.nomeFantasia` NÃO será alterado (é do cliente)
- [ ] Verificado que `VendaAnalytics.nomeFantasia` NÃO será alterado (é do cliente)
- [ ] Migration executada em desenvolvimento
- [ ] Prisma Client regenerado

### Backend
- [ ] DTOs atualizados
- [ ] Services atualizados
- [ ] Controllers atualizados
- [ ] Testes unitários atualizados (se houver)
- [ ] Build do backend sem erros

### Frontend
- [ ] Types atualizados
- [ ] Services atualizados
- [ ] Hooks atualizados
- [ ] Página de empresas atualizada
- [ ] Todas as outras páginas atualizadas
- [ ] Build do frontend sem erros

### Verificação
- [ ] Nenhuma referência a `nomeFantasia` restante
- [ ] Testes funcionais passando
- [ ] Dados antigos sendo exibidos corretamente
- [ ] Novos dados sendo salvos corretamente

### Documentação
- [ ] Documentação atualizada
- [ ] Changelog atualizado

### Deploy
- [ ] PR criado e revisado
- [ ] Testes em staging
- [ ] Deploy em produção
- [ ] Verificação pós-deploy

---

## 🔄 Ordem de Execução Recomendada

1. **FASE 1**: Preparação (Backup, Branch)
2. **FASE 2**: Banco de Dados (Schema + Migration)
3. **FASE 3**: Backend (DTOs → Services → Controllers)
4. **FASE 4**: Frontend (Types → Services → Hooks → Páginas)
5. **FASE 5**: Verificação e Testes
6. **FASE 6**: Documentação
7. **FASE 7**: Deploy

---

## 📝 Notas Adicionais

- Esta é uma mudança **breaking change** que afeta toda a aplicação
- Recomenda-se fazer em horário de baixo uso ou com janela de manutenção
- Considerar comunicar a mudança aos usuários se necessário
- Manter backup por pelo menos 30 dias após o deploy

---

## 🆘 Rollback

Em caso de problemas, o rollback pode ser feito:

1. Reverter código (git revert)
2. Executar migration reversa:
   ```sql
   ALTER TABLE "Empresa" RENAME COLUMN "filial" TO "nomeFantasia";
   ```
3. Restaurar backup do banco se necessário

---

**Data de Criação**: 2025-01-XX
**Última Atualização**: 2025-01-XX
**Status**: 📋 Planejado

