# 📋 PLANO DE MELHORIAS: Painel de Mapeamento

## 🎯 Objetivos

1. **Carregar campos da tabela `produtos` dinamicamente** (do schema Prisma)
2. **Carregar campos do Bravo ERP dinamicamente** (da API - 1º produto)
3. **Preview dos campos mapeados** - Visualizar como ficará o produto após o mapeamento

---

## 📊 Situação Atual

### ❌ Problemas Identificados

1. **Campos da Tabela `produtos`** - Atualmente **FIXO** no código (`CAMPOS_INTERNOS` array)
2. **Campos do Bravo ERP** - Atualmente **FIXO** no código (`CAMPOS_BRAVO` array)
3. **Preview de Mapeamento** - **NÃO EXISTE** - Usuário não consegue verificar se o mapeamento está correto

### ✅ Vantagens da Implementação Dinâmica

- ✅ Sempre atualizado com o schema do banco
- ✅ Campos reais retornados pela API
- ✅ Preview permite validar mapeamento antes de sincronizar
- ✅ Mais confiável e profissional

---

## 🔧 MELHORIA 1: Campos da Tabela `produtos` Dinâmicos

### Objetivo
Carregar os campos disponíveis diretamente do schema Prisma da tabela `produtos`.

### Implementação

#### Backend - Novo Endpoint
```
GET /bravo-erp/mapping/fields/internal
```

**Resposta:**
```json
{
  "success": true,
  "fields": [
    {
      "nome": "referencia",
      "tipo": "varchar",
      "obrigatorio": true,
      "descricao": "Referência única do produto"
    },
    {
      "nome": "descricao",
      "tipo": "text",
      "obrigatorio": false,
      "descricao": "Descrição do produto"
    },
    // ... todos os campos do schema
  ]
}
```

**Código:**
- Criar método no `MappingService` que lê o schema Prisma
- Retornar todos os campos da tabela `produto`
- Incluir metadados (tipo, obrigatório, descrição)

#### Frontend
- Remover array `CAMPOS_INTERNOS` fixo
- Carregar campos via API ao montar componente
- Mostrar loading enquanto carrega
- Cachear resultado (não muda frequentemente)

---

## 🌐 MELHORIA 2: Campos do Bravo ERP Dinâmicos

### Objetivo
Carregar os campos disponíveis do primeiro produto retornado pela API do Bravo ERP.

### Implementação

#### Backend - Novo Endpoint
```
GET /bravo-erp/mapping/fields/bravo
```

**Resposta:**
```json
{
  "success": true,
  "fields": [
    {
      "nome": "id_produto",
      "tipo": "string",
      "valor_exemplo": "27928",
      "caminho": "id_produto"
    },
    {
      "nome": "ref",
      "tipo": "string",
      "valor_exemplo": "IMP001",
      "caminho": "ref"
    },
    {
      "nome": "gtin.gtin",
      "tipo": "string",
      "valor_exemplo": "7892677009393",
      "caminho": "gtin.gtin"
    },
    // ... todos os campos do produto (incluindo aninhados)
  ],
  "product_sample": {
    "id_produto": "27928",
    "ref": "IMP001",
    // ... produto completo para preview
  }
}
```

**Código:**
- Criar método no `MappingService` que chama `BravoErpClientV2Service`
- Buscar primeira página (1 produto)
- Extrair todos os campos do produto (incluindo aninhados)
- Retornar estrutura achatada para mapeamento
- Incluir produto completo para preview

**Lógica de Extração de Campos Aninhados:**
```typescript
function flattenObject(obj: any, prefix = ''): Array<{nome: string, tipo: string, valor: any, caminho: string}> {
  // Recursivamente extrai campos aninhados
  // Ex: {gtin: {gtin: "123"}} -> "gtin.gtin"
}
```

#### Frontend
- Remover array `CAMPOS_BRAVO` fixo
- Carregar campos via API ao montar componente
- Mostrar loading enquanto carrega
- Atualizar quando clicar em "Atualizar Campos"
- Tratar erro se API não configurada

---

## 👁️ MELHORIA 3: Preview dos Campos Mapeados

### Objetivo
Permitir que o usuário visualize como ficará o produto após aplicar os mapeamentos configurados.

### Interface Proposta

#### Modal/Dialog de Preview

