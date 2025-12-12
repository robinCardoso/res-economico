# 📊 ANÁLISE COMPLETA: Implementação de Importação de Vendas

## 🎯 OBJETIVO

Implementar a importação de vendas no sistema res-economico, adaptando a estrutura existente do painel-completo que utiliza Supabase para o sistema atual que utiliza PostgreSQL/Prisma. **IMPORTANTE:** Não existe API BRAVO para vendas - a importação é feita via planilha Excel.

## 📋 STATUS ATUAL - Versão 2.3.0 (2025-12-12)

### ✅ Funcionalidades Implementadas

1. **Sistema de Importação Completo**
   - ✅ Importação de planilhas Excel (.xls, .xlsx, .csv)
   - ✅ Mapeamento manual de colunas
   - ✅ Validação de campos obrigatórios
   - ✅ Processamento em lotes (300 registros)
   - ✅ Processamento assíncrono em background
   - ✅ Barra de progresso em tempo real
   - ✅ Sistema de deleção de importações

2. **Persistência de Mapeamentos**
   - ✅ Mapeamentos salvos no banco de dados (PostgreSQL)
   - ✅ CRUD completo de mapeamentos
   - ✅ Suporte a filtros de exclusão salvos
   - ✅ Relacionamento com usuário

3. **Sistema de Analytics**
   - ✅ Página completa de analytics com 4 análises
   - ✅ Filtros salvos de analytics
   - ✅ Ordenação automática (maior para menor)
   - ✅ Interface compacta e profissional
   - ✅ Exportação CSV/Excel

4. **Validação e Qualidade**
   - ✅ Validação de campos vazios antes da revisão
   - ✅ 13 campos obrigatórios configurados
   - ✅ Feedback detalhado por linha do Excel
   - ✅ Detecção de duplicatas

5. **Gerenciamento**
   - ✅ Listagem de vendas com filtros avançados
   - ✅ Filtros Select (Marca, Grupo, Subgrupo, Tipo Operação)
   - ✅ Paginação e busca
   - ✅ Modal de detalhes da venda

### 📊 Estatísticas de Implementação

- **Total de Tabelas:** 3 (Venda, VendaAnalytics, VendaImportacaoLog, VendaColumnMapping, VendaAnalyticsFilter)
- **Total de Endpoints Backend:** 25+
- **Total de Componentes Frontend:** 15+
- **Total de Migrations:** 8+
- **Campos Obrigatórios:** 13
- **Análises de Analytics:** 4

---

## 📋 SUMÁRIO

