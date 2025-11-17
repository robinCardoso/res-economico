# Estrutura da DRE (Demonstração do Resultado do Exercício)

## O que é DRE?

A Demonstração do Resultado do Exercício (DRE) é um relatório contábil obrigatório no Brasil que apresenta, de forma estruturada e hierárquica, as receitas, custos e despesas de uma empresa em um determinado período, evidenciando o resultado líquido (lucro ou prejuízo).

## Estrutura Hierárquica da DRE

A DRE segue uma estrutura hierárquica específica, onde cada nível representa um agrupamento de contas:

### Nível 1 - Categorias Principais
- **Receitas Operacionais Brutas**
- **Deduções das Receitas**
- **Receitas Operacionais Líquidas**
- **Custos**
- **Despesas Operacionais**
- **Resultado Operacional**
- **Outras Receitas/Despesas**
- **Resultado Antes dos Tributos**
- **Tributos sobre o Lucro**
- **Resultado Líquido do Exercício**

### Nível 2 - Subcategorias
Cada categoria principal pode ter subcategorias, por exemplo:
- **Receitas Operacionais Brutas**
  - Receita Bruta de Vendas
  - Receita Bruta de Serviços
- **Despesas Operacionais**
  - Despesas Administrativas
  - Despesas Comerciais
  - Despesas Financeiras

### Níveis 3, 4, 5+ - Detalhamento
Cada subcategoria pode ser detalhada em níveis mais profundos, até chegar nas contas específicas.

## Regras de Apresentação

### 1. Hierarquia Visual
- Contas de nível superior (pais) devem aparecer antes das contas filhas
- Contas filhas devem estar indentadas em relação aos pais
- Valores das contas pais = soma dos valores das contas filhas

### 2. Formatação de Valores
- **Receitas:** Valores positivos (ou vazios se zero)
- **Custos e Despesas:** Valores negativos (ou entre parênteses em alguns formatos)
- **Resultados Intermediários:** Podem ser positivos (lucro) ou negativos (prejuízo)
- **Formato numérico:** Separador de milhar (ponto ou vírgula), 2 casas decimais

### 3. Cálculos
- **Receita Líquida** = Receita Bruta - Deduções
- **Lucro Bruto** = Receita Líquida - Custo das Mercadorias Vendidas
- **Lucro Operacional** = Lucro Bruto - Despesas Operacionais
- **Resultado Antes dos Tributos** = Lucro Operacional + Outras Receitas - Outras Despesas
- **Resultado Líquido** = Resultado Antes dos Tributos - Tributos sobre o Lucro

### 4. Ordem de Apresentação
A DRE deve seguir a ordem natural do fluxo de resultados:
1. Receitas (topo)
2. Deduções (reduzem receitas)
3. Custos (reduzem resultado)
4. Despesas (reduzem resultado)
5. Resultados intermediários (lucro bruto, operacional, etc.)
6. Tributos (reduzem resultado)
7. Resultado final (lucro/prejuízo líquido)

## Identificação no Sistema

No sistema, as contas DRE são identificadas por:
- **tipoConta = "3-DRE"** (campo no Excel da contabilidade)
- **nivel** (indica a hierarquia: 1, 2, 3, 4, 5, etc.)
- **classificacao** (código hierárquico como "3.", "3.01", "3.01.01", etc.)

## Filtros para Relatório DRE

Para gerar um relatório DRE correto, o sistema deve:
1. **Filtrar apenas contas com `tipoConta = "3-DRE"`**
2. **Ordenar por `classificacao`** (garante ordem hierárquica)
3. **Agrupar por `nivel`** (para formatação visual)
4. **Calcular totais hierárquicos** (pais = soma dos filhos)
5. **Agrupar valores por mês** (para relatório anual)

## Exemplo de Estrutura

```
3. RECEITA OPERACIONAL BRUTA (nível 1)
  3.01. Receita Bruta de Vendas (nível 2)
    3.01.01. Vendas de Produtos (nível 3)
      3.01.01.01. Vendas no Mercado Interno (nível 4)
      3.01.01.02. Vendas no Mercado Externo (nível 4)
  3.02. Receita Bruta de Serviços (nível 2)
    3.02.01. Prestação de Serviços (nível 3)

3.10. DEDUÇÕES DAS RECEITAS (nível 1)
  3.10.01. Impostos sobre Vendas (nível 2)
  3.10.02. Devoluções de Vendas (nível 2)

3.20. RECEITA OPERACIONAL LÍQUIDA (nível 1) = 3. - 3.10.

3.30. CUSTO DAS MERCADORIAS VENDIDAS (nível 1)
  3.30.01. Custo dos Produtos Vendidos (nível 2)

3.40. LUCRO BRUTO (nível 1) = 3.20. - 3.30.

3.50. DESPESAS OPERACIONAIS (nível 1)
  3.50.01. Despesas Administrativas (nível 2)
  3.50.02. Despesas Comerciais (nível 2)

3.60. LUCRO OPERACIONAL (nível 1) = 3.40. - 3.50.

3.70. RESULTADO ANTES DOS TRIBUTOS (nível 1)

3.80. TRIBUTOS SOBRE O LUCRO (nível 1)

3.90. RESULTADO LÍQUIDO DO EXERCÍCIO (nível 1) = 3.70. - 3.80.
```

## Referências

- Lei 6.404/76 (Lei das S.A.) - Art. 187
- CPC 26 (R1) - Demonstração do Resultado
- Normas do CFC (Conselho Federal de Contabilidade)

