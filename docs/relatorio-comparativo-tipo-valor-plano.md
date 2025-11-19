# Plano de Implementação - Tipo de Valor no Relatório Comparativo

## 📋 Contexto e Problema

### Situação Atual
- O relatório comparativo usa **`saldoAtual`** (valor acumulado)
- `saldoAtual` representa o saldo acumulado até o mês, crescendo mês a mês
- Para comparação de períodos, faz mais sentido comparar a **movimentação do período** (exercício/mês atual)

### Problema Identificado
- Comparar saldos acumulados pode mascarar a real movimentação do período
- Usuário precisa saber tanto o valor acumulado quanto o valor do período

### Solução Proposta
Adicionar opção para escolher entre:
1. **Valor Acumulado** (`saldoAtual`) - padrão atual
2. **Valor do Período** (movimentação do mês) - calculado a partir de `debito` e `credito`

---

## 🎯 Objetivos

1. Permitir que o usuário escolha entre valor acumulado e valor do período
2. Calcular corretamente o valor do período baseado em débito/crédito
3. Manter compatibilidade com o comportamento atual (acumulado como padrão)
4. Atualizar labels e tooltips para deixar claro qual tipo está sendo usado

---

## 📊 Análise Técnica

### Estrutura de Dados

**Tabela:** `LinhaUpload`
- `saldoAnterior`: Saldo do mês anterior
- `debito`: Movimentação a débito do período
- `credito`: Movimentação a crédito do período
- `saldoAtual`: Saldo acumulado (saldoAnterior + movimentação)

### Lógica Contábil para DRE

Para **Demonstrativo de Resultado do Exercício (DRE)**:
- **Receitas**: Aumentam com crédito (positivo)
- **Despesas/Custos**: Aumentam com débito (negativo)
- **Valor do Período**: `credito - debito`
  - Se positivo: Receita líquida do período
  - Se negativo: Despesa líquida do período

**Nota:** No sistema atual, o `credito` já vem com sinal do Excel (positivo/negativo), então a fórmula pode ser simplesmente `credito - debito` ou apenas `credito` dependendo de como está armazenado.

---

## 🔧 Implementação

### 1. Backend

#### 1.1. DTO - Adicionar Tipo de Valor

**Arquivo:** `backend/src/relatorios/dto/gerar-relatorio-comparativo.dto.ts`

```typescript
export enum TipoValor {
  ACUMULADO = 'ACUMULADO',  // saldoAtual (padrão)
  PERIODO = 'PERIODO',      // movimentação do mês (credito - debito)
}

export class GerarRelatorioComparativoDto {
  // ... campos existentes ...
  
  @IsOptional()
  @IsEnum(TipoValor)
  tipoValor?: TipoValor; // Padrão: ACUMULADO
}
```

#### 1.2. Service - Modificar `buscarDadosPeriodo`

**Arquivo:** `backend/src/relatorios/relatorios.service.ts`

```typescript
private async buscarDadosPeriodo(
  mes: number,
  ano: number,
  empresaIds: string[],
  descricao?: string,
  tipoValor: TipoValor = TipoValor.ACUMULADO, // Novo parâmetro
): Promise<Map<string, number>> {
  // ... código existente de busca de uploads ...

  for (const upload of uploads) {
    for (const linha of upload.linhas) {
      // ... filtros existentes ...

      let valorLinha: number;
      
      if (tipoValor === TipoValor.PERIODO) {
        // Valor do período: movimentação do mês
        // Para DRE: crédito - débito
        // (crédito já vem com sinal do Excel)
        const debito = Number(linha.debito) || 0;
        const credito = Number(linha.credito) || 0;
        valorLinha = credito - debito;
      } else {
        // Valor acumulado (padrão)
        valorLinha = Number(linha.saldoAtual) || 0;
      }

      // Somar valores se já existe a chave
      const valorAtual = dadosPorChaveComposta.get(chaveComposta) || 0;
      dadosPorChaveComposta.set(chaveComposta, valorAtual + valorLinha);
    }
  }

  return dadosPorChaveComposta;
}
```

#### 1.3. Service - Atualizar `gerarRelatorioComparativo`

**Arquivo:** `backend/src/relatorios/relatorios.service.ts`