```
┌─────────────────────────────────────────────────────────────┐
│  📊 Preview do Mapeamento                         [X]       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Produto de Referência: IMP001 - EMPILHADEIRA MANUAL        │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Dados Originais (Bravo ERP)        │ Dados Mapeados   │ │
│  ├────────────────────────────────────┼───────────────────┤ │
│  │ id_produto: "27928"                │ referencia:       │ │
│  │                                    │ "IMP001"          │ │
│  │ ref: "IMP001"                      │ ───────────────── │ │
│  │                                    │ descricao:        │ │
│  │ titulo: "EMPILHADEIRA MANUAL"      │ "EMPILHADEIRA..." │ │
│  │                                    │ ───────────────── │ │
│  │ excluido: "N"                      │ ativo: true       │ │
│  │                                    │ ───────────────── │ │
│  │ gtin.gtin: "7892677009393"         │ gtin:             │ │
│  │                                    │ "7892677009393"   │ │
│  │ ncm: "84271010"                    │ ncm: "84271010"   │ │
│  │                                    │ ───────────────── │ │
│  │ _data_ult_modif: "2025-01-03..."  │ dataUltModif:     │ │
│  │                                    │ 2025-01-03T14:14  │ │
│  └────────────────────────────────────┴───────────────────┘ │
│                                                              │
│  [Ver Produto Completo] [Copiar JSON] [Fechar]              │
└─────────────────────────────────────────────────────────────┘
```

#### Versão Expandida (Todos os Campos)

```
┌─────────────────────────────────────────────────────────────┐
│  📊 Preview Completo - Todos os Campos            [X]       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Mostrando: Todos os campos do produto original             │
│  Filtros: [ Mapeados ] [ Não Mapeados ] [ Todos ]          │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Campo Original (Bravo ERP) │ Valor │ Mapeado Para │   │
│  ├────────────────────────────┼───────┼───────────────┤   │
│  │ id_produto                 │ 27928 │ metadata...   │   │
│  │ ref                        │ IMP001│ referencia ✓  │   │
│  │ titulo                     │ EMP...│ descricao ✓   │   │
│  │ descricao                  │ Det...│ (não mapeado) │   │
│  │ ...                        │ ...   │ ...           │   │
│  └────────────────────────────┴───────┴───────────────┘   │
│                                                              │
│  [Exportar JSON] [Exportar CSV] [Fechar]                    │
└─────────────────────────────────────────────────────────────┘
```

### Implementação

#### Backend - Novo Endpoint
```
POST /bravo-erp/mapping/preview
```

**Request:**
```json
{
  "mapeamentos": [
    {
      "campo_bravo": "ref",
      "campo_interno": "referencia",
      "tipo_transformacao": "direto"
    },
    // ... mapeamentos configurados
  ]
}
```

**Resposta:**
```json
{
  "success": true,
  "original": {
    "id_produto": "27928",
    "ref": "IMP001",
    "titulo": "EMPILHADEIRA MANUAL",
    // ... produto completo da API
  },
  "mapped": {
    "referencia": "IMP001",
    "descricao": "EMPILHADEIRA MANUAL",
    "ativo": true,
    // ... produto após transformação
  },
  "metadata": {
    "bravo_id": "27928",
    // ... campos mapeados para metadata
  },
  "mapping_details": [
    {
      "campo_bravo": "ref",
      "campo_interno": "referencia",
      "valor_original": "IMP001",
      "valor_mapeado": "IMP001",
      "transformacao": "direto",
      "sucesso": true
    },
    // ... detalhes de cada mapeamento
  ],
  "unmapped_fields": [
    {
      "campo": "descricao",
      "valor": "Descrição completa...",
      "tipo": "text"
    }
    // ... campos não mapeados
  ]
}
```

**Código:**
- Criar método no `MappingService` que:
  1. Busca 1º produto da API Bravo ERP
  2. Aplica transformações usando `ProductTransformService`
  3. Retorna produto original, mapeado e detalhes

#### Frontend

**Componente: `MappingPreviewDialog`**

```tsx
interface MappingPreviewDialogProps {
  mapeamentos: CampoMapeamento[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
```

**Funcionalidades:**
- Botão "Ver Preview" ao lado de "Salvar Mapeamentos"
- Modal/Dialog com duas colunas (Original vs Mapeado)
- Aba "Resumido" e "Completo"
- Filtros: Mapeados / Não Mapeados / Todos
- Indicadores visuais (✓ mapeado, ✗ erro)
- Exportar JSON/CSV
- Loading enquanto processa

**Integração:**
- Adicionar botão no `MappingPanel`
- Chamar endpoint de preview
- Mostrar resultado em dialog profissional

---

## 🎨 MELHORIA 4: Interface Visual Aprimorada

### Melhorias de UX

1. **Indicadores Visuais:**
   - ✓ Verde: Campo mapeado corretamente
   - ⚠️ Amarelo: Campo mapeado com aviso
   - ✗ Vermelho: Erro no mapeamento
   - ⭕ Cinza: Campo não mapeado

