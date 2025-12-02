# 📋 Plano de Melhorias: Cards de Estatísticas - Atas de Reuniões

## 🎯 Objetivo

Melhorar os cards de estatísticas na página `/admin/atas` para refletir melhor a realidade do sistema e as necessidades do usuário.

## 📊 Situação Atual

### Cards Existentes:
1. **Total de Atas** ✅ - OK (mantém)
2. **Finalizadas** ❓ - Status `PUBLICADA` (precisa definir significado)
3. **Rascunhos** ⚠️ - Status `RASCUNHO` (não necessário no momento)
4. **Geradas por IA** ❓ - Campo `geradoPorIa` (precisa definir escopo)

### Contexto do Sistema:
- **Atualmente**: Todas as atas importadas são ATAs já registradas e validadas em cartório
- **Futuro**: Possibilidade de gerar ATAs via IA que precisarão ser registradas em cartório (rascunhos)

## 🔍 Análise dos Cards

### 1. Total de Atas ✅
**Status**: Mantém como está
- Funciona corretamente
- Mostra o total de atas cadastradas

### 2. Finalizadas ❓
**Problema**: Não está claro o que significa "Finalizadas"
- Atualmente conta: `status === 'PUBLICADA'`
- **Pergunta**: O que significa uma ATA "Finalizada"?
  - ATA registrada em cartório?
  - ATA aprovada pelos participantes?
  - ATA com todos os campos preenchidos?
  - ATA com status de publicação?

**Opções de Definição**:
- **Opção A**: ATAs com status `PUBLICADA` (mantém atual)
- **Opção B**: ATAs registradas em cartório (precisa campo adicional)
- **Opção C**: ATAs aprovadas (precisa sistema de aprovação)
- **Opção D**: Remover este card e substituir por outro mais útil

### 3. Rascunhos ⚠️
**Problema**: Não é necessário no momento
- Atualmente conta: `status === 'RASCUNHO'`
- **Contexto**: Todas as atas importadas são já validadas em cartório
- **Futuro**: Será útil quando houver geração de ATAs via IA que precisam ser registradas

**Decisão**: 
- **Agora**: Remover ou ocultar este card
- **Futuro**: Reativar quando houver funcionalidade de geração de ATAs via IA

### 4. Geradas por IA ❓
**Problema**: Não está claro o escopo
- Atualmente conta: `geradoPorIa === true`
- **Pergunta**: O que deve contar?
  - **Opção A**: Apenas ATAs geradas completamente por IA (rascunhos futuros)
  - **Opção B**: Qualquer ATA que passou por processamento de IA (importadas também)
  - **Opção C**: ATAs onde a IA extraiu/processou informações do arquivo

**Contexto Atual**:
- ATAs importadas passam por IA para extrair informações (participantes, pautas, decisões, ações)
- Campo `geradoPorIa` é preenchido quando há processamento de IA
- Campo `iaUsada` indica qual IA foi usada (ex: "Gemini")

**Recomendação**: 
- Contar ATAs onde `geradoPorIa === true` (qualquer processamento de IA)
- Renomear para "Processadas por IA" para ser mais claro
- Ou manter "Geradas por IA" mas documentar que inclui processamento

## 📝 Plano de Implementação

### Fase 1: Melhorias Imediatas (Agora)

#### 1.1. Definir e Corrigir "Finalizadas"
**Ação**: Decidir o significado de "Finalizadas"
- [ ] **Opção Recomendada**: Manter como `PUBLICADA` mas renomear para "Publicadas"
- [ ] Ou adicionar campo `registradaEmCartorio` e contar baseado nisso
- [ ] Ou remover e substituir por outro card mais útil

**Cards Alternativos para "Finalizadas"**:
- **"Registradas em Cartório"** (se houver campo)
- **"Aprovadas"** (se houver sistema de aprovação)
- **"Este Mês"** (atas do mês atual)
- **"Este Ano"** (atas do ano atual)
- **"Com Decisões"** (atas que têm decisões registradas)
- **"Com Ações"** (atas que têm ações pendentes)

#### 1.2. Remover/Ocultar "Rascunhos"
**Ação**: Remover o card de Rascunhos
- [ ] Remover o card da interface
- [ ] Manter a lógica no backend (status `RASCUNHO` ainda existe)
- [ ] Documentar que será reativado no futuro

#### 1.3. Clarificar "Geradas por IA"
**Ação**: Definir e documentar o escopo
- [ ] **Opção Recomendada**: Manter contando `geradoPorIa === true`
- [ ] Renomear para "Processadas por IA" (mais claro)
- [ ] Adicionar tooltip explicando: "ATAs que tiveram informações extraídas ou processadas por IA"
- [ ] Ou manter "Geradas por IA" mas documentar que inclui processamento

