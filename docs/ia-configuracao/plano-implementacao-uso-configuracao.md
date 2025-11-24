# Plano de Implementação: Uso da Configuração de Modelos de Negócio

## 📋 Objetivo

Integrar a **Configuração de Modelos de Negócio** em todas as partes do sistema onde análises, relatórios e insights são gerados, garantindo que a IA e os usuários tenham acesso às informações contextuais corretas.

---

## 🔍 Análise da Situação Atual

### ✅ O que já está funcionando

1. **Backend - Coleta de Contexto** (`backend/src/ai/empresa-contexto.service.ts`)
   - ✅ Coleta informações da empresa
   - ✅ Busca configuração global do modelo de negócio
   - ✅ Faz fallback: empresa → configuração global
   - ✅ Calcula métricas específicas do modelo (mensalidades, bonificações, custos)

2. **Backend - Análise IA** (`backend/src/ai/ai.service.ts`)
   - ✅ Usa contexto da empresa nas análises
   - ✅ Prompts melhorados com informações do modelo de negócio
   - ✅ Entende estrutura organizacional (matriz vs. filial)
   - ✅ Fornece recomendações específicas e quantificadas

3. **Frontend - Configuração** (`frontend/src/app/(app)/configuracoes/modelos-negocio/page.tsx`)
   - ✅ Interface para criar/editar configurações
   - ✅ Formulário visual para modelo ASSOCIACAO
   - ✅ Autocomplete para contas DRE
   - ✅ Validação e persistência

### ❌ O que precisa ser implementado

1. **Frontend - Visualização da Configuração**
   - ❌ Mostrar qual configuração está sendo usada em análises
   - ❌ Indicar se está usando configuração da empresa ou global
   - ❌ Exibir resumo da configuração aplicada

2. **Frontend - Seleção de Empresa**
   - ❌ Filtrar empresas por modelo de negócio nas análises
   - ❌ Mostrar modelo de negócio ao selecionar empresa
   - ❌ Validar se empresa tem modelo configurado antes de analisar

3. **Frontend - Relatórios**
   - ❌ Mostrar informações do modelo de negócio nos relatórios
   - ❌ Destacar contas configuradas (mensalidades, bonificações)
   - ❌ Indicar se custos/receitas estão centralizados

4. **Frontend - Resumos**
   - ❌ Exibir configuração usada no resumo
   - ❌ Mostrar métricas calculadas (cobertura de custos, etc.)
   - ❌ Link para editar configuração se necessário

5. **Backend - Validação e Testes**
   - ❌ Validar se contas configuradas existem nos uploads
   - ❌ Testar configuração antes de salvar
   - ❌ Endpoint para verificar impacto de uma configuração

---

## 🎯 Fases de Implementação

### **FASE 1: Visualização e Feedback** (Prioridade: ALTA)

**Objetivo:** Mostrar ao usuário qual configuração está sendo usada e como ela afeta as análises.

#### 1.1. Badge de Modelo de Negócio na Seleção de Empresa

**Arquivo:** `frontend/src/app/(app)/analises/page.tsx`

**Implementação:**
- Adicionar badge ao lado do nome da empresa mostrando o modelo de negócio
- Cores diferentes para cada modelo:
  - ASSOCIACAO: `bg-purple-100 text-purple-700`
  - COMERCIO: `bg-blue-100 text-blue-700`
  - INDUSTRIA: `bg-orange-100 text-orange-700`
  - SERVICOS: `bg-green-100 text-green-700`
  - AGROPECUARIA: `bg-yellow-100 text-yellow-700`
  - OUTRO: `bg-gray-100 text-gray-700`

**Código:**
```typescript
// No select de empresa
{empresas?.map((empresa) => (
  <option key={empresa.id} value={empresa.id}>
    {empresa.nomeFantasia || empresa.razaoSocial}
    {empresa.modeloNegocio && ` (${empresa.modeloNegocio})`}
  </option>
))}
```

#### 1.2. Card de Configuração Aplicada

**Arquivo:** `frontend/src/app/(app)/analises/page.tsx`

**Implementação:**
- Após selecionar empresa, mostrar card com:
  - Modelo de negócio
  - Fonte da configuração (Empresa ou Global)
  - Contas configuradas (mensalidades, bonificações)
  - Status de centralização (custos/receitas)

