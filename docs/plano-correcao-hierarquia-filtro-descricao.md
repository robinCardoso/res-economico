# 📋 Plano de Correção: Hierarquia Incorreta com Filtro de Descrição

## 🎯 Objetivo

Corrigir o problema onde, quando há filtro de descrição, as classificações aparecem uma dentro da outra (hierarquia aninhada incorreta), enquanto sem filtro funciona perfeitamente.

## 🔍 Problema Identificado

### Situação Atual

**Sem filtro de descrição** ✅:
- Hierarquia correta
- Subcontas são irmãs (mesmo nível)
- Renderização correta

**Com filtro de descrição** ❌:
- Hierarquia incorreta
- Subcontas aparecem aninhadas (uma dentro da outra)
- Renderização incorreta

### Causa Raiz

A função `incluirFilhosDeContasFiltradas` no backend está:
1. Adicionando subcontas como filhos da conta filtrada ✅ (correto)
2. Processando recursivamente essas subcontas recém-adicionadas ❌ (incorreto)
3. Adicionando outras subcontas como filhos das subcontas anteriores ❌ (incorreto)

**Resultado**: Subcontas que deveriam ser irmãs acabam sendo filhas umas das outras.

## 🏗️ Solução Proposta

### Princípios da Correção

1. **Subcontas são folhas**: Subcontas não têm filhos hierárquicos, então não devem ser processadas recursivamente
2. **Subcontas são irmãs**: Todas as subcontas da mesma classificação devem estar no mesmo nível (filhas diretas da conta pai)
3. **Manter estrutura original**: Não modificar a hierarquia original, apenas adicionar o que está faltando

### Estratégia de Implementação

#### Fase 1: Separar Lógica de Filhos Hierárquicos e Subcontas ✅

**Objetivo**: Tratar filhos hierárquicos e subcontas de forma diferente.

**Implementação**:

```typescript
// Identificar tipo de filho
const ehFilhoHierarquico = classificacaoLinha.startsWith(classificacaoNormalizada + '.') && 
  classificacaoLinha !== classificacaoNormalizada;

const ehSubConta = classificacaoLinha === classificacaoNormalizada && 
  (linha.conta !== contaPaiNum || linha.subConta !== subContaPaiNum);

// Processar de forma diferente
if (ehFilhoHierarquico) {
  // Filho hierárquico: pode ter filhos próprios, processar recursivamente
  adicionarFilho(conta, linha);
  // Processar recursivamente apenas filhos hierárquicos
  if (contaFilho.filhos && contaFilho.filhos.length > 0) {
    incluirFilhosDeContasFiltradas(contaFilho.filhos);
  }
} else if (ehSubConta) {
  // Subconta: é folha, não processar recursivamente
  adicionarFilho(conta, linha);
  // NÃO processar recursivamente subcontas
}
```

#### Fase 2: Não Processar Recursivamente Subcontas ✅

**Objetivo**: Evitar que subcontas sejam processadas recursivamente, pois são folhas.

**Implementação**:

```typescript
// Continuar recursivamente apenas se:
// 1. A conta não corresponde ao filtro (já processamos filhos acima)
// 2. A conta não é uma subconta (subcontas são folhas)
if (!contaCorresponde && conta.filhos && conta.filhos.length > 0) {
  // Filtrar apenas filhos hierárquicos (não subcontas)
  const filhosHierarquicos = conta.filhos.filter(f => 
    f.classificacao !== conta.classificacao || 
    (!f.conta && !f.subConta) // Conta pai, não subconta
  );
  
  if (filhosHierarquicos.length > 0) {
    incluirFilhosDeContasFiltradas(filhosHierarquicos);
  }
}
```

#### Fase 3: Verificar se Conta Já Está na Hierarquia ✅

**Objetivo**: Evitar duplicatas e garantir que cada conta apareça apenas uma vez.

**Implementação**:

```typescript
// Função auxiliar para verificar se conta já está na hierarquia
const jaEstaNaHierarquia = (
  chaveComposta: string,
  contaPai: ContaRelatorio,
  visitadas = new Set<string>()
): boolean => {
  // Verificar se já foi visitada nesta passagem
  if (visitadas.has(chaveComposta)) return true;
  visitadas.add(chaveComposta);
  
  // Verificar se está nos filhos diretos
  if (contaPai.filhos) {
    for (const filho of contaPai.filhos) {
      const chaveFilho = criarChaveComposta(
        filho.classificacao,
        (filho as any).conta,
        (filho as any).subConta
      );
      if (chaveFilho === chaveComposta) return true;
      
      // Verificar recursivamente nos filhos
      if (jaEstaNaHierarquia(chaveComposta, filho, visitadas)) return true;
    }
  }
  
  return false;
};
```

#### Fase 4: Melhorar Lógica de Adição de Filhos ✅

**Objetivo**: Garantir que filhos sejam adicionados corretamente, sem criar hierarquia aninhada.

**Implementação**:

```typescript
// Antes de adicionar filho, verificar:
// 1. Não é a mesma conta (auto-referência)
// 2. Não está duplicada na hierarquia
// 3. É um filho válido (hierárquico ou subconta)

if (chaveComposta === chaveConta) {
  continue; // Auto-referência
}

if (jaEstaNaHierarquia(chaveComposta, conta)) {
  continue; // Já está na hierarquia
}

// Adicionar apenas se for filho válido
if (ehFilhoValido(linha, conta)) {
  adicionarFilho(conta, linha);
}
```

