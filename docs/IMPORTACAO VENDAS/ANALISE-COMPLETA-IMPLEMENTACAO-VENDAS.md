# 📊 ANÁLISE COMPLETA: Implementação de Importação de Vendas

## 🎯 OBJETIVO

Implementar a importação de vendas no sistema res-economico, adaptando a estrutura existente do painel-completo que utiliza Supabase para o sistema atual que utiliza PostgreSQL/Prisma. **IMPORTANTE:** Não existe API BRAVO para vendas - a importação é feita via planilha Excel.

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
  
  // Metadata JSONB para campos dinâmicos
  metadata        Json?    // { origem, tipo_venda, desconto, etc }
  
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
  @@index([grupo])
  @@index([subgrupo])
  @@index([prodCodMestre])
  @@index([tipoOperacao])
  
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
  
  @@unique([ano, mes, nomeFantasia, marca, uf])
  @@index([ano, mes])
  @@index([marca])
  @@index([grupo])
  @@index([subgrupo])
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
3. ✅ Usar marca, grupo e subgrupo denormalizados da tabela `Venda` (já disponíveis, sem necessidade de JOIN)
4. ✅ Implementar atualização em tempo real durante importação
5. ✅ Criar endpoints de consulta

#### Arquivos:
- `backend/src/vendas/analytics/vendas-analytics.service.ts`
- `backend/src/vendas/analytics/vendas-analytics.controller.ts`

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

### Testes
- [ ] Testar importação de planilha
- [ ] Testar validação
- [ ] Testar analytics
- [ ] Testar relacionamento com produtos
- [ ] Testar performance
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

- Processar vendas em lotes (400 registros por vez)
- Usar UPSERT para evitar duplicatas e permitir atualizações
- Atualizar analytics em tempo real (otimizado)
- **Denormalizar marca, grupo e subgrupo** na tabela `Venda` durante importação para melhor performance em relatórios
- Esses campos são capturados no momento da importação, preservando os valores históricos da venda
- **Tratamento de erros:** Se produto não existir ou campos estiverem null, usar valores padrão:
  - `marca`: `'DESCONHECIDA'`
  - `grupo`: `'DESCONHECIDO'`
  - `subgrupo`: `'DESCONHECIDO'`
- Isso evita JOINs complexos em relatórios frequentes e melhora significativamente a performance

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

**Última Atualização:** 2025-01-XX  
**Versão:** 1.0.0  
**Status:** 📋 Pronto para Implementação
