# 📋 Plano de Melhorias: Título Dinâmico do Relatório de Resultado Econômico

> **Última Atualização**: Todas as fases (1-7) concluídas. Correções adicionais de filtro de descrição e "Expandir Níveis" implementadas.

## 📈 Progresso Geral

- ✅ **Fase 1**: Criar Função Utilitária - CONCLUÍDA
- ✅ **Fase 2**: Atualizar Página de Relatórios - CONCLUÍDA
- ✅ **Fase 3**: Atualizar Exportação - CONCLUÍDA
- ✅ **Fase 4**: Melhorar Filtro de Descrição - CONCLUÍDA
- ✅ **Fase 5**: Auto-expandir Níveis - CONCLUÍDA (com correções)
- ✅ **Fase 6**: Filtro de Mês - CONCLUÍDA
- ✅ **Fase 7**: Validação e Testes - CONCLUÍDA

**Status Geral**: ✅ **TODAS AS FASES CONCLUÍDAS**

## 🎯 Objetivo

Melhorar o título do relatório de resultado econômico para:
1. **Tipo Consolidado**: Exibir "RESULTADO ECONÔMICO CONSOLIDADO"
2. **Com empresas selecionadas**: Incluir os nomes das empresas selecionadas no título
3. **Sem empresas selecionadas (todas)**: Mostrar apenas "CONSOLIDADO"

## 📊 Análise da Situação Atual

### Estado Atual
- **Linha 697** de `page.tsx`: 
  ```typescript
  RESULTADO ECONÔMICO {relatorio.empresaNome.toUpperCase()}
  ```
- O título sempre usa `relatorio.empresaNome`, que vem do backend
- Não diferencia entre tipo CONSOLIDADO e FILIAL no título
- Não mostra os nomes das empresas quando múltiplas são selecionadas

### Dados Disponíveis
- `tipo`: `TipoRelatorio.CONSOLIDADO` ou `TipoRelatorio.FILIAL`
- `empresaIds`: Array de IDs das empresas selecionadas (quando CONSOLIDADO)
- `empresaId`: ID da empresa selecionada (quando FILIAL)
- `empresasList`: Lista completa de empresas disponíveis
- `relatorio.empresaNome`: Nome da empresa retornado pelo backend
- `relatorio.uf`: UF da empresa (quando FILIAL)

## 🏗️ Arquitetura da Solução

### 1. Lógica de Construção do Título

#### Cenário 1: Tipo FILIAL
```
RESULTADO ECONÔMICO [NOME_EMPRESA] - [UF] [ANO]
```
- Usar `relatorio.empresaNome` (já vem do backend)
- Incluir UF se disponível
- Incluir ano

#### Cenário 2: Tipo CONSOLIDADO - Sem empresas selecionadas (todas)
```
RESULTADO ECONÔMICO CONSOLIDADO - [ANO]
```
- Mostrar "CONSOLIDADO"
- Não incluir nomes de empresas
- Incluir ano

#### Cenário 3: Tipo CONSOLIDADO - Com 1 empresa selecionada
```
RESULTADO ECONÔMICO CONSOLIDADO - [NOME_EMPRESA] - [ANO]
```
- Mostrar "CONSOLIDADO"
- Incluir nome da empresa
- Incluir ano

#### Cenário 4: Tipo CONSOLIDADO - Com múltiplas empresas selecionadas
```
RESULTADO ECONÔMICO CONSOLIDADO - [NOME_1], [NOME_2], [NOME_3] - [ANO]
```
- Mostrar "CONSOLIDADO"
- Listar todos os nomes das empresas separados por vírgula
- Incluir ano

### 2. Implementação no Frontend

#### 2.1. Função Helper para Construir Título

Criar função `construirTituloRelatorio()` que:
- Recebe: `tipo`, `empresaIds`, `empresasList`, `relatorio`, `ano`
- Retorna: String formatada do título

```typescript
const construirTituloRelatorio = (
  tipo: TipoRelatorio,
  empresaIds: string[],
  empresasList: Empresa[],
  relatorio: RelatorioResultado | null,
  ano: number
): string => {
  if (tipo === TipoRelatorio.FILIAL) {
    // Cenário 1: FILIAL
    const empresaNome = relatorio?.empresaNome || '';
    const uf = relatorio?.uf || '';
    return `RESULTADO ECONÔMICO ${empresaNome.toUpperCase()}${uf ? ` - ${uf}` : ''} ${ano}`;
  }
  
  // Tipo CONSOLIDADO
  if (empresaIds.length === 0) {
    // Cenário 2: Todas as empresas
    return `RESULTADO ECONÔMICO CONSOLIDADO - ${ano}`;
  }
  
  // Cenário 3 e 4: Empresas selecionadas
  const nomesEmpresas = empresaIds
    .map(id => {
      const empresa = empresasList.find(e => e.id === id);
      return empresa?.razaoSocial || 'N/A';
    })
    .filter(nome => nome !== 'N/A');
  
  const nomesFormatados = nomesEmpresas.join(', ');
  
  return `RESULTADO ECONÔMICO CONSOLIDADO - ${nomesFormatados} - ${ano}`;
};
```

#### 2.2. Atualizar Renderização do Título

**Localização**: Linha 697 de `page.tsx`

**Antes**:
```typescript
<h2 className="text-sm font-semibold text-foreground">
  RESULTADO ECONÔMICO {relatorio.empresaNome.toUpperCase()}
  {relatorio.uf ? ` - ${relatorio.uf}` : ''} {relatorio.ano}
</h2>
```

**Depois**:
```typescript
<h2 className="text-sm font-semibold text-foreground">
  {construirTituloRelatorio(tipo, empresaIds, empresasList, relatorio, ano)}
</h2>
```

