# Planejamento: Sistema de Relatórios de Resultado Econômico

## 📊 Análise do Relatório Excel

### Estrutura Identificada

O arquivo `Resultado Por Empresa.xlsx` contém um relatório consolidado com a seguinte estrutura:

1. **Cabeçalho (Linha 1):**
   - Título: "RESULTADO ECONÔMICO REDE UNIÃO - SC 2025"
   - Identifica empresa/grupo, estado e ano

2. **Cabeçalho de Colunas (Linha 5):**
   - `CLASSI`: Classificação da conta (ex: 3., 3.01, 3.01.01.01)
   - `DESCRI`: Descrição/Nome da conta
   - Colunas mensais: Janeiro, Fevereiro, Março, ..., Dezembro
   - Coluna `Total`: Soma anual

3. **Dados (Linhas 6+):**
   - Hierarquia de contas (níveis: 3., 3.01, 3.01.01, 3.01.01.01, etc.)
   - Valores numéricos por mês
   - Contas podem ser totais (soma de filhos) ou valores diretos

### Diferenças do Sistema Atual

| Aspecto | Sistema Atual (Balancete) | Relatório (Resultado) |
|---------|---------------------------|----------------------|
| **Origem** | Importação de Excel | Geração a partir dos dados |
| **Estrutura** | Débito, Crédito, Saldo | Valores consolidados por mês |
| **Período** | Um mês por upload | Múltiplos meses (ano completo) |
| **Visualização** | Por upload | Consolidado/por filial |
| **Cálculo** | Saldo = Anterior + Débito + Crédito | Soma hierárquica de contas |

---

## 🎯 Funcionalidades Necessárias

### 1. Geração de Relatórios Consolidados

#### 1.1. Agregação de Dados
- **Agrupar por período:** Consolidar múltiplos uploads do mesmo ano
- **Agrupar por empresa/filial:** Filtrar por empresa específica ou consolidar todas
- **Calcular totais hierárquicos:** Somar valores de contas filhas para contas pai

#### 1.2. Estrutura de Dados
```typescript
interface RelatorioResultado {
  empresaId: string;
  empresaNome: string;
  ano: number;
  tipo: 'FILIAL' | 'CONSOLIDADO';
  periodo: {
    mes: number;
    nome: string; // Janeiro, Fevereiro, etc.
  }[];
  contas: ContaRelatorio[];
}

interface ContaRelatorio {
  classificacao: string; // 3., 3.01, 3.01.01, etc.
  nomeConta: string;
  nivel: number;
  valores: {
    [mes: number]: number; // 1-12
    total: number;
  };
  filhos?: ContaRelatorio[]; // Para hierarquia
}
```

### 2. Visualização por Filial ou Consolidado

#### 2.1. Filtros
- **Tipo de visualização:**
  - `FILIAL`: Mostrar apenas uma empresa/filial por vez (seleção única)
  - `CONSOLIDADO`: Somar valores de todas as empresas/filiais selecionadas
- **Período:**
  - Ano completo (padrão)
  - Trimestre específico (futuro)
  - Mês específico (futuro)
- **Empresas:**
  - Para `FILIAL`: Seleção única de empresa
  - Para `CONSOLIDADO`: Seleção múltipla de empresas (ou todas)
  - Filtrar por tipo (MATRIZ/FILIAL)

#### 2.2. Interface
- Tabela similar ao Excel
- Colunas: Classificação, Descrição, 12 meses, Total
- **Hierarquia:** Sempre expandida por padrão, mas pode ser recolhida (funcionalidade futura)
- Exportação para Excel/PDF

#### 2.3. Cabeçalho do Relatório
- **Título:** "RESULTADO ECONÔMICO [NOME_EMPRESA] - [UF] [ANO]"
  - `FILIAL`: Nome da empresa selecionada + UF da empresa
  - `CONSOLIDADO`: "CONSOLIDADO" ou nome do grupo + UF (da primeira empresa ou mais comum)
- **UF:** Vem da empresa selecionada (campo a ser adicionado no modelo `Empresa`)

