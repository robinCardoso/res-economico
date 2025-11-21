# Plano Completo: Sistema de Relatórios

## 📋 Índice

1. [Relatórios Comparativos](#relatórios-comparativos)
2. [Tipo de Valor no Relatório Comparativo](#tipo-de-valor)
3. [Relatórios de Resultado Econômico (DRE)](#relatórios-de-resultado)

---

## Relatórios Comparativos

### 📊 Status Atual: ✅ Funcional (Parcialmente Concluído)

**Data de Implementação:** Janeiro 2025  
**Status:** Funcional e pronto para uso  
**Funcionalidades Pendentes:** Gráficos de tendências e exportação Excel/PDF (opcionais)

### Resumo Executivo

O sistema de **Relatórios Comparativos** foi implementado com sucesso e está totalmente funcional. Permite comparar períodos financeiros de três formas diferentes (Mês a Mês, Ano a Ano, Customizado), com destaque visual de variações significativas e hierarquia de contas expandível.

**Funcionalidades Principais Implementadas:**
- ✅ Comparação entre dois períodos (mês/ano)
- ✅ Três tipos de comparação com ajuste automático
- ✅ Tabela comparativa com diferenças e percentuais
- ✅ Destaque visual de variações significativas
- ✅ Hierarquia de contas expandível/colapsável
- ✅ Filtros organizados e intuitivos
- ✅ Totais gerais do relatório

**Pendente (Opcional):**
- ⏳ Gráficos de tendências (Recharts)
- ⏳ Exportação para Excel/PDF

---

## Tipo de Valor

### 📋 Contexto e Problema

#### Situação Atual
- O relatório comparativo usa **`saldoAtual`** (valor acumulado)
- `saldoAtual` representa o saldo acumulado até o mês, crescendo mês a mês
- Para comparação de períodos, faz mais sentido comparar a **movimentação do período** (exercício/mês atual)

#### Problema Identificado
- Comparar saldos acumulados pode mascarar a real movimentação do período
- Usuário precisa saber tanto o valor acumulado quanto o valor do período

#### Solução Proposta
Adicionar opção para escolher entre:
1. **Valor Acumulado** (`saldoAtual`) - padrão atual
2. **Valor do Período** (movimentação do mês) - calculado a partir de `debito` e `credito`

### 🎯 Objetivos

1. Permitir que o usuário escolha entre valor acumulado e valor do período
2. Calcular corretamente o valor do período baseado em débito/crédito
3. Manter compatibilidade com o comportamento atual (acumulado como padrão)
4. Atualizar labels e tooltips para deixar claro qual tipo está sendo usado

### 📊 Análise Técnica

#### Estrutura de Dados

**Tabela:** `LinhaUpload`
- `saldoAnterior`: Saldo do mês anterior
- `debito`: Movimentação a débito do período
- `credito`: Movimentação a crédito do período
- `saldoAtual`: Saldo acumulado (saldoAnterior + movimentação)

#### Lógica Contábil para DRE

Para **Demonstrativo de Resultado do Exercício (DRE)**:
- **Receitas**: Aumentam com crédito (positivo)
- **Despesas/Custos**: Aumentam com débito (negativo)
- **Valor do Período**: `credito - debito`
  - Se positivo: Receita líquida do período
  - Se negativo: Despesa líquida do período

**Nota:** No sistema atual, o `credito` já vem com sinal do Excel (positivo/negativo), então a fórmula pode ser simplesmente `credito - debito` ou apenas `credito` dependendo de como está armazenado.

### 🔧 Implementação

#### Backend

**DTO - Adicionar Tipo de Valor**

```typescript
export enum TipoValor {
  ACUMULADO = 'ACUMULADO',  // saldoAtual (padrão)
  PERIODO = 'PERIODO',      // movimentação do mês (credito - debito)
}

export class GerarRelatorioComparativoDto {
  // ... campos existentes ...
  
  @IsOptional()
  @IsEnum(TipoValor)
  tipoValor?: TipoValor; // Padrão: ACUMULADO
}
```

**Service - Modificar `buscarDadosPeriodo`**

```typescript
private async buscarDadosPeriodo(
  mes: number,
  ano: number,
  empresaIds: string[],
  descricao?: string,
  tipoValor: TipoValor = TipoValor.ACUMULADO, // Novo parâmetro
): Promise<Map<string, number>> {
  // ... código existente de busca de uploads ...

  for (const upload of uploads) {
    for (const linha of upload.linhas) {
      // ... filtros existentes ...

      let valorLinha: number;
      
      if (tipoValor === TipoValor.PERIODO) {
        // Valor do período: movimentação do mês
        // Para DRE: crédito - débito
        const debito = Number(linha.debito) || 0;
        const credito = Number(linha.credito) || 0;
        valorLinha = credito - debito;
      } else {
        // Valor acumulado (padrão)
        valorLinha = Number(linha.saldoAtual) || 0;
      }

      // Somar valores se já existe a chave
      const valorAtual = dadosPorChaveComposta.get(chaveComposta) || 0;
      dadosPorChaveComposta.set(chaveComposta, valorAtual + valorLinha);
    }
  }

  return dadosPorChaveComposta;
}
```

#### Frontend

**Types - Adicionar Enum**

```typescript
export enum TipoValor {
  ACUMULADO = 'ACUMULADO',
  PERIODO = 'PERIODO',
}
```

**Página - Adicionar Seletor**

```typescript
// Adicionar na seção de filtros (após "Tipo de Comparação")
<div>
  <label className="mb-2 block text-xs font-semibold text-slate-700 dark:text-slate-300">
    1.1. Tipo de Valor
  </label>
  <div className="space-y-2">
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        name="tipoValor"
        value={TipoValor.ACUMULADO}
        checked={tipoValorLocal === TipoValor.ACUMULADO}
        onChange={(e) => setTipoValorLocal(e.target.value as TipoValor)}
        className="h-3.5 w-3.5 text-sky-600 focus:ring-sky-500"
      />
      <span className="text-xs text-slate-700 dark:text-slate-300">
        Valor Acumulado
      </span>
    </label>
    <p className="ml-6 text-[10px] text-slate-500 dark:text-slate-400">
      Saldo acumulado até o mês (saldoAtual)
    </p>
    
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        name="tipoValor"
        value={TipoValor.PERIODO}
        checked={tipoValorLocal === TipoValor.PERIODO}
        onChange={(e) => setTipoValorLocal(e.target.value as TipoValor)}
        className="h-3.5 w-3.5 text-sky-600 focus:ring-sky-500"
      />
      <span className="text-xs text-slate-700 dark:text-slate-300">
        Valor do Período
      </span>
    </label>
    <p className="ml-6 text-[10px] text-slate-500 dark:text-slate-400">
      Movimentação do mês (crédito - débito)
    </p>
  </div>
</div>
```

### ✅ Checklist de Implementação

#### Backend
- [x] Criar enum `TipoValor` no DTO
- [x] Adicionar campo `tipoValor` no DTO (opcional, padrão ACUMULADO)
- [x] Modificar `buscarDadosPeriodo` para aceitar `tipoValor`
- [x] Implementar lógica de cálculo do valor do período (credito - debito)
- [x] Atualizar `gerarRelatorioComparativo` para passar `tipoValor`
- [x] Adicionar query parameter no controller
- [x] Testar com dados reais (acumulado e período)

#### Frontend
- [x] Adicionar enum `TipoValor` em `types/api.ts`
- [x] Adicionar `tipoValor` no service
- [x] Adicionar estado `tipoValorLocal` e `tipoValor`
- [x] Adicionar seletor de tipo de valor nos filtros
- [x] Atualizar query key para incluir `tipoValor`
- [x] Atualizar labels do relatório para mostrar tipo selecionado
- [x] Adicionar tooltips explicativos
- [x] Testar interface e comportamento

---

## Relatórios de Resultado Econômico (DRE)

### 📊 Análise do Relatório Excel

### ⚠️ IMPORTANTE: Identificação de Contas DRE

O sistema identifica contas DRE através do campo `tipoConta = "3-DRE"` presente no arquivo Excel enviado pela contabilidade. Apenas contas com este tipo devem ser incluídas no relatório DRE.

**Campos utilizados:**
- `tipoConta`: Deve ser "3-DRE" para contas do DRE
- `nivel`: Indica a hierarquia (1, 2, 3, 4, 5, etc.)
- `classificacao`: Código hierárquico (ex: "3.", "3.01", "3.01.01")

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

### 🎯 Funcionalidades Necessárias

#### 1. Geração de Relatórios Consolidados

**Agregação de Dados:**
- **Agrupar por período:** Consolidar múltiplos uploads do mesmo ano
- **Agrupar por empresa/filial:** Filtrar por empresa específica ou consolidar todas
- **Calcular totais hierárquicos:** Somar valores de contas filhas para contas pai

**Estrutura de Dados:**
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

#### 2. Visualização por Filial ou Consolidado

**Filtros:**
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

**Interface:**
- Tabela similar ao Excel
- Colunas: Classificação, Descrição, 12 meses, Total
- **Hierarquia:** Sempre expandida por padrão, mas pode ser recolhida (funcionalidade futura)
- Exportação para Excel/PDF

#### 3. Cálculos e Agregações

**Regras de Cálculo:**
1. **Valores diretos:** Contas que têm valores importados diretamente
2. **Valores calculados:** Contas pai = soma de todas as contas filhas
3. **Totais:** Coluna Total = soma de todos os meses

**Hierarquia de Contas:**
- Identificar nível pela classificação (pontos)
- Exemplo: `3.` (nível 1), `3.01` (nível 2), `3.01.01` (nível 3)
- Contas de nível superior = soma dos filhos

### ✅ Checklist de Implementação

#### Fase 1: Estrutura Base
- [x] Adicionar campo `uf` ao modelo `Empresa` no Prisma
- [x] Criar migration para adicionar `uf` em `Empresa`
- [x] Módulo `RelatoriosModule`
- [x] Serviço de agregação de dados
- [x] Controller com endpoints

#### Fase 2: Lógica de Agregação
- [x] Buscar uploads por ano e empresa(s)
- [x] **Filtrar apenas contas com tipoConta = "3-DRE"** ✅
- [x] Agrupar dados por mês (1-12)
- [x] Agrupar por classificação de conta
- [x] Construir hierarquia de contas (árvore) respeitando níveis
- [x] Calcular totais hierárquicos (recursivo)
- [x] Calcular coluna Total (soma anual)

#### Fase 3: Frontend
- [x] Página frontend `/relatorios/resultado`
- [x] Componente de filtros (ano, tipo, empresa)
- [x] Componente de tabela hierárquica
- [x] Formatação de números (separador milhar, 2 decimais)
- [x] Formatação de valores negativos (sinal negativo)
- [x] Cabeçalho dinâmico (nome empresa + UF)

#### Fase 4: Exportação
- [x] Exportação Excel (formato similar ao modelo)
- [x] Exportação PDF
- [x] Testes de exportação

---

## 📚 Referências

- Schema Prisma: `LinhaUpload` com campos `saldoAtual`, `debito`, `credito`
- Service atual: `buscarDadosPeriodo` usa `saldoAtual`
- DRE: Demonstrativo de Resultado do Exercício