### 3. Atualizar Exportação (Excel/PDF)

#### 3.1. Arquivo: `frontend/src/utils/export-relatorio.ts`

**Localização**: Linha 200

**Antes**:
```typescript
const titulo = `RESULTADO ECONÔMICO ${relatorio.tipo === 'FILIAL' ? relatorio.empresaNome.toUpperCase() : 'CONSOLIDADO'}${relatorio.uf ? ` - ${relatorio.uf}` : ''} ${relatorio.ano}`;
```

**Depois**: 
- Passar informações adicionais para a função de exportação
- Usar a mesma lógica de construção do título
- Ou criar função compartilhada entre página e exportação

**Opção Recomendada**: Criar função utilitária compartilhada

```typescript
// frontend/src/utils/titulo-relatorio.ts
export function construirTituloRelatorio(
  tipo: TipoRelatorio,
  empresaIds: string[],
  empresasList: Empresa[],
  relatorio: RelatorioResultado | null,
  ano: number
): string {
  // ... implementação acima
}
```

## 📝 Passos de Implementação

### Fase 1: Criar Função Utilitária ✅
- [ ] Criar arquivo `frontend/src/utils/titulo-relatorio.ts`
- [ ] Implementar função `construirTituloRelatorio()`
- [ ] Adicionar tipos necessários
- [ ] Adicionar testes unitários (opcional)

### Fase 2: Atualizar Página de Relatórios ✅
- [ ] Importar função utilitária em `page.tsx`
- [ ] Substituir título estático por chamada da função
- [ ] Testar todos os cenários:
  - [ ] FILIAL com empresa selecionada
  - [ ] CONSOLIDADO sem empresas (todas)
  - [ ] CONSOLIDADO com 1 empresa
  - [ ] CONSOLIDADO com múltiplas empresas

### Fase 3: Atualizar Exportação ✅
- [ ] Atualizar `export-relatorio.ts` para usar função compartilhada
- [ ] Garantir que Excel e PDF usem o mesmo título
- [ ] Testar exportação em todos os cenários

### Fase 4: Validação e Testes ✅
- [ ] Verificar comportamento com dados reais
- [ ] Testar com diferentes quantidades de empresas
- [ ] Verificar formatação (maiúsculas, espaços, vírgulas)
- [ ] Validar que não quebra com dados ausentes

## 🔍 Considerações Técnicas

### 1. Tratamento de Dados Ausentes
- Se `relatorio` for `null`, retornar título padrão
- Se `empresasList` estiver vazia, usar fallback
- Se `empresaIds` contiver IDs inválidos, filtrar e continuar

### 2. Formatação
- Nomes em MAIÚSCULAS (conforme padrão atual)
- Separar empresas por vírgula e espaço: `, `
- Limitar comprimento do título se necessário (tooltip para completo)

### 3. Performance
- Usar `useMemo` para calcular título apenas quando necessário
- Evitar recálculos desnecessários

### 4. Acessibilidade
- Manter estrutura semântica do `<h2>`
- Garantir que título seja legível para leitores de tela

## 📌 Exemplos de Títulos Esperados

### Exemplo 1: FILIAL
```
RESULTADO ECONÔMICO REDE UNIÃO - SC - 2025
```

### Exemplo 2: CONSOLIDADO (todas)
```
RESULTADO ECONÔMICO CONSOLIDADO - 2025
```

### Exemplo 3: CONSOLIDADO (1 empresa)
```
RESULTADO ECONÔMICO CONSOLIDADO - REDE UNIÃO - SC - 2025
```

### Exemplo 4: CONSOLIDADO (múltiplas)
```
RESULTADO ECONÔMICO CONSOLIDADO - REDE UNIÃO - BA, REDE UNIÃO - ES, REDE UNIÃO - GO - 2025
```

## ✅ Critérios de Sucesso

1. ✅ Título mostra "CONSOLIDADO" quando tipo é CONSOLIDADO
2. ✅ Título mostra nomes das empresas quando selecionadas
3. ✅ Título não mostra nomes quando nenhuma empresa está selecionada (todas)
4. ✅ Título mantém formato correto para FILIAL
5. ✅ Exportação (Excel/PDF) usa o mesmo título
6. ✅ Funciona corretamente com dados reais
7. ✅ Não quebra com dados ausentes ou inválidos

## 🚀 Melhorias Adicionais Solicitadas

### Melhoria 1: Incluir Classificação/Conta no Filtro de Descrição

#### Objetivo
Melhorar a identificação das contas no filtro "Descrição" incluindo também a classificação/conta, facilitando a seleção correta pelo usuário.

#### Situação Atual
- O filtro "Descrição" retorna apenas `nomeConta` (ex: "RECEITA OPERACIONAL BRUTA")
- O usuário não vê a classificação (ex: "3.01") ou conta (ex: "1304")
- Dificulta identificar contas com nomes similares

#### Solução Proposta

**Backend - Modificar Retorno de `getDescricoesDisponiveis`**

**Arquivo**: `backend/src/relatorios/relatorios.service.ts` (linha 110)

**Antes**:
```typescript
async getDescricoesDisponiveis(busca?: string): Promise<string[]> {
  // Retorna apenas array de strings com nomeConta
  return descricoes.slice(0, 20);
}
```

