# 📋 Plano: Visualização Detalhada de Alertas

## 🎯 Objetivo

Criar uma interface rica e analítica para visualização de detalhes de alertas, permitindo que o usuário:
- Entenda completamente o contexto do alerta
- Analise dados históricos relacionados
- Compare valores entre períodos
- Tome decisões informadas baseadas em dados
- Veja o histórico de alterações da conta

---

## 📊 Informações Disponíveis no Sistema

### Dados do Alerta (Atuais)
- `id`, `tipo`, `severidade`, `mensagem`, `status`
- `createdAt`, `resolvedAt`
- `uploadId`, `linhaId`
- Relacionamentos: `upload`, `linha`

### Dados da Linha (LinhaUpload)
- `classificacao`, `conta`, `subConta`, `nomeConta`
- `tipoConta`, `nivel`
- `saldoAnterior`, `debito`, `credito`, `saldoAtual`
- `hashLinha`, `createdAt`

### Dados do Upload
- `empresaId`, `mes`, `ano`
- `nomeArquivo`, `status`, `totalLinhas`
- `createdAt`, `updatedAt`
- Relacionamento: `empresa`

### Dados da Empresa
- `razaoSocial`, `nomeFantasia`, `cnpj`
- `tipo` (MATRIZ/FILIAL), `uf`
- `modeloNegocio`, `setor`, `porte`

---

## 🔍 Tipos de Informações Analíticas Disponíveis

### 1. Para CONTINUIDADE_TEMPORAL_DIVERGENTE

#### 1.1. Comparação Temporal
- **Saldo Anterior (Mês Anterior)**: Valor esperado
- **Saldo Anterior (Mês Atual)**: Valor encontrado
- **Diferença**: Variação detectada
- **Percentual de Variação**: Impacto relativo

#### 1.2. Histórico da Conta
- Valores dos últimos 12 meses
- Gráfico de linha mostrando evolução
- Identificação de meses com alterações retroativas
- Tendência (crescimento/declínio)

#### 1.3. Contexto da Conta
- Classificação hierárquica completa
- Contas relacionadas (pai/filhas)
- Tipo de conta e significado
- Primeira aparição no sistema

#### 1.4. Comparação com Outras Empresas
- Média do mesmo tipo de conta em outras empresas
- Desvio padrão
- Posição relativa (percentil)

### 2. Para SALDO_DIVERGENTE

#### 2.1. Validação de Saldo
- Saldo calculado: `saldoAnterior + debito - credito`
- Saldo informado: `saldoAtual`
- Diferença absoluta e percentual
- Possíveis causas (arredondamento, erro de digitação)

#### 2.2. Histórico de Divergências
- Quantas vezes esta conta teve divergência
- Última vez que foi corrigida
- Padrão de ocorrência

### 3. Para CONTA_NOVA

#### 3.1. Primeira Aparição
- Data da primeira importação
- Upload onde apareceu pela primeira vez
- Comparação com contas similares
- Sugestão de classificação (se houver similaridade)

#### 3.2. Evolução da Conta
- Crescimento desde a criação
- Frequência de aparição
- Valores médios

### 4. Para DADO_INCONSISTENTE

#### 4.1. Detalhes da Inconsistência
- Campo com problema
- Valor esperado vs. valor encontrado
- Regra de validação violada
- Sugestões de correção

### 5. Para CABECALHO_ALTERADO

#### 5.1. Comparação de Cabeçalhos
- Cabeçalho anterior (último upload)
- Cabeçalho atual
- Colunas adicionadas/removidas
- Impacto no processamento

---

## 🎨 Interface Proposta

### ✅ Página Dedicada (Recomendado - Padrão do Projeto)

**Vantagens:**
- ✅ Segue o padrão já estabelecido no projeto (`/resumos/[id]`, `/uploads/[id]`)
- ✅ Mais espaço para informações e análises
- ✅ URL compartilhável (`/alertas/[id]`)
- ✅ Melhor para análises profundas
- ✅ Histórico de navegação do browser
- ✅ Pode abrir em nova aba
- ✅ Melhor para impressão/exportação

**Rota:** `/alertas/[id]`

