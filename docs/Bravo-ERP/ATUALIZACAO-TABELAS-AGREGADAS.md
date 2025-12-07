# Atualização de Tabelas Agregadas (Marcas, Grupos e Subgrupos)

## 📋 Resumo

**SIM, isso já está implementado e funcionando!** ✅

As tabelas de **Marcas**, **Grupos** e **Subgrupos** são atualizadas **automaticamente** no final de cada sincronização de produtos.

## 🔄 Quando Acontece

A atualização ocorre no momento da **finalização da sincronização**, especificamente:

1. **Após todos os produtos serem processados** (inseridos/atualizados no banco)
2. **Antes de marcar a sincronização como concluída**
3. **No passo de 90% do progresso** - aparece a mensagem "Atualizando tabelas de marcas, grupos e subgrupos..."

## 📍 Localização no Código

### Backend - Serviço de Sincronização

**Arquivo:** `backend/src/bravo-erp/sync/sync.service.ts`

```typescript
private async finalizarSincronizacao(
  syncLogId: string,
  resultado: { totalProdutos: number; totalPagesProcessed: number },
  // ...
): Promise<void> {
  // Atualizar progresso para 90%
  await this.progressService.updateProgress(syncLogId, {
    progress_percentage: 90,
    current_step: 'Atualizando tabelas de marcas, grupos e subgrupos...',
    // ...
  });

  // 🔥 AQUI É ONDE ACONTECE A ATUALIZAÇÃO
  await this.processorService.atualizarTabelasAgregadas();

  // Depois atualiza progresso para 100% e finaliza
  // ...
}
```

### Método de Atualização

**Arquivo:** `backend/src/bravo-erp/sync/sync-processor.service.ts`

```typescript
async atualizarTabelasAgregadas(): Promise<void> {
  // 1. Busca TODOS os produtos já salvos no banco
  const produtos = await this.prisma.produto.findMany({
    where: { marca: { not: null } },
    select: { marca: true, grupo: true, subgrupo: true },
  });

  // 2. Extrai valores únicos usando Set
  const marcasSet = new Set<string>();
  const gruposSet = new Set<string>();
  const subgruposSet = new Set<string>();

  produtos.forEach((produto) => {
    if (produto.marca) marcasSet.add(produto.marca);
    if (produto.grupo) gruposSet.add(produto.grupo);
    if (produto.subgrupo) subgruposSet.add(produto.subgrupo);
  });

  // 3. Cria/atualiza cada marca na tabela Marca
  for (const marca of Array.from(marcasSet)) {
    await this.prisma.marca.upsert({
      where: { nome: marca },
      update: {},
      create: { nome: marca },
    });
  }

  // 4. Mesmo processo para Grupos
  // 5. Mesmo processo para Subgrupos
}
```

## 📊 Como Funciona

### 1. **Origem dos Dados**

As informações de **marca**, **grupo** e **subgrupo** vêm diretamente dos **produtos importados do Bravo ERP**:

- Quando um produto é sincronizado, ele tem campos como:
  - `marca` (ex: "Samsung", "Apple")
  - `grupo` (ex: "Eletrônicos", "Informática")
  - `subgrupo` (ex: "Smartphones", "Notebooks")

### 2. **Processo de Extração**

Durante a transformação do produto (no `ProductTransformService`), esses campos são extraídos do mapeamento:

- Campo `_ref.marca.titulo` → campo `marca` da tabela `produtos`
- Campo `_ref.categoria.titulo` → campo `grupo` da tabela `produtos`
- Outros campos podem ser mapeados para `subgrupo`

### 3. **Atualização das Tabelas Agregadas**

Após todos os produtos serem salvos, o sistema:

1. **Busca todos os produtos** já salvos no banco
2. **Extrai valores únicos** de marca, grupo e subgrupo
3. **Cria ou atualiza** cada valor nas tabelas correspondentes:
   - Tabela `Marca`
   - Tabela `Grupo`
   - Tabela `Subgrupo`

### 4. **Upsert (Create or Update)**

O sistema usa `upsert`, que significa:
- Se a marca/grupo/subgrupo **já existe**, não faz nada
- Se **não existe**, cria um novo registro

Isso garante que não haja duplicatas.