**Depois**:
```typescript
interface DescricaoCompleta {
  nomeConta: string;
  classificacao: string;
  conta?: string;
  subConta?: string;
}

async getDescricoesDisponiveis(busca?: string): Promise<DescricaoCompleta[]> {
  // Buscar do catálogo com mais campos
  const contasCatalogo = await this.prisma.contaCatalogo.findMany({
    where: whereCatalogo,
    select: {
      nomeConta: true,
      classificacao: true,
      conta: true,
      subConta: true,
    },
    distinct: ['nomeConta', 'classificacao', 'conta', 'subConta'],
    orderBy: {
      classificacao: 'asc',
    },
  });

  // Buscar também das linhas de upload
  const linhasUpload = await this.prisma.linhaUpload.findMany({
    where: whereLinhas,
    select: {
      nomeConta: true,
      classificacao: true,
      conta: true,
      subConta: true,
    },
    distinct: ['nomeConta', 'classificacao', 'conta', 'subConta'],
    orderBy: {
      classificacao: 'asc',
    },
    take: 20,
  });

  // Combinar e formatar resultados
  const resultados: DescricaoCompleta[] = [];
  const visto = new Set<string>();

  for (const conta of [...contasCatalogo, ...linhasUpload]) {
    const chave = `${conta.nomeConta}|${conta.classificacao}|${conta.conta || ''}|${conta.subConta || ''}`;
    if (!visto.has(chave) && conta.nomeConta) {
      visto.add(chave);
      resultados.push({
        nomeConta: conta.nomeConta,
        classificacao: conta.classificacao,
        conta: conta.conta || undefined,
        subConta: conta.subConta || undefined,
      });
    }
  }

  return resultados.slice(0, 20);
}
```

**Frontend - Atualizar Exibição das Sugestões**

**Arquivo**: `frontend/src/app/(app)/admin/resultado-economico/relatorios/resultado/page.tsx` (linha 35)

**Antes**:
```typescript
const [descricoesSugeridas, setDescricoesSugeridas] = useState<string[]>([]);
```

**Depois**:
```typescript
interface DescricaoSugerida {
  nomeConta: string;
  classificacao: string;
  conta?: string;
  subConta?: string;
}

const [descricoesSugeridas, setDescricoesSugeridas] = useState<DescricaoSugerida[]>([]);
```

**Atualizar Service**:
```typescript
// frontend/src/services/relatorios.service.ts
async getDescricoesDisponiveis(busca?: string): Promise<DescricaoSugerida[]> {
  const queryParams = new URLSearchParams();
  if (busca && busca.trim().length > 0) {
    queryParams.append('busca', busca.trim());
  }
  const { data } = await api.get<DescricaoSugerida[]>(
    `/relatorios/descricoes-disponiveis?${queryParams.toString()}`,
  );
  return data;
}
```

**Atualizar Renderização**:
```typescript
{descricoesSugeridas.map((desc, index) => {
  const classificacaoCompleta = desc.subConta 
    ? `${desc.classificacao}.${desc.conta}.${desc.subConta}`
    : desc.conta 
    ? `${desc.classificacao}.${desc.conta}`
    : desc.classificacao;
  
  return (
    <button
      key={index}
      type="button"
      onClick={() => {
        setDescricaoLocal(desc.nomeConta);
        setMostrarSugestoes(false);
      }}
      className="w-full px-3 py-1.5 text-left text-[10px] text-foreground hover:bg-muted"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium">{desc.nomeConta}</span>
        <span className="text-[9px] text-muted-foreground font-mono">
          {classificacaoCompleta}
        </span>
      </div>
    </button>
  );
})}
```

**Atualizar Input para Mostrar Classificação**:
```typescript
// Quando selecionar uma sugestão, pode mostrar classificação também
const descricaoSelecionada = descricoesSugeridas.find(d => d.nomeConta === descricaoLocal);
```

### Melhoria 2: Auto-expandir Níveis quando Conta Estiver Selecionada

#### Objetivo
Quando uma conta estiver selecionada no filtro "Descrição" e o checkbox "Expandir Níveis" estiver marcado, o sistema deve automaticamente expandir os níveis dessa conta específica.

#### Situação Atual
- O checkbox "Expandir Níveis" expande todas as contas
- Não há expansão automática quando uma conta específica é filtrada
- Usuário precisa expandir manualmente para ver os detalhes da conta filtrada

#### Solução Proposta

**Lógica de Auto-expansão**

**Arquivo**: `frontend/src/app/(app)/admin/resultado-economico/relatorios/resultado/page.tsx`

**Adicionar useEffect para detectar conta filtrada**:
```typescript
// Encontrar conta filtrada no relatório
const contaFiltrada = useMemo(() => {
  if (!descricao || !relatorio?.contas) return null;
  
  const encontrarConta = (contas: ContaRelatorio[]): ContaRelatorio | null => {
    for (const conta of contas) {
      if (conta.nomeConta.toLowerCase().includes(descricao.toLowerCase())) {
        return conta;
      }
      if (conta.filhos) {
        const encontrada = encontrarConta(conta.filhos);
        if (encontrada) return encontrada;
      }
    }
    return null;
  };
  
  return encontrarConta(relatorio.contas);
}, [descricao, relatorio?.contas]);

// Auto-expandir quando conta filtrada for encontrada e "Expandir Níveis" estiver ativo
useEffect(() => {
  if (expandirTodosNiveis && contaFiltrada) {
    // Encontrar caminho até a conta filtrada
    const encontrarCaminho = (
      contas: ContaRelatorio[],
      alvo: ContaRelatorio,
      caminho: string[] = []
    ): string[] | null => {
      for (const conta of contas) {
        const novoCaminho = [...caminho, conta.classificacao];
        
        if (conta.classificacao === alvo.classificacao) {
          return novoCaminho;
        }
        
        if (conta.filhos) {
          const resultado = encontrarCaminho(conta.filhos, alvo, novoCaminho);
          if (resultado) return resultado;
        }
      }
      return null;
    };
    
    if (relatorio?.contas) {
      const caminho = encontrarCaminho(relatorio.contas, contaFiltrada);
      if (caminho) {
        // Expandir todos os níveis do caminho
        setContasExpandidas(new Set(caminho));
      }
    }
  }
}, [expandirTodosNiveis, contaFiltrada, relatorio?.contas]);
```

