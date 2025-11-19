# Plano de Implementação - Relatórios Comparativos

## 📊 Status Atual: ✅ Funcional (Parcialmente Concluído)

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

## 📋 Análise da Estrutura Atual

### Estrutura de Relatórios Existente

```
frontend/src/app/(app)/relatorios/
├── page.tsx                    # Página principal (lista de relatórios)
└── resultado/
    ├── layout.tsx
    └── page.tsx                # Relatório de Resultado Econômico

backend/src/relatorios/
├── relatorios.controller.ts    # Endpoints REST
├── relatorios.service.ts       # Lógica de negócio
└── dto/
    ├── gerar-relatorio.dto.ts
    └── relatorio-resultado.dto.ts
```

### Padrões Identificados

1. **Frontend:**
   - Uso de React Query para gerenciamento de estado
   - Filtros expansíveis/colapsáveis
   - Autocomplete para descrições
   - Exportação para Excel e PDF
   - Layout responsivo com Tailwind CSS

2. **Backend:**
   - NestJS com controllers e services
   - DTOs para validação
   - Prisma para acesso ao banco
   - Endpoints RESTful

3. **Navegação:**
   - Menu lateral com link para `/relatorios`
   - Cards na página principal para cada tipo de relatório

## 🎯 Proposta de Implementação

### Estrutura Proposta

```
frontend/src/app/(app)/relatorios/
├── page.tsx                    # Página principal (atualizada com novo card)
└── comparativo/
    ├── layout.tsx              # Layout específico (se necessário)
    └── page.tsx                # Nova página de relatório comparativo

backend/src/relatorios/
├── relatorios.controller.ts    # Adicionar endpoint /comparativo
├── relatorios.service.ts       # Adicionar método gerarRelatorioComparativo
└── dto/
    ├── gerar-relatorio-comparativo.dto.ts  # Novo DTO
    └── relatorio-comparativo.dto.ts        # Novo DTO de resposta
```

### Funcionalidades a Implementar

#### 1. Tipos de Comparação
- **Mês a Mês:** Comparar dois meses consecutivos (ex: Janeiro vs Fevereiro)
- **Ano a Ano:** Comparar mesmo período em anos diferentes (ex: Janeiro/2024 vs Janeiro/2025)
- **Período Customizado:** Comparar dois períodos específicos (ex: Jan-Mar/2024 vs Jan-Mar/2025)

#### 2. Filtros
- Tipo de comparação (mês a mês, ano a ano, customizado)
- Período 1: Ano, Mês (ou range)
- Período 2: Ano, Mês (ou range)
- Tipo de relatório: Filial ou Consolidado
- Empresa(s): Seleção de empresa(s) para análise
- Descrição: Filtro opcional por descrição de conta (com autocomplete)

#### 3. Visualização de Dados
- **Tabela Comparativa:**
  - Colunas: Classificação | Descrição | Período 1 | Período 2 | Diferença Absoluta | Diferença %
  - Hierarquia de contas (expandir/colapsar)
  - Destaque visual para variações significativas:
    - Verde: Variação positiva >10%
    - Vermelho: Variação negativa >10%
    - Amarelo: Variação entre 5-10%
    - Sem destaque: Variação <5%

#### 4. Gráficos de Tendências
- **Gráfico de Linhas:** Evolução dos valores ao longo do tempo
- **Gráfico de Barras:** Comparação lado a lado dos períodos
- **Gráfico de Pizza:** Distribuição de receitas/despesas por período

#### 5. Exportação
- Excel: Tabela comparativa com formatação
- PDF: Relatório formatado com gráficos

### Tecnologias Sugeridas

- **Gráficos:** Recharts (já usado em projetos Next.js, leve e flexível)
- **Exportação:** Reutilizar `export-relatorio.ts` existente, adaptando para formato comparativo

### Endpoints Backend

```
GET /relatorios/comparativo
Query Params:
  - tipoComparacao: 'MES_A_MES' | 'ANO_A_ANO' | 'CUSTOMIZADO'
  - ano1: number
  - mes1: number
  - ano2: number
  - mes2: number
  - tipo: 'FILIAL' | 'CONSOLIDADO'
  - empresaId?: string
  - empresaIds?: string[]
  - descricao?: string
```

### Estrutura de Dados

```typescript
interface RelatorioComparativo {
  periodo1: {
    ano: number;
    mes: number;
    label: string; // "Janeiro/2024"
  };
  periodo2: {
    ano: number;
    mes: number;
    label: string; // "Fevereiro/2024"
  };
  contas: ContaComparativa[];
  totais: {
    periodo1: number;
    periodo2: number;
    diferenca: number;
    percentual: number;
  };
}

interface ContaComparativa {
  classificacao: string;
  nomeConta: string;
  nivel: number;
  valorPeriodo1: number;
  valorPeriodo2: number;
  diferenca: number;
  percentual: number;
  filhos?: ContaComparativa[];
}
```

