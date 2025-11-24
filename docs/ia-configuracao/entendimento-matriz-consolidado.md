# Entendimento de Matriz e Relatórios Consolidados pela IA

## 📋 Situação Atual

### 1. Como o Sistema Identifica a Empresa Matriz

✅ **O sistema SABE qual é a empresa matriz** através do campo `tipo: TipoEmpresa`:
- `MATRIZ`: Empresa matriz/sede
- `FILIAL`: Empresa filial/unidade

Este campo está no modelo `Empresa` e é usado pelo serviço `EmpresaContextoService` para coletar informações contextuais.

### 2. Como a IA Lida com Relatórios Específicos (com empresaId)

Quando uma empresa específica é selecionada:

1. **Coleta de Contexto:**
   - O sistema busca informações da empresa incluindo:
     - `tipo: 'MATRIZ' | 'FILIAL'`
     - `custosCentralizados: boolean`
     - `receitasCentralizadas: boolean`
     - `modeloNegocio` e configurações relacionadas

2. **Prompt para IA:**
   - Se `tipo === 'MATRIZ'` e `custosCentralizados === true`:
     - A IA recebe instrução: "Custos altos na matriz são NORMAIS quando centralizados"
     - A IA entende que custos/receitas centralizados são estrutura organizacional, não problema
   
   - Se `tipo === 'FILIAL'`:
     - A IA recebe instrução: "Custos/receitas podem estar baixos se centralizados na matriz"
     - A IA foca na operação individual da filial

### 3. Como a IA Lida com Relatórios Consolidados (sem empresaId)

⚠️ **PROBLEMA IDENTIFICADO:**

Quando um relatório consolidado é gerado (sem `empresaId`):

1. **Contexto de Empresa NÃO é coletado:**
   ```typescript
   // Em ai.service.ts linha 62-70
   let contextoEmpresa: EmpresaContexto | null = null;
   if (dto.empresaId) {  // ← Só coleta se empresaId existir
     contextoEmpresa = await this.empresaContextoService.coletarContextoEmpresa(dto.empresaId);
   }
   ```

2. **A IA não recebe informações sobre:**
   - Qual empresa é matriz
   - Se custos/receitas estão centralizados
   - Estrutura organizacional
   - Modelo de negócio aplicável

3. **Resultado:**
   - A IA analisa dados consolidados sem entender a estrutura organizacional
   - Pode interpretar custos/receitas altos na matriz como problema
   - Não diferencia visão individual vs. consolidada

---

## 🔧 Melhorias Necessárias

### Opção 1: Coletar Contexto da Matriz para Relatórios Consolidados

Quando `empresaId` for `null` ou `undefined` (consolidado):

1. **Identificar a empresa matriz:**
   ```typescript
   const empresaMatriz = await this.prisma.empresa.findFirst({
     where: { tipo: 'MATRIZ' },
     // Opcional: filtrar por modelo de negócio se aplicável
   });
   ```

2. **Coletar contexto da matriz:**
   ```typescript
   if (!dto.empresaId && empresaMatriz) {
     contextoEmpresa = await this.empresaContextoService.coletarContextoEmpresa(empresaMatriz.id);
     // Marcar como consolidado
     contextoEmpresa.isConsolidado = true;
   }
   ```

3. **Ajustar prompt para consolidado:**
   - Adicionar seção explicando que é visão consolidada
   - Informar que custos/receitas podem estar concentrados na matriz
   - Orientar a IA a considerar estrutura organizacional

### Opção 2: Coletar Contexto de Todas as Empresas no Consolidado

Para relatórios consolidados:

1. **Identificar todas as empresas envolvidas:**
   ```typescript
   const empresas = await this.prisma.empresa.findMany({
     where: {
       // Filtrar por empresas que têm uploads no período
       uploads: {
         some: {
           ano: dto.ano,
           mes: dto.mes,
           status: { in: ['CONCLUIDO', 'COM_ALERTAS'] }
         }
       }
     }
   });
   ```

2. **Identificar matriz e filiais:**
   ```typescript
   const matriz = empresas.find(e => e.tipo === 'MATRIZ');
   const filiais = empresas.filter(e => e.tipo === 'FILIAL');
   ```

3. **Coletar contexto agregado:**
   - Contexto da matriz (para entender centralização)
   - Lista de filiais (para entender estrutura)
   - Informar se há centralização de custos/receitas

### Opção 3: Melhorar Prompt para Consolidado (Mais Simples)

Sem alterar a coleta de contexto, melhorar o prompt quando `contextoEmpresa` for `null`:

```typescript
if (!contextoEmpresa) {
  // Adicionar seção no prompt explicando que é consolidado
  prompt += `
## VISÃO CONSOLIDADA

⚠️ ATENÇÃO: Você está analisando dados CONSOLIDADOS de múltiplas empresas.