**Alternativa Mais Simples - Expandir Automaticamente ao Filtrar**:
```typescript
// Quando descrição for aplicada e "Expandir Níveis" estiver ativo
useEffect(() => {
  if (descricao && expandirTodosNiveis && relatorio?.contas) {
    // Encontrar todas as classificações que correspondem à descrição
    const encontrarClassificacoes = (
      contas: ContaRelatorio[],
      busca: string,
      resultado: string[] = []
    ): string[] => {
      for (const conta of contas) {
        if (conta.nomeConta.toLowerCase().includes(busca.toLowerCase())) {
          resultado.push(conta.classificacao);
        }
        if (conta.filhos) {
          encontrarClassificacoes(conta.filhos, busca, resultado);
        }
      }
      return resultado;
    };
    
    const classificacoes = encontrarClassificacoes(relatorio.contas, descricao);
    
    // Expandir caminho até essas classificações
    const expandirCaminho = (contas: ContaRelatorio[], alvos: string[], expandidas: Set<string>) => {
      for (const conta of contas) {
        // Se esta conta ou algum filho está nos alvos, expandir
        const temAlvo = alvos.some(a => 
          conta.classificacao === a || 
          conta.classificacao.startsWith(a + '.') ||
          a.startsWith(conta.classificacao + '.')
        );
        
        if (temAlvo && conta.filhos && conta.filhos.length > 0) {
          expandidas.add(conta.classificacao);
          expandirCaminho(conta.filhos, alvos, expandidas);
        }
      }
    };
    
    const novasExpandidas = new Set(contasExpandidas);
    expandirCaminho(relatorio.contas, classificacoes, novasExpandidas);
    setContasExpandidas(novasExpandidas);
  }
}, [descricao, expandirTodosNiveis, relatorio?.contas]);
```

## 📝 Passos de Implementação Atualizados

### Fase 1: Criar Função Utilitária ✅ CONCLUÍDA
- [x] Criar arquivo `frontend/src/utils/titulo-relatorio.ts`
- [x] Implementar função `construirTituloRelatorio()`
- [x] Adicionar tipos necessários
- [x] Adicionar testes unitários (opcional)

**Status**: ✅ Implementação completa. Função utilitária criada e funcionando corretamente.

### Fase 2: Atualizar Página de Relatórios ✅ CONCLUÍDA
- [x] Importar função utilitária em `page.tsx`
- [x] Substituir título estático por chamada da função
- [x] Testar todos os cenários:
  - [x] FILIAL com empresa selecionada
  - [x] CONSOLIDADO sem empresas (todas)
  - [x] CONSOLIDADO com 1 empresa
  - [x] CONSOLIDADO com múltiplas empresas

**Status**: ✅ Implementação completa. Título dinâmico funcionando em todos os cenários.

### Fase 3: Atualizar Exportação ✅ CONCLUÍDA
- [x] Atualizar `export-relatorio.ts` para usar função compartilhada
- [x] Garantir que Excel e PDF usem o mesmo título
- [x] Testar exportação em todos os cenários

**Status**: ✅ Implementação completa. Exportação Excel e PDF usando título dinâmico.

### Fase 4: Melhorar Filtro de Descrição ✅ CONCLUÍDA
- [x] **Backend**: Modificar `getDescricoesDisponiveis` para retornar objeto com classificação
- [x] **Backend**: Atualizar controller para retornar novo formato
- [x] **Frontend**: Atualizar tipo `DescricaoSugerida`
- [x] **Frontend**: Atualizar service para usar novo tipo
- [x] **Frontend**: Atualizar renderização das sugestões para mostrar classificação
- [x] **Frontend**: Testar busca e seleção de contas

**Status**: ✅ Implementação completa. Filtro de descrição agora mostra classificação/conta nas sugestões.

### Fase 5: Auto-expandir Níveis ✅ CONCLUÍDA (com correções)
- [x] Implementar lógica para encontrar conta filtrada
- [x] Adicionar `useEffect` para auto-expansão quando conta filtrada
- [x] Garantir que funciona com "Expandir Níveis" ativo
- [x] Testar com diferentes contas e níveis hierárquicos
- [x] Garantir que não quebra quando conta não é encontrada

**Status**: ✅ Implementação completa com correções (ver detalhes na seção "Correções Implementadas" acima).

### Fase 6: Validação e Testes ✅ PARCIALMENTE CONCLUÍDA
- [ ] Verificar comportamento com dados reais
- [ ] Testar com diferentes quantidades de empresas
- [ ] Verificar formatação (maiúsculas, espaços, vírgulas)
- [ ] Validar que não quebra com dados ausentes
- [ ] Testar filtro de descrição com classificação
- [ ] Testar auto-expansão em diferentes cenários

## 🔍 Considerações Técnicas Adicionais

### 1. Filtro de Descrição com Classificação
- **Performance**: Limitar resultados a 20 para não sobrecarregar
- **Formatação**: Mostrar classificação de forma clara (ex: "3.01" ou "3.01.1304")
- **Busca**: Manter busca case-insensitive
- **Compatibilidade**: Garantir que funciona com dados antigos (fallback)

### 2. Auto-expansão de Níveis
- **Performance**: Evitar recálculos desnecessários
- **Estado**: Sincronizar com estado de `contasExpandidas`
- **UX**: Não expandir tudo, apenas o caminho até a conta filtrada
- **Feedback Visual**: Destacar a conta filtrada (opcional)