## 🗂️ Estrutura das Tabelas

### Tabela `Marca`

```prisma
model Marca {
  id        String   @id @default(uuid())
  nome      String   @unique  // Ex: "Samsung", "Apple"
  createdAt DateTime @default(now())
  
  @@index([nome])
}
```

### Tabela `Grupo`

```prisma
model Grupo {
  id        String   @id @default(uuid())
  nome      String   @unique  // Ex: "Eletrônicos", "Informática"
  createdAt DateTime @default(now())
  
  @@index([nome])
}
```

### Tabela `Subgrupo`

```prisma
model Subgrupo {
  id        String   @id @default(uuid())
  nome      String   @unique  // Ex: "Smartphones", "Notebooks"
  createdAt DateTime @default(now())
  
  @@index([nome])
}
```

## 🔍 Campos nos Produtos

Os produtos têm esses campos na tabela `Produto`:

```prisma
model Produto {
  // ...
  marca            String?  // Valor extraído do mapeamento
  grupo            String?  // Valor extraído do mapeamento
  subgrupo         String?  // Valor extraído do mapeamento
  // ...
}
```

## ⚡ Fluxo Completo

```
1. Sincronização Inicia
   ↓
2. Produtos são buscados do Bravo ERP
   ↓
3. Cada produto é transformado (ProductTransformService)
   ↓
4. Campos marca/grupo/subgrupo são extraídos e salvos no produto
   ↓
5. Produtos são inseridos/atualizados na tabela Produto
   ↓
6. Sincronização chega ao final (90% do progresso)
   ↓
7. 🎯 atualizarTabelasAgregadas() é chamado
   ↓
8. Sistema busca TODOS os produtos já salvos
   ↓
9. Extrai valores únicos de marca/grupo/subgrupo
   ↓
10. Cria/atualiza nas tabelas Marca, Grupo, Subgrupo
    ↓
11. Sincronização finaliza (100%)
```

## 📝 Exemplo Prático

**Situação:**
- Produto 1: marca="Samsung", grupo="Eletrônicos", subgrupo="Smartphones"
- Produto 2: marca="Apple", grupo="Eletrônicos", subgrupo="Smartphones"
- Produto 3: marca="Samsung", grupo="Informática", subgrupo="Notebooks"

**Resultado nas Tabelas Agregadas:**

**Tabela `Marca`:**
- Samsung
- Apple

**Tabela `Grupo`:**
- Eletrônicos
- Informática

**Tabela `Subgrupo`:**
- Smartphones
- Notebooks

## ✅ Vantagens dessa Abordagem

1. **Automático**: Não precisa fazer nada manualmente
2. **Sempre atualizado**: Toda sincronização atualiza as tabelas
3. **Sem duplicatas**: Usa `upsert` para evitar registros duplicados
4. **Baseado em dados reais**: Só cria marcas/grupos que realmente existem nos produtos
5. **Performance**: Usa `Set` para eliminar duplicatas rapidamente

## 🔧 Configuração

As tabelas agregadas são populadas **automaticamente** baseadas no mapeamento configurado. Para que funcione, você precisa:

1. **Mapear o campo correto** do Bravo ERP para `marca`:
   - Exemplo: `_ref.marca.titulo` → `marca`

2. **Mapear o campo correto** do Bravo ERP para `grupo`:
   - Exemplo: `_ref.categoria.titulo` → `grupo`

3. **Mapear o campo correto** do Bravo ERP para `subgrupo`:
   - Depende de qual campo do Bravo ERP representa subgrupo

## 🎯 Comparação com painel-completo

No **painel-completo** original, isso era feito da mesma forma:
- Após sincronizar os produtos
- Extraindo valores únicos de marca/grupo/subgrupo
- Criando/atualizando nas tabelas agregadas

A implementação atual segue o mesmo padrão e já está funcionando! ✅

## 📌 Observações Importantes

1. **A atualização só acontece no final da sincronização**, não durante
2. **Usa TODOS os produtos já salvos**, não apenas os novos
3. **Se um produto for deletado**, a marca/grupo continuam nas tabelas agregadas (não há limpeza automática)
4. **Os valores vêm dos produtos mapeados**, então é importante ter o mapeamento correto