### 3. Cálculos e Agregações

#### 3.1. Regras de Cálculo
1. **Valores diretos:** Contas que têm valores importados diretamente
2. **Valores calculados:** Contas pai = soma de todas as contas filhas
3. **Totais:** Coluna Total = soma de todos os meses

#### 3.2. Hierarquia de Contas
- Identificar nível pela classificação (pontos)
- Exemplo: `3.` (nível 1), `3.01` (nível 2), `3.01.01` (nível 3)
- Contas de nível superior = soma dos filhos

---

## 🏗️ Arquitetura Proposta

### 1. Backend

#### 1.1. Atualização do Modelo Empresa
```prisma
model Empresa {
  id          String      @id @default(uuid())
  cnpj        String      @unique
  razaoSocial String
  nomeFantasia String?
  tipo        TipoEmpresa @default(MATRIZ)
  uf          String?     // NOVO: Estado (SC, SP, etc.)
  // ... outros campos
}
```

#### 1.2. Novo Modelo no Prisma (Opcional - para cache)
```prisma
model Relatorio {
  id          String   @id @default(uuid())
  empresaIds  String[] // Array de IDs (vazio = todas)
  ano        Int
  tipo       TipoRelatorio @default(CONSOLIDADO)
  status     StatusRelatorio @default(GERANDO)
  dados      Json     // Estrutura do relatório
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

enum TipoRelatorio {
  FILIAL
  CONSOLIDADO
}

enum StatusRelatorio {
  GERANDO
  CONCLUIDO
  ERRO
}
```

#### 1.3. Serviço de Relatórios
```typescript
// backend/src/relatorios/relatorios.service.ts
@Injectable()
export class RelatoriosService {
  async gerarRelatorioResultado(
    ano: number,
    empresaId?: string, // Para FILIAL: uma empresa | Para CONSOLIDADO: undefined = todas
    empresaIds?: string[], // Para CONSOLIDADO: empresas específicas
    tipo: 'FILIAL' | 'CONSOLIDADO' = 'CONSOLIDADO'
  ): Promise<RelatorioResultado> {
    // 1. Buscar todos os uploads do ano
    // 2. Filtrar por empresa(s) conforme tipo
    // 3. Agrupar por mês (1-12)
    // 4. Agrupar por classificação de conta
    // 5. Construir hierarquia de contas (árvore)
    // 6. Calcular totais hierárquicos (contas pai = soma dos filhos)
    // 7. Calcular coluna Total (soma de todos os meses)
    // 8. Retornar estrutura formatada
  }
  
  async exportarParaExcel(relatorio: RelatorioResultado): Promise<Buffer> {
    // Gerar arquivo Excel similar ao modelo
    // Formatação: números com separador de milhar, 2 decimais
    // Valores negativos: -38,646.76 (não parênteses)
  }
  
  async exportarParaPDF(relatorio: RelatorioResultado): Promise<Buffer> {
    // Gerar PDF do relatório
  }
}
```

#### 1.4. Controller
```typescript
// backend/src/relatorios/relatorios.controller.ts
@Controller('relatorios')
export class RelatoriosController {
  @Get('resultado')
  async gerarResultado(
    @Query('ano') ano: number,
    @Query('empresaId') empresaId?: string, // Para FILIAL
    @Query('empresaIds') empresaIds?: string[], // Para CONSOLIDADO
    @Query('tipo') tipo: 'FILIAL' | 'CONSOLIDADO' = 'CONSOLIDADO'
  ) {
    return this.relatoriosService.gerarRelatorioResultado(
      ano, 
      empresaId, 
      empresaIds, 
      tipo
    );
  }
  
  @Get('resultado/excel')
  async exportarExcel(
    @Query('ano') ano: number,
    @Query('empresaId') empresaId?: string,
    @Query('empresaIds') empresaIds?: string[],
    @Query('tipo') tipo: 'FILIAL' | 'CONSOLIDADO' = 'CONSOLIDADO'
  ) {
    const relatorio = await this.relatoriosService.gerarRelatorioResultado(
      ano, empresaId, empresaIds, tipo
    );
    const buffer = await this.relatoriosService.exportarParaExcel(relatorio);
    // Retornar arquivo Excel com headers apropriados
  }
  
  @Get('resultado/pdf')
  async exportarPDF(...) {
    // Similar ao Excel
  }
}
```