```typescript
async gerarRelatorioComparativo(
  tipoComparacao: string,
  mes1: number,
  ano1: number,
  mes2: number,
  ano2: number,
  tipo: TipoRelatorio,
  empresaId?: string,
  empresaIds?: string[],
  descricao?: string,
  tipoValor: TipoValor = TipoValor.ACUMULADO, // Novo parâmetro
): Promise<RelatorioComparativo> {
  // ... código existente ...

  // 2. Buscar dados dos dois períodos
  const dadosPeriodo1 = await this.buscarDadosPeriodo(
    mes1, 
    ano1, 
    empresaIdsList, 
    descricao,
    tipoValor // Passar tipoValor
  );
  const dadosPeriodo2 = await this.buscarDadosPeriodo(
    mes2, 
    ano2, 
    empresaIdsList, 
    descricao,
    tipoValor // Passar tipoValor
  );

  // ... resto do código ...
}
```

#### 1.4. Controller - Adicionar Query Parameter

**Arquivo:** `backend/src/relatorios/relatorios.controller.ts`

```typescript
@Get('comparativo')
async gerarComparativo(
  // ... parâmetros existentes ...
  @Query('tipoValor') tipoValor?: TipoValor,
) {
  // ... código existente ...

  return this.relatoriosService.gerarRelatorioComparativo(
    tipoComparacao,
    mes1,
    ano1,
    mes2,
    ano2,
    tipo,
    empresaId,
    empresaIdsArray,
    descricao,
    tipoValor || TipoValor.ACUMULADO, // Padrão: ACUMULADO
  );
}
```

### 2. Frontend

#### 2.1. Types - Adicionar Enum

**Arquivo:** `frontend/src/types/api.ts`

```typescript
export enum TipoValor {
  ACUMULADO = 'ACUMULADO',
  PERIODO = 'PERIODO',
}
```

#### 2.2. Service - Adicionar Parâmetro

**Arquivo:** `frontend/src/services/relatorios.service.ts`

```typescript
export interface GerarRelatorioComparativoParams {
  // ... campos existentes ...
  tipoValor?: TipoValor;
}

async gerarComparativo(params: GerarRelatorioComparativoParams): Promise<RelatorioComparativo> {
  const queryParams = new URLSearchParams();
  // ... parâmetros existentes ...
  
  if (params.tipoValor) {
    queryParams.append('tipoValor', params.tipoValor);
  }

  // ... resto do código ...
}
```

#### 2.3. Página - Adicionar Seletor

**Arquivo:** `frontend/src/app/(app)/relatorios/comparativo/page.tsx`

```typescript
// Importar enum
import { TipoComparacao, TipoValor } from '@/types/api';

// Adicionar estado
const [tipoValorLocal, setTipoValorLocal] = useState<TipoValor>(TipoValor.ACUMULADO);
const [tipoValor, setTipoValor] = useState<TipoValor>(TipoValor.ACUMULADO);

// Adicionar na função aplicarFiltros
const aplicarFiltros = () => {
  // ... código existente ...
  setTipoValor(tipoValorLocal);
  // ... resto ...
};

// Adicionar na query
const { data: relatorio, isLoading, error } = useQuery({
  queryKey: [
    'relatorio-comparativo',
    tipoComparacao,
    mes1,
    ano1,
    mes2,
    ano2,
    tipo,
    empresaId,
    empresaIds,
    descricao,
    tipoValor, // Adicionar aqui
  ],
  queryFn: () =>
    relatoriosService.gerarComparativo({
      // ... parâmetros existentes ...
      tipoValor, // Adicionar aqui
    }),
  enabled: false, // Mantém o comportamento atual
});

// Adicionar na seção de filtros (após "Tipo de Comparação")
<div>
  <label className="mb-2 block text-xs font-semibold text-slate-700 dark:text-slate-300">
    1.1. Tipo de Valor
  </label>
  <div className="space-y-2">
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        name="tipoValor"
        value={TipoValor.ACUMULADO}
        checked={tipoValorLocal === TipoValor.ACUMULADO}
        onChange={(e) => setTipoValorLocal(e.target.value as TipoValor)}
        className="h-3.5 w-3.5 text-sky-600 focus:ring-sky-500"
      />
      <span className="text-xs text-slate-700 dark:text-slate-300">
        Valor Acumulado
      </span>
    </label>
    <p className="ml-6 text-[10px] text-slate-500 dark:text-slate-400">
      Saldo acumulado até o mês (saldoAtual)
    </p>
    
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        name="tipoValor"
        value={TipoValor.PERIODO}
        checked={tipoValorLocal === TipoValor.PERIODO}
        onChange={(e) => setTipoValorLocal(e.target.value as TipoValor)}
        className="h-3.5 w-3.5 text-sky-600 focus:ring-sky-500"
      />
      <span className="text-xs text-slate-700 dark:text-slate-300">
        Valor do Período
      </span>
    </label>
    <p className="ml-6 text-[10px] text-slate-500 dark:text-slate-400">
      Movimentação do mês (crédito - débito)
    </p>
  </div>
</div>

// Atualizar labels no cabeçalho do relatório
{relatorio && (
  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {relatorio.empresaNome}
          {relatorio.uf && ` - ${relatorio.uf}`}
        </h2>
        <p className="text-sm text-slate-500">
          Comparação: {relatorio.periodo1.label} vs {relatorio.periodo2.label}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Tipo de valor: {tipoValor === TipoValor.ACUMULADO ? 'Acumulado' : 'Período'}
        </p>
      </div>
      {/* ... resto do código ... */}
    </div>
  </div>
)}
```

