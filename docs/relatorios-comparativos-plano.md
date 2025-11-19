# Plano de Implementação - Relatórios Comparativos

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
- [ ] Criar DTOs (`GerarRelatorioComparativoDto`, `RelatorioComparativoDto`)
- [ ] Implementar método `gerarRelatorioComparativo` no service
- [ ] Adicionar endpoint `GET /relatorios/comparativo` no controller
- [ ] Validar lógica de comparação (mês a mês, ano a ano)
- [ ] Implementar cálculo de diferenças e percentuais
- [ ] Testar com dados reais

### Frontend
- [ ] Criar estrutura de pastas `/relatorios/comparativo`
- [ ] Criar página com filtros (tipo, períodos, empresas, descrição)
- [ ] Implementar tabela comparativa com destaque de variações
- [ ] Adicionar gráficos (Recharts)
- [ ] Implementar exportação Excel/PDF
- [ ] Adicionar card na página principal de relatórios
- [ ] Adicionar hook `use-relatorios.ts` para buscar dados comparativos
- [ ] Atualizar `relatorios.service.ts` com método de comparação

### UX/UI
- [ ] Layout responsivo
- [ ] Loading states
- [ ] Mensagens de erro
- [ ] Validação de filtros (período 2 deve ser posterior a período 1)
- [ ] Tooltips explicativos
- [ ] Dark mode support

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

## ✅ Próximos Passos

1. Revisar e aprovar este plano
2. Instalar dependências (Recharts)
3. Começar implementação pelo backend
4. Implementar frontend básico
5. Adicionar gráficos e exportação
6. Testes e ajustes finais