## 📌 Exemplos de Uso

### Exemplo 1: Filtro de Descrição com Classificação
**Antes**:
```
RECEITA OPERACIONAL BRUTA
```

**Depois**:
```
RECEITA OPERACIONAL BRUTA                    3.01
```

### Exemplo 2: Auto-expansão
**Cenário**: Usuário filtra por "RECEITA OPERACIONAL BRUTA" e marca "Expandir Níveis"

**Comportamento Esperado**:
- Sistema encontra conta "3.01 - RECEITA OPERACIONAL BRUTA"
- Expande automaticamente o caminho: "3" → "3.01"
- Mostra todos os filhos de "3.01" (se houver)
- Mantém outras contas colapsadas (se não expandir todos)

## ✅ Critérios de Sucesso Atualizados

1. ✅ Título mostra "CONSOLIDADO" quando tipo é CONSOLIDADO
2. ✅ Título mostra nomes das empresas quando selecionadas
3. ✅ Título não mostra nomes quando nenhuma empresa está selecionada (todas)
4. ✅ Título mantém formato correto para FILIAL
5. ✅ Exportação (Excel/PDF) usa o mesmo título
6. ✅ Filtro de descrição mostra classificação/conta
7. ✅ Auto-expansão funciona quando conta está filtrada e "Expandir Níveis" está ativo
8. ✅ Funciona corretamente com dados reais
9. ✅ Não quebra com dados ausentes ou inválidos

## 🚀 Melhoria 3: Filtro de Mês (Intervalo de Meses)

### Objetivo
Permitir que o usuário selecione um intervalo de meses (ex: Janeiro a Setembro) para exibir apenas os meses selecionados no relatório, facilitando análises de períodos específicos.

### Situação Atual
- O relatório sempre mostra todos os meses do ano (Janeiro a Dezembro)
- Não há opção de filtrar por meses específicos
- Usuário precisa visualizar todos os meses mesmo quando só precisa de um período

### Solução Proposta

#### Arquitetura

**Cenários de Uso**:
1. **Todos os meses** (padrão): Mostra Janeiro a Dezembro
2. **Intervalo de meses**: Ex: Janeiro a Setembro (mostra apenas meses 1-9)
3. **Meses específicos**: Ex: Janeiro, Março, Junho (seleção múltipla)

**Recomendação**: Implementar seleção de intervalo (mês inicial e mês final) por ser mais intuitivo e comum.

#### Backend - Adicionar Parâmetros de Filtro

**Arquivo**: `backend/src/relatorios/relatorios.controller.ts` (linha 39)

**Adicionar parâmetros opcionais**:
```typescript
@Get('resultado')
async gerarResultado(
  @Query('ano', ParseIntPipe) ano: number,
  @Query('empresaId') empresaId?: string,
  @Query('empresaIds') empresaIds?: string | string[],
  @Query('tipo') tipo: TipoRelatorio = TipoRelatorio.CONSOLIDADO,
  @Query('descricao') descricao?: string,
  @Query('mesInicial', new ParseIntPipe({ optional: true })) mesInicial?: number, // 1-12
  @Query('mesFinal', new ParseIntPipe({ optional: true })) mesFinal?: number, // 1-12
) {
  // Validar intervalo
  if (mesInicial && (mesInicial < 1 || mesInicial > 12)) {
    throw new BadRequestException('mesInicial deve estar entre 1 e 12');
  }
  if (mesFinal && (mesFinal < 1 || mesFinal > 12)) {
    throw new BadRequestException('mesFinal deve estar entre 1 e 12');
  }
  if (mesInicial && mesFinal && mesInicial > mesFinal) {
    throw new BadRequestException('mesInicial deve ser menor ou igual a mesFinal');
  }

  const empresaIdsArray = Array.isArray(empresaIds)
    ? empresaIds
    : empresaIds
      ? [empresaIds]
      : undefined;

  return this.relatoriosService.gerarRelatorioResultado(
    ano,
    empresaId,
    empresaIdsArray,
    tipo,
    descricao,
    mesInicial,
    mesFinal,
  );
}
```

**Arquivo**: `backend/src/relatorios/relatorios.service.ts` (linha 194)

**Atualizar assinatura do método**:
```typescript
async gerarRelatorioResultado(
  ano: number,
  empresaId?: string,
  empresaIds?: string[],
  tipo: TipoRelatorio = TipoRelatorio.CONSOLIDADO,
  descricao?: string,
  mesInicial?: number,
  mesFinal?: number,
): Promise<RelatorioResultado> {
  // ... código existente ...

  // Determinar período a ser exibido
  const mesesCompletos = [
    { mes: 1, nome: 'Janeiro' },
    { mes: 2, nome: 'Fevereiro' },
    { mes: 3, nome: 'Março' },
    { mes: 4, nome: 'Abril' },
    { mes: 5, nome: 'Maio' },
    { mes: 6, nome: 'Junho' },
    { mes: 7, nome: 'Julho' },
    { mes: 8, nome: 'Agosto' },
    { mes: 9, nome: 'Setembro' },
    { mes: 10, nome: 'Outubro' },
    { mes: 11, nome: 'Novembro' },
    { mes: 12, nome: 'Dezembro' },
  ];

  // Filtrar período se especificado
  let periodo: Array<{ mes: number; nome: string }>;
  if (mesInicial && mesFinal) {
    periodo = mesesCompletos.filter(
      (m) => m.mes >= mesInicial && m.mes <= mesFinal
    );
  } else if (mesInicial) {
    periodo = mesesCompletos.filter((m) => m.mes >= mesInicial);
  } else if (mesFinal) {
    periodo = mesesCompletos.filter((m) => m.mes <= mesFinal);
  } else {
    periodo = mesesCompletos; // Todos os meses (padrão)
  }

  // ... resto do código existente ...

  return {
    empresaId: tipo === TipoRelatorio.FILIAL ? empresaId : undefined,
    empresaNome,
    uf: ufRelatorio,
    ano,
    tipo,
    periodo, // Usar período filtrado
    contas: raiz,
  };
}
```

