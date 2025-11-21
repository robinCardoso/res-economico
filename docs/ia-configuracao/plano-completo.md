# Plano Completo: Contexto de Empresa para Análises IA e Configuração de Modelos de Negócio

## 📋 Índice

1. [Contexto de Empresa para Análises IA](#contexto-de-empresa-para-análises-ia)
2. [Melhorias na Configuração de Modelos de Negócio](#melhorias-na-configuração)

---

## Contexto de Empresa para Análises IA

### Objetivo
Enriquecer as análises da IA com informações contextuais sobre a empresa, permitindo análises mais precisas, relevantes e acionáveis.

### Benefícios Esperados
- ✅ Análises mais específicas e contextualizadas
- ✅ Recomendações alinhadas ao setor e porte da empresa
- ✅ Identificação de padrões setoriais vs. anomalias reais
- ✅ Comparações mais relevantes (benchmarking por setor)
- ✅ Insights sobre sazonalidade e tendências históricas
- ✅ **Avaliação de saúde financeira considerando modelo de negócio único**
- ✅ **Identificação de pontos críticos específicos do modelo operacional**
- ✅ **Recomendações baseadas em fontes de receita reais (mensalidades, bonificações)**
- ✅ **Configuração global por modelo de negócio**: Configure uma vez, aplique a todas as empresas
- ✅ **Menos manutenção**: Mudanças na configuração global afetam todas as empresas automaticamente
- ✅ **Padronização**: Garante consistência entre empresas do mesmo modelo

### Estrutura de Dados

**Schema Prisma:**

```prisma
model Empresa {
  // ... campos básicos ...
  
  // NOVOS CAMPOS PARA CONTEXTO IA
  setor        String?              // Ex: "Comércio", "Indústria", "Serviços", "Agronegócio"
  porte        PorteEmpresa?        // MICRO, PEQUENA, MEDIA, GRANDE
  dataFundacao DateTime?            // Data de fundação
  descricao    String?              // Descrição/observações sobre a empresa
  website      String?              // URL do site oficial da empresa (opcional)
  
  // MODELO DE NEGÓCIO ESPECÍFICO
  modeloNegocio ModeloNegocio?      // ASSOCIACAO, COMERCIO, INDUSTRIA, SERVICOS, etc.
  modeloNegocioDetalhes Json?       // Detalhes específicos do modelo (opcional: override da configuração global)
  
  // FONTES DE RECEITA (para identificar contas no DRE)
  // Opcional: se não informado, usa ConfiguracaoModeloNegocio.contasReceita
  contasReceita Json?               // Ex: { mensalidades: "3.1.01.01", bonificacoes: "3.1.02.01" }
  
  // ESTRUTURA OPERACIONAL
  // Opcional: se não informado, usa ConfiguracaoModeloNegocio.custosCentralizados
  custosCentralizados Boolean?      // Se custos estão centralizados na matriz
  // Opcional: se não informado, usa ConfiguracaoModeloNegocio.receitasCentralizadas
  receitasCentralizadas Boolean?    // Se receitas (ex: bonificações) estão centralizadas na matriz
  // Opcional: se não informado, usa ConfiguracaoModeloNegocio.contasCustos
  contasCustos Json?                // Contas de custos operacionais (funcionários, sistema, contabilidade)
}

// NOVA TABELA: Configuração Global por Modelo de Negócio
model ConfiguracaoModeloNegocio {
  id                    String        @id @default(uuid())
  modeloNegocio         ModeloNegocio @unique
  modeloNegocioDetalhes Json          // Detalhes específicos do modelo (ex: associação para retificas)
  contasReceita         Json          // Mapeamento padrão de contas de receita
  contasCustos          Json          // Mapeamento padrão de contas de custos
  custosCentralizados   Boolean       // Padrão para custos centralizados
  receitasCentralizadas Boolean       // Padrão para receitas centralizadas
  descricao             String?       // Descrição da configuração
  ativo                 Boolean       @default(true)
  createdAt             DateTime      @default(now())
  updatedAt             DateTime      @updatedAt
}
```

### Entendendo Visão Individual vs. Consolidada

A IA agora entende a estrutura organizacional:

**Para MATRIZ:**
- Custos operacionais altos na matriz são **NORMAIS e ESPERADOS** quando centralizados - isso é a estrutura organizacional, não um problema
- Receitas altas (ex: bonificações) na matriz são **NORMAIS e ESPERADAS** quando centralizadas - isso é a estrutura organizacional, não um problema
- A matriz concentra custos/receitas que servem a todas as unidades
- Foque em avaliar se as receitas (mensalidades + bonificações) cobrem os custos centralizados

**Para FILIAL:**
- Custos operacionais podem estar baixos porque são centralizados na matriz
- Receitas podem estar baixas se bonificações estão centralizadas na matriz
- Foque em avaliar a operação individual da filial

### Sustentabilidade Real da Empresa

**O que SUSTENTA a empresa:**
- **TAXA DE ADESÃO** e **CONTRIBUIÇÃO MENSAL** de cada associado
- Mensalidades são a fonte primária de receita e devem ser suficientes para cobrir custos
- Bonificações são complementares e não devem ser a principal fonte de receita

**Para melhorar a saúde financeira, foque em:**
- Aumentar a base de associados (taxa de adesão)
- Ajustar a contribuição mensal quando necessário
- Manter custos operacionais controlados

### Recomendações Práticas e Quantificadas

A IA fornece recomendações **ESPECÍFICAS e QUANTIFICADAS**:

**Exemplos:**
- "Aumentar contribuição mensal em 15% para cobrir custos operacionais"
- "Reduzir custos de sistema em 10% através de renegociação de contratos"
- "Aumentar base de associados em 20% através de campanha de adesão"
- "Ajustar mensalidades de R$ X para R$ Y para atingir margem de segurança de 15%"

**NÃO usa recomendações vagas** como "melhorar receitas" ou "reduzir custos". Sempre fornece valores, percentuais e ações concretas.

---

## Melhorias na Configuração de Modelos de Negócio

### Objetivo
Melhorar a experiência do usuário na página de configuração de modelos de negócio, facilitando o preenchimento e edição dos dados, especialmente para usuários não técnicos.

### Fase 1: Buscar Dados do Banco ao Editar ✅

**Problema Identificado:**
- Ao clicar em "Editar" uma configuração existente, os campos não eram preenchidos com os dados do banco
- O usuário precisava digitar tudo novamente

**Solução Implementada:**
- ✅ Modificar função `openEditModal` para buscar dados do banco
- ✅ Preencher o formulário com os dados retornados
- ✅ Converter `modeloNegocioDetalhes` (JSON) para string para o textarea
- ✅ Converter `contasReceita` e `contasCustos` (JSON) para campos individuais
- ✅ Preencher checkboxes `custosCentralizados` e `receitasCentralizadas`

### Fase 2: Formulário Amigável para Modelo de Negócio Detalhes ✅

**Problema Identificado:**
- Campo JSON é difícil para usuários leigos
- Risco de JSON inválido
- Não havia validação visual

**Solução Implementada:**
- ✅ Formulário visual específico para modelo ASSOCIACAO
- ✅ Campos estruturados (tipo, características, número de associados, descrição)
- ✅ Preview do JSON em tempo real
- ✅ Opção de editar JSON diretamente (para usuários avançados)
- ✅ Templates pré-definidos para cada modelo de negócio

### Fase 3: Autocomplete para Contas DRE ✅

**Melhorias Implementadas:**
- ✅ Autocomplete flexível que busca por partes de palavras
- ✅ Busca case-insensitive
- ✅ Busca por código (classificação) ou nome da conta
- ✅ Ordenação por relevância
- ✅ Suporte a múltiplas palavras

**Exemplos que funcionam:**
- Digite "associado" → encontra "Contribuição de Associados"
- Digite "contribui" → encontra "Contribuição de Associados"
- Digite "mens" → encontra "Mensalidades", "Mensalidades de Associados"
- Digite "bonif" → encontra "Bonificações", "Bonificações de Fornecedores"

### Fase 4: Melhorias Adicionais (Pendentes)

#### Validação de Contas
- Validar se a conta existe no catálogo de contas
- Sugerir contas similares se não encontrar
- Mostrar nome completo da conta ao lado do código

#### Histórico e Auditoria
- Mostrar quando a configuração foi criada/editada
- Mostrar quem criou/editou (se disponível)
- Histórico de alterações

#### Exportar/Importar
- Botão para exportar configuração como JSON
- Botão para importar configuração de JSON
- Útil para backup e migração entre ambientes

#### Teste de Configuração
- Botão "Testar Configuração"
- Validar se as contas informadas existem nos uploads
- Mostrar estatísticas (ex: quantos uploads têm essas contas)

---

## ✅ Status da Implementação

### ✅ Concluído
- Estrutura de dados completa (schema Prisma, migrations)
- Serviço de contexto de empresa
- Integração com IA (prompts melhorados)
- Configuração global por modelo de negócio
- Buscar dados ao editar configuração
- Formulário visual para modelo de negócio detalhes
- Autocomplete flexível para contas DRE
- Campo `receitasCentralizadas` implementado
- Melhorias no prompt da IA para entender estrutura organizacional

### 🔄 Pendente
- Validação de contas no formulário
- Histórico e auditoria de configurações
- Exportar/Importar configurações
- Teste de configuração

---

## 📚 Referências

- Schema Prisma: `Empresa` e `ConfiguracaoModeloNegocio`
- Service: `EmpresaContextoService` e `ConfiguracaoModeloNegocioService`
- IA Service: `AiService` com prompts melhorados
- Frontend: `/configuracoes/modelos-negocio`