2. **Badges de Status:**
   - "Dinâmico" - Campos carregados da API
   - "Fixo" - Campos carregados do schema
   - "Atualizado há X minutos"

3. **Busca/Filtro:**
   - Campo de busca nos campos disponíveis
   - Filtro por tipo (string, number, boolean, etc)
   - Filtro por status (mapeado, não mapeado)

---

## 📝 Ordem de Implementação

### FASE 1: Backend - Endpoints
1. ✅ `GET /bravo-erp/mapping/fields/internal` - Campos da tabela
2. ✅ `GET /bravo-erp/mapping/fields/bravo` - Campos da API
3. ✅ `POST /bravo-erp/mapping/preview` - Preview do mapeamento

### FASE 2: Frontend - Carregamento Dinâmico
1. ✅ Carregar campos da tabela dinamicamente
2. ✅ Carregar campos do Bravo ERP dinamicamente
3. ✅ Botão "Atualizar Campos" para recarregar

### FASE 3: Frontend - Preview
1. ✅ Criar componente `MappingPreviewDialog`
2. ✅ Integrar botão "Ver Preview" no `MappingPanel`
3. ✅ Implementar visualização resumida e completa

### FASE 4: Frontend - Melhorias de UX
1. ✅ Indicadores visuais
2. ✅ Busca/filtro
3. ✅ Badges de status
4. ✅ Exportar preview

---

## 🔍 Detalhes Técnicos

### Backend - Extração de Campos do Schema

```typescript
// MappingService
async getInternalFields() {
  // Ler schema Prisma
  // Extrair campos do model Produto
  // Retornar com metadados
}
```

### Backend - Extração de Campos da API

```typescript
// MappingService
async getBravoFields() {
  // Buscar 1º produto via BravoErpClientV2Service
  // Flatten object recursivamente
  // Extrair tipos e valores
  // Retornar lista de campos
}
```

### Backend - Preview de Mapeamento

```typescript
// MappingService
async previewMapping(mapeamentos: CampoMapeamento[]) {
  // Buscar 1º produto
  // Aplicar transformações usando ProductTransformService
  // Separar campos mapeados/não mapeados
  // Retornar resultado detalhado
}
```

### Frontend - Componente de Preview

```tsx
<Dialog>
  <DialogContent className="max-w-6xl max-h-[90vh]">
    <DialogHeader>
      <DialogTitle>Preview do Mapeamento</DialogTitle>
    </DialogHeader>
    
    <Tabs>
      <TabsList>
        <TabsTrigger value="resumido">Resumido</TabsTrigger>
        <TabsTrigger value="completo">Completo</TabsTrigger>
      </TabsList>
      
      <TabsContent value="resumido">
        {/* Preview resumido - apenas mapeados */}
      </TabsContent>
      
      <TabsContent value="completo">
        {/* Preview completo - todos os campos */}
      </TabsContent>
    </Tabs>
  </DialogContent>
</Dialog>
```

---

## ✅ Checklist de Implementação

### Backend
- [ ] Criar endpoint `GET /bravo-erp/mapping/fields/internal`
- [ ] Criar endpoint `GET /bravo-erp/mapping/fields/bravo`
- [ ] Criar endpoint `POST /bravo-erp/mapping/preview`
- [ ] Implementar extração de campos do schema Prisma
- [ ] Implementar extração de campos da API (flatten)
- [ ] Implementar preview usando ProductTransformService
- [ ] Adicionar testes unitários

### Frontend
- [ ] Atualizar `bravo-erp.service.ts` com novos métodos
- [ ] Remover arrays fixos do `mapping-panel.tsx`
- [ ] Carregar campos dinamicamente na montagem
- [ ] Criar componente `MappingPreviewDialog`
- [ ] Adicionar botão "Ver Preview"
- [ ] Implementar visualização resumida
- [ ] Implementar visualização completa
- [ ] Adicionar indicadores visuais
- [ ] Adicionar busca/filtro
- [ ] Adicionar exportação JSON/CSV

---

## 🎯 Resultado Final

Após essas melhorias:

1. ✅ **Campos sempre atualizados** - Sem necessidade de atualizar código
2. ✅ **Campos reais da API** - Usuário vê exatamente o que a API retorna
3. ✅ **Preview profissional** - Usuário valida mapeamento antes de sincronizar
4. ✅ **Interface moderna** - Visual profissional e intuitivo
5. ✅ **Menos erros** - Usuário consegue ver problemas antes de sincronizar

---

**Última Atualização:** 2025-01-22  
**Status:** 📋 Plano de Implementação