IMPORTANTE:
- Custos/receitas podem estar concentrados na empresa MATRIZ (sede)
- Filiais podem ter custos/receitas baixos se centralizados na matriz
- Ao analisar, considere:
  * Se há empresa matriz com custos/receitas centralizados
  * Se valores altos na matriz são estrutura organizacional, não problema
  * Se valores baixos em filiais são esperados quando há centralização
  * A saúde financeira deve ser avaliada considerando a estrutura completa
`;
}
```

---

## 🎯 Recomendação

**Implementar Opção 1 + Opção 3 (Híbrida):**

1. **Quando consolidado, coletar contexto da matriz:**
   - Identificar empresa matriz
   - Coletar contexto incluindo `custosCentralizados` e `receitasCentralizadas`
   - Marcar como `isConsolidado: true`

2. **Ajustar prompt para consolidado:**
   - Se `isConsolidado === true`:
     - Explicar que é visão consolidada
     - Informar estrutura organizacional (matriz + filiais)
     - Orientar sobre centralização

3. **Manter lógica atual para específico:**
   - Quando `empresaId` existe, usar contexto da empresa específica
   - Diferenciar matriz vs. filial conforme já implementado

---

## 📝 Implementação Sugerida

### 1. Atualizar Interface `EmpresaContexto`

```typescript
export interface EmpresaContexto {
  // ... campos existentes ...
  isConsolidado?: boolean; // Novo campo
  empresasNoConsolidado?: Array<{
    id: string;
    razaoSocial: string;
    tipo: 'MATRIZ' | 'FILIAL';
  }>; // Novo campo
}
```

### 2. Atualizar `ai.service.ts`

```typescript
// Coletar contexto da matriz se consolidado
let contextoEmpresa: EmpresaContexto | null = null;
if (dto.empresaId) {
  contextoEmpresa = await this.empresaContextoService.coletarContextoEmpresa(dto.empresaId);
} else {
  // Para consolidado, buscar contexto da matriz
  const empresaMatriz = await this.prisma.empresa.findFirst({
    where: { tipo: 'MATRIZ' },
  });
  
  if (empresaMatriz) {
    contextoEmpresa = await this.empresaContextoService.coletarContextoEmpresa(empresaMatriz.id);
    contextoEmpresa.isConsolidado = true;
    
    // Opcional: listar empresas no consolidado
    const empresas = await this.prisma.empresa.findMany({
      where: {
        uploads: {
          some: {
            ano: dto.ano,
            ...(dto.mes && { mes: dto.mes }),
            status: { in: ['CONCLUIDO', 'COM_ALERTAS'] }
          }
        }
      },
      select: {
        id: true,
        razaoSocial: true,
        tipo: true,
      }
    });
    
    contextoEmpresa.empresasNoConsolidado = empresas;
  }
}
```

### 3. Atualizar `criarPrompt` para Consolidado

```typescript
if (contextoEmpresa?.isConsolidado) {
  prompt += `
## VISÃO CONSOLIDADA

⚠️ Você está analisando dados CONSOLIDADOS de múltiplas empresas.

ESTRUTURA ORGANIZACIONAL:
${contextoEmpresa.empresasNoConsolidado?.map(e => 
  `- ${e.razaoSocial} (${e.tipo})`
).join('\n') || '- Estrutura não identificada'}

${contextoEmpresa.custosCentralizados ? 
  '⚠️ CUSTOS CENTRALIZADOS: Custos operacionais estão centralizados na matriz. Valores altos na matriz são NORMAIS.' : 
  ''}

${contextoEmpresa.receitasCentralizadas ? 
  '⚠️ RECEITAS CENTRALIZADAS: Receitas (ex: bonificações) estão centralizadas na matriz. Valores altos na matriz são NORMAIS.' : 
  ''}

IMPORTANTE:
- Ao analisar, considere que custos/receitas podem estar concentrados na matriz
- Filiais podem ter valores baixos se há centralização
- Avalie a saúde financeira considerando a estrutura completa
- Não interprete custos/receitas altos na matriz como problema se centralizados
`;
}
```

---

## ✅ Checklist de Implementação

- [ ] Atualizar interface `EmpresaContexto` com `isConsolidado` e `empresasNoConsolidado`
- [ ] Modificar `ai.service.ts` para coletar contexto da matriz quando consolidado
- [ ] Atualizar `criarPrompt` para incluir seção de consolidado
- [ ] Atualizar `criarSystemPrompt` para orientar IA sobre consolidado
- [ ] Testar com relatório consolidado
- [ ] Testar com relatório específico (matriz)
- [ ] Testar com relatório específico (filial)
- [ ] Documentar comportamento esperado

---

**Última atualização:** Janeiro 2025  
**Status:** Análise completa, aguardando implementação