1. [Análise da Estrutura Atual](#1-análise-da-estrutura-atual)
2. [Análise do Banco de Dados](#2-análise-do-banco-de-dados)
3. [Dependências e Referências](#3-dependências-e-referências)
4. [Estrutura Proposta](#4-estrutura-proposta)
5. [Plano de Implementação](#5-plano-de-implementação)
6. [Checklist Completo](#6-checklist-completo)
7. [Atualizações e Melhorias Implementadas](#-atualizações-e-melhorias-implementadas)
   - [Versão 2.0.0 - Melhorias de Analytics](#-versão-200---melhorias-de-analytics-e-sincronização-2025-12-09)
   - [Versão 2.1.0 - Melhorias de UX nos Filtros](#-versão-210---melhorias-de-ux-nos-filtros-2025-12-09)
   - [Versão 2.2.0 - Sistema de Progresso](#-versão-220---sistema-de-progresso-e-processamento-assíncrono-2025-12-10)
   - [Versão 2.3.0 - Persistência e Validação](#-versão-230---persistência-de-mapeamentos-e-filtros-salvos-2025-12-12)

---

## 1. ANÁLISE DA ESTRUTURA ATUAL

### 1.0. Arquivo de Exemplo Analisado

**Arquivo:** `12-dadosItensVendas-69360c926d332.xls`

**Observações:**
- Arquivo Excel (.xls) com dados de itens de vendas
- Estrutura de colunas a ser mapeada para a tabela `Venda`
- Campos esperados baseados no código do painel-completo:
  - `NFE` - Nota Fiscal Eletrônica
  - `DATA` - Data da Venda
  - `ID_DOC` - ID do Documento
  - `ID_PROD` - ID do Produto
  - `REFERENCIA` - Referência do Produto
  - `PROD_COD_MAESTRE` ou `PROD_COD_MASTER` - Prod Cod Mestre (Código Mestre do Produto)
  - `TIPO_OPERACAO` ou `TIPO_OPER` - Tipo Operação
  - `QTD` ou `QUANTIDADE` - Quantidade
  - `VALOR_UNIT` ou `VALOR_UNITARIO` - Valor Unitário
  - `VALOR_TOTAL` - Valor Total
  - `RAZAO_SOCIAL` - Razão Social (Cliente)
  - `NOME_FANTASIA` - Nome Fantasia (Cliente)
  - `UF_Destino` ou `UF_DESTINO` - UF de Destino
  - `UF_Origem` ou `UF_ORIGEM` - UF de Origem

**Nota:** A estrutura exata das colunas será detectada automaticamente durante o processamento, permitindo flexibilidade nos nomes das colunas.

**Mapeamento de Colunas (Flexível):**
O sistema deve suportar variações nos nomes das colunas. Exemplos:
- `NFE`, `NFe`, `nfe`, `Nota Fiscal`, `NOTA_FISCAL`
- `DATA`, `Data`, `data`, `Data Venda`, `DATA_VENDA`
- `ID_DOC`, `Id Doc`, `id_doc`, `ID Documento`
- `REFERENCIA`, `Referência`, `referencia`, `REF`, `Código Produto`
- `PROD_COD_MAESTRE`, `Prod Cod Mestre`, `prod_cod_mestre`, `COD_MASTER`, `Código Mestre`
- `TIPO_OPERACAO`, `Tipo Operação`, `tipo_operacao`, `TIPO_OPER`, `Tipo Oper`
- `GRUPO`, `Grupo`, `grupo`, `GRUPO_PRODUTO`
- `SUBGRUPO`, `Subgrupo`, `subgrupo`, `SUBGRUPO_PRODUTO`
- `QTD`, `Quantidade`, `qtd`, `QTD_VENDA`
- `VALOR_UNIT`, `Valor Unitário`, `valor_unit`, `PRECO_UNITARIO`
- `VALOR_TOTAL`, `Valor Total`, `valor_total`, `TOTAL`
- `RAZAO_SOCIAL`, `Razão Social`, `razao_social`, `Cliente`
- `NOME_FANTASIA`, `Nome Fantasia`, `nome_fantasia`, `Fantasia`
- `UF_Destino`, `UF Destino`, `uf_destino`, `UF_DESTINO`
- `UF_Origem`, `UF Origem`, `uf_origem`, `UF_ORIGEM`

**Estratégia de Detecção:**
1. Buscar primeira linha com texto não-numérico (cabeçalho)
2. Normalizar nomes de colunas (remover acentos, converter para maiúsculas, remover espaços)
3. Fazer match por palavras-chave (ex: "nfe", "nota", "fiscal")
4. Permitir mapeamento manual se detecção automática falhar

### 1.1. Estrutura de Vendas no painel-completo (Supabase)

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
  - `PROD_COD_MAESTRE` - Prod Cod Mestre (Código Mestre do Produto)
  - `TIPO_OPERACAO` - Tipo Operação
  - `QTD` - Quantidade
  - `VALOR_UNIT` - Valor Unitário
  - `VALOR_TOTAL` - Valor Total
  - `RAZAO_SOCIAL` - Razão Social (Cliente)
  - `NOME_FANTASIA` - Nome Fantasia (Cliente)
  - `UF_Destino` - UF de Destino
  - `UF_Origem` - UF de Origem
  - **Nota:** `MARCA` não será armazenada na tabela de vendas - será obtida via JOIN com a tabela `produtos` usando `ID_PROD` ou `REFERENCIA`

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
- ✅ Denormaliza `MARCA` da tabela `products` para `vendas` (para performance em relatórios)
- ✅ Atualiza tabela `analytics` em tempo real durante importação
- ✅ Usa UPSERT com chave composta: `nfe,id_prod,id_doc`
- ✅ Processa em lotes de 400 registros
- ✅ Retorna estatísticas de importação
- ✅ Salva histórico em `historico_importacao`

**Estrutura da Tabela `vendas` (Supabase):**
```sql
CREATE TABLE vendas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nfe TEXT NOT NULL,
  data DATE,
  id_doc TEXT,
  id_prod TEXT,
  referencia TEXT,
  prod_cod_mestre TEXT,
  tipo_operacao TEXT,
  qtd DECIMAL,
  valor_unit DECIMAL,
  valor_total DECIMAL,
  razao_social TEXT,
  nome_fantasia TEXT,
  uf_destino TEXT,
  uf_origem TEXT,
  -- Nota: marca não será armazenada aqui - será obtida via JOIN com tabela products
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(nfe, id_prod, id_doc)
);
```

**Estrutura da Tabela `analytics` (Supabase):**
```sql
CREATE TABLE analytics (
  id UUID PRIMARY KEY,
  year INTEGER,
  month INTEGER,
  associate TEXT, -- nome_fantasia
  brand TEXT, -- marca (obtida via JOIN com products no painel-completo)
  uf TEXT,
  total_value DECIMAL,
  total_quantity INTEGER,
  updated_at TIMESTAMP,
  UNIQUE(year, month, associate, brand, uf)
);
```

**Nota:** No res-economico, a marca será obtida via JOIN com a tabela `Produto` durante a agregação, mantendo os dados normalizados.

### 1.2. Estrutura Atual do Projeto (res-economico)

#### Frontend
- ✅ Página de vendas existe no painel-completo (referência)
- ✅ Componente `ImportStepper` disponível (precisa verificar se existe no res-economico)
- ✅ Componente `ImportHistoryTable` disponível (precisa verificar)
- ✅ Utilitários de importação disponíveis (precisa verificar)

#### Backend
- ✅ Módulo Bravo ERP implementado: `backend/src/bravo-erp/`
- ✅ Estrutura de sincronização de produtos já existe
- ✅ Sistema de lock e progresso implementado
- ✅ Cliente API do Bravo ERP implementado (apenas para produtos)
- ❌ **NÃO existe API BRAVO para vendas** - importação é via Excel

---

## 2. ANÁLISE DO BANCO DE DADOS

### 2.1. Tabelas Necessárias

#### 2.1.1. Tabela `Venda` (Nova - PostgreSQL/Prisma)

```prisma
model Venda {
  id              String   @id @default(uuid())
  
  // Identificação da Venda
  nfe             String   // Nota Fiscal Eletrônica (obrigatório)
  idDoc           String?  // ID do Documento no sistema origem
  dataVenda       DateTime  // Data da Venda (obrigatório)
  
  // Cliente
  razaoSocial     String   // Razão Social do Cliente (obrigatório)
  nomeFantasia    String?  // Nome Fantasia do Cliente
  cnpjCliente     String?  // CNPJ do Cliente
  ufDestino       String?  // UF de Destino
  ufOrigem        String?  // UF de Origem
  
  // Produto
  idProd          String?  // ID do Produto no sistema origem
  referencia      String?  // Referência do Produto
  prodCodMestre   String?  // Prod Cod Mestre (Código Mestre do Produto)
  descricaoProduto String? // Descrição do Produto
  marca           String?  // Marca do Produto (denormalizada para performance em relatórios)
  // Nota: Marca é denormalizada para evitar JOINs em relatórios frequentes
  // A marca é capturada no momento da importação e representa a marca no momento da venda
  // Se a marca do produto mudar no futuro, a marca histórica da venda é preservada
  
  // Operação
  tipoOperacao    String?  // Tipo Operação
  
  // Valores
  quantidade      Decimal  @db.Decimal(18, 3) // Quantidade vendida
  valorUnitario   Decimal  @db.Decimal(18, 2) // Valor unitário
  valorTotal      Decimal  @db.Decimal(18, 2) // Valor total
  
  // Relacionamentos
  empresaId       String?  // Empresa relacionada
  produtoId       String?  // Produto relacionado (se existir na tabela Produto)
  importacaoLogId String?  // ID da importação que criou esta venda (NOVO - Versão 2.2.0)
  
  // Metadata JSONB para campos dinâmicos
  metadata        Json?    // { origem, tipo_venda, desconto, etc }
  
  // Timestamps
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relacionamentos
  empresa         Empresa? @relation(fields: [empresaId], references: [id])
  produto         Produto? @relation(fields: [produtoId], references: [id])
  importacaoLog   VendaImportacaoLog? @relation(fields: [importacaoLogId], references: [id], onDelete: SetNull) // NOVO
  
  @@index([nfe])
  @@index([dataVenda])
  @@index([empresaId, dataVenda])
  @@index([referencia])
  @@index([razaoSocial])
  @@index([idDoc])
  @@index([marca])
  @@index([grupo])
  @@index([subgrupo])
  @@index([prodCodMestre])
  @@index([tipoOperacao])
  @@index([importacaoLogId]) // NOVO - Para deleção de importações
  
  // Chave única composta para evitar duplicatas
  // IMPORTANTE: Esta chave garante que não haverá duplicatas mesmo se:
  // - O usuário carregar o mesmo arquivo duas vezes
  // - O usuário carregar um arquivo antigo sem querer
  // - Houver múltiplos produtos na mesma NFE
  // 
  // Estratégia: NFE + ID_DOC + REFERENCIA (ou ID_PROD se referencia for null)
  // Se idDoc for null, usa 'NULL' como string para manter unicidade
  // Se referencia for null, usa idProd como fallback
  @@unique([nfe, idDoc, referencia])
  
  // Índice adicional para busca rápida de duplicatas potenciais
  @@index([nfe, dataVenda, referencia])
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
  marca            String   // Marca do produto (denormalizada da tabela Venda)
  grupo            String?  // Grupo do produto (denormalizado da tabela Venda, opcional)
  subgrupo         String?  // Subgrupo do produto (denormalizado da tabela Venda, opcional)
  
  // Agregação geográfica
  uf               String   // UF
  
  // Valores agregados
  totalValor       Decimal  @db.Decimal(18, 2)
  totalQuantidade  Decimal  @db.Decimal(18, 3)
  
  // Timestamps
  updatedAt        DateTime @updatedAt
  createdAt        DateTime @default(now())
  
  // IMPORTANTE: Constraint único inclui grupo e subgrupo para evitar agrupamento incorreto
  // Isso garante que vendas de diferentes grupos/subgrupos da mesma marca sejam contabilizadas separadamente
  @@unique([ano, mes, nomeFantasia, marca, grupo, subgrupo, uf])
  @@index([ano, mes])
  @@index([marca])
  @@index([grupo])
  @@index([subgrupo])
  @@index([uf])
  @@index([nomeFantasia])
}
```

**⚠️ ATUALIZAÇÃO IMPORTANTE - Constraint Único:**

O constraint único foi **atualizado** para incluir `grupo` e `subgrupo` na chave de agrupamento. Isso é **essencial** para evitar cálculos incorretos quando há múltiplos grupos/subgrupos da mesma marca.

**Antes (INCORRETO):**
```prisma
  // IMPORTANTE: Constraint único inclui grupo e subgrupo para evitar agrupamento incorreto
  // Isso garante que vendas de diferentes grupos/subgrupos da mesma marca sejam contabilizadas separadamente
  @@unique([ano, mes, nomeFantasia, marca, grupo, subgrupo, uf])
```

**Depois (CORRETO):**
```prisma
@@unique([ano, mes, nomeFantasia, marca, grupo, subgrupo, uf])
```

**Por que isso é importante?**
- Se uma marca tem produtos em diferentes grupos (ex: "ELETRÔNICOS" e "INFORMÁTICA"), sem incluir grupo/subgrupo na chave, os valores seriam somados incorretamente
- O analytics agora agrupa corretamente por grupo e subgrupo, permitindo análises mais precisas

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
  duplicatasCount   Int      @default(0)  // Quantidade de registros que já existiam (atualizados)
  novosCount        Int      @default(0)   // Quantidade de registros novos (inseridos)
  produtosNaoEncontrados Int? // Quantidade de produtos não encontrados na tabela Produto
  
  // Progresso (NOVO - Versão 2.2.0)
  progresso         Int      @default(0)   // Percentual de conclusão (0-100)
  linhasProcessadas Int      @default(0)   // Quantidade de linhas já processadas
  
  // Usuário
  usuarioEmail      String
  usuarioId         String?
  
  // Timestamps
  createdAt         DateTime @default(now())
  
  // Relacionamentos
  usuario           Usuario? @relation(fields: [usuarioId], references: [id])
  vendas            Venda[]  // Vendas criadas por esta importação (NOVO)
  
  @@index([createdAt])
  @@index([usuarioId])
}
```

**Campos Adicionados:**
- `duplicatasCount`: Quantidade de registros que já existiam no banco (foram atualizados via UPSERT)
- `novosCount`: Quantidade de registros novos que foram inseridos
- `produtosNaoEncontrados`: Quantidade de produtos que não foram encontrados na tabela `Produto` (usaram valores padrão)
- **`progresso`** (Versão 2.2.0): Percentual de conclusão da importação (0-100)
- **`linhasProcessadas`** (Versão 2.2.0): Quantidade de linhas já processadas durante a importação
- **`vendas`** (Versão 2.2.0): Relacionamento com vendas criadas por esta importação (para deleção)

### 2.2. Relacionamentos com Tabelas Existentes

#### 2.2.1. Relacionamento com `Empresa`
- Uma venda pode pertencer a uma empresa
- Relacionamento opcional (pode ser null)

#### 2.2.2. Relacionamento com `Produto`
- Uma venda pode estar relacionada a um produto
- Relacionamento opcional (pode ser null)
- Usa `referencia`, `idProd` ou `prodCodMestre` para fazer o match
- **Marca será obtida via JOIN** com a tabela `Produto` usando `idProd` ou `referencia` quando necessário
- Isso mantém os dados normalizados e evita redundância
- `prodCodMestre` pode ser usado para relacionar com produtos mestres/variantes

#### 2.2.3. Relacionamento com `Usuario`
- Logs de importação relacionam com usuário que iniciou
- Usado para auditoria

### 2.3. Índices Necessários

**Tabela `Venda`:**
- `@@index([nfe])` - Busca rápida por NFE
- `@@index([dataVenda])` - Filtros por data
- `@@index([empresaId, dataVenda])` - Relatórios por empresa e período
- `@@index([referencia])` - Busca por produto
- `@@index([prodCodMestre])` - Busca por código mestre do produto
- `@@index([tipoOperacao])` - Busca por tipo de operação
- `@@index([razaoSocial])` - Busca por cliente
- `@@index([idDoc])` - Busca por ID do documento
- `@@index([marca])` - Busca por marca (denormalizada para performance)
- `@@index([grupo])` - Busca por grupo (denormalizado para performance)
- `@@index([subgrupo])` - Busca por subgrupo (denormalizado para performance)
- `@@index([nfe, dataVenda, referencia])` - Busca rápida de duplicatas potenciais

**Tabela `VendaAnalytics`:**
- `@@unique([ano, mes, nomeFantasia, marca, uf])` - Evita duplicatas
- `@@index([ano, mes])` - Filtros temporais
- `@@index([marca])` - Filtros por marca (marca denormalizada da tabela Venda)
- `@@index([grupo])` - Filtros por grupo (grupo denormalizado da tabela Venda)
- `@@index([subgrupo])` - Filtros por subgrupo (subgrupo denormalizado da tabela Venda)
- `@@index([uf])` - Filtros geográficos
- **Nota:** A marca, grupo e subgrupo na tabela `VendaAnalytics` são obtidos dos dados denormalizados na tabela `Venda` durante o processo de agregação

---

## 3. DEPENDÊNCIAS E REFERÊNCIAS

### 3.1. Dependências do Backend

#### 3.1.1. Módulos NestJS Necessários
- ✅ `@nestjs/common` - Já instalado
- ✅ `@nestjs/config` - Já instalado
- ✅ `@prisma/client` - Já instalado
- ✅ `class-validator` - Já instalado
- ✅ `class-transformer` - Já instalado
- ✅ `xlsx` ou `exceljs` - Para processar planilhas Excel (verificar se já existe)

#### 3.1.2. Serviços Existentes que Podem Ser Reutilizados
- ✅ `PrismaService` - Serviço de banco de dados
- ❌ Não há sincronização de vendas (apenas produtos)
- ❌ Não há sistema de lock para vendas (pode reutilizar lógica de produtos)
- ❌ Não há sistema de progresso para vendas (pode reutilizar lógica de produtos)

### 3.2. Dependências do Frontend

#### 3.2.1. Componentes Existentes (painel-completo)
- ✅ `ImportStepper` - Componente genérico de importação
- ✅ `ImportHistoryTable` - Tabela de histórico
- ✅ `GerenciarVendasTab` - Componente de gerenciamento

#### 3.2.2. Utilitários Existentes (painel-completo)
- ✅ `import-vendas-utils.ts` - Utilitários de importação de vendas
- ✅ Cliente HTTP genérico

### 3.3. Referências de Código

#### 3.3.1. Código de Referência - painel-completo
- `painel-completo/src/app/admin/vendas/page.tsx` - Página de vendas
- `painel-completo/src/server/actions/imports/import-sales-supabase.ts` - Importação de vendas
- `painel-completo/src/lib/imports/utils/import-vendas-utils.ts` - Utilitários

#### 3.3.2. Código de Referência - res-economico (produtos)
- `backend/src/bravo-erp/sync/sync.service.ts` - Serviço de sincronização (apenas produtos)
- `backend/src/bravo-erp/sync/sync-processor.service.ts` - Processador de sincronização
- `backend/src/bravo-erp/sync/sync-log.service.ts` - Logs de sincronização
- `backend/src/bravo-erp/sync/sync-progress.service.ts` - Progresso de sincronização

#### 3.3.3. Código de Referência - res-economico (uploads)
- `backend/src/uploads/` - Sistema de upload de planilhas Excel (já existe)
- `frontend/src/app/(app)/admin/resultado-economico/uploads/` - Interface de uploads

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
        │   ├── vendas-processor.service.ts   # Processador de planilhas
        │   ├── vendas-validator.service.ts   # Validador de dados
        │   └── vendas-analytics.service.ts   # Atualização de analytics
        │
        ├── analytics/
        │   ├── vendas-analytics.service.ts   # Serviço de analytics
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
        └── vendas.service.ts                  # Cliente API para vendas
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
2. ✅ Implementar parser de planilhas (usar `xlsx` - já instalado)
3. ✅ Implementar detecção automática de cabeçalho (similar ao módulo de uploads)
4. ✅ Implementar mapeamento flexível de colunas (suportar variações de nomes)
5. ✅ Implementar validação de dados
6. ✅ Implementar transformação de dados
7. ✅ Normalizar campos null para string vazia na chave única

#### Arquivos:
- `backend/src/vendas/import/vendas-processor.service.ts`
- `backend/src/vendas/import/vendas-validator.service.ts`

#### Dependências:
- Reutilizar lógica de processamento de Excel do módulo de uploads
- Adaptar para estrutura de vendas
- Usar biblioteca `xlsx` (já instalada no projeto)

#### Estrutura de Processamento:
```typescript
// 1. Ler arquivo Excel
const workbook = XLSX.readFile(filePath);
const worksheet = workbook.Sheets[workbook.SheetNames[0]];

// 2. Detectar cabeçalho (primeira linha com texto não-numérico)
const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });
const headerRowIndex = detectHeaderRow(rawData);

// 3. Normalizar e mapear colunas
const headers = rawData[headerRowIndex];
const columnMapping = mapColumns(headers); // Mapeia para campos internos

// 4. Processar linhas de dados
const vendas = rawData.slice(headerRowIndex + 1).map((row, index) => {
  return transformRow(row, columnMapping, index + headerRowIndex + 1);
});

// 5. Validar e normalizar dados
const vendasValidadas = vendas.map(venda => ({
  ...venda,
  idDoc: venda.idDoc || '', // Normalizar null para string vazia
  referencia: venda.referencia || '', // Normalizar null para string vazia
}));

// 6. Obter marca, grupo e subgrupo de produtos (denormalização)
const referencias = vendasValidadas
  .map(v => v.referencia)
  .filter(Boolean);
const idProds = vendasValidadas
  .map(v => v.idProd)
  .filter(Boolean);

// Buscar produtos para obter marca, grupo e subgrupo
const produtos = await prisma.produto.findMany({
  where: {
    OR: [
      { referencia: { in: referencias } },
      { id_prod: { in: idProds } },
    ],
  },
  select: {
    referencia: true,
    id_prod: true,
    marca: true,
    grupo: true,
    subgrupo: true,
  },
});

// Criar mapas por referencia/idProd
const marcaMap = new Map<string, string>();
const grupoMap = new Map<string, string>();
const subgrupoMap = new Map<string, string>();

produtos.forEach(p => {
  const keyRef = p.referencia || '';
  const keyId = p.id_prod || '';
  
  // Mapa de marca
  if (keyRef) {
    marcaMap.set(keyRef, p.marca || 'DESCONHECIDA');
    grupoMap.set(keyRef, p.grupo || 'DESCONHECIDO');
    subgrupoMap.set(keyRef, p.subgrupo || 'DESCONHECIDO');
  }
  if (keyId) {
    marcaMap.set(keyId, p.marca || 'DESCONHECIDA');
    grupoMap.set(keyId, p.grupo || 'DESCONHECIDO');
    subgrupoMap.set(keyId, p.subgrupo || 'DESCONHECIDO');
  }
});

// Adicionar marca, grupo e subgrupo denormalizados às vendas
// Tratamento de erros: Se produto não existir ou campos estiverem null, usar valores padrão
const vendasComDadosProduto = vendasValidadas.map(venda => {
  const referencia = venda.referencia || '';
  const idProd = venda.idProd || '';
  
  // Tentar obter por referencia primeiro, depois por idProd
  const marca = marcaMap.get(referencia) || marcaMap.get(idProd) || 'DESCONHECIDA';
  const grupo = grupoMap.get(referencia) || grupoMap.get(idProd) || 'DESCONHECIDO';
  const subgrupo = subgrupoMap.get(referencia) || subgrupoMap.get(idProd) || 'DESCONHECIDO';
  
  // Logar avisos se produto não foi encontrado (para auditoria)
  const produtoNaoEncontrado = !marcaMap.has(referencia) && !marcaMap.has(idProd) && (referencia || idProd);
  if (produtoNaoEncontrado) {
    console.warn(`⚠️ Produto não encontrado: referencia="${referencia}", idProd="${idProd}" - usando valores padrão (marca=DESCONHECIDA, grupo=DESCONHECIDO, subgrupo=DESCONHECIDO)`);
  }
  
  return {
    ...venda,
    marca,
    grupo,
    subgrupo,
    _produtoNaoEncontrado: produtoNaoEncontrado, // Flag para estatísticas
  };
});

// Contar produtos não encontrados para estatísticas
const produtosNaoEncontradosCount = vendasComDadosProduto.filter(v => v._produtoNaoEncontrado).length;
console.log(`📊 Estatísticas: ${produtosNaoEncontradosCount} produtos não encontrados (usando valores padrão)`);
  
  return {
    ...venda,
    marca,
    grupo,
    subgrupo,
  };
});
```

---

### FASE 3: Backend - Serviço de Importação ⏱️ ~4 horas

#### Tarefas:
1. ✅ Criar `VendasImportService` principal
2. ✅ Implementar processamento em lotes
3. ✅ Implementar UPSERT com chave composta `[nfe, idDoc, referencia]`
4. ✅ Normalizar campos null para string vazia na chave única
5. ✅ Implementar verificação de duplicatas pré-importação
6. ✅ Implementar feedback ao usuário sobre duplicatas
7. ✅ **Denormalizar marca, grupo e subgrupo de produtos** - Obter da tabela `Produto` (usando `idProd` ou `referencia`) e armazenar na tabela `Venda`
8. ✅ **Tratamento de erros:** 
   - Se produto não existir na tabela `Produto`: usar valores padrão
   - Se campos `marca`, `grupo` ou `subgrupo` estiverem null: usar valores padrão
   - Não falhar a importação se produto não existir (apenas usar valores padrão)
   - Logar avisos e registrar estatísticas de produtos não encontrados
9. ✅ Atualizar analytics em tempo real (usando dados denormalizados)
10. ✅ Salvar logs de importação (incluindo contagem de produtos não encontrados)
11. ✅ **Processamento assíncrono em background** (Versão 2.2.0) - Retorna `logId` imediatamente
12. ✅ **Sistema de progresso em tempo real** (Versão 2.2.0) - Campos `progresso` e `linhasProcessadas`
13. ✅ **Associar vendas à importação via `importacaoLogId`** (Versão 2.2.0) - Para deleção precisa
14. ✅ **Sistema de deleção de importações** (Versão 2.2.0) - Ver `PLANO-DELECAO-IMPORTACAO.md`

#### Arquivos:
- `backend/src/vendas/import/vendas-import.service.ts`
- `backend/src/vendas/import/vendas-import.controller.ts`
- `backend/src/vendas/import/vendas-analytics.service.ts`
- `backend/src/vendas/import/vendas-import-delete.service.ts` (NOVO - Versão 2.2.0)
- `backend/src/vendas/dto/vendas-import-request.dto.ts`
- `backend/src/vendas/dto/vendas-import-response.dto.ts`

#### Dependências:
- Reutilizar lógica de processamento em lotes do módulo de uploads
- Adaptar para estrutura de vendas
- **Processamento em lotes:** 300 linhas por vez (otimizado na Versão 2.2.0)
- **Timeout:** 10 minutos (600.000ms) no frontend para importações grandes

---

### FASE 4: Backend - Serviço de Analytics ⏱️ ~2 horas

#### Tarefas:
1. ✅ Criar `VendasAnalyticsService`
2. ✅ Implementar agregação de dados
3. ✅ Usar marca, grupo e subgrupo denormalizados da tabela `Venda` (já disponíveis, sem necessidade de JOIN)
4. ✅ Implementar atualização em tempo real durante importação
5. ✅ Criar endpoints de consulta
6. ✅ **Implementar upsert atômico com SQL `ON CONFLICT`** para evitar race conditions
7. ✅ **Criar serviço de sincronização** (`VendasAnalyticsSyncService`) para validar e corrigir dados
8. ✅ **Implementar recálculo automático** quando vendas são alteradas ou produtos são atualizados

#### Arquivos:
- `backend/src/vendas/analytics/vendas-analytics.service.ts`
- `backend/src/vendas/analytics/vendas-analytics.controller.ts`
- `backend/src/vendas/analytics/vendas-analytics-sync.service.ts` (NOVO)
- `backend/src/vendas/vendas-update.service.ts` (NOVO)

#### Melhorias Implementadas:

**1. Upsert Atômico com SQL ON CONFLICT:**
```typescript
// Usa SQL raw com ON CONFLICT para fazer upsert atômico
// Isso evita race conditions quando múltiplas requisições processam em paralelo
await this.prisma.$executeRaw`
  INSERT INTO "VendaAnalytics" (...)
  VALUES (...)
  ON CONFLICT ("ano", "mes", "nomeFantasia", "marca", "grupo", "subgrupo", "uf")
  DO UPDATE SET
    "totalValor" = "VendaAnalytics"."totalValor" + ${analytics.totalValor}::decimal,
    "totalQuantidade" = "VendaAnalytics"."totalQuantidade" + ${analytics.totalQuantidade}::decimal,
    "updatedAt" = NOW()
`;
```

**2. Tratamento de Constraint Antigo:**
- Durante migração, o sistema detecta se o constraint antigo (sem grupo/subgrupo) ainda existe
- Consolida registros antigos com os novos valores de grupo/subgrupo
- Remove duplicatas e atualiza registros existentes

**3. Recálculo Automático:**
- Quando uma venda é atualizada ou removida, o analytics é recalculado automaticamente para o período afetado
- Quando um produto é atualizado (especialmente grupo/subgrupo/marca), todas as vendas relacionadas são atualizadas e o analytics é recalculado
- Isso garante que o analytics sempre esteja sincronizado com os dados de vendas

**4. Serviço de Sincronização:**
- `VendasAnalyticsSyncService` valida se os dados de analytics estão sincronizados com as vendas
- Endpoint `GET /vendas/analytics/validar-sincronizacao` para verificar divergências
- Endpoint `POST /vendas/analytics/corrigir-sincronizacao` para corrigir automaticamente

#### Implementação de Agregação (com dados denormalizados):
```typescript
// Exemplo de agregação usando marca, grupo e subgrupo denormalizados (sem JOIN necessário)
const vendasAgregadas = await prisma.$queryRaw`
  SELECT 
    EXTRACT(YEAR FROM "dataVenda")::INTEGER as ano,
    EXTRACT(MONTH FROM "dataVenda")::INTEGER as mes,
    "nomeFantasia",
    COALESCE("marca", 'DESCONHECIDA') as marca,
    COALESCE("grupo", 'DESCONHECIDO') as grupo,
    COALESCE("subgrupo", 'DESCONHECIDO') as subgrupo,
    "ufDestino" as uf,
    SUM("valorTotal") as total_valor,
    SUM("quantidade") as total_quantidade
  FROM "Venda"
  WHERE "dataVenda" >= $1 AND "dataVenda" <= $2
  GROUP BY ano, mes, "nomeFantasia", marca, grupo, subgrupo, uf
  ORDER BY ano DESC, mes DESC
`;

// Performance: Muito mais rápido que JOIN, especialmente com muitos registros
// Filtros por grupo/subgrupo são muito mais rápidos com índices diretos
```

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
6. ✅ **Converter filtros para Select** (Marca, Grupo, Subgrupo, Tipo de Operação)
7. ✅ **Implementar filtro padrão "Venda"**
8. ✅ **Criar endpoints para valores únicos**
9. ✅ **Implementar modal de detalhes da venda**
10. ✅ **Implementar debounce para filtros de texto**

#### Arquivos:
- `frontend/src/app/(app)/admin/importacoes/vendas/gerenciar/page.tsx`
- `backend/src/vendas/vendas.controller.ts` (endpoints de valores únicos)
- `backend/src/vendas/vendas.service.ts` (métodos de busca de valores únicos)
- `frontend/src/services/vendas.service.ts` (métodos de API)
- `frontend/src/hooks/use-vendas.ts` (hooks para carregar opções)

#### Melhorias Implementadas:
- **Filtros Select:** Marca, Grupo, Subgrupo e Tipo de Operação agora são selects com opções do banco
- **Endpoints Backend:** 
  - `GET /vendas/tipos-operacao` - Retorna tipos únicos
  - `GET /vendas/marcas` - Retorna marcas únicas
  - `GET /vendas/grupos` - Retorna grupos únicos
  - `GET /vendas/subgrupos` - Retorna subgrupos únicos
- **Performance:** Queries otimizadas com raw SQL (`SELECT DISTINCT`)
- **Cache:** 5 minutos no frontend para reduzir requisições
- **Filtro Padrão:** Página inicia com "Tipo de Operação = Venda" ativo

---

### FASE 8: Frontend - Analytics e Estatísticas ⏱️ ~8 horas

#### Tarefas:
1. ✅ Criar componente de estatísticas
2. ✅ Implementar gráficos (opcional)
3. ✅ Implementar filtros de analytics
4. ⏳ **Página de Analytics** (`/admin/importacoes/vendas/analytics`) - **PRÓXIMA ETAPA**
5. ⏳ **Análise 1: Crescimento Empresa Mês a Mês e Ano a Ano**
6. ⏳ **Análise 2: Crescimento por Filial (UF) Ano a Ano**
7. ⏳ **Análise 3: Crescimento por Marca Ano a Ano**
8. ⏳ **Análise 4: Crescimento por Associado (nomeFantasia) Ano a Ano**

#### Arquivos:
- `frontend/src/components/vendas/vendas-stats-card.tsx`
- `frontend/src/app/(app)/admin/importacoes/vendas/analytics/page.tsx` (PRÓXIMA ETAPA)
- `backend/src/vendas/analytics/vendas-analytics.controller.ts` (novos endpoints)
- `backend/src/vendas/analytics/vendas-analytics.service.ts` (métodos de agregação)
- `frontend/src/services/vendas.service.ts` (métodos de API)
- `frontend/src/hooks/use-vendas.ts` (hooks para analytics)
- `frontend/src/components/vendas/analytics/` (componentes de análise)

#### Detalhamento das Análises:

**Análise 1: Crescimento Empresa Mês a Mês e Ano a Ano**
- **Estrutura:** Tabela compacta com meses (1-12) nas linhas e anos (2022-2025) nas colunas
- **Colunas por ano:** "Venda" (valor) e "% Evol." (percentual de evolução)
- **Cálculo:** Comparar cada mês/ano com o mesmo mês do ano anterior
- **Total Geral:** Soma de todos os meses por ano e evolução anual
- **Visualização:** Valores negativos destacados em vermelho

**Análise 2: Crescimento por Filial (UF) Ano a Ano**
- **Estrutura:** Tabela com Filiais (UFs) nas linhas e anos nas colunas
- **Agregação:** Agrupar por `ufDestino` da tabela `Venda`
- **Colunas por ano:** "Vendas" (valor) e "% Evol." (percentual)
- **Cálculo:** Comparar cada filial/ano com o mesmo filial/ano anterior
- **Total Geral:** Soma de todas as filiais por ano

**Análise 3: Crescimento por Marca Ano a Ano**
- **Estrutura:** Tabela com Marcas nas linhas e anos nas colunas
- **Agregação:** Agrupar por `marca` da tabela `VendaAnalytics`
- **Colunas por ano:** "Venda" (valor) e "%" (percentual)
- **Cálculo:** Comparar cada marca/ano com o mesmo marca/ano anterior
- **Total Geral:** Soma de todas as marcas por ano

**Análise 4: Crescimento por Associado (nomeFantasia) Ano a Ano**
- **Estrutura:** Tabela com Nome Fantasia nas linhas e anos nas colunas
- **Agregação:** Agrupar por `nomeFantasia` da tabela `VendaAnalytics`
- **Colunas por ano:** "Venda" (valor) e "%" (percentual)
- **Cálculo:** Comparar cada associado/ano com o mesmo associado/ano anterior
- **Filtros:** Permitir busca/filtro por nome fantasia

#### Endpoints Backend Necessários:

```typescript
// GET /vendas/analytics/crescimento-empresa
// Query params: 
//   - tipoOperacao?: string[] (múltiplos valores)
//   - filial?: string[] (UFs, múltiplos valores)
//   - ano?: number[] (múltiplos valores)
//   - mes?: number[] (múltiplos valores, 1-12)
//   - marca?: string[] (múltiplos valores)
//   - nomeFantasia?: string[] (múltiplos valores)
//   - grupo?: string[] (múltiplos valores)
//   - subgrupo?: string[] (múltiplos valores)
// Retorna: { meses: [{ mes: 1, 2022: { venda: number, evol?: number }, 2023: {...}, ... }], totalGeral: {...} }

// GET /vendas/analytics/crescimento-filial
// Query params: (mesmos filtros acima)
// Retorna: { filiais: [{ uf: string, 2022: { vendas: number, evol?: number }, 2023: {...}, ... }], totalGeral: {...} }

// GET /vendas/analytics/crescimento-marca
// Query params: (mesmos filtros acima)
// Retorna: { marcas: [{ marca: string, 2022: { venda: number, evol?: number }, 2023: {...}, ... }], totalGeral: {...} }

// GET /vendas/analytics/crescimento-associado
// Query params: (mesmos filtros acima)
// Retorna: { associados: [{ nomeFantasia: string, 2022: { venda: number, evol?: number }, 2023: {...}, ... }], totalGeral: {...} }
```

**Nota:** Todos os filtros suportam seleção múltipla (arrays). Se nenhum valor for fornecido, retorna todos os dados disponíveis.

#### Layout da Página:

- **Estrutura:** Tabs ou seções separadas para cada análise
- **Design:** Tabelas compactas, responsivas, com scroll horizontal se necessário
- **Visualização:**
  - Valores negativos em vermelho (background + texto)
  - Valores positivos em preto/verde
  - Formatação de números: separador de milhares (ponto), 2 casas decimais
  - Percentuais: 1 casa decimal, sinal de % ou negativo
- **Filtros (Todos com Seleção Múltipla):**
  - **Tipo de Operação:** Select múltiplo (checkbox ou multi-select)
  - **Filial (UF):** Select múltiplo com todas as UFs disponíveis
  - **Ano:** Select múltiplo (2022, 2023, 2024, 2025, etc.)
  - **Mês:** Select múltiplo (1-12, com nomes dos meses)
  - **Marca:** Select múltiplo com todas as marcas disponíveis
  - **Nome Fantasia (Associado):** Select múltiplo com busca/filtro
  - **Grupo:** Select múltiplo com todos os grupos disponíveis
  - **Subgrupo:** Select múltiplo com todos os subgrupos disponíveis
- **Comportamento dos Filtros:**
  - Filtros aplicados a todas as análises (compartilhados)
  - Se nenhum valor selecionado = retorna todos os dados
  - Múltiplos valores = filtro OR (ex: Marca A OU Marca B)
  - Combinação de filtros = filtro AND (ex: Marca A E Filial SC)
- **Exportação:** Botão para exportar cada tabela em CSV/Excel com filtros aplicados

#### Componentes Frontend:

```
frontend/src/components/vendas/analytics/
├── CrescimentoEmpresaTable.tsx      # Análise 1
├── CrescimentoFilialTable.tsx        # Análise 2
├── CrescimentoMarcaTable.tsx         # Análise 3
├── CrescimentoAssociadoTable.tsx     # Análise 4
├── AnalyticsFilters.tsx               # Filtros compartilhados (seleção múltipla)
├── EvolutionCell.tsx                  # Componente para célula com evolução
└── MultiSelect.tsx                    # Componente de select múltiplo reutilizável
```

#### Estrutura de Filtros (Interface TypeScript):

```typescript
interface AnalyticsFilters {
  tipoOperacao?: string[];      // Múltiplos tipos de operação
  filial?: string[];            // Múltiplas UFs
  ano?: number[];               // Múltiplos anos
  mes?: number[];               // Múltiplos meses (1-12)
  marca?: string[];             // Múltiplas marcas
  nomeFantasia?: string[];      // Múltiplos associados
  grupo?: string[];             // Múltiplos grupos
  subgrupo?: string[];          // Múltiplos subgrupos
}

// Exemplo de uso:
const filters: AnalyticsFilters = {
  tipoOperacao: ['Venda', 'Devolução'],
  filial: ['SC', 'PR', 'SP'],
  ano: [2023, 2024, 2025],
  mes: [1, 2, 3], // Janeiro, Fevereiro, Março
  marca: ['KSPG', 'RIOSULENSE'],
  grupo: ['ELETRÔNICOS'],
  subgrupo: ['COMPONENTES']
};
```

#### Cálculos de Evolução:

```typescript
// Fórmula de evolução ano a ano:
function calcularEvolucao(valorAtual: number, valorAnterior: number): number | null {
  if (!valorAnterior || valorAnterior === 0) return null;
  return ((valorAtual - valorAnterior) / valorAnterior) * 100;
}

// Exemplo:
// 2023: 1.000.000
// 2024: 1.100.000
// Evolução: ((1.100.000 - 1.000.000) / 1.000.000) * 100 = 10.0%
```

#### Estrutura de Dados e Queries SQL:

**Análise 1: Crescimento Empresa Mês a Mês**
```sql
-- Agregação mensal por ano com filtros múltiplos
-- Nota: Precisa fazer JOIN com Venda para filtrar por tipoOperacao
SELECT 
  va.ano,
  va.mes,
  SUM(va."totalValor") as total_venda
FROM "VendaAnalytics" va
INNER JOIN "Venda" v ON (
  EXTRACT(YEAR FROM v."dataVenda") = va.ano
  AND EXTRACT(MONTH FROM v."dataVenda") = va.mes
  AND v."nomeFantasia" = va."nomeFantasia"
  AND v."marca" = va."marca"
  AND v."ufDestino" = va.uf
)
WHERE 
  ($1::int[] IS NULL OR va.ano = ANY($1::int[]))
  AND ($2::int[] IS NULL OR va.mes = ANY($2::int[]))
  AND ($3::text[] IS NULL OR va.uf = ANY($3::text[]))
  AND ($4::text[] IS NULL OR va."marca" = ANY($4::text[]))
  AND ($5::text[] IS NULL OR va."nomeFantasia" = ANY($5::text[]))
  AND ($6::text[] IS NULL OR va."grupo" = ANY($6::text[]))
  AND ($7::text[] IS NULL OR va."subgrupo" = ANY($7::text[]))
  AND ($8::text[] IS NULL OR v."tipoOperacao" = ANY($8::text[]))
GROUP BY va.ano, va.mes
ORDER BY va.ano, va.mes;
```

**Análise 2: Crescimento por Filial**
```sql
-- Agregação por UF e ano com filtros múltiplos
SELECT 
  va.uf,
  va.ano,
  SUM(va."totalValor") as total_vendas
FROM "VendaAnalytics" va
INNER JOIN "Venda" v ON (
  EXTRACT(YEAR FROM v."dataVenda") = va.ano
  AND EXTRACT(MONTH FROM v."dataVenda") = va.mes
  AND v."nomeFantasia" = va."nomeFantasia"
  AND v."marca" = va."marca"
  AND v."ufDestino" = va.uf
)
WHERE 
  ($1::int[] IS NULL OR va.ano = ANY($1::int[]))
  AND ($2::int[] IS NULL OR va.mes = ANY($2::int[]))
  AND ($3::text[] IS NULL OR va.uf = ANY($3::text[]))
  AND ($4::text[] IS NULL OR va."marca" = ANY($4::text[]))
  AND ($5::text[] IS NULL OR va."nomeFantasia" = ANY($5::text[]))
  AND ($6::text[] IS NULL OR va."grupo" = ANY($6::text[]))
  AND ($7::text[] IS NULL OR va."subgrupo" = ANY($7::text[]))
  AND ($8::text[] IS NULL OR v."tipoOperacao" = ANY($8::text[]))
GROUP BY va.uf, va.ano
ORDER BY va.uf, va.ano;
```

**Análise 3: Crescimento por Marca**
```sql
-- Agregação por marca e ano com filtros múltiplos
SELECT 
  va."marca",
  va.ano,
  SUM(va."totalValor") as total_venda
FROM "VendaAnalytics" va
INNER JOIN "Venda" v ON (
  EXTRACT(YEAR FROM v."dataVenda") = va.ano
  AND EXTRACT(MONTH FROM v."dataVenda") = va.mes
  AND v."nomeFantasia" = va."nomeFantasia"
  AND v."marca" = va."marca"
  AND v."ufDestino" = va.uf
)
WHERE 
  ($1::int[] IS NULL OR va.ano = ANY($1::int[]))
  AND ($2::int[] IS NULL OR va.mes = ANY($2::int[]))
  AND ($3::text[] IS NULL OR va.uf = ANY($3::text[]))
  AND ($4::text[] IS NULL OR va."marca" = ANY($4::text[]))
  AND ($5::text[] IS NULL OR va."nomeFantasia" = ANY($5::text[]))
  AND ($6::text[] IS NULL OR va."grupo" = ANY($6::text[]))
  AND ($7::text[] IS NULL OR va."subgrupo" = ANY($7::text[]))
  AND ($8::text[] IS NULL OR v."tipoOperacao" = ANY($8::text[]))
GROUP BY va."marca", va.ano
ORDER BY va."marca", va.ano;
```

**Análise 4: Crescimento por Associado**
```sql
-- Agregação por nomeFantasia e ano com filtros múltiplos
SELECT 
  va."nomeFantasia",
  va.ano,
  SUM(va."totalValor") as total_venda
FROM "VendaAnalytics" va
INNER JOIN "Venda" v ON (
  EXTRACT(YEAR FROM v."dataVenda") = va.ano
  AND EXTRACT(MONTH FROM v."dataVenda") = va.mes
  AND v."nomeFantasia" = va."nomeFantasia"
  AND v."marca" = va."marca"
  AND v."ufDestino" = va.uf
)
WHERE 
  ($1::int[] IS NULL OR va.ano = ANY($1::int[]))
  AND ($2::int[] IS NULL OR va.mes = ANY($2::int[]))
  AND ($3::text[] IS NULL OR va.uf = ANY($3::text[]))
  AND ($4::text[] IS NULL OR va."marca" = ANY($4::text[]))
  AND ($5::text[] IS NULL OR va."nomeFantasia" = ANY($5::text[]))
  AND ($6::text[] IS NULL OR va."grupo" = ANY($6::text[]))
  AND ($7::text[] IS NULL OR va."subgrupo" = ANY($7::text[]))
  AND ($8::text[] IS NULL OR v."tipoOperacao" = ANY($8::text[]))
GROUP BY va."nomeFantasia", va.ano
ORDER BY va."nomeFantasia", va.ano
LIMIT $9 OFFSET $10;
```

**Nota Importante sobre Filtros:** 
- **Todos os filtros suportam seleção múltipla (arrays)**
- Para filtrar por `tipoOperacao`, é necessário fazer JOIN com a tabela `Venda`, pois `tipoOperacao` não está na tabela `VendaAnalytics`
- **Alternativa recomendada:** Adicionar `tipoOperacao` à tabela `VendaAnalytics` para melhor performance (denormalização similar a marca/grupo/subgrupo)
- **Lógica de filtros:**
  - Múltiplos valores no mesmo filtro = OR (ex: Marca A OU Marca B)
  - Filtros diferentes = AND (ex: Marca A E Filial SC E Ano 2024)
- Filtros múltiplos usam `= ANY(array)` no PostgreSQL
- Se nenhum valor selecionado em um filtro = retorna todos os valores daquele campo

**Exemplo de Filtros Aplicados:**
```
tipoOperacao: ['Venda', 'Devolução']  → Venda OU Devolução
filial: ['SC', 'PR']                   → SC OU PR
ano: [2023, 2024]                      → 2023 OU 2024
marca: ['KSPG']                        → Apenas KSPG

Resultado: (Venda OU Devolução) E (SC OU PR) E (2023 OU 2024) E (KSPG)
```

#### Estrutura de Resposta da API:

```typescript
// Exemplo de resposta para Análise 1 (Crescimento Empresa)
interface CrescimentoEmpresaResponse {
  meses: Array<{
    mes: number;
    nomeMes: string; // "Janeiro", "Fevereiro", etc.
    dados: {
      [ano: number]: {
        venda: number;
        evolucao?: number; // null se não houver ano anterior
      };
    };
  }>;
  totalGeral: {
    [ano: number]: {
      venda: number;
      evolucao?: number;
    };
  };
  anosDisponiveis: number[]; // [2022, 2023, 2024, 2025]
}

// Exemplo de resposta para Análise 2 (Crescimento por Filial)
interface CrescimentoFilialResponse {
  filiais: Array<{
    uf: string;
    dados: {
      [ano: number]: {
        vendas: number;
        evolucao?: number;
      };
    };
  }>;
  totalGeral: {
    [ano: number]: {
      vendas: number;
      evolucao?: number;
    };
  };
  anosDisponiveis: number[];
}
```

#### Performance:

- **Cache:** 5 minutos para dados agregados
- **Lazy Loading:** Carregar cada análise sob demanda (tabs)
- **Paginação:** Para análises com muitos registros (ex: associados)
- **Otimização:** Usar índices do banco (ano, mes, marca, uf, nomeFantasia)
- **Queries:** Usar raw SQL para melhor performance em agregações complexas
- **Processamento:** Calcular evoluções no backend para reduzir carga no frontend

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
- [ ] Implementar normalização de campos null para chave única
- [ ] Implementar verificação de duplicatas pré-importação
- [ ] Implementar UPSERT com chave composta
- [ ] Implementar feedback ao usuário sobre duplicatas
- [ ] Implementar denormalização de marca, grupo e subgrupo (obter da tabela `Produto` e armazenar em `Venda`)
- [ ] Implementar tratamento de erros:
  - [ ] Valores padrão quando produto não existir (`DESCONHECIDA`, `DESCONHECIDO`)
  - [ ] Valores padrão quando campos estiverem null
  - [ ] Não falhar importação se produto não existir
  - [ ] Logar avisos de produtos não encontrados
  - [ ] Registrar estatísticas de produtos não encontrados no log
- [ ] Implementar atualização de analytics (usando dados denormalizados)

### Backend - Analytics
- [ ] Criar `VendasAnalyticsService`
- [ ] Criar `VendasAnalyticsController`
- [ ] Implementar agregação
- [ ] Implementar endpoints de consulta

### Frontend - Estrutura
- [ ] Criar estrutura de pastas (`/admin/vendas`)
- [ ] Criar API client
- [ ] Criar hooks

### Frontend - Páginas
- [ ] Criar página principal (`/admin/vendas`)
- [ ] Criar página de importação
- [ ] Criar página de gerenciamento

### Frontend - Componentes
- [ ] Criar painel de importação
- [ ] Criar lista de vendas
- [ ] Criar card de estatísticas
- [ ] Criar tabela de logs
- [ ] **Criar página de Analytics** (`/admin/importacoes/vendas/analytics`)
- [ ] **Criar componente CrescimentoEmpresaTable**
- [ ] **Criar componente CrescimentoFilialTable**
- [ ] **Criar componente CrescimentoMarcaTable**
- [ ] **Criar componente CrescimentoAssociadoTable**
- [ ] **Criar componente AnalyticsFilters**
- [ ] **Criar componente EvolutionCell**

### Backend - Analytics (FASE 8)
- [ ] **Criar endpoint GET /vendas/analytics/crescimento-empresa**
- [ ] **Criar endpoint GET /vendas/analytics/crescimento-filial**
- [ ] **Criar endpoint GET /vendas/analytics/crescimento-marca**
- [ ] **Criar endpoint GET /vendas/analytics/crescimento-associado**
- [ ] **Implementar DTO para filtros múltiplos (arrays)**
- [ ] **Implementar métodos de agregação mensal com filtros**
- [ ] **Implementar métodos de agregação por filial com filtros**
- [ ] **Implementar métodos de agregação por marca com filtros**
- [ ] **Implementar métodos de agregação por associado com filtros**
- [ ] **Implementar JOIN com tabela Venda para filtrar por tipoOperacao**
- [ ] **Implementar lógica de filtros múltiplos (ANY array no PostgreSQL)**
- [ ] **Implementar cálculo de evolução ano a ano**
- [ ] **Otimizar queries com índices**
- [ ] **Considerar denormalizar tipoOperacao em VendaAnalytics para melhor performance**

### Frontend - Analytics (FASE 8)
- [ ] **Criar hooks para buscar dados de crescimento**
- [ ] **Implementar layout com tabs/seções**
- [ ] **Implementar formatação de números e percentuais**
- [ ] **Implementar destaque visual para valores negativos**
- [ ] **Implementar filtros com seleção múltipla:**
  - [ ] Tipo de Operação (multi-select)
  - [ ] Filial/UF (multi-select)
  - [ ] Ano (multi-select)
  - [ ] Mês (multi-select com nomes)
  - [ ] Marca (multi-select)
  - [ ] Nome Fantasia (multi-select com busca)
  - [ ] Grupo (multi-select)
  - [ ] Subgrupo (multi-select)
- [ ] **Implementar componente MultiSelect reutilizável**
- [ ] **Implementar lógica de filtros (AND entre campos, OR dentro de cada campo)**
- [ ] **Implementar exportação CSV/Excel com filtros aplicados**
- [ ] **Implementar paginação para associados**
- [ ] **Implementar busca/filtro por nome fantasia**
- [ ] **Implementar carregamento de opções dos filtros do backend**

### Testes
- [ ] Testar importação de planilha
- [ ] Testar validação
- [ ] Testar analytics
- [ ] Testar relacionamento com produtos
- [ ] Testar performance
- [ ] Testar erros
- [ ] **Testar cálculos de evolução**
- [ ] **Testar agregações por período**
- [ ] **Testar performance das análises**
- [ ] **Testar exportação de dados**

---

## 📊 ESTIMATIVA DE ESFORÇO

| Componente | Estimativa |
|------------|-----------|
| Backend (NestJS) | ~11 horas |
| Frontend (Next.js) | ~11 horas |
| Testes e Ajustes | ~3 horas |
| **FASE 8 - Analytics (Nova)** | **~8 horas** |
| **TOTAL** | **~33 horas** |

### Detalhamento FASE 8 - Analytics:
- Backend - Endpoints de agregação: ~3 horas
- Frontend - Componentes de tabela: ~3 horas
- Frontend - Layout e filtros: ~1 hora
- Testes e ajustes: ~1 hora

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

### 3. Prevenção de Duplicatas

**Estratégia de Chave Única Composta:**
- Chave única: `[nfe, idDoc, referencia]`
- Garante que não haverá duplicatas mesmo se:
  - O usuário carregar o mesmo arquivo duas vezes
  - O usuário carregar um arquivo antigo sem querer
  - Houver múltiplos produtos na mesma NFE (cada linha é única)

**Tratamento de Campos Null:**
- Se `idDoc` for null, será tratado como string vazia `''` na chave única
- Se `referencia` for null, será tratado como string vazia `''` na chave única
- Isso garante que a chave única sempre funcione mesmo com campos opcionais

**Implementação do UPSERT:**
- Usar `upsert` do Prisma com `uniqueFields: ['nfe', 'idDoc', 'referencia']`
- Se registro já existir (mesma chave), será atualizado ao invés de inserido
- Isso previne duplicatas e permite atualização de dados existentes

**Validação Adicional:**
- Antes de importar, verificar se já existem registros com a mesma chave
- Mostrar ao usuário quantos registros serão atualizados vs inseridos
- Opção de "modo seguro" que falha se detectar duplicatas potenciais

### 4. Performance

- Processar vendas em lotes (300 registros por vez - otimizado na Versão 2.2.0)
- Usar UPSERT para evitar duplicatas e permitir atualizações
- Atualizar analytics em tempo real (otimizado)
- **Denormalizar marca, grupo e subgrupo** na tabela `Venda` durante importação para melhor performance em relatórios
- Esses campos são capturados no momento da importação, preservando os valores históricos da venda
- **Tratamento de erros:** Se produto não existir ou campos estiverem null, usar valores padrão:
  - `marca`: `'DESCONHECIDA'`
  - `grupo`: `'DESCONHECIDO'`
  - `subgrupo`: `'DESCONHECIDO'`
- Isso evita JOINs complexos em relatórios frequentes e melhora significativamente a performance
- **Processamento assíncrono:** Importações grandes são processadas em background para evitar timeouts
- **Timeout:** Aumentado para 10 minutos (600.000ms) no frontend para acomodar importações grandes

### 5. Validação

- Validar campos obrigatórios: `NFE`, `DATA`, `RAZAO_SOCIAL`
- Validar formatos de data
- Validar valores numéricos
- Validar relacionamento com produtos (opcional)
- **Validar chave única antes de inserir** (detectar duplicatas potenciais)
- **Normalizar campos null** para string vazia na chave única
- **Tratamento de erros na denormalização:**
  - Se produto não existir: usar valores padrão (`DESCONHECIDA`, `DESCONHECIDO`)
  - Se campos `marca`, `grupo` ou `subgrupo` estiverem null: usar valores padrão
  - Não falhar a importação se produto não existir (apenas usar valores padrão)
  - Logar avisos para auditoria

### 6. Relacionamento com Produtos e Denormalização de Dados

#### Decisão: Denormalizar Marca, Grupo e Subgrupo na Tabela Venda

**Análise de Trade-offs:**

**Opção 1: JOIN sempre que necessário (Normalizado)**
- ✅ Dados sempre atualizados
- ✅ Sem redundância
- ❌ JOINs complexos em relatórios frequentes
- ❌ Performance pior com muitos registros
- ❌ Consultas mais lentas

**Opção 2: Denormalizar Marca, Grupo e Subgrupo (Escolhida)**
- ✅ **Performance muito melhor** em relatórios (sem JOINs)
- ✅ **Preserva valor histórico** (marca, grupo e subgrupo no momento da venda)
- ✅ Consultas mais simples e rápidas
- ✅ Menos carga no banco de dados
- ✅ Índices diretos em marca, grupo e subgrupo para filtros rápidos
- ⚠️ Redundância de dados (aceitável para este caso)
- ⚠️ Se valores do produto mudarem, valores históricos da venda são mantidos (comportamento desejado)

**Decisão:** Denormalizar marca, grupo e subgrupo na tabela `Venda` porque:
1. **Relatórios são frequentes** e precisam desses dados
2. **Volume de vendas pode ser grande** (JOINs seriam custosos)
3. **Esses valores mudam raramente** (baixo risco de inconsistência)
4. **Valor histórico é importante** (valores no momento da venda devem ser preservados)
5. **Performance é crítica** para experiência do usuário
6. **Filtros por grupo/subgrupo são comuns** em relatórios

#### Implementação:

- Tentar fazer match automático com produtos existentes
- Usar `referencia`, `idProd` ou `prodCodMestre` para relacionar
- `prodCodMestre` pode ser usado para relacionar com produtos mestres/variantes
- Manter relacionamento opcional (pode ser null)
- **Durante importação:**
  1. Buscar produtos correspondentes (por `referencia` ou `idProd`)
  2. Extrair marca, grupo e subgrupo de cada produto
  3. Armazenar dados denormalizados na tabela `Venda`
  4. **Tratamento de erros:**
     - Se produto não existir na tabela `Produto`: usar valores padrão
     - Se campo `marca` for null ou não existir: usar `'DESCONHECIDA'`
     - Se campo `grupo` for null ou não existir: usar `'DESCONHECIDO'`
     - Se campo `subgrupo` for null ou não existir: usar `'DESCONHECIDO'`
     - **Não falhar a importação** se produto não existir (apenas usar valores padrão)
     - Logar avisos quando produtos não forem encontrados (para auditoria)
     - Registrar estatísticas de produtos não encontrados no log de importação
- **Em relatórios:**
  - Usar marca, grupo e subgrupo diretamente da tabela `Venda` (sem JOIN necessário)
  - Performance muito melhor, especialmente com muitos registros
  - Filtros por grupo/subgrupo são muito mais rápidos com índices diretos

#### ⚠️ IMPORTANTE: Atualização de Dados Denormalizados

**Comportamento Atual:**
- Quando um produto é atualizado (ex: `grupo` mudou), as vendas relacionadas **NÃO são atualizadas automaticamente**
- Isso é **intencional** porque:
  - **Vendas são dados históricos** - representam o estado no momento da venda
  - **Preservação histórica** - o grupo no momento da venda deve ser mantido
  - **Integridade de relatórios** - atualizar vendas antigas distorceria análises históricas

**Exemplo:**
- Venda de 01/01/2024: produto tinha `grupo = "ELETRÔNICOS"`
- Em 15/01/2024: produto foi atualizado para `grupo = "INFORMÁTICA"`
- A venda de 01/01/2024 **continua** com `grupo = "ELETRÔNICOS"` (correto!)

**Estratégias de Atualização (Opcional):**

1. **Opção Manual de Recalcular (Recomendada):**
   - Endpoint: `POST /vendas/recalcular-dados-produto`
   - Permite ao usuário escolher quando atualizar
   - Pode filtrar por período (ex: apenas vendas dos últimos 30 dias)
   - Útil para correções de dados ou quando necessário

2. **Opção de Atualização Seletiva:**
   - Atualizar apenas vendas futuras (após a data de atualização do produto)
   - Manter histórico intacto
   - Configurável por empresa/usuário

3. **Opção de Flag "Atualizar Automaticamente":**
   - Configuração opcional no produto
   - Se habilitada, atualiza vendas relacionadas quando produto muda
   - **Não recomendado** para dados históricos

**Implementação Realizada:**
- ✅ Serviço `VendasUpdateService` criado
- ✅ Método `recalcularDadosProdutoEmVendas()` implementado
- ✅ Endpoint `POST /vendas/recalcular-dados-produto` disponível
- ✅ Suporta filtros: apenas vendas futuras, data limite, campos específicos
- ✅ Por padrão, **NÃO atualiza automaticamente** quando produto é atualizado

**Decisão Final:**
- ✅ **NÃO atualizar automaticamente** vendas quando produto é atualizado
- ✅ **Preservar dados históricos** - marca/grupo/subgrupo no momento da venda
- ✅ **Oferecer opção manual** de recalcular se necessário
- ✅ **Documentar comportamento** para usuários

#### Tratamento de Erros na Denormalização

**Cenários de Erro:**

1. **Produto não existe na tabela `Produto`:**
   - **Causa:** `referencia` ou `idProd` não encontrado na tabela `Produto`
   - **Ação:** Usar valores padrão:
     - `marca`: `'DESCONHECIDA'`
     - `grupo`: `'DESCONHECIDO'`
     - `subgrupo`: `'DESCONHECIDO'`
   - **Comportamento:** Não falhar a importação, apenas usar valores padrão
   - **Log:** Registrar aviso para auditoria

2. **Campo `marca` é null na tabela `Produto`:**
   - **Causa:** Produto existe mas campo `marca` está null
   - **Ação:** Usar `'DESCONHECIDA'` como padrão
   - **Comportamento:** Continuar importação normalmente

3. **Campo `grupo` é null na tabela `Produto`:**
   - **Causa:** Produto existe mas campo `grupo` está null
   - **Ação:** Usar `'DESCONHECIDO'` como padrão
   - **Comportamento:** Continuar importação normalmente

4. **Campo `subgrupo` é null na tabela `Produto`:**
   - **Causa:** Produto existe mas campo `subgrupo` está null
   - **Ação:** Usar `'DESCONHECIDO'` como padrão
   - **Comportamento:** Continuar importação normalmente

**Implementação do Tratamento de Erros:**

```typescript
async function denormalizarDadosProduto(vendas: VendaInput[]): Promise<{
  vendasComDados: VendaComDadosProduto[];
  produtosNaoEncontrados: number;
  produtosComCamposNull: number;
}> {
  const referencias = vendas.map(v => v.referencia).filter(Boolean);
  const idProds = vendas.map(v => v.idProd).filter(Boolean);

  // Buscar produtos
  const produtos = await prisma.produto.findMany({
    where: {
      OR: [
        { referencia: { in: referencias } },
        { id_prod: { in: idProds } },
      ],
    },
    select: {
      referencia: true,
      id_prod: true,
      marca: true,
      grupo: true,
      subgrupo: true,
    },
  });

  // Criar mapas
  const marcaMap = new Map<string, string>();
  const grupoMap = new Map<string, string>();
  const subgrupoMap = new Map<string, string>();

  produtos.forEach(p => {
    const keyRef = p.referencia || '';
    const keyId = p.id_prod || '';
    
    if (keyRef) {
      marcaMap.set(keyRef, p.marca || 'DESCONHECIDA');
      grupoMap.set(keyRef, p.grupo || 'DESCONHECIDO');
      subgrupoMap.set(keyRef, p.subgrupo || 'DESCONHECIDO');
    }
    if (keyId) {
      marcaMap.set(keyId, p.marca || 'DESCONHECIDA');
      grupoMap.set(keyId, p.grupo || 'DESCONHECIDO');
      subgrupoMap.set(keyId, p.subgrupo || 'DESCONHECIDO');
    }
  });

  // Processar vendas com tratamento de erros
  let produtosNaoEncontrados = 0;
  let produtosComCamposNull = 0;

  const vendasComDados = vendas.map(venda => {
    const referencia = venda.referencia || '';
    const idProd = venda.idProd || '';
    
    // Tentar obter dados
    const marca = marcaMap.get(referencia) || marcaMap.get(idProd) || 'DESCONHECIDA';
    const grupo = grupoMap.get(referencia) || grupoMap.get(idProd) || 'DESCONHECIDO';
    const subgrupo = subgrupoMap.get(referencia) || subgrupoMap.get(idProd) || 'DESCONHECIDO';
    
    // Detectar erros
    const produtoNaoEncontrado = !marcaMap.has(referencia) && !marcaMap.has(idProd) && (referencia || idProd);
    if (produtoNaoEncontrado) {
      produtosNaoEncontrados++;
      console.warn(`⚠️ Produto não encontrado: referencia="${referencia}", idProd="${idProd}"`);
    }
    
    // Verificar se campos eram null no produto (se produto foi encontrado)
    if (!produtoNaoEncontrado && (marca === 'DESCONHECIDA' || grupo === 'DESCONHECIDO' || subgrupo === 'DESCONHECIDO')) {
      produtosComCamposNull++;
    }
    
    return {
      ...venda,
      marca,
      grupo,
      subgrupo,
    };
  });

  return {
    vendasComDados,
    produtosNaoEncontrados,
    produtosComCamposNull,
  };
}
```

**Estatísticas no Log de Importação:**

```typescript
const resultado = await denormalizarDadosProduto(vendas);

// Registrar no log de importação
await prisma.vendaImportacaoLog.create({
  data: {
    nomeArquivo: fileName,
    totalLinhas: vendas.length,
    sucessoCount: resultado.vendasComDados.length,
    produtosNaoEncontrados: resultado.produtosNaoEncontrados,
    // ... outros campos
  },
});
```

**Feedback ao Usuário:**

```
📊 Importação Concluída

✅ Vendas importadas: 1.234
⚠️ Produtos não encontrados: 12 (usando valores padrão)
⚠️ Produtos com campos null: 5 (usando valores padrão)

Os produtos não encontrados foram importados com:
- Marca: DESCONHECIDA
- Grupo: DESCONHECIDO
- Subgrupo: DESCONHECIDO

Você pode atualizar esses produtos posteriormente.
```

---

## 🔒 ESTRATÉGIA DE PREVENÇÃO DE DUPLICATAS

### Problema Identificado

Usuários podem:
- Carregar o mesmo arquivo duas vezes (acidentalmente)
- Carregar um arquivo antigo sem querer
- Ter múltiplos produtos na mesma NFE (cada linha precisa ser única)

### Solução Implementada

#### 1. Chave Única Composta

```prisma
@@unique([nfe, idDoc, referencia])
```

**Por que esta chave?**
- `nfe`: Identifica a nota fiscal (obrigatório)
- `idDoc`: Identifica o documento específico (pode ser null)
- `referencia`: Identifica o produto específico (pode ser null)

**Tratamento de Null:**
- Campos null são normalizados para string vazia `''` antes de criar a chave
- Isso garante que a chave única sempre funcione mesmo com campos opcionais

#### 2. Implementação do UPSERT

```typescript
// Exemplo de implementação
const vendasParaUpsert = vendas.map(venda => ({
  ...venda,
  idDoc: venda.idDoc || '', // Normalizar null para string vazia
  referencia: venda.referencia || '', // Normalizar null para string vazia
}));

await prisma.venda.upsert({
  where: {
    nfe_idDoc_referencia: {
      nfe: venda.nfe,
      idDoc: venda.idDoc || '',
      referencia: venda.referencia || '',
    },
  },
  update: {
    // Atualizar campos se registro já existir
    quantidade: venda.quantidade,
    valorTotal: venda.valorTotal,
    updatedAt: new Date(),
  },
  create: venda,
});
```

#### 3. Validação Pré-Importação

Antes de importar, verificar duplicatas potenciais:

```typescript
async function verificarDuplicatas(vendas: VendaInput[]): Promise<{
  duplicatas: number;
  novos: number;
  detalhes: Array<{ nfe: string; idDoc: string; referencia: string; status: 'novo' | 'duplicado' }>;
}> {
  const chaves = vendas.map(v => ({
    nfe: v.nfe,
    idDoc: v.idDoc || '',
    referencia: v.referencia || '',
  }));

  const existentes = await prisma.venda.findMany({
    where: {
      OR: chaves.map(chave => ({
        nfe: chave.nfe,
        idDoc: chave.idDoc,
        referencia: chave.referencia,
      })),
    },
    select: {
      nfe: true,
      idDoc: true,
      referencia: true,
    },
  });

  const chavesExistentes = new Set(
    existentes.map(e => `${e.nfe}|${e.idDoc || ''}|${e.referencia || ''}`)
  );

  const detalhes = chaves.map(chave => ({
    ...chave,
    status: chavesExistentes.has(`${chave.nfe}|${chave.idDoc}|${chave.referencia}`)
      ? 'duplicado'
      : 'novo',
  }));

  return {
    duplicatas: detalhes.filter(d => d.status === 'duplicado').length,
    novos: detalhes.filter(d => d.status === 'novo').length,
    detalhes,
  };
}
```

#### 4. Feedback ao Usuário

Mostrar ao usuário antes de confirmar a importação:

```
📊 Análise de Duplicatas

✅ Novos registros: 1.234
⚠️ Registros que serão atualizados: 56
📁 Total de linhas no arquivo: 1.290

Os registros duplicados serão atualizados com os novos dados.
Deseja continuar?
```

#### 5. Modo Seguro (Opcional)

Permitir que o usuário escolha um "modo seguro" que:
- Falha a importação se detectar duplicatas
- Mostra quais registros são duplicados
- Permite ao usuário decidir se quer continuar ou não

---

### Exemplos de Cenários

#### Cenário 1: Mesmo arquivo carregado duas vezes
- **Resultado:** Todos os registros serão atualizados (UPSERT)
- **Comportamento:** Não cria duplicatas, apenas atualiza dados existentes

#### Cenário 2: Arquivo antigo carregado
- **Resultado:** Registros antigos serão atualizados com dados novos
- **Comportamento:** Se os dados mudaram, serão atualizados; se não, permanecem iguais

#### Cenário 3: NFE com múltiplos produtos
- **Resultado:** Cada linha (produto) é tratada como registro único
- **Comportamento:** `nfe + idDoc + referencia` garante unicidade por linha

#### Cenário 4: Campos null na chave única
- **Resultado:** Null é normalizado para string vazia `''`
- **Comportamento:** Chave única funciona mesmo com campos opcionais

---

## 🔒 ESTRATÉGIA DE PREVENÇÃO DE DUPLICATAS

### Problema Identificado

Usuários podem:
- Carregar o mesmo arquivo duas vezes (acidentalmente)
- Carregar um arquivo antigo sem querer
- Ter múltiplos produtos na mesma NFE (cada linha precisa ser única)

### Solução Implementada

#### 1. Chave Única Composta

```prisma
@@unique([nfe, idDoc, referencia])
```

**Por que esta chave?**
- `nfe`: Identifica a nota fiscal (obrigatório)
- `idDoc`: Identifica o documento específico (pode ser null)
- `referencia`: Identifica o produto específico (pode ser null)

**Tratamento de Null:**
- Campos null são normalizados para string vazia `''` antes de criar a chave
- Isso garante que a chave única sempre funcione mesmo com campos opcionais

#### 2. Implementação do UPSERT

```typescript
// Exemplo de implementação
const vendasParaUpsert = vendas.map(venda => ({
  ...venda,
  idDoc: venda.idDoc || '', // Normalizar null para string vazia
  referencia: venda.referencia || '', // Normalizar null para string vazia
}));

// Usar createMany com skipDuplicates OU upsert individual
await prisma.venda.createMany({
  data: vendasParaUpsert,
  skipDuplicates: true, // Ignora duplicatas silenciosamente
});

// OU usar upsert para atualizar registros existentes
for (const venda of vendasParaUpsert) {
  await prisma.venda.upsert({
    where: {
      nfe_idDoc_referencia: {
        nfe: venda.nfe,
        idDoc: venda.idDoc || '',
        referencia: venda.referencia || '',
      },
    },
    update: {
      // Atualizar campos se registro já existir
      quantidade: venda.quantidade,
      valorTotal: venda.valorTotal,
      updatedAt: new Date(),
    },
    create: venda,
  });
}
```

#### 3. Validação Pré-Importação

Antes de importar, verificar duplicatas potenciais:

```typescript
async function verificarDuplicatas(vendas: VendaInput[]): Promise<{
  duplicatas: number;
  novos: number;
  detalhes: Array<{ nfe: string; idDoc: string; referencia: string; status: 'novo' | 'duplicado' }>;
}> {
  const chaves = vendas.map(v => ({
    nfe: v.nfe,
    idDoc: v.idDoc || '',
    referencia: v.referencia || '',
  }));

  const existentes = await prisma.venda.findMany({
    where: {
      OR: chaves.map(chave => ({
        nfe: chave.nfe,
        idDoc: chave.idDoc,
        referencia: chave.referencia,
      })),
    },
    select: {
      nfe: true,
      idDoc: true,
      referencia: true,
    },
  });

  const chavesExistentes = new Set(
    existentes.map(e => `${e.nfe}|${e.idDoc || ''}|${e.referencia || ''}`)
  );

  const detalhes = chaves.map(chave => ({
    ...chave,
    status: chavesExistentes.has(`${chave.nfe}|${chave.idDoc}|${chave.referencia}`)
      ? 'duplicado'
      : 'novo',
  }));

  return {
    duplicatas: detalhes.filter(d => d.status === 'duplicado').length,
    novos: detalhes.filter(d => d.status === 'novo').length,
    detalhes,
  };
}
```

#### 4. Feedback ao Usuário

Mostrar ao usuário antes de confirmar a importação:

```
📊 Análise de Duplicatas

✅ Novos registros: 1.234
⚠️ Registros que serão atualizados: 56
📁 Total de linhas no arquivo: 1.290

Os registros duplicados serão atualizados com os novos dados.
Deseja continuar?
```

#### 5. Modo Seguro (Opcional)

Permitir que o usuário escolha um "modo seguro" que:
- Falha a importação se detectar duplicatas
- Mostra quais registros são duplicados
- Permite ao usuário decidir se quer continuar ou não

---

### Exemplos de Cenários

#### Cenário 1: Mesmo arquivo carregado duas vezes
- **Resultado:** Todos os registros serão atualizados (UPSERT)
- **Comportamento:** Não cria duplicatas, apenas atualiza dados existentes

#### Cenário 2: Arquivo antigo carregado
- **Resultado:** Registros antigos serão atualizados com dados novos
- **Comportamento:** Se os dados mudaram, serão atualizados; se não, permanecem iguais

#### Cenário 3: NFE com múltiplos produtos
- **Resultado:** Cada linha (produto) é tratada como registro único
- **Comportamento:** `nfe + idDoc + referencia` garante unicidade por linha

#### Cenário 4: Campos null na chave única
- **Resultado:** Null é normalizado para string vazia `''`
- **Comportamento:** Chave única funciona mesmo com campos opcionais

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

---

## 🔄 ATUALIZAÇÕES E MELHORIAS IMPLEMENTADAS

### ✅ Versão 2.0.0 - Melhorias de Analytics e Sincronização (2025-12-09)

#### 1. Constraint Único Atualizado
- **Antes:** `@@unique([ano, mes, nomeFantasia, marca, uf])`
- **Depois:** `@@unique([ano, mes, nomeFantasia, marca, grupo, subgrupo, uf])`
- **Motivo:** Evitar cálculos incorretos quando há múltiplos grupos/subgrupos da mesma marca
- **Migration:** `20251209010000_fix_venda_analytics_constraint_final`

#### 2. Upsert Atômico com SQL ON CONFLICT
- **Implementação:** Uso de SQL raw com `ON CONFLICT` para evitar race conditions
- **Benefício:** Operação atômica, mais eficiente que `findFirst` + `update/create`
- **Tratamento:** Detecta e consolida registros antigos durante migração

#### 3. Recálculo Automático de Analytics
- **Quando vendas são alteradas:** Analytics é recalculado automaticamente para o período afetado
- **Quando produtos são atualizados:** Vendas relacionadas são atualizadas e analytics é recalculado
- **Serviços envolvidos:**
  - `VendasService.update()` - Recalcula analytics após atualizar venda
  - `VendasService.remove()` - Recalcula analytics após remover venda
  - `VendasUpdateService.onProdutoUpdated()` - Atualiza vendas e analytics quando produto muda

#### 4. Serviço de Sincronização
- **VendasAnalyticsSyncService:** Valida e corrige sincronização entre `Venda` e `VendaAnalytics`
- **Endpoints:**
  - `GET /vendas/analytics/validar-sincronizacao` - Valida se dados estão sincronizados
  - `POST /vendas/analytics/corrigir-sincronizacao` - Corrige dados dessincronizados

#### 5. Campos Adicionais no Log de Importação
- `duplicatasCount`: Quantidade de registros que já existiam (atualizados)
- `novosCount`: Quantidade de registros novos (inseridos)
- `produtosNaoEncontrados`: Quantidade de produtos não encontrados

#### 6. Mapeamento Manual Obrigatório
- **Removido:** Mapeamento automático de colunas
- **Implementado:** Apenas mapeamento manual do frontend
- **Validação:** Campos obrigatórios devem estar mapeados antes de importar

#### 7. Integração com Sincronização de Produtos
- **SyncProcessorService:** Detecta mudanças em `grupo`, `subgrupo` ou `marca` de produtos
- **Ação automática:** Chama `VendasUpdateService.onProdutoUpdated()` para atualizar vendas e analytics

---

### ✅ Versão 2.1.0 - Melhorias de UX nos Filtros (2025-12-09)

#### 1. Filtros Convertidos para Select
- **Campos afetados:** Marca, Grupo, Subgrupo, Tipo de Operação
- **Antes:** Campos de texto (Input) com busca manual
- **Depois:** Selects com opções carregadas do banco de dados
- **Benefícios:**
  - Melhor UX: usuário seleciona ao invés de digitar
  - Reduz erros de digitação
  - Mostra apenas valores que existem no banco
  - Ordenação alfabética das opções

#### 2. Novos Endpoints para Valores Únicos
- **GET /vendas/tipos-operacao** - Retorna tipos de operação únicos
- **GET /vendas/marcas** - Retorna marcas únicas
- **GET /vendas/grupos** - Retorna grupos únicos
- **GET /vendas/subgrupos** - Retorna subgrupos únicos
- **Implementação:** Queries otimizadas com raw SQL (`SELECT DISTINCT`)
- **Performance:** Cache de 5 minutos no frontend

#### 3. Filtro Padrão "Venda"
- **Página:** `/admin/importacoes/vendas/gerenciar`
- **Comportamento:** Inicia sempre com filtro "Tipo de Operação = Venda" ativo
- **Motivo:** Facilita visualização das vendas mais comuns

#### 4. Melhorias na Página de Gerenciamento
- **Removido:** Debounce desnecessário para campos Select
- **Adicionado:** Opção "Todos/Todas" em cada select para limpar filtro
- **Melhorado:** Interface mais intuitiva e fácil de usar

#### 5. Estrutura de Hooks Frontend
- **Novos hooks:**
  - `useTiposOperacao()` - Carrega tipos de operação
  - `useMarcas()` - Carrega marcas
  - `useGrupos()` - Carrega grupos
  - `useSubgrupos()` - Carrega subgrupos
- **Cache:** 5 minutos para reduzir requisições ao backend

---

### ⏳ Versão 2.2.0 - Página de Analytics com Análises de Crescimento (Planejado)

#### 1. Análise 1: Crescimento Empresa Mês a Mês e Ano a Ano
- **Estrutura:** Tabela compacta mostrando vendas mensais e evolução ano a ano
- **Dados:** Agregação mensal de `VendaAnalytics` agrupada por ano e mês
- **Cálculo:** Comparação mês/ano atual vs mesmo mês/ano anterior
- **Visualização:** Tabela com scroll horizontal, valores negativos em vermelho

#### 2. Análise 2: Crescimento por Filial (UF) Ano a Ano
- **Estrutura:** Tabela com filiais (UFs) e vendas por ano
- **Dados:** Agregação de `VendaAnalytics` agrupada por `uf` e `ano`
- **Cálculo:** Comparação filial/ano atual vs mesmo filial/ano anterior
- **Visualização:** Tabela compacta, destaque para filiais com maior/menor crescimento

#### 3. Análise 3: Crescimento por Marca Ano a Ano
- **Estrutura:** Tabela com marcas e vendas por ano
- **Dados:** Agregação de `VendaAnalytics` agrupada por `marca` e `ano`
- **Cálculo:** Comparação marca/ano atual vs mesma marca/ano anterior
- **Visualização:** Tabela compacta, ordenação por maior crescimento

#### 4. Análise 4: Crescimento por Associado (nomeFantasia) Ano a Ano
- **Estrutura:** Tabela com associados e vendas por ano
- **Dados:** Agregação de `VendaAnalytics` agrupada por `nomeFantasia` e `ano`
- **Cálculo:** Comparação associado/ano atual vs mesmo associado/ano anterior
- **Visualização:** Tabela com paginação, busca por nome fantasia

#### 5. Endpoints Backend
- `GET /vendas/analytics/crescimento-empresa` - Dados mensais e anuais
- `GET /vendas/analytics/crescimento-filial` - Dados por filial/UF
- `GET /vendas/analytics/crescimento-marca` - Dados por marca
- `GET /vendas/analytics/crescimento-associado` - Dados por associado

#### 6. Componentes Frontend
- Componentes de tabela para cada análise
- Filtros compartilhados (período, ano)
- Exportação para CSV/Excel
- Layout responsivo e compacto

#### 7. Filtros com Seleção Múltipla
- **Todos os filtros suportam múltiplos valores:**
  - Tipo de Operação (array)
  - Filial/UF (array)
  - Ano (array)
  - Mês (array)
  - Marca (array)
  - Nome Fantasia/Associado (array)
  - Grupo (array)
  - Subgrupo (array)
- **Lógica:** OR dentro do mesmo filtro, AND entre filtros diferentes
- **Componente:** MultiSelect reutilizável com busca e seleção múltipla

#### 8. Melhorias de Performance
- Cache de 5 minutos para dados agregados
- Lazy loading por tab/análise
- Queries otimizadas com índices do banco
- Paginação para grandes volumes de dados
- **Consideração:** Denormalizar `tipoOperacao` em `VendaAnalytics` para evitar JOINs

---

### ✅ Versão 2.2.0 - Sistema de Progresso e Processamento Assíncrono (2025-12-10)

#### 1. Processamento Assíncrono em Background
- **Implementação:** Importação agora retorna `logId` imediatamente e processa vendas em background
- **Benefício:** Evita timeouts em importações grandes (10+ minutos)
- **Método:** `processarVendasEmBackground()` executa de forma assíncrona após criar o log
- **Timeout:** Aumentado para 10 minutos (600.000ms) no frontend

#### 2. Sistema de Progresso em Tempo Real
- **Campos adicionados em `VendaImportacaoLog`:**
  - `progresso`: Int (0-100) - Percentual de conclusão
  - `linhasProcessadas`: Int - Quantidade de linhas já processadas
- **Atualização:** Progresso atualizado a cada lote de 300 linhas
- **Endpoint:** `GET /vendas/import-logs/:id/progresso` - Retorna progresso atual
- **Polling:** Frontend consulta a cada 2 segundos até 100% ou conclusão

#### 3. Barra de Progresso Visual
- **Componente:** `frontend/src/components/vendas/import-progress-bar.tsx`
- **Funcionalidades:**
  - Exibe percentual de progresso
  - Mostra linhas processadas / total
  - Exibe contadores de sucesso e erros
  - Estados visuais: processando, concluído, erro
- **Integração:** Aparece automaticamente na página de importação quando há importação ativa

#### 4. Processamento em Lotes Otimizado
- **Tamanho do lote:** Reduzido de 400 para 300 linhas
- **Motivo:** Melhor performance e menor risco de travamentos
- **Atualização de progresso:** Após cada lote processado

#### 5. Sistema de Deleção de Importações
- **Endpoint:** `DELETE /vendas/import-logs/:id`
- **Funcionalidades:**
  - Deleta todas as vendas associadas à importação
  - Recalcula analytics apenas para períodos afetados
  - Valida permissões (apenas criador pode deletar)
  - Transação atômica (tudo ou nada)
- **Frontend:** Botão de deletar na tabela de histórico com dialog de confirmação
- **Documentação completa:** Ver `PLANO-DELECAO-IMPORTACAO.md`

#### 6. Campo `importacaoLogId` em Venda
- **Migration:** `20251210000000_add_importacao_log_id_to_venda`
- **Funcionalidade:** Rastreabilidade completa de vendas por importação
- **Benefício:** Permite deleção precisa e auditoria
- **Índice:** Criado para performance em buscas

#### 7. Integração com BRAVO-ERP - Produtos Inativos
- **Alteração:** Sistema BRAVO-ERP agora importa produtos inativos por padrão
- **Arquivo:** `backend/src/bravo-erp/sync/sync.service.ts`
- **Mudança:** `apenas_ativos = false` (era `true`)
- **Motivo:** Permitir importação de vendas de produtos que não estão mais ativos
- **Comportamento:** Produtos inativos são importados normalmente, facilitando rastreamento de vendas históricas

#### 8. Melhorias de UX na Importação
- **Feedback imediato:** Usuário recebe `logId` imediatamente após iniciar importação
- **Progresso visual:** Barra de progresso mostra status em tempo real
- **Mensagens claras:** "Importação iniciada. Processando em background..."
- **Auto-limpeza:** Barra de progresso desaparece após conclusão (com delay)

#### 9. Estrutura de Dados de Progresso
```typescript
interface VendaImportProgress {
  progresso: number;           // 0-100
  linhasProcessadas: number;
  totalLinhas: number;
  sucessoCount: number;
  erroCount: number;
  concluido: boolean;
}
```

#### 10. Hooks Frontend Adicionados
- `useImportLogProgress(logId)` - Hook para buscar progresso com polling automático
- `useDeleteImportLog()` - Hook para deletar importação
- **Polling:** Configurado para refetch a cada 2 segundos até conclusão

#### 11. Arquivos Criados/Modificados
- **Backend:**
  - `backend/src/vendas/import/vendas-import.service.ts` - Processamento assíncrono
  - `backend/src/vendas/import/vendas-import-delete.service.ts` - Deleção de importações
  - `backend/src/vendas/vendas.controller.ts` - Endpoints de progresso e deleção
  - `backend/src/vendas/vendas.service.ts` - Método `getImportLogProgress()`
  - `backend/prisma/migrations/20251210000000_add_importacao_log_id_to_venda/` - Migration
  - `backend/prisma/migrations/20251210200000_add_progresso_to_import_log/` - Migration
- **Frontend:**
  - `frontend/src/components/vendas/import-progress-bar.tsx` - Componente de progresso
  - `frontend/src/services/vendas.service.ts` - Métodos de API
  - `frontend/src/hooks/use-vendas.ts` - Hooks de progresso e deleção
  - `frontend/src/app/(app)/admin/importacoes/vendas/importar/page.tsx` - Integração
  - `frontend/src/components/imports/import-history-table.tsx` - Botão de deletar

---

---

### ✅ Versão 2.3.0 - Persistência de Mapeamentos e Filtros Salvos (2025-12-12)

#### 1. Persistência de Mapeamentos de Colunas no Banco de Dados
- **Antes:** Mapeamentos salvos apenas em `localStorage` (volátil, não seguro)
- **Depois:** Mapeamentos salvos no banco de dados PostgreSQL
- **Modelo:** `VendaColumnMapping` com relacionamento com `Usuario`
- **Funcionalidades:**
  - Salvar mapeamentos com nome personalizado
  - Carregar mapeamentos salvos
  - Editar mapeamentos existentes
  - Deletar mapeamentos
  - Compartilhamento entre usuários (opcional via `usuarioId`)
- **Campos:**
  - `id`: Identificador único
  - `nome`: Nome do mapeamento
  - `columnMapping`: JSONB com mapeamento de colunas
  - `filters`: JSONB opcional com filtros de exclusão
  - `descricao`: Descrição opcional
  - `usuarioId`: Relacionamento com usuário (opcional)
- **Migration:** `20251211000000_add_venda_column_mapping`
- **Endpoints Backend:**
  - `GET /vendas/column-mappings` - Lista todos os mapeamentos
  - `GET /vendas/column-mappings/:id` - Busca mapeamento específico
  - `POST /vendas/column-mappings` - Cria novo mapeamento
  - `PUT /vendas/column-mappings/:id` - Atualiza mapeamento
  - `DELETE /vendas/column-mappings/:id` - Deleta mapeamento
- **Integração Frontend:**
  - Componente `ImportStepper` atualizado com props opcionais para banco de dados
  - Suporte a `useDatabaseMappings`, `onLoadMappings`, `onSaveMapping`, `onDeleteMapping`
  - Compatibilidade mantida com `localStorage` para outros tipos de importação

#### 2. Sistema de Filtros Salvos de Analytics
- **Modelo:** `VendaAnalyticsFilter` com relacionamento com `Usuario`
- **Funcionalidades:**
  - Salvar configurações de filtros de analytics com nome personalizado
  - Carregar filtros salvos
  - Editar filtros existentes (atualizar configuração)
  - Deletar filtros salvos
- **Campos:**
  - `id`: Identificador único
  - `nome`: Nome do filtro
  - `filters`: JSONB com configuração de filtros (tipoOperacao, filial, ano, mes, marca, nomeFantasia, grupo, subgrupo)
  - `descricao`: Descrição opcional
  - `usuarioId`: Relacionamento com usuário (opcional)
- **Migration:** `20251212000000_add_venda_analytics_filter`
- **Endpoints Backend:**
  - `GET /vendas/analytics-filters` - Lista todos os filtros salvos
  - `GET /vendas/analytics-filters/:id` - Busca filtro específico
  - `POST /vendas/analytics-filters` - Cria novo filtro
  - `PUT /vendas/analytics-filters/:id` - Atualiza filtro
  - `DELETE /vendas/analytics-filters/:id` - Deleta filtro
- **Interface Frontend:**
  - Dropdown para carregar filtros salvos
  - Botão "Salvar Filtro" com diálogo para nomear
  - Botão "Atualizar Filtro" quando um filtro está carregado
  - Botão "Deletar Filtro" com confirmação
  - Feedback visual com toasts para todas as operações

#### 3. Melhorias na Interface de Analytics
- **Redução de Padding:**
  - Container principal: `py-6 space-y-6` → `py-4 space-y-4`
  - Tabs content: `space-y-4` → `space-y-2`
  - Card headers: Adicionado `pb-3`, reduzido `CardTitle` para `text-lg`, `CardDescription` para `text-sm`
  - Card content: Adicionado `pt-3`
  - Tabelas: Linhas com `h-9`, células com `py-2`
- **Ordenação Automática:**
  - Todas as tabelas de analytics ordenadas do maior para o menor valor
  - Algoritmo de ordenação:
    - Soma valores de todos os anos disponíveis
    - Desempate: usa valor do ano mais recente
    - Aplicado em: CrescimentoEmpresaTable, CrescimentoFilialTable, CrescimentoMarcaTable, CrescimentoAssociadoTable
- **Visualização:**
  - Tabelas mais compactas e fáceis de ler
  - Melhor aproveitamento do espaço vertical
  - Dados sempre ordenados por relevância (maior valor primeiro)

#### 4. Validação de Campos Vazios Antes da Revisão
- **Funcionalidade:** Validação automática de campos obrigatórios vazios antes de avançar para revisão
- **Momento:** Ao clicar em "Revisar" no Passo 2 (Mapeamento)
- **Validação:**
  - Verifica dados originais do Excel (antes da conversão)
  - Detecta campos obrigatórios vazios: `null`, `undefined`, string vazia, apenas espaços, ou `NaN` para números
  - Mostra alerta visual no Passo 2 com detalhes das linhas problemáticas
  - Diálogo de confirmação antes de prosseguir
- **Informações Exibidas:**
  - Quantidade de linhas com problemas
  - Detalhes por linha: número da linha do Excel, campos vazios, coluna do Excel
  - Opção de voltar e corrigir ou prosseguir mesmo assim
- **Performance:**
  - Validação calculada com `useMemo` (recalcula apenas quando necessário)
  - Verifica dados originais do Excel (mais eficiente)
  - Não bloqueia a interface durante validação

#### 5. Campos Obrigatórios Atualizados
- **Campos Obrigatórios (13 campos):**
  1. Nota Fiscal Eletrônica (NFE)
  2. ID do Documento
  3. Data da Venda
  4. Razão Social (Cliente)
  5. Nome Fantasia (Cliente)
  6. UF de Destino
  7. UF de Origem
  8. ID do Produto
  9. Referência do Produto
  10. Tipo de Operação
  11. Quantidade
  12. Valor Unitário
  13. Valor Total
- **Validação:**
  - Campos obrigatórios devem estar mapeados
  - Campos obrigatórios não podem estar vazios no Excel
  - Validação ocorre antes da revisão e antes da importação
- **Campos Opcionais (não validados):**
  - CNPJ do Cliente
  - Código Mestre do Produto
  - Descrição do Produto
  - Marca do Produto
  - Grupo do Produto
  - Subgrupo do Produto

#### 6. Arquivos Criados/Modificados
- **Backend:**
  - `backend/src/vendas/vendas-column-mapping.service.ts` - Serviço de mapeamentos
  - `backend/src/vendas/vendas-analytics-filter.service.ts` - Serviço de filtros salvos
  - `backend/src/vendas/dto/create-venda-column-mapping.dto.ts` - DTO de mapeamento
  - `backend/src/vendas/dto/create-venda-analytics-filter.dto.ts` - DTO de filtro
  - `backend/src/vendas/vendas.controller.ts` - Endpoints de mapeamentos e filtros
  - `backend/prisma/migrations/20251211000000_add_venda_column_mapping/` - Migration
  - `backend/prisma/migrations/20251212000000_add_venda_analytics_filter/` - Migration
  - `backend/prisma/schema.prisma` - Modelos `VendaColumnMapping` e `VendaAnalyticsFilter`
- **Frontend:**
  - `frontend/src/components/imports/import-stepper.tsx` - Validação de campos vazios
  - `frontend/src/app/(app)/admin/importacoes/vendas/analytics/page.tsx` - Filtros salvos e melhorias de UI
  - `frontend/src/app/(app)/admin/importacoes/vendas/importar/page.tsx` - Integração com mapeamentos do banco
  - `frontend/src/components/vendas/analytics/CrescimentoEmpresaTable.tsx` - Padding e ordenação
  - `frontend/src/components/vendas/analytics/CrescimentoFilialTable.tsx` - Padding e ordenação
  - `frontend/src/components/vendas/analytics/CrescimentoMarcaTable.tsx` - Padding e ordenação
  - `frontend/src/components/vendas/analytics/CrescimentoAssociadoTable.tsx` - Padding e ordenação
  - `frontend/src/services/vendas.service.ts` - Métodos de API para mapeamentos e filtros
  - `frontend/src/hooks/use-vendas.ts` - Hooks React Query para mapeamentos e filtros

---

## 📊 RESUMO DAS MELHORIAS IMPLEMENTADAS

### ✅ Versão 2.3.0 - Melhorias Completas (2025-12-12)

#### 🗄️ Persistência de Dados
1. **Mapeamentos de Colunas no Banco de Dados**
   - Migração de `localStorage` para PostgreSQL
   - Modelo `VendaColumnMapping` com CRUD completo
   - Relacionamento com usuário para personalização
   - Suporte a filtros de exclusão salvos junto com mapeamento

2. **Filtros Salvos de Analytics**
   - Modelo `VendaAnalyticsFilter` para salvar configurações
   - Interface completa de salvar/carregar/editar/deletar
   - Compartilhamento entre usuários (opcional)

#### 🎨 Melhorias de Interface
1. **Redução de Padding nas Tabelas**
   - Interface mais compacta e profissional
   - Melhor aproveitamento do espaço vertical
   - Aplicado em todas as tabelas de analytics

2. **Ordenação Automática**
   - Todas as tabelas ordenadas do maior para o menor valor
   - Algoritmo inteligente: soma de todos os anos + desempate por ano mais recente
   - Dados sempre apresentados por relevância

#### ✅ Validação e Qualidade de Dados
1. **Validação de Campos Vazios**
   - Verificação automática antes da revisão
   - Detalhamento por linha do Excel
   - Informação clara sobre qual campo está vazio e em qual linha
   - Opção de prosseguir ou corrigir

2. **Campos Obrigatórios Atualizados**
   - 13 campos obrigatórios configurados
   - Validação robusta: null, undefined, string vazia, espaços, NaN
   - Feedback claro ao usuário

#### 🔧 Melhorias Técnicas
1. **Performance**
   - Validação com `useMemo` (recalcula apenas quando necessário)
   - Verificação de dados originais do Excel (mais eficiente)
   - Cache de 5 minutos para filtros e mapeamentos

2. **Arquitetura**
   - Separação clara entre mapeamentos e filtros
   - Endpoints RESTful bem organizados
   - Compatibilidade mantida com `localStorage` para outros tipos

---

**Última Atualização:** 2025-12-12  
**Versão:** 2.3.0  
**Status:** ✅ Implementado e Funcionando  
**Próxima Versão:** 2.4.0 - Melhorias Adicionais (Planejado)