---

## ✅ Checklist de Implementação

### Backend
- [ ] Criar enum `TipoValor` no DTO
- [ ] Adicionar campo `tipoValor` no DTO (opcional, padrão ACUMULADO)
- [ ] Modificar `buscarDadosPeriodo` para aceitar `tipoValor`
- [ ] Implementar lógica de cálculo do valor do período (credito - debito)
- [ ] Atualizar `gerarRelatorioComparativo` para passar `tipoValor`
- [ ] Adicionar query parameter no controller
- [ ] Testar com dados reais (acumulado e período)

### Frontend
- [ ] Adicionar enum `TipoValor` em `types/api.ts`
- [ ] Adicionar `tipoValor` no service
- [ ] Adicionar estado `tipoValorLocal` e `tipoValor`
- [ ] Adicionar seletor de tipo de valor nos filtros
- [ ] Atualizar query key para incluir `tipoValor`
- [ ] Atualizar labels do relatório para mostrar tipo selecionado
- [ ] Adicionar tooltips explicativos
- [ ] Testar interface e comportamento

### Validação
- [ ] Verificar cálculo do valor do período (credito - debito)
- [ ] Confirmar que valores acumulados continuam funcionando
- [ ] Testar com diferentes tipos de contas (receitas, despesas)
- [ ] Validar que hierarquia funciona com ambos os tipos
- [ ] Verificar exportação Excel/PDF com ambos os tipos

---

## 🧪 Testes

### Cenários de Teste

1. **Valor Acumulado (Padrão)**
   - Selecionar "Valor Acumulado"
   - Verificar que usa `saldoAtual`
   - Comparar dois meses e verificar que valores aumentam

2. **Valor do Período**
   - Selecionar "Valor do Período"
   - Verificar que calcula `credito - debito`
   - Comparar dois meses e verificar movimentação do período

3. **Alternância**
   - Mudar de acumulado para período e vice-versa
   - Verificar que valores mudam corretamente
   - Verificar que filtros são mantidos

4. **Exportação**
   - Exportar Excel com valor acumulado
   - Exportar Excel com valor do período
   - Verificar que valores estão corretos em ambos

---

## 📝 Notas Importantes

1. **Compatibilidade:** Manter `ACUMULADO` como padrão para não quebrar comportamento existente
2. **Lógica Contábil:** Confirmar se `credito` já vem com sinal ou se precisa inverter
3. **Performance:** Cálculo do período não deve impactar performance significativamente
4. **UX:** Deixar claro qual tipo está sendo usado com labels e tooltips

---

## 🚀 Ordem de Implementação

1. **Backend primeiro:**
   - Criar enum e DTO
   - Modificar service
   - Testar com Postman/Thunder Client

2. **Frontend depois:**
   - Adicionar tipos
   - Adicionar seletor
   - Integrar com backend

3. **Validação:**
   - Testar ambos os tipos
   - Validar cálculos
   - Verificar exportação

---

## ❓ Questões a Resolver

1. **Lógica Contábil:**
   - Confirmar se `credito` já vem com sinal positivo/negativo do Excel
   - Verificar se fórmula `credito - debito` está correta para DRE
   - Validar com dados reais

2. **Labels:**
   - "Valor Acumulado" vs "Saldo Acumulado"
   - "Valor do Período" vs "Movimentação do Período"

3. **Posicionamento:**
   - Onde colocar o seletor? (dentro de "1. Tipo de Comparação" ou separado?)

---

## 📚 Referências

- Schema Prisma: `LinhaUpload` com campos `saldoAtual`, `debito`, `credito`
- Service atual: `buscarDadosPeriodo` usa `saldoAtual`
- DRE: Demonstrativo de Resultado do Exercício

