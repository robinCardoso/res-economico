# Análise: Colunas Extras no Excel (Mês e UF)

## 📋 Problema Identificado

### Situação Atual
1. **Arquivo Excel possui 2 colunas extras**: "Mês" e "UF" após a coluna "Saldo atual"
2. **Pré-visualização mostra dados incorretos**: A coluna "Saldo atual" está exibindo "Janeiro" (valor que deveria estar na coluna "Mês")
3. **Sistema não sabe o que fazer** com essas colunas extras

### Estrutura do Excel Analisado
```
Colunas esperadas:
1. Classificação
2. Conta
3. Sub
4. Nome da conta contábil/C. Custo
5. Tipo conta
6. Nível
7. Cta. título
8. Estab.
9. Saldo anterior
10. Débito
11. Crédito
12. Saldo atual
13. Mês (EXTRA - não esperada)
14. UF (EXTRA - não esperada)
```

## 🔍 Análise Técnica

### Frontend (Pré-visualização)
**Arquivo**: `frontend/src/app/(app)/uploads/novo/page.tsx`

**Código atual**:
```typescript
const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
setPreview(jsonData.slice(0, 10) as unknown[][]); // Primeiras 10 linhas
```

**Comportamento**:
- ✅ Mostra TODAS as colunas do Excel (incluindo "Mês" e "UF")
- ✅ Primeira linha é o cabeçalho
- ❌ **PROBLEMA**: Se os dados estão desalinhados no Excel, a pré-visualização também mostrará desalinhado

### Backend (Processamento)
**Arquivo**: `backend/src/uploads/excel-processor.service.ts`

**Comportamento atual**:
- ✅ Detecta colunas extras via `detectHeaderChanges()`
- ✅ Gera alerta `CABECALHO_ALTERADO` quando encontra colunas não esperadas
- ✅ Ignora colunas não mapeadas no `getColumnMapping()`
- ✅ Processa apenas as colunas mapeadas (ignora "Mês" e "UF")

## 🎯 O Que o Sistema Deve Fazer

### 1. **Colunas Extras "Mês" e "UF"**

**Decisão**: **IGNORAR** essas colunas no processamento

**Justificativa**:
- O sistema já coleta "mês" e "ano" via formulário no frontend
- "UF" não é necessário para o processamento contábil
- Essas colunas são metadados do arquivo, não dados contábeis

**Comportamento esperado**:
- ✅ Pré-visualização: Mostrar todas as colunas (incluindo extras) para transparência
- ✅ Processamento: Ignorar colunas não mapeadas (já implementado)
- ✅ Alertas: Gerar alerta `CABECALHO_ALTERADO` informando sobre colunas extras (já implementado)

### 2. **Pré-visualização com Dados Corretos**

**Problema identificado**: 
- A pré-visualização pode estar mostrando dados desalinhados se o Excel tiver estrutura inconsistente
- O código atual usa `header: 1` que mapeia por índice de coluna

**Solução**:
- ✅ Manter a pré-visualização mostrando todas as colunas (transparência)
- ✅ Adicionar indicador visual para colunas não mapeadas (ex: cor diferente, ícone)
- ✅ Melhorar a detecção de cabeçalho para garantir alinhamento correto

### 3. **Alertas de Colunas Extras**

**Comportamento atual**:
- ✅ Sistema já gera alerta `CABECALHO_ALTERADO` quando detecta colunas extras
- ✅ Severidade: `MEDIA` ou `ALTA` dependendo do número de colunas extras

**Melhorias sugeridas**:
- ✅ Mensagem mais clara: "Colunas extras detectadas: Mês, UF. Essas colunas serão ignoradas no processamento."
- ✅ Informar que o processamento continuará normalmente

## 📝 Plano de Implementação

### Fase 1: Análise e Validação ✅ (ATUAL)
- [x] Analisar estrutura do Excel
- [x] Verificar comportamento atual do sistema
- [x] Identificar problemas na pré-visualização
- [x] Documentar decisões

### Fase 2: Melhorias na Pré-visualização
- [ ] Adicionar indicador visual para colunas não mapeadas
- [ ] Melhorar detecção de cabeçalho (garantir alinhamento)
- [ ] Adicionar tooltip explicando colunas extras

### Fase 3: Melhorias nos Alertas
- [ ] Aprimorar mensagem de alerta `CABECALHO_ALTERADO` para colunas extras
- [ ] Diferenciação entre colunas ausentes e colunas extras
- [ ] Informar que colunas extras serão ignoradas

### Fase 4: Validação e Testes
- [ ] Testar com arquivo "Balancete Filial 02 JAN 2025.xls"
- [ ] Verificar se pré-visualização mostra dados corretos
- [ ] Confirmar que colunas extras são ignoradas no processamento
- [ ] Validar alertas gerados

## 🔧 Implementações Necessárias

### 1. Melhorar Pré-visualização (Frontend)

**Arquivo**: `frontend/src/app/(app)/uploads/novo/page.tsx`

**Mudanças**:
- Detectar quais colunas são mapeadas vs extras
- Adicionar classe CSS diferente para colunas extras
- Adicionar tooltip explicativo

### 2. Melhorar Mensagens de Alerta (Backend)

**Arquivo**: `backend/src/uploads/excel-processor.service.ts`

**Mudanças**:
- Diferenciação entre "colunas ausentes" e "colunas extras"
- Mensagens mais claras e informativas
- Informar que colunas extras serão ignoradas

### 3. Validação no Frontend (Opcional)

**Arquivo**: `frontend/src/lib/excel-validator.ts`

**Mudanças**:
- Detectar colunas extras na validação client-side
- Mostrar aviso (não erro) sobre colunas extras

## ✅ Conclusão

**Resumo das Decisões**:
1. ✅ **Colunas "Mês" e "UF" serão IGNORADAS** no processamento
2. ✅ **Pré-visualização mostrará todas as colunas** (transparência)
3. ✅ **Sistema gerará alerta informativo** sobre colunas extras
4. ✅ **Processamento continuará normalmente** (apenas colunas mapeadas serão processadas)

**Status Atual**:
- ✅ Backend já está preparado para ignorar colunas extras
- ✅ Sistema já gera alertas sobre colunas extras
- ⚠️ Pré-visualização precisa de melhorias visuais
- ⚠️ Mensagens de alerta podem ser mais claras

**Próximos Passos**:
1. Implementar melhorias na pré-visualização
2. Aprimorar mensagens de alerta
3. Testar com arquivo real
4. Validar comportamento final