**Observação**: Os valores das contas já estão organizados por mês (`valores[mes]`), então não é necessário filtrar os dados, apenas o período retornado.

#### Frontend - Adicionar Filtros de Mês

**Arquivo**: `frontend/src/app/(app)/admin/resultado-economico/relatorios/resultado/page.tsx`

**Adicionar estados**:
```typescript
// Estados locais dos filtros
const [mesInicialLocal, setMesInicialLocal] = useState<number | undefined>(undefined);
const [mesFinalLocal, setMesFinalLocal] = useState<number | undefined>(undefined);

// Estados dos filtros aplicados
const [mesInicial, setMesInicial] = useState<number | undefined>(undefined);
const [mesFinal, setMesFinal] = useState<number | undefined>(undefined);
```

**Adicionar constantes de meses**:
```typescript
const meses = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];
```

**Atualizar params**:
```typescript
const params = useMemo(
  () => ({
    ano,
    tipo,
    empresaId: tipo === 'FILIAL' ? empresaId : undefined,
    empresaIds: tipo === TipoRelatorio.CONSOLIDADO && empresaIds.length > 0 ? empresaIds : undefined,
    descricao: descricao && descricao.trim().length > 0 ? descricao : undefined,
    mesInicial: mesInicial && mesInicial >= 1 && mesInicial <= 12 ? mesInicial : undefined,
    mesFinal: mesFinal && mesFinal >= 1 && mesFinal <= 12 ? mesFinal : undefined,
  }),
  [ano, tipo, empresaId, empresaIds, descricao, mesInicial, mesFinal],
);
```

**Adicionar campos de filtro na UI** (após o filtro de Descrição):
```typescript
{/* Filtro de Mês Inicial */}
<div className="min-w-[150px]">
  <label
    htmlFor="mes-inicial"
    className="mb-0.5 block text-[10px] font-medium text-foreground"
  >
    Mês Inicial (opcional)
  </label>
  <select
    id="mes-inicial"
    value={mesInicialLocal || ''}
    onChange={(e) => {
      const valor = e.target.value ? parseInt(e.target.value) : undefined;
      setMesInicialLocal(valor);
      // Se mesFinal estiver definido e for menor que mesInicial, resetar mesFinal
      if (valor && mesFinalLocal && valor > mesFinalLocal) {
        setMesFinalLocal(undefined);
      }
    }}
    className="h-7 w-full rounded border border-border bg-input px-2 text-[10px] text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
  >
    <option value="">Todos</option>
    {meses.map((mes) => (
      <option key={mes.value} value={mes.value}>
        {mes.label}
      </option>
    ))}
  </select>
</div>

{/* Filtro de Mês Final */}
<div className="min-w-[150px]">
  <label
    htmlFor="mes-final"
    className="mb-0.5 block text-[10px] font-medium text-foreground"
  >
    Mês Final (opcional)
  </label>
  <select
    id="mes-final"
    value={mesFinalLocal || ''}
    onChange={(e) => {
      const valor = e.target.value ? parseInt(e.target.value) : undefined;
      setMesFinalLocal(valor);
      // Se mesInicial estiver definido e for maior que mesFinal, resetar mesInicial
      if (valor && mesInicialLocal && valor < mesInicialLocal) {
        setMesInicialLocal(undefined);
      }
    }}
    disabled={!mesInicialLocal} // Desabilitar se não houver mês inicial
    className="h-7 w-full rounded border border-border bg-input px-2 text-[10px] text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <option value="">Todos</option>
    {meses
      .filter((mes) => !mesInicialLocal || mes.value >= mesInicialLocal)
      .map((mes) => (
        <option key={mes.value} value={mes.value}>
          {mes.label}
        </option>
      ))}
  </select>
  {mesInicialLocal && (
    <p className="mt-0.5 text-[9px] text-slate-500">
      {mesInicialLocal === mesFinalLocal
        ? 'Mesmo mês selecionado'
        : mesFinalLocal
        ? `${meses.find(m => m.value === mesInicialLocal)?.label} a ${meses.find(m => m.value === mesFinalLocal)?.label}`
        : `A partir de ${meses.find(m => m.value === mesInicialLocal)?.label}`}
    </p>
  )}
</div>
```

**Atualizar função `aplicarFiltros`**:
```typescript
const aplicarFiltros = () => {
  setAno(anoLocal);
  setTipo(tipoLocal);
  setEmpresaId(empresaIdLocal);
  setEmpresaIds(empresaIdsLocal);
  setDescricao(descricaoLocal);
  setMesInicial(mesInicialLocal);
  setMesFinal(mesFinalLocal);
  // Recolher os filtros após aplicar
  setFiltrosExpandidos(false);
  setMostrarSugestoes(false);
};
```

**Atualizar função `limparFiltros`**:
```typescript
const limparFiltros = () => {
  // ... código existente ...
  setMesInicialLocal(undefined);
  setMesFinalLocal(undefined);
  setMesInicial(undefined);
  setMesFinal(undefined);
  // ... resto do código ...
};
```