**Estrutura da Página:**
```
┌─────────────────────────────────────────────────────────┐
│ ← Voltar para Alertas                                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ [Cabeçalho com Tipo, Severidade, Status]                │
│                                                          │
│ [Abas]                                                   │
│ ┌───────────┬───────────┬───────────┬───────────┐      │
│ │ Visão      │ Histórico │ Comparação│ Ações     │      │
│ │ Geral      │           │           │           │      │
│ └───────────┴───────────┴───────────┴───────────┘      │
│                                                          │
│ [Conteúdo da Aba Selecionada]                            │
│                                                          │
│ [Botões de Ação]                                         │
│ [Resolver] [Em Análise] [Reabrir]                        │
└─────────────────────────────────────────────────────────┘
```

**Navegação:**
- Ao clicar em uma linha (`<tr>`) da tabela de alertas, redireciona para `/alertas/[id]`
- Botão "Voltar" retorna para `/alertas` (mantendo filtros via query params)
- Link para upload relacionado: `/uploads/[uploadId]`
- Link para empresa relacionada: `/empresas` (filtrado)

### Opção Alternativa: Modal de Detalhes

**Quando usar:**
- Para visualização rápida sem sair da listagem
- Pode ser implementado como complemento (abrir modal com atalho de teclado)

**Vantagens:**
- Não sai da página de listagem
- Contexto mantido
- Rápido de abrir/fechar

---

## 📑 Estrutura de Abas

### Aba 1: Visão Geral

**Seções:**

1. **Informações Básicas**
   - Tipo de alerta (badge)
   - Severidade (badge)
   - Status (badge)
   - Data de criação
   - Data de resolução (se aplicável)
   - Mensagem do alerta

2. **Contexto do Upload**
   - Empresa (com link)
   - Período (mês/ano)
   - Nome do arquivo
   - Status do upload
   - Link para detalhes do upload

3. **Dados da Linha**
   - Classificação completa
   - Nome da conta
   - Tipo de conta
   - Nível hierárquico
   - Valores:
     - Saldo Anterior
     - Débito
     - Crédito
     - Saldo Atual

4. **Ações Rápidas**
   - Botões para mudar status
   - Link para upload relacionado
   - Link para empresa relacionada

### Aba 2: Histórico e Tendências

**Seções:**

1. **Gráfico de Evolução**
   - Gráfico de linha (Recharts)
   - Últimos 12 meses
   - Mostrar saldoAtual por mês
   - Destacar mês do alerta
   - Mostrar alertas anteriores da mesma conta

2. **Tabela de Histórico**
   - Últimos 12 meses
   - Colunas: Mês/Ano, Saldo Anterior, Débito, Crédito, Saldo Atual
   - Destaque para meses com alertas
   - Link para upload de cada mês

3. **Estatísticas**
   - Valor médio (últimos 12 meses)
   - Valor máximo/mínimo
   - Variação média mensal
   - Tendência (crescimento/declínio/estável)

4. **Alertas Relacionados**
   - Lista de alertas da mesma conta
   - Filtro por tipo de alerta
   - Status dos alertas anteriores

### Aba 3: Comparação e Análise

**Seções:**

1. **Comparação Temporal** (para CONTINUIDADE_TEMPORAL_DIVERGENTE)
   - Card comparativo:
     ```
     ┌─────────────────┬─────────────────┐
     │ Mês Anterior    │ Mês Atual       │
     │ Saldo: R$ X     │ Saldo: R$ Y     │
     │ Diferença: R$ Z │ Variação: ±N%   │
     └─────────────────┴─────────────────┘
     ```
   - Explicação da divergência
   - Possíveis causas

2. **Comparação com Média do Setor** (se disponível)
   - Valor da conta vs. média
   - Percentil
   - Benchmarking

3. **Análise de Padrões**
   - Identificar padrões anômalos
   - Sazonalidade
   - Correlações com outras contas

4. **Sugestões da IA** (opcional)
   - Análise automática do alerta
   - Recomendações de ação
   - Confiança da análise

### Aba 4: Ações e Resolução

**Seções:**

1. **Histórico de Ações**
   - Timeline de mudanças de status
   - Quem alterou e quando
   - Comentários (futuro)

2. **Resolução**
   - Campo para observações
   - Anexar arquivos (futuro)
   - Marcar como resolvido

3. **Ações Relacionadas**
   - Ver todos os alertas do upload
   - Ver todos os alertas da empresa
   - Ver todos os alertas da conta

---

## 🔧 Implementação Técnica

### Backend - Novos Endpoints

#### 1. `GET /alertas/:id/detalhes`
Retorna dados enriquecidos do alerta:

```typescript
interface AlertaDetalhesResponse {
  alerta: AlertaWithRelations;
  linha: LinhaUploadCompleta;
  upload: UploadCompleto;
  empresa: Empresa;
  
  // Dados analíticos
  historico: {
    mes: number;
    ano: number;
    saldoAnterior: number;
    debito: number;
    credito: number;
    saldoAtual: number;
    uploadId: string;
    temAlerta: boolean;
  }[];
  
  // Para CONTINUIDADE_TEMPORAL_DIVERGENTE
  comparacaoTemporal?: {
    mesAnterior: {
      mes: number;
      ano: number;
      saldoAtual: number;
    };
    mesAtual: {
      mes: number;
      ano: number;
      saldoAnterior: number;
    };
    diferenca: number;
    percentual: number;
  };
  
  // Estatísticas
  estatisticas: {
    valorMedio: number;
    valorMaximo: number;
    valorMinimo: number;
    variacaoMedia: number;
    tendencia: 'CRESCENTE' | 'DECRESCENTE' | 'ESTAVEL';
  };
  
  // Alertas relacionados
  alertasRelacionados: Alerta[];
  
  // Conta no catálogo
  contaCatalogo?: ContaCatalogo;
}
```

#### 2. `GET /alertas/:id/historico`
Retorna histórico completo da conta (últimos 12 meses)

#### 3. `GET /alertas/:id/comparacao`
Retorna dados comparativos (temporal, benchmarking)

### Frontend - Componentes

#### 1. `AlertaDetalhesModal.tsx`
Modal principal com abas

#### 2. `AlertaVisaoGeral.tsx`
Aba de visão geral

#### 3. `AlertaHistorico.tsx`
Aba de histórico com gráfico

#### 4. `AlertaComparacao.tsx`
Aba de comparação e análise

#### 5. `AlertaAcoes.tsx`
Aba de ações e resolução

#### 6. `AlertaGráficoEvolucao.tsx`
Componente de gráfico (Recharts)

---

## 📈 Dados Analíticos Específicos por Tipo

### CONTINUIDADE_TEMPORAL_DIVERGENTE

**Informações Críticas:**
1. **Comparação Direta**
   - Saldo atual do mês anterior
   - Saldo anterior do mês atual
   - Diferença absoluta e percentual
   - Explicação: "O saldo foi alterado retroativamente"

2. **Impacto**
   - Quantas contas foram afetadas no mesmo upload
   - Valor total das alterações retroativas
   - Impacto nos relatórios consolidados

3. **Contexto Temporal**
   - Quando a alteração foi feita (data do upload)
   - Quanto tempo depois do mês anterior
   - Frequência de alterações retroativas nesta conta

4. **Análise de Padrão**
   - Esta conta costuma ter alterações retroativas?
   - É um padrão da empresa?
   - Há sazonalidade?

### SALDO_DIVERGENTE

**Informações Críticas:**
1. **Cálculo Detalhado**
   - Fórmula: `saldoAnterior + debito - credito = saldoAtual`
   - Mostrar cada componente
   - Destacar onde está a divergência

2. **Possíveis Causas**
   - Arredondamento (diferença < 0.01)
   - Erro de digitação
   - Problema no Excel original

### CONTA_NOVA

**Informações Críticas:**
1. **Primeira Aparição**
   - Data exata
   - Upload onde apareceu
   - Valor inicial

2. **Evolução**
   - Crescimento desde criação
   - Frequência de uso
   - Comparação com contas similares

### DADO_INCONSISTENTE

**Informações Críticas:**
1. **Detalhes da Inconsistência**
   - Campo problemático
   - Valor esperado vs. encontrado
   - Regra violada

### CABECALHO_ALTERADO

**Informações Críticas:**
1. **Comparação de Estrutura**
   - Colunas anteriores
   - Colunas atuais
   - Diferenças

---

## 🎯 Decisões que o Usuário Pode Tomar

### 1. Resolver o Alerta
- **Quando:** Após investigação e correção
- **Ação:** Marcar como resolvido
- **Informações necessárias:**
  - Entender o que causou o alerta
  - Verificar se foi corrigido
  - Confirmar que não há impacto em outros períodos

### 2. Investigar Mais
- **Quando:** Alerta complexo ou padrão suspeito
- **Ações:**
  - Ver histórico completo da conta
  - Comparar com outras empresas
  - Analisar tendências
  - Verificar outros alertas relacionados