## 📝 Checklist de Implementação

### Backend
- [x] Criar DTOs (`GerarRelatorioComparativoDto`, `RelatorioComparativoDto`)
- [x] Implementar método `gerarRelatorioComparativo` no service
- [x] Adicionar endpoint `GET /relatorios/comparativo` no controller
- [x] Validar lógica de comparação (mês a mês, ano a ano, customizado)
- [x] Implementar cálculo de diferenças e percentuais
- [x] Implementar construção de hierarquia de contas
- [x] Implementar busca de dados por período específico
- [x] Testar com dados reais

### Frontend
- [x] Criar estrutura de pastas `/relatorios/comparativo`
- [x] Criar página com filtros (tipo, períodos, empresas, descrição)
- [x] Implementar tabela comparativa com destaque de variações
- [x] Adicionar card na página principal de relatórios
- [x] Atualizar `relatorios.service.ts` com método de comparação
- [x] Adicionar tipos TypeScript (`TipoComparacao`, `ContaComparativa`, `RelatorioComparativo`)
- [x] Implementar hierarquia expandível/colapsável
- [x] Implementar ajuste automático de período 2 baseado no tipo de comparação
- [ ] Adicionar gráficos (Recharts) - **Pendente**
- [ ] Implementar exportação Excel/PDF - **Pendente**

### UX/UI
- [x] Layout responsivo
- [x] Loading states
- [x] Mensagens de erro
- [x] Organização clara dos filtros em ordem lógica
- [x] Agrupamento visual dos períodos em cards
- [x] Textos explicativos para cada tipo de comparação
- [x] Destaque visual de variações significativas (>10%, >20%)
- [x] Dark mode support
- [x] Autocomplete para descrição
- [x] Totais gerais do relatório

## 🚀 Ordem de Implementação Sugerida

1. **Backend primeiro:**
   - DTOs e estrutura de dados
   - Lógica de comparação no service
   - Endpoint no controller
   - Testes básicos

2. **Frontend básico:**
   - Página com filtros
   - Tabela comparativa simples
   - Integração com backend

3. **Melhorias visuais:**
   - Destaque de variações
   - Gráficos
   - Exportação

4. **Polimento:**
   - Validações
   - Mensagens de erro
   - Loading states
   - Responsividade

## 📊 Exemplo de Interface

```
┌─────────────────────────────────────────────────────────┐
│ Relatório Comparativo                                    │
├─────────────────────────────────────────────────────────┤
│ Filtros:                                                 │
│ [Tipo: Mês a Mês ▼] [Período 1: 2024 | Janeiro ▼]      │
│ [Período 2: 2024 | Fevereiro ▼] [Tipo: Filial ▼]       │
│ [Empresa: REDE UNIÃO SC ▼] [Buscar] [Limpar]            │
├─────────────────────────────────────────────────────────┤
│                                                           │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Gráfico de Tendências                              │ │
│ │ [Linha] [Barras] [Pizza]                           │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                           │
│ Tabela Comparativa:                                       │
│ ┌─────────┬──────────────┬─────────┬─────────┬──────┐ │
│ │ Classif. │ Descrição    │ Jan/24  │ Fev/24  │ Var% │ │
│ ├─────────┼──────────────┼─────────┼─────────┼──────┤ │
│ │ 3.01    │ Receitas     │ 100.000 │ 120.000 │ +20% │ │
│ │ 3.05    │ Despesas     │ 80.000  │ 90.000  │ +12% │ │
│ └─────────┴──────────────┴─────────┴─────────┴──────┘ │
│                                                           │
│ [Exportar Excel] [Exportar PDF]                           │
└─────────────────────────────────────────────────────────┘
```

## ✅ Status da Implementação

### ✅ Concluído
- Backend completo (DTOs, service, controller, endpoint)
- Frontend básico funcional (página, filtros, tabela)
- Destaque de variações significativas
- Hierarquia expandível/colapsável
- Organização clara dos filtros
- Ajuste automático de períodos
- Totais gerais do relatório

### 🔄 Pendente
- Gráficos de tendências (Recharts)
- Exportação para Excel/PDF

## 📊 Próximos Passos

1. ~~Revisar e aprovar este plano~~ ✅
2. ~~Instalar dependências (Recharts)~~ ⏳ (quando necessário)
3. ~~Começar implementação pelo backend~~ ✅
4. ~~Implementar frontend básico~~ ✅
5. Adicionar gráficos e exportação (opcional)
6. Testes e ajustes finais (em andamento)

## 🎉 Resultado

O relatório comparativo está **funcional e pronto para uso** com todas as funcionalidades principais implementadas. As funcionalidades pendentes (gráficos e exportação) são melhorias opcionais que podem ser adicionadas conforme necessidade.