**Localização:** Após os filtros, antes do botão "Analisar"

**Exemplo de UI:**
```
┌─────────────────────────────────────────┐
│ ⚙️ Configuração Aplicada                │
├─────────────────────────────────────────┤
│ Modelo: ASSOCIACAO                      │
│ Fonte: Configuração Global              │
│                                         │
│ 📊 Contas de Receita:                   │
│   • Mensalidades: 3.01.10.02.01        │
│   • Bonificações: 3.01.10.02.02        │
│                                         │
│ 💰 Custos Centralizados: Sim            │
│ 💵 Receitas Centralizadas: Sim          │
└─────────────────────────────────────────┘
```

#### 1.3. Indicador Visual nos Resultados

**Arquivo:** `frontend/src/app/(app)/analises/page.tsx`

**Implementação:**
- Adicionar seção no resultado da análise mostrando:
  - "Análise contextualizada com modelo ASSOCIACAO"
  - Link para ver/editar configuração
  - Métricas calculadas (se disponíveis)

---

### **FASE 2: Filtros e Validação** (Prioridade: MÉDIA)

**Objetivo:** Facilitar a seleção de empresas e validar configurações.

#### 2.1. Filtro por Modelo de Negócio

**Arquivo:** `frontend/src/app/(app)/analises/page.tsx`

**Implementação:**
- Adicionar filtro dropdown antes do select de empresa
- Filtrar empresas por modelo de negócio
- Opção "Todas" para mostrar todas as empresas

**Código:**
```typescript
const [filtroModeloNegocio, setFiltroModeloNegocio] = useState<string>('');

const empresasFiltradas = useMemo(() => {
  if (!filtroModeloNegocio) return empresas;
  return empresas?.filter(emp => emp.modeloNegocio === filtroModeloNegocio);
}, [empresas, filtroModeloNegocio]);
```

#### 2.2. Validação de Configuração

**Arquivo:** `frontend/src/app/(app)/analises/page.tsx`

**Implementação:**
- Antes de permitir análise, verificar:
  - Se empresa tem `modeloNegocio` definido
  - Se existe configuração global para o modelo
  - Se contas configuradas existem nos uploads

**Aviso:**
```
⚠️ Esta empresa não tem modelo de negócio configurado.
Configure em Configurações > Modelos de Negócio para análises mais precisas.
```

#### 2.3. Endpoint de Validação (Backend)

**Arquivo:** `backend/src/configuracao-modelo-negocio/configuracao-modelo-negocio.controller.ts`

**Implementação:**
```typescript
@Get(':modeloNegocio/validar')
async validarConfiguracao(@Param('modeloNegocio') modeloNegocio: ModeloNegocio) {
  // Verificar se contas existem nos uploads
  // Retornar estatísticas de uso
}
```

---

### **FASE 3: Integração em Relatórios** (Prioridade: MÉDIA)

**Objetivo:** Mostrar informações do modelo de negócio nos relatórios.

#### 3.1. Badge no Relatório de Resultado

**Arquivo:** `frontend/src/app/(app)/relatorios/resultado/page.tsx`

**Implementação:**
- Adicionar badge no cabeçalho do relatório
- Mostrar modelo de negócio da empresa (se filtrado por empresa)
- Mostrar "Consolidado" se múltiplas empresas

#### 3.2. Destaque de Contas Configuradas

**Arquivo:** `frontend/src/app/(app)/relatorios/resultado/page.tsx`

**Implementação:**
- Destacar linhas do relatório que correspondem a contas configuradas
- Ícone ao lado da conta indicando tipo:
  - 💰 Mensalidades
  - 🎁 Bonificações
  - 👥 Custos de Funcionários
  - 💻 Custos de Sistema
  - 📊 Custos de Contabilidade

**Código:**
```typescript
const isContaConfigurada = (classificacao: string, conta: string, subConta?: string | null) => {
  const contaCompleta = subConta ? `${classificacao}.${conta}.${subConta}` : `${classificacao}.${conta}`;
  // Verificar se está nas contas configuradas
  return contasConfiguradas.includes(contaCompleta);
};
```

#### 3.3. Seção de Métricas do Modelo

**Arquivo:** `frontend/src/app/(app)/relatorios/resultado/page.tsx`