## 📝 Implementação Detalhada

### Correção 1: Modificar Lógica de Recursão

**Arquivo**: `backend/src/relatorios/relatorios.service.ts`

**Localização**: Função `incluirFilhosDeContasFiltradas` (linha ~1156-1160)

**Antes**:
```typescript
// Continuar recursivamente nos filhos apenas se a conta não corresponder ao filtro
if (!contaCorresponde && conta.filhos && conta.filhos.length > 0) {
  incluirFilhosDeContasFiltradas(conta.filhos);
}
```

**Depois**:
```typescript
// Continuar recursivamente apenas se:
// 1. A conta não corresponde ao filtro (já processamos filhos acima)
// 2. A conta não é uma subconta (subcontas são folhas, não têm filhos)
if (!contaCorresponde && conta.filhos && conta.filhos.length > 0) {
  // Filtrar apenas filhos hierárquicos (não subcontas)
  // Subcontas têm a mesma classificação mas diferente conta/subConta
  const filhosHierarquicos = conta.filhos.filter(f => {
    // Se tem classificação diferente, é filho hierárquico
    if (f.classificacao !== conta.classificacao) return true;
    
    // Se tem a mesma classificação mas não tem conta/subConta, é conta pai (não subconta)
    const fConta = (f as any).conta || '';
    const fSubConta = (f as any).subConta || '';
    const contaAtual = (conta as any).conta || '';
    const subContaAtual = (conta as any).subConta || '';
    
    // Se não tem conta/subConta, é conta pai (processar)
    if (!fConta && !fSubConta) return true;
    
    // Se tem conta/subConta mas é diferente da conta atual, é subconta (não processar recursivamente)
    return false;
  });
  
  if (filhosHierarquicos.length > 0) {
    incluirFilhosDeContasFiltradas(filhosHierarquicos);
  }
}
```

### Correção 2: Adicionar Verificação de Hierarquia

**Arquivo**: `backend/src/relatorios/relatorios.service.ts`

**Localização**: Antes de adicionar filho (linha ~1109-1127)

**Adicionar função auxiliar**:
```typescript
// Função auxiliar para verificar se conta já está na hierarquia
const jaEstaNaHierarquia = (
  chaveComposta: string,
  contaPai: ContaRelatorio,
  visitadas = new Set<string>()
): boolean => {
  // Verificar se já foi visitada nesta passagem
  if (visitadas.has(chaveComposta)) return true;
  visitadas.add(chaveComposta);
  
  // Verificar se está nos filhos diretos
  if (contaPai.filhos) {
    for (const filho of contaPai.filhos) {
      const chaveFilho = `${filho.classificacao}|${(filho as any).conta || ''}|${(filho as any).subConta || ''}`;
      if (chaveFilho === chaveComposta) return true;
      
      // Verificar recursivamente nos filhos (apenas filhos hierárquicos)
      if (filho.classificacao !== contaPai.classificacao) {
        if (jaEstaNaHierarquia(chaveComposta, filho, visitadas)) return true;
      }
    }
  }
  
  return false;
};
```

**Usar antes de adicionar**:
```typescript
// Verificar se já está na hierarquia antes de adicionar
if (jaEstaNaHierarquia(chaveComposta, conta)) {
  continue; // Já está na hierarquia, pular
}
```

### Correção 3: Marcar Subcontas como Processadas

**Objetivo**: Evitar processar subcontas múltiplas vezes.

**Implementação**:
```typescript
// Quando adiciona uma subconta, marcar como processada
if (ehSubConta) {
  contasProcessadasParaFilhos.add(chaveComposta);
  // Não processar recursivamente
}
```

## ✅ Critérios de Sucesso

1. ✅ Sem filtro de descrição: Funciona como antes
2. ✅ Com filtro de descrição: Hierarquia correta, subcontas são irmãs
3. ✅ Não há aninhamento incorreto de subcontas
4. ✅ Não há duplicatas na hierarquia
5. ✅ "Expandir Níveis" funciona corretamente
6. ✅ "Exibir SubContas" funciona corretamente
7. ✅ Renderização mantém indentação correta

## 🚀 Passos de Implementação

### Passo 1: Modificar Lógica de Recursão ✅
- [ ] Atualizar função `incluirFilhosDeContasFiltradas` para não processar subcontas recursivamente
- [ ] Filtrar apenas filhos hierárquicos antes de recursão

### Passo 2: Adicionar Verificação de Hierarquia ✅
- [ ] Criar função `jaEstaNaHierarquia`
- [ ] Usar antes de adicionar filhos

### Passo 3: Testar Cenários ✅
- [ ] Testar sem filtro de descrição
- [ ] Testar com filtro de descrição (conta pai)
- [ ] Testar com filtro de descrição (subconta)
- [ ] Testar com "Expandir Níveis" ativo
- [ ] Testar com "Exibir SubContas" desativado

### Passo 4: Validar Hierarquia ✅
- [ ] Verificar que subcontas são irmãs
- [ ] Verificar que não há aninhamento incorreto
- [ ] Verificar que não há duplicatas

## 📌 Notas Importantes

1. **Subcontas são folhas**: Não têm filhos, então não devem ser processadas recursivamente
2. **Subcontas são irmãs**: Devem estar no mesmo nível hierárquico
3. **Manter estrutura original**: Não modificar hierarquia existente, apenas adicionar o que falta
4. **Performance**: Verificações de hierarquia devem ser eficientes para não impactar performance