### 2. Frontend

#### 2.1. Página de Relatórios
```
/relatorios/resultado
```

**Componentes:**
- Filtros (ano, empresas, tipo)
- Tabela de resultados (similar ao Excel)
- Botões de exportação (Excel, PDF)
- Visualização hierárquica (expandir/recolher)

#### 2.2. Estrutura de Componentes
```typescript
// frontend/src/app/(app)/relatorios/resultado/page.tsx
- FiltrosRelatorio (ano, empresas, tipo)
- TabelaResultado (dados hierárquicos)
- ExportacaoRelatorio (botões Excel/PDF)
```

---

## 📋 Plano de Implementação

### Fase 1: Estrutura Base (Backend)
1. ✅ Criar modelo `Relatorio` no Prisma
2. ✅ Criar migration
3. ✅ Criar módulo `RelatoriosModule`
4. ✅ Criar `RelatoriosService` com método de agregação
5. ✅ Criar `RelatoriosController` com endpoints

### Fase 2: Lógica de Agregação
1. ✅ Implementar agrupamento por período (mês)
2. ✅ Implementar agrupamento por empresa
3. ✅ Implementar construção de hierarquia de contas
4. ✅ Implementar cálculo de totais hierárquicos
5. ✅ Testes unitários

### Fase 3: Frontend - Visualização
1. ✅ Criar página `/relatorios/resultado`
2. ✅ Criar componente de filtros
3. ✅ Criar componente de tabela hierárquica
4. ✅ Integrar com backend
5. ✅ Testes de interface

### Fase 4: Exportação
1. ✅ Implementar exportação Excel (usando xlsx)
2. ✅ Implementar exportação PDF (usando pdfkit ou similar)
3. ✅ Testes de exportação

### Fase 5: Melhorias
1. ✅ Cache de relatórios gerados
2. ✅ Geração assíncrona (para relatórios grandes)
3. ✅ Histórico de relatórios gerados
4. ✅ Comparação entre períodos

---

## 🔍 Considerações Técnicas

### 1. Performance
- **Problema:** Agregar muitos uploads pode ser lento
- **Solução:** 
  - Cache de relatórios gerados
  - Geração assíncrona com BullMQ
  - Índices no banco (empresaId, ano, mes)

### 2. Consolidação
- **Problema:** Como consolidar múltiplas empresas?
- **Solução:**
  - Somar valores de contas com mesma classificação
  - Manter hierarquia baseada no catálogo unificado
  - Tratar empresas sem dados em alguns meses

### 3. Hierarquia
- **Problema:** Identificar contas pai e filhas
- **Solução:**
  - Usar classificação hierárquica (3., 3.01, 3.01.01)
  - Construir árvore baseada em prefixos
  - Calcular totais recursivamente

### 4. Valores Mensais
- **Problema:** Uploads são por mês, relatório precisa de 12 meses
- **Solução:**
  - Buscar todos os uploads do ano
  - Agrupar por mês
  - Preencher meses sem dados com 0 ou null

---

## 📝 Próximos Passos

1. **Criar estrutura base do módulo de relatórios**
2. **Implementar lógica de agregação básica**
3. **Criar interface de visualização**
4. **Implementar exportação Excel**
5. **Adicionar funcionalidades avançadas (comparação, histórico)**

---

## 🎨 Mockup da Interface