**Atualizar exibição de filtros aplicados**:
```typescript
{tipo === TipoRelatorio.CONSOLIDADO && empresaIds.length > 0 && (
  <>
    <span>•</span>
    <span>{empresaIds.length} empresa(s) selecionada(s)</span>
  </>
)}
{(mesInicial || mesFinal) && (
  <>
    <span>•</span>
    <span>
      Período:{' '}
      {mesInicial && mesFinal
        ? `${meses.find(m => m.value === mesInicial)?.label} a ${meses.find(m => m.value === mesFinal)?.label}`
        : mesInicial
        ? `A partir de ${meses.find(m => m.value === mesInicial)?.label}`
        : `Até ${meses.find(m => m.value === mesFinal)?.label}`}
    </span>
  </>
)}
```

**Atualizar Service**:
```typescript
// frontend/src/services/relatorios.service.ts
export interface GerarRelatorioParams {
  ano: number;
  empresaId?: string;
  empresaIds?: string[];
  tipo: TipoRelatorio;
  descricao?: string;
  mesInicial?: number;
  mesFinal?: number;
}
```

### Considerações Técnicas

1. **Validação**:
   - Mês inicial deve ser <= mês final
   - Valores devem estar entre 1 e 12
   - Se apenas um mês for selecionado, usar como inicial e final

2. **UX**:
   - Mês final desabilitado até selecionar mês inicial
   - Mostrar preview do intervalo selecionado
   - Limpar filtros reseta os meses

3. **Performance**:
   - Filtro não afeta a query do banco (dados já estão carregados)
   - Apenas filtra o array de período retornado
   - Recalcular totais apenas para meses visíveis

4. **Total**:
   - ✅ **IMPLEMENTADO**: O total reflete apenas os meses do período filtrado
   - ✅ Total é recalculado automaticamente quando há filtro de mês
   - ✅ Função `recalcularTotaisPorPeriodo()` implementada no backend

## 📝 Passos de Implementação Atualizados

### Fase 1: Criar Função Utilitária ✅
- [ ] Criar arquivo `frontend/src/utils/titulo-relatorio.ts`
- [ ] Implementar função `construirTituloRelatorio()`
- [ ] Adicionar tipos necessários
- [ ] Adicionar testes unitários (opcional)

### Fase 2: Atualizar Página de Relatórios ✅
- [ ] Importar função utilitária em `page.tsx`
- [ ] Substituir título estático por chamada da função
- [ ] Testar todos os cenários:
  - [ ] FILIAL com empresa selecionada
  - [ ] CONSOLIDADO sem empresas (todas)
  - [ ] CONSOLIDADO com 1 empresa
  - [ ] CONSOLIDADO com múltiplas empresas

### Fase 3: Atualizar Exportação ✅
- [ ] Atualizar `export-relatorio.ts` para usar função compartilhada
- [ ] Garantir que Excel e PDF usem o mesmo título
- [ ] Testar exportação em todos os cenários

### Fase 4: Melhorar Filtro de Descrição ✅
- [ ] **Backend**: Modificar `getDescricoesDisponiveis` para retornar objeto com classificação
- [ ] **Backend**: Atualizar controller para retornar novo formato
- [ ] **Frontend**: Atualizar tipo `DescricaoSugerida`
- [ ] **Frontend**: Atualizar service para usar novo tipo
- [ ] **Frontend**: Atualizar renderização das sugestões para mostrar classificação
- [ ] **Frontend**: Testar busca e seleção de contas

### Fase 5: Auto-expandir Níveis ✅
- [ ] Implementar lógica para encontrar conta filtrada
- [ ] Adicionar `useEffect` para auto-expansão quando conta filtrada
- [ ] Garantir que funciona com "Expandir Níveis" ativo
- [ ] Testar com diferentes contas e níveis hierárquicos
- [ ] Garantir que não quebra quando conta não é encontrada

### Fase 6: Filtro de Mês ✅ CONCLUÍDA
- [x] **Backend**: Adicionar parâmetros `mesInicial` e `mesFinal` no controller
- [x] **Backend**: Adicionar validação de intervalo
- [x] **Backend**: Atualizar `gerarRelatorioResultado` para filtrar período
- [x] **Backend**: Recalcular totais baseado no período filtrado
- [x] **Backend**: Testar com diferentes intervalos
- [x] **Frontend**: Adicionar estados para meses inicial e final
- [x] **Frontend**: Adicionar selects de mês na UI
- [x] **Frontend**: Implementar validação e sincronização entre selects
- [x] **Frontend**: Atualizar `params` para incluir meses
- [x] **Frontend**: Atualizar service com novos parâmetros
- [x] **Frontend**: Atualizar exibição de filtros aplicados
- [x] **Frontend**: Testar todos os cenários (todos, intervalo, apenas inicial, apenas final)

**Status**: ✅ Implementação completa.

**Arquivos Modificados**:
- `backend/src/relatorios/relatorios.controller.ts`: Adicionados parâmetros e validação
- `backend/src/relatorios/relatorios.service.ts`: Filtro de período e recálculo de totais
- `frontend/src/app/(app)/admin/resultado-economico/relatorios/resultado/page.tsx`: UI e estados
- `frontend/src/services/relatorios.service.ts`: Interface e parâmetros atualizados

**Funcionalidades Implementadas**:
- Seleção de intervalo de meses (inicial e final)
- Validação automática (inicial <= final)
- Mês final desabilitado até selecionar inicial
- Preview do intervalo selecionado
- Total recalculado apenas para meses do período filtrado
- Exibição de período filtrado nos filtros aplicados

### Fase 7: Validação e Testes ✅ CONCLUÍDA
- [x] Verificar comportamento com dados reais
- [x] Testar com diferentes quantidades de empresas
- [x] Verificar formatação (maiúsculas, espaços, vírgulas)
- [x] Validar que não quebra com dados ausentes
- [x] Testar filtro de descrição com classificação
- [x] Testar auto-expansão em diferentes cenários
- [x] Testar filtro de mês com diferentes intervalos
- [x] Validar que total reflete apenas meses do período filtrado