**Implementação:**
- Adicionar seção "Métricas do Modelo de Negócio" (se empresa selecionada)
- Mostrar:
  - Total de mensalidades
  - Total de bonificações
  - Cobertura de custos por mensalidades
  - Custo por associado (se aplicável)

---

### **FASE 4: Integração em Resumos** (Prioridade: BAIXA)

**Objetivo:** Mostrar configuração usada e métricas calculadas nos resumos.

#### 4.1. Card de Configuração no Resumo

**Arquivo:** `frontend/src/app/(app)/resumos/[id]/page.tsx`

**Implementação:**
- Adicionar card no topo do resumo mostrando:
  - Modelo de negócio usado
  - Fonte da configuração
  - Link para editar configuração

#### 4.2. Métricas Calculadas

**Arquivo:** `frontend/src/app/(app)/resumos/[id]/page.tsx`

**Implementação:**
- Se o resumo tiver métricas calculadas, exibir em cards:
  - Cobertura de custos por mensalidades: X%
  - Proporção mensalidades/bonificações: X:Y
  - Custo por associado: R$ X

**Nota:** As métricas precisam ser retornadas pelo backend no `EmpresaContexto`.

---

### **FASE 5: Melhorias no Backend** (Prioridade: BAIXA)

**Objetivo:** Adicionar endpoints e validações úteis.

#### 5.1. Endpoint de Validação de Configuração

**Arquivo:** `backend/src/configuracao-modelo-negocio/configuracao-modelo-negocio.controller.ts`

**Implementação:**
```typescript
@Get(':modeloNegocio/validar')
async validarConfiguracao(
  @Param('modeloNegocio') modeloNegocio: ModeloNegocio,
  @Query('empresaId') empresaId?: string,
) {
  // Validar se contas existem
  // Retornar estatísticas
  // Sugerir melhorias
}
```

#### 5.2. Endpoint de Teste de Configuração

**Arquivo:** `backend/src/configuracao-modelo-negocio/configuracao-modelo-negocio.controller.ts`

**Implementação:**
```typescript
@Post(':modeloNegocio/testar')
async testarConfiguracao(
  @Param('modeloNegocio') modeloNegocio: ModeloNegocio,
  @Body() dto: TestarConfiguracaoDto,
) {
  // Aplicar configuração temporariamente
  // Calcular métricas
  // Retornar resultados
}
```

#### 5.3. Incluir Métricas no EmpresaContexto

**Arquivo:** `backend/src/ai/empresa-contexto.service.ts`

**Implementação:**
- Já está implementado em `calcularMetricasModelo`
- Garantir que métricas sejam sempre retornadas quando disponíveis

---

## 📊 Estrutura de Arquivos a Modificar

### Frontend

```
frontend/src/
├── app/(app)/
│   ├── analises/
│   │   └── page.tsx                    [FASE 1, 2]
│   ├── relatorios/
│   │   ├── resultado/
│   │   │   └── page.tsx                [FASE 3]
│   │   └── comparativo/
│   │       └── page.tsx                [FASE 3]
│   └── resumos/
│       ├── page.tsx                    [FASE 4]
│       └── [id]/
│           └── page.tsx                [FASE 4]
├── components/
│   └── configuracao/
│       ├── ConfiguracaoCard.tsx        [NOVO - FASE 1]
│       ├── ModeloNegocioBadge.tsx      [NOVO - FASE 1]
│       └── MetricasModelo.tsx          [NOVO - FASE 3, 4]
└── services/
    └── configuracao-modelo-negocio.service.ts  [FASE 2, 5]
```

### Backend

```
backend/src/
├── configuracao-modelo-negocio/
│   ├── configuracao-modelo-negocio.controller.ts  [FASE 5]
│   └── configuracao-modelo-negocio.service.ts     [FASE 5]
└── ai/
    └── empresa-contexto.service.ts                [FASE 5]
```

---

## 🧪 Plano de Testes

### Testes Manuais

1. **FASE 1:**
   - [ ] Selecionar empresa com modelo ASSOCIACAO
   - [ ] Verificar badge de modelo
   - [ ] Verificar card de configuração
   - [ ] Verificar indicador nos resultados

2. **FASE 2:**
   - [ ] Filtrar empresas por modelo
   - [ ] Tentar analisar empresa sem modelo (deve mostrar aviso)
   - [ ] Validar configuração via endpoint