### Estrutura Visual (Baseada no Excel Analisado)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ RESULTADO ECONÔMICO REDE UNIÃO - SC 2025                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ Filtros:                                                                    │
│ [Ano: 2025 ▼] [Tipo: Consolidado ▼] [Empresas: Todas ▼]                    │
│ [Gerar Relatório] [Exportar Excel] [Exportar PDF]                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ CLASSI │ DESCRI                    │ Jan    │ Fev    │ ... │ Dez │ Total  │
│────────┼────────────────────────────┼────────┼────────┼─────┼─────┼────────│
│ 3.     │ RESULTADO LÍQUIDO DO...    │-38,646 │-34,556 │ ... │  0  │-330,006│
│  3.01  │ RECEITAS OPERACIONAIS...   │481,256 │1,012,731│ ... │  0  │4,133,517│
│    3.01.01 │ RECEITA OPERACIONAL... │556,076 │1,126,488│ ... │  0  │4,717,777│
│      3.01.01.01 │ RECEITA OPER...   │556,076 │1,126,488│ ... │  0  │4,717,777│
│        3.01.01.01.01 │ VENDA DE...  │538,557 │1,105,800│ ... │  0  │4,557,888│
│          3.01.01.01.01.01 │ Vendas..│538,557 │1,105,800│ ... │  0  │4,557,888│
│        3.01.01.01.02 │ PRESTAÇÃO... │ 17,519 │  20,688 │ ... │  0  │  159,889│
│          3.01.01.01.02.01 │ Receitas│ 17,519 │  19,855 │ ... │  0  │  146,866│
│ ...                                                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Características Identificadas do Relatório:

1. **Cabeçalho:**
   - Título: "RESULTADO ECONÔMICO [NOME EMPRESA] - [UF] [ANO]"
   - Identifica empresa/grupo, estado e ano

2. **Estrutura de Colunas:**
   - `CLASSI`: Classificação hierárquica (3., 3.01, 3.01.01, etc.)
   - `DESCRI`: Descrição/Nome da conta
   - 12 colunas mensais (Janeiro a Dezembro)
   - Coluna `Total`: Soma anual

3. **Hierarquia Visual:**
   - Indentação por nível (nível 1 sem indent, nível 2 com 2 espaços, etc.)
   - Contas pai = soma de todas as contas filhas
   - Valores podem ser expandidos/recolhidos (funcionalidade futura)

4. **Formatação:**
   - Números com separador de milhar e 2 casas decimais
   - Valores negativos com sinal negativo: `-38,646.76` (NÃO usar parênteses)
   - Valores zero podem aparecer como "0" ou vazio
   - Sem cores diferentes para valores positivos/negativos

---

## ✅ Checklist de Implementação

### Fase 1: Estrutura Base
- [ ] Adicionar campo `uf` ao modelo `Empresa` no Prisma
- [ ] Criar migration para adicionar `uf` em `Empresa`
- [ ] Modelo `Relatorio` no Prisma (opcional - para cache)
- [ ] Migration do banco (se usar modelo Relatorio)
- [ ] Módulo `RelatoriosModule`
- [ ] Serviço de agregação de dados
- [ ] Controller com endpoints

### Fase 2: Lógica de Agregação
- [ ] Buscar uploads por ano e empresa(s)
- [ ] Agrupar dados por mês (1-12)
- [ ] Agrupar por classificação de conta
- [ ] Construir hierarquia de contas (árvore)
- [ ] Calcular totais hierárquicos (recursivo)
- [ ] Calcular coluna Total (soma anual)

### Fase 3: Frontend
- [ ] Página frontend `/relatorios/resultado`
- [ ] Componente de filtros (ano, tipo, empresa)
- [ ] Componente de tabela hierárquica
- [ ] Formatação de números (separador milhar, 2 decimais)
- [ ] Formatação de valores negativos (sinal negativo)
- [ ] Cabeçalho dinâmico (nome empresa + UF)

### Fase 4: Exportação
- [ ] Exportação Excel (formato similar ao modelo)
- [ ] Exportação PDF
- [ ] Testes de exportação

### Fase 5: Melhorias Futuras
- [ ] Cache de relatórios gerados
- [ ] Geração assíncrona (para relatórios grandes)
- [ ] Expandir/recolher hierarquia na interface
- [ ] Comparação entre períodos