**Status**: ✅ Todos os testes concluídos.

## 📌 Exemplos de Uso - Filtro de Mês

### Exemplo 1: Intervalo Completo
**Seleção**: Mês Inicial: Janeiro (1), Mês Final: Setembro (9)
**Resultado**: Tabela mostra apenas colunas de Janeiro a Setembro + Total

### Exemplo 2: A partir de um mês
**Seleção**: Mês Inicial: Julho (7), Mês Final: (vazio)
**Resultado**: Tabela mostra colunas de Julho a Dezembro + Total

### Exemplo 3: Até um mês
**Seleção**: Mês Inicial: (vazio), Mês Final: Junho (6)
**Resultado**: Tabela mostra colunas de Janeiro a Junho + Total

### Exemplo 4: Mês único
**Seleção**: Mês Inicial: Março (3), Mês Final: Março (3)
**Resultado**: Tabela mostra apenas coluna de Março + Total

## ✅ Critérios de Sucesso Atualizados

### Fases 1-5: ✅ TODAS CONCLUÍDAS

1. ✅ Título mostra "CONSOLIDADO" quando tipo é CONSOLIDADO
2. ✅ Título mostra nomes das empresas quando selecionadas
3. ✅ Título não mostra nomes quando nenhuma empresa está selecionada (todas)
4. ✅ Título mantém formato correto para FILIAL
5. ✅ Exportação (Excel/PDF) usa o mesmo título
6. ✅ Filtro de descrição mostra classificação/conta
7. ✅ Auto-expansão funciona quando conta está filtrada e "Expandir Níveis" está ativo
8. ✅ Auto-expansão baseada em classificação (não nome)
9. ✅ Backend inclui todos os filhos de contas filtradas
10. ✅ Funciona corretamente com dados reais
11. ✅ Não quebra com dados ausentes ou inválidos

### Fase 6: ✅ CONCLUÍDA

12. ✅ Filtro de mês permite selecionar intervalo (inicial e final)
13. ✅ Filtro de mês valida que inicial <= final
14. ✅ Tabela mostra apenas meses do intervalo selecionado
15. ✅ Total reflete apenas meses do período filtrado (recalculado corretamente)

## 📊 Resumo de Implementação

### ✅ Fases Concluídas (1-5)

**Fase 1**: Função utilitária para título dinâmico
- Arquivo: `frontend/src/utils/titulo-relatorio.ts`
- Status: ✅ Completo e testado

**Fase 2**: Atualização da página de relatórios
- Arquivo: `frontend/src/app/(app)/admin/resultado-economico/relatorios/resultado/page.tsx`
- Status: ✅ Completo e testado

**Fase 3**: Atualização da exportação
- Arquivo: `frontend/src/utils/export-relatorio.ts`
- Status: ✅ Completo e testado

**Fase 4**: Melhoria do filtro de descrição
- Backend: `backend/src/relatorios/relatorios.service.ts`
- Frontend: `frontend/src/services/relatorios.service.ts` e páginas de relatórios
- Status: ✅ Completo e testado

**Fase 5**: Auto-expansão de níveis hierárquicos
- Backend: Lógica para incluir filhos de contas filtradas
- Frontend: Auto-expansão baseada em classificação
- Status: ✅ Completo com correções implementadas

### ✅ Fase Concluída (6)

**Fase 6**: Filtro de mês (intervalo)
- Backend: Filtro de período e recálculo de totais
- Frontend: UI com selects e validação
- Status: ✅ Completo e testado

## 🚀 Correções Adicionais Implementadas

### Correção: Filtro de Descrição e "Expandir Níveis"

**Problemas Identificados**:
1. "Expandir Níveis" não funcionava corretamente com filtro de descrição
2. Filtro de descrição não distinguia entre contas com mesmo nome mas diferentes classificação/conta/subConta
3. Sistema mostrava hierarquia pai da conta filtrada (não deveria)

**Soluções Implementadas**:
1. ✅ Modificado `useEffect` de "Expandir Níveis" para considerar filtro de descrição
2. ✅ Implementado sistema de chave única (`classificacao|conta|subConta`) para identificação precisa
3. ✅ Simplificada lógica de filtro para mostrar apenas conta filtrada e seus filhos (sem pais)

**Arquivos Modificados**:
- `frontend/src/app/(app)/admin/resultado-economico/relatorios/resultado/page.tsx`
- `backend/src/relatorios/relatorios.service.ts`

**Documentação Completa**: Ver `docs/plano-correcao-expandir-niveis-e-descricao.md`

## 🚀 Próximos Passos Após Implementação

### Imediatos
1. ✅ Implementar Fase 6: Filtro de mês (intervalo de meses) - **CONCLUÍDO**
2. ✅ Correções de filtro de descrição e "Expandir Níveis" - **CONCLUÍDO**
3. ✅ Coletar feedback dos usuários sobre melhorias implementadas
4. ✅ Todas as melhorias principais foram implementadas

### Futuras Melhorias
1. Considerar adicionar UF nas empresas do título consolidado (se necessário)
2. Considerar limitar número de empresas no título (ex: "e mais 3 empresas")
3. Adicionar tooltip com lista completa se título for muito longo
4. Considerar destacar visualmente a conta filtrada na tabela
5. Considerar adicionar busca também por classificação no filtro de descrição
6. Considerar opção de mostrar total apenas dos meses filtrados (além do total anual)
7. Considerar adicionar atalhos rápidos (ex: "Últimos 3 meses", "Primeiro semestre")

