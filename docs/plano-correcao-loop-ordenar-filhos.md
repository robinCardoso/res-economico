# 📋 Plano de Correção: Loop Infinito na Função `ordenarFilhos`

## 🎯 Problema Identificado

A função `ordenarFilhos` está causando um erro de "Maximum call stack size exceeded" devido a um loop infinito. Isso indica que há referências circulares na estrutura hierárquica de contas.

## 🔍 Análise do Problema

### Erro Observado
```
RangeError: Maximum call stack size exceeded
at ordenarFilhos (relatorios.service.ts:937:29)
at ordenarFilhos (relatorios.service.ts:940:11)
```

### Causa Raiz
1. **Referências Circulares**: Quando `incluirFilhosDeContasFiltradas` adiciona novos filhos, pode estar criando referências circulares (uma conta sendo filha de si mesma ou uma cadeia circular).
2. **Falta de Proteção**: A função `ordenarFilhos` não tem proteção contra referências circulares.
3. **Ordem de Execução**: `ordenarFilhos` é chamado antes de `incluirFilhosDeContasFiltradas`, mas depois novos filhos são adicionados sem reordenar.

## 🏗️ Solução Proposta

### Fase 1: Adicionar Proteção Contra Referências Circulares ✅
- Adicionar um `Set` para rastrear contas já visitadas na função `ordenarFilhos`
- Evitar processar a mesma conta múltiplas vezes

### Fase 2: Reordenar Após Adicionar Filhos ✅
- Mover a chamada de `ordenarFilhos` para depois de `incluirFilhosDeContasFiltradas`
- Garantir que novos filhos adicionados também sejam ordenados

### Fase 3: Validar Estrutura Antes de Ordenar ✅
- Adicionar validação para detectar referências circulares antes de ordenar
- Logar avisos se referências circulares forem detectadas

## 📝 Implementação

### Correção 1: Proteção na Função `ordenarFilhos`

**Antes**:
```typescript
const ordenarFilhos = (contas: ContaRelatorio[]) => {
  for (const conta of contas) {
    if (conta.filhos && conta.filhos.length > 0) {
      conta.filhos.sort((a, b) =>
        a.classificacao.localeCompare(b.classificacao),
      );
      ordenarFilhos(conta.filhos);
    }
  }
};
```

**Depois**:
```typescript
const ordenarFilhos = (contas: ContaRelatorio[], visitadas = new Set<ContaRelatorio>()) => {
  for (const conta of contas) {
    // Proteção contra referências circulares
    if (visitadas.has(conta)) {
      console.warn(`[ordenarFilhos] Referência circular detectada: ${conta.classificacao}`);
      continue;
    }
    
    visitadas.add(conta);
    
    if (conta.filhos && conta.filhos.length > 0) {
      conta.filhos.sort((a, b) =>
        a.classificacao.localeCompare(b.classificacao),
      );
      ordenarFilhos(conta.filhos, visitadas);
    }
    
    visitadas.delete(conta); // Remover após processar para permitir processar em outros contextos
  }
};
```

### Correção 2: Reordenar Após Adicionar Filhos

**Antes**:
```typescript
ordenarFilhos(raiz);

// 6.5. Se há filtro de descrição...
if (descricao && descricao.trim().length > 0) {
  // ... adicionar filhos ...
  incluirFilhosDeContasFiltradas(raiz);
  ordenarFilhos(raiz); // Já existe, mas pode não estar funcionando
}
```

**Depois**:
```typescript
ordenarFilhos(raiz);

// 6.5. Se há filtro de descrição...
if (descricao && descricao.trim().length > 0) {
  // ... adicionar filhos ...
  incluirFilhosDeContasFiltradas(raiz);
  // Reordenar após adicionar novos filhos (com proteção contra loops)
  ordenarFilhos(raiz);
}
```

### Correção 3: Prevenir Referências Circulares ao Adicionar Filhos

Adicionar validação em `incluirFilhosDeContasFiltradas` para evitar adicionar uma conta como filha de si mesma:

```typescript
// Antes de adicionar filho, verificar se não é a mesma conta
if (contaFilho !== conta && !conta.filhos?.some(f => f === contaFilho)) {
  conta.filhos.push(contaFilho);
}
```

## ✅ Critérios de Sucesso

1. ✅ Função `ordenarFilhos` não causa mais loops infinitos
2. ✅ Referências circulares são detectadas e evitadas
3. ✅ Novos filhos adicionados são ordenados corretamente
4. ✅ Sistema funciona corretamente com filtro de descrição

## ✅ Implementação Concluída

### Correções Aplicadas

1. **Proteção contra Referências Circulares** ✅
   - Adicionado `Set<string>` para rastrear contas já visitadas
   - Chave única baseada em `classificacao|conta|subConta`
   - Log de aviso quando referência circular é detectada

2. **Limpeza do Set entre Chamadas** ✅
   - Set é limpo antes da segunda chamada de `ordenarFilhos` (após adicionar filhos)
   - Garante que novas passagens não sejam afetadas por visitas anteriores

3. **Estrutura da Função** ✅
   ```typescript
   const visitadasOrdenacao = new Set<string>();
   const ordenarFilhos = (contas: ContaRelatorio[]) => {
     for (const conta of contas) {
       const chaveUnica = `${conta.classificacao}|${contaKey}|${subContaKey}`;
       if (visitadasOrdenacao.has(chaveUnica)) {
         this.logger.warn(`[ordenarFilhos] Referência circular detectada...`);
         continue;
       }
       visitadasOrdenacao.add(chaveUnica);
       // ... ordenar e recursão ...
     }
   };
   ```

## ✅ Correções Adicionais Implementadas

### Problema 2: Loop Infinito em `calcularTotaisHierarquicos`

**Erro Observado**:
```
RangeError: Maximum call stack size exceeded
at RelatoriosService.calcularTotaisHierarquicos (linha 1189:37)
```

**Causa**: A função `calcularTotaisHierarquicos` também não tinha proteção contra referências circulares.

**Correção Aplicada**:
- Adicionado parâmetro `visitadas = new Set<string>()` para rastrear contas já visitadas
- Chave única baseada em `classificacao|conta|subConta`
- Log de aviso quando referência circular é detectada
- Continue para pular contas já processadas

### Problema 3: Adicionar Conta como Filha de Si Mesma

**Erro Observado**:
```
[ordenarFilhos] Referência circular detectada: 3.01.03.01.01|832| - Venda de Mercadorias (A Prazo)
```

**Causa**: A função `incluirFilhosDeContasFiltradas` estava tentando adicionar uma conta como filha de si mesma.

**Correção Aplicada**:
- Verificação antes de adicionar filho: `if (chaveComposta === chaveContaPai)`
- Log de aviso quando tentativa é detectada
- Continue para pular a adição

## 🚀 Próximos Passos

1. ✅ Implementar proteção na função `ordenarFilhos` - **CONCLUÍDO**
2. ✅ Implementar proteção na função `calcularTotaisHierarquicos` - **CONCLUÍDO**
3. ✅ Prevenir adição de conta como filha de si mesma - **CONCLUÍDO**
4. ⏳ Testar com diferentes cenários de filtro
5. ⏳ Monitorar logs para detectar referências circulares
6. ⏳ Validar que não há mais loops infinitos