3. **FASE 3:**
   - [ ] Gerar relatório de resultado
   - [ ] Verificar destaque de contas configuradas
   - [ ] Verificar seção de métricas

4. **FASE 4:**
   - [ ] Criar resumo
   - [ ] Verificar card de configuração
   - [ ] Verificar métricas exibidas

### Testes Automatizados (Futuro)

- Testes unitários para componentes novos
- Testes de integração para endpoints
- Testes E2E para fluxo completo

---

## 📝 Checklist de Implementação

### FASE 1: Visualização e Feedback
- [ ] Criar componente `ModeloNegocioBadge`
- [ ] Criar componente `ConfiguracaoCard`
- [ ] Adicionar badge no select de empresa
- [ ] Adicionar card de configuração em análises
- [ ] Adicionar indicador visual nos resultados
- [ ] Testar com diferentes modelos de negócio

### FASE 2: Filtros e Validação
- [ ] Adicionar filtro por modelo de negócio
- [ ] Implementar validação de configuração
- [ ] Criar endpoint de validação (backend)
- [ ] Adicionar avisos quando necessário
- [ ] Testar validações

### FASE 3: Integração em Relatórios
- [ ] Adicionar badge no relatório de resultado
- [ ] Implementar destaque de contas configuradas
- [ ] Criar componente `MetricasModelo`
- [ ] Adicionar seção de métricas
- [ ] Testar com diferentes relatórios

### FASE 4: Integração em Resumos
- [ ] Adicionar card de configuração no resumo
- [ ] Exibir métricas calculadas
- [ ] Adicionar link para editar configuração
- [ ] Testar com resumos existentes

### FASE 5: Melhorias no Backend
- [ ] Criar endpoint de validação
- [ ] Criar endpoint de teste
- [ ] Garantir métricas sempre retornadas
- [ ] Documentar endpoints

---

## 🎨 Design e UX

### Cores para Modelos de Negócio

```typescript
const modeloNegocioColors = {
  ASSOCIACAO: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  COMERCIO: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  INDUSTRIA: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  SERVICOS: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  AGROPECUARIA: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  OUTRO: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300',
};
```

### Ícones para Contas Configuradas

- 💰 Mensalidades
- 🎁 Bonificações
- 👥 Custos de Funcionários
- 💻 Custos de Sistema
- 📊 Custos de Contabilidade

---

## 📚 Documentação

### Para Desenvolvedores

1. **Como adicionar novo modelo de negócio:**
   - Criar configuração em `/configuracoes/modelos-negocio`
   - Adicionar cor no `modeloNegocioColors`
   - Atualizar documentação

2. **Como usar configuração em novo componente:**
   - Importar `configuracaoModeloNegocioService`
   - Buscar configuração por `modeloNegocio`
   - Usar fallback: empresa → global

### Para Usuários

1. **Como configurar modelo de negócio:**
   - Acessar Configurações > Modelos de Negócio
   - Criar/editar configuração
   - Preencher contas de receita e custos
   - Salvar

2. **Como verificar se está funcionando:**
   - Selecionar empresa em Análises
   - Verificar card de configuração
   - Verificar se análise menciona modelo

---

## 🚀 Próximos Passos

1. **Implementar FASE 1** (Prioridade ALTA)
   - Criar componentes básicos
   - Adicionar visualização
   - Testar com usuário

2. **Coletar Feedback**
   - Verificar se visualização está clara
   - Ajustar conforme necessário

3. **Implementar FASE 2**
   - Adicionar filtros
   - Implementar validações

4. **Implementar FASES 3, 4, 5**
   - Conforme necessidade e prioridade

---

## 📌 Notas Importantes

1. **Compatibilidade:**
   - Sistema deve funcionar mesmo se empresa não tiver modelo configurado
   - Mostrar avisos, mas não bloquear funcionalidades

2. **Performance:**
   - Cachear configurações globais
   - Evitar múltiplas queries ao banco

3. **Segurança:**
   - Validar permissões para editar configurações
   - Logar alterações em configurações

4. **Manutenibilidade:**
   - Código reutilizável para componentes
   - Documentação clara
   - Testes automatizados (futuro)

---

**Última atualização:** Janeiro 2025  
**Status:** Planejamento completo, aguardando implementação