### 3. Ignorar Temporariamente
- **Quando:** Alerta conhecido, correção pendente
- **Ação:** Marcar como "Em análise"
- **Informações necessárias:**
  - Justificativa para ignorar
  - Prazo para resolução

### 4. Corrigir na Fonte
- **Quando:** Erro identificado no arquivo original
- **Ações:**
  - Solicitar novo upload
  - Corrigir manualmente (se possível)
  - Documentar correção

### 5. Ajustar Configuração
- **Quando:** Alerta é falso positivo
- **Ações:**
  - Ajustar regras de validação
  - Atualizar templates
  - Configurar exceções

---

## 📊 Exemplos de Visualizações

### Gráfico de Evolução Temporal
```
Saldo Atual (R$)
│
│     ●
│    ╱ ╲
│   ●   ●
│  ╱     ╲
│ ●       ●───● (alerta aqui)
│╱         ╲
└───────────────→ Tempo (meses)
```

### Card Comparativo
```
┌─────────────────────────────────────┐
│ Comparação Temporal                 │
├─────────────────────────────────────┤
│ Mês Anterior (Nov/2024)             │
│ Saldo Atual: R$ 125.450,00          │
│                                     │
│ Mês Atual (Dez/2024)                │
│ Saldo Anterior: R$ 125.480,00      │
│                                     │
│ ⚠️ Diferença: R$ 30,00 (+0,02%)    │
│                                     │
│ Alteração retroativa detectada      │
└─────────────────────────────────────┘
```

### Tabela de Histórico
```
Mês/Ano  │ Saldo Ant. │ Débito  │ Crédito │ Saldo At. │ Status
─────────┼────────────┼─────────┼─────────┼───────────┼────────
Nov/2024 │ 125.420,00 │ 50,00   │ 0,00    │ 125.450,00 │ ✓
Dez/2024 │ 125.480,00 │ 30,00   │ 0,00    │ 125.510,00 │ ⚠️ Alerta
Jan/2025 │ 125.510,00 │ 0,00    │ 100,00  │ 125.410,00 │ ✓
```

---

## ✅ Checklist de Implementação

### Fase 1: Estrutura Base
- [ ] Criar endpoint `GET /alertas/:id/detalhes` no backend
- [ ] Criar página `/alertas/[id]/page.tsx` (seguindo padrão de `/resumos/[id]`)
- [ ] Adicionar onClick no `<tr>` da tabela para navegar para `/alertas/[id]`
- [ ] Implementar aba "Visão Geral"
- [ ] Adicionar botão "Voltar" que retorna para `/alertas` (com filtros preservados)

### Fase 2: Histórico
- [ ] Criar endpoint para histórico (últimos 12 meses)
- [ ] Implementar aba "Histórico"
- [ ] Adicionar gráfico de evolução (Recharts)
- [ ] Criar tabela de histórico

### Fase 3: Comparação
- [ ] Implementar lógica de comparação temporal
- [ ] Criar aba "Comparação"
- [ ] Adicionar cards comparativos
- [ ] Calcular estatísticas

### Fase 4: Ações
- [ ] Criar aba "Ações"
- [ ] Implementar histórico de mudanças de status
- [ ] Adicionar campo de observações
- [ ] Melhorar botões de ação

### Fase 5: Melhorias
- [ ] Adicionar análise de IA (opcional)
- [ ] Implementar comparação com benchmarking
- [ ] Adicionar exportação de dados
- [ ] Melhorar responsividade

---

## 🚀 Prioridades

### Alta Prioridade
1. Modal de detalhes básico
2. Aba "Visão Geral" completa
3. Comparação temporal para CONTINUIDADE_TEMPORAL_DIVERGENTE
4. Histórico dos últimos 12 meses

### Média Prioridade
5. Gráfico de evolução
6. Estatísticas básicas
7. Alertas relacionados
8. Aba "Ações" completa

### Baixa Prioridade
9. Análise de IA
10. Benchmarking
11. Exportação de dados
12. Comentários e anexos

---

## 📝 Notas Técnicas

### Performance
- Cache de histórico (últimos 12 meses)
- Lazy loading de dados pesados
- Paginação em alertas relacionados

### UX
- Loading states em todas as seções
- Tratamento de erros
- Feedback visual em ações
- Tooltips explicativos

### Acessibilidade
- Navegação por teclado
- ARIA labels
- Contraste adequado
- Screen reader friendly

---

**Última atualização:** Janeiro 2025