### Fase 2: Melhorias Futuras (Updates)

#### 2.1. Sistema de Rascunhos (Futuro)
**Quando**: Quando houver funcionalidade de geração de ATAs via IA
- [ ] Reativar card de "Rascunhos"
- [ ] Implementar workflow: Rascunho → Revisão → Aprovação → Registro em Cartório
- [ ] Adicionar status intermediários se necessário

#### 2.2. Novos Cards Úteis
**Sugestões para adicionar no futuro**:
- **"Este Mês"**: ATAs do mês atual
- **"Este Ano"**: ATAs do ano atual
- **"Com Decisões"**: ATAs que têm decisões registradas
- **"Com Ações Pendentes"**: ATAs com ações não concluídas
- **"Aguardando Aprovação"**: ATAs em processo de aprovação (futuro)
- **"Registradas em Cartório"**: ATAs já registradas (se houver campo)

#### 2.3. Filtros e Agrupamentos
- [ ] Adicionar filtros por período (mês, ano)
- [ ] Agrupamento por tipo de reunião
- [ ] Gráficos de evolução temporal

## 🎨 Proposta de Cards Finais

### Versão Atual (Imediata): ✅ IMPLEMENTADA
1. ✅ **Total de Atas** - Mantém
2. ✅ **Processadas por IA** - Renomeado e mantido
3. ❌ **Rascunhos** - Removido
4. ❌ **Publicadas** - Removido (não faz sentido)

### Versão Futura (Com Rascunhos e Gerenciamento):
1. ✅ **Total de Atas**
2. ✅ **Processadas por IA**
3. ✅ **Rascunhos** (reativar quando houver geração via IA)
4. ➕ **Com Decisões Pendentes** (novo)
5. ➕ **Com Ações Pendentes** (novo)
6. ➕ **Geradas de Rascunho** (futuro)
7. ➕ **Registradas em Cartório** (futuro)

**Nota**: Ver plano completo em `plano-sistema-rascunhos-e-gerenciamento-atas.md`

## 🔧 Implementação Técnica

### Mudanças Necessárias:

#### Frontend (`frontend/src/app/(app)/admin/atas/page.tsx`):

```typescript
// Remover card de Rascunhos
// Renomear "Finalizadas" para "Publicadas" (ou outro)
// Renomear "Geradas por IA" para "Processadas por IA"
// Adicionar tooltip explicativo
```

#### Backend (se necessário):
- Adicionar campo `registradaEmCartorio` se optar por essa definição
- Manter estrutura atual se usar `PUBLICADA`

## 📌 Decisões Tomadas ✅

1. **"Finalizadas/Publicadas" → Decisão:**
   - ✅ **REMOVIDO** - Não faz sentido porque tudo que é importado já foi publicado
   - ✅ Implementado

2. **"Rascunhos" → Decisão:**
   - ✅ Remover card por enquanto
   - ✅ Reativar no futuro quando houver geração de ATAs via IA
   - ✅ Implementado

3. **"Geradas por IA" → Decisão:**
   - ✅ Renomear para "Processadas por IA" (mais claro)
   - ✅ Contar qualquer ATA processada por IA (`geradoPorIa === true`)
   - ✅ Implementado

4. **Cards Finais:**
   - ✅ Total de Atas
   - ✅ Processadas por IA
   - ✅ Grid ajustado para 2 colunas

## 📌 Decisões Pendentes (Futuro)

1. **Novos Cards → Quais adicionar?**
   - [ ] "Este Mês"
   - [ ] "Este Ano"
   - [ ] "Com Decisões"
   - [ ] Outro: _______________

## ✅ Checklist de Implementação

### Fase 1 (Agora): ✅ CONCLUÍDA
- [x] Decidir significado de "Finalizadas" → "Publicadas" (status PUBLICADA)
- [x] Remover card de "Rascunhos"
- [x] Renomear "Geradas por IA" para "Processadas por IA"
- [x] Ajustar grid de 4 para 3 colunas
- [ ] Adicionar tooltip explicativo nos cards (opcional - futuro)
- [x] Testar visualização
- [x] Atualizar documentação

### Fase 2 (Futuro):
- [ ] Implementar sistema de rascunhos
- [ ] Reativar card de "Rascunhos"
- [ ] Adicionar novos cards úteis
- [ ] Implementar filtros e agrupamentos

## 📝 Notas

- Todos os cards devem ser responsivos
- Tooltips devem ser informativos mas não muito longos
- Considerar acessibilidade (aria-labels, etc.)
- Manter consistência visual com o resto do sistema

