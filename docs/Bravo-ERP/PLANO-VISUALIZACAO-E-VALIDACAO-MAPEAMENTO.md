# 📋 PLANO: Visualização da API e Validação de Duplicidade no Mapeamento

## 🎯 Objetivos

1. **Visualizar resposta da API Bravo ERP diretamente no painel de mapeamento**
   - Exibir valores reais da API ao lado de cada campo mapeado
   - Facilitar validação visual do mapeamento pelo usuário

2. **Prevenir duplicidade de mapeamento**
   - Campos do sistema já mapeados ficam indisponíveis para outros mapeamentos
   - Melhorar UX e evitar erros de configuração

---

## 📊 Situação Atual

### ❌ Problemas Identificados

1. **Sem visualização dos valores da API**: Usuário não vê o valor real que será mapeado
2. **Duplicidade permitida**: Um mesmo campo do sistema pode ser mapeado múltiplas vezes
3. **Sem feedback visual**: Difícil validar se o mapeamento está correto sem executar sincronização

### ✅ Benefícios da Implementação

- ✅ Validação imediata dos valores que serão mapeados
- ✅ Prevenção de erros de configuração
- ✅ Melhor experiência do usuário
- ✅ Reduz necessidade de usar preview para validação básica

---

## 🔧 MELHORIA 1: Visualização da Resposta da API no Mapeamento

### Objetivo
Exibir o valor real do campo da API Bravo ERP ao lado de cada campo mapeado, diretamente na linha do mapeamento.

### Implementação

#### Backend
**Nenhuma alteração necessária** - Já temos:
- ✅ `getBravoFields()` retorna `product_sample` com o produto completo
- ✅ `previewMapping()` retorna valores originais e mapeados

**Opção:** Criar endpoint específico para retornar apenas o produto de exemplo:
- `GET /bravo-erp/mapping/sample-product`
  - Retorna o primeiro produto (ordenado por `id_produto ASC`)
  - Formato: `{ success: boolean, product?: any, error?: string }`

#### Frontend

1. **Carregar produto de exemplo ao iniciar**
   - Ao montar o componente `MappingPanel`, buscar produto de exemplo
   - Armazenar em estado: `sampleProduct: any | null`

2. **Exibir valor ao lado de cada campo mapeado**
   - Adicionar coluna extra na linha de mapeamento
   - Mostrar valor do campo usando `getNestedValue(sampleProduct, campo_bravo)`
   - Formatar valor conforme tipo (string, number, date, etc)

3. **Layout da linha de mapeamento**
   ```
   [Campo Bravo ERP ▼] → [Valor da API] → [Campo Sistema ▼] → [Transformação ▼] → [Ativo ✓] [🗑️]
   ```
   
   Ou em layout mais compacto:
   ```
   [Campo Bravo ERP ▼] → [Campo Sistema ▼] → [Transformação ▼] → [Valor: "XXX"] → [Ativo ✓] [🗑️]
   ```

4. **Tooltip/Expansão**
   - Ao passar mouse no valor, mostrar tooltip com valor completo
   - Ou botão para expandir/colapsar detalhes do campo

---

## 🔧 MELHORIA 2: Prevenção de Duplicidade de Mapeamento

### Objetivo
Tornar campos do sistema já mapeados indisponíveis em outros mapeamentos.

### Implementação

#### Frontend - Lógica

1. **Identificar campos já mapeados**
   ```typescript
   const camposMapeados = new Set(
     mapeamentos
       .filter(m => m.ativo && m.campo_interno)
       .map(m => m.campo_interno)
   );
   ```

2. **Filtrar opções do Select "Campo Sistema"**
   - Remover campos já mapeados da lista de opções
   - OU mostrar como `disabled` com indicador visual

3. **Quando um campo é desmapeado (removido ou desativado)**
   - Campo volta a ficar disponível para outros mapeamentos

4. **Tratamento especial para o campo atual**
   - O próprio campo do mapeamento atual deve permanecer disponível
   - Apenas outros campos não devem poder selecionar o mesmo

#### Interface do Select

**Opção 1: Remover da lista**
- Mais limpo visualmente
- Usuário não vê opções indisponíveis

**Opção 2: Mostrar como disabled com badge**
- Usuário vê que o campo existe mas está mapeado
- Pode indicar em qual linha está mapeado
- Mais informativo

**Recomendação:** Opção 2 (disabled com indicador)

#### Indicador Visual

1. **Badge "Já mapeado"** no campo disabled
2. **Tooltip** mostrando em qual linha está o mapeamento
3. **Ícone** indicando que está indisponível

---

## 📐 Estrutura de Implementação

### FASE 1: Preparação Backend (Opcional)

**Arquivo:** `backend/src/bravo-erp/mapping/mapping.controller.ts`

```typescript
@Get('mapping/sample-product')
async getSampleProduct() {
  return this.mappingService.getSampleProduct();
}
```

**Arquivo:** `backend/src/bravo-erp/mapping/mapping.service.ts`

```typescript
async getSampleProduct(): Promise<{
  success: boolean;
  product?: any;
  error?: string;
}> {
  try {
    const produtos = await this.bravoClient.consultarProdutos({
      page: 1,
      limit: 1,
      sortCol: 'id_produto',
      sortOrder: 'ASC',
    });
    
    return {
      success: true,
      product: produtos[0] || null,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}
```

### FASE 2: Frontend - Carregar Produto de Exemplo

**Arquivo:** `frontend/src/components/bravo-erp/mapping-panel.tsx`

1. Adicionar estado:
   ```typescript
   const [sampleProduct, setSampleProduct] = useState<any | null>(null);
   ```

2. Função para carregar produto:
   ```typescript
   const loadSampleProduct = async () => {
     try {
       const result = await bravoErpService.getSampleProduct();
       if (result.success && result.product) {
         setSampleProduct(result.product);
       }
     } catch (error) {
       console.error('Erro ao carregar produto exemplo:', error);
     }
   };
   ```

3. Carregar ao montar componente (usar mesmo endpoint de `getBravoFields`)

### FASE 3: Frontend - Exibir Valores da API

**Arquivo:** `frontend/src/components/bravo-erp/mapping-panel.tsx`

1. Função auxiliar para obter valor:
   ```typescript
   const getFieldValue = (campoBravo: string): any => {
     if (!sampleProduct || !campoBravo) return null;
     return getNestedValue(sampleProduct, campoBravo);
   };
   
   const getNestedValue = (obj: any, path: string): any => {
     return path.split('.').reduce((o, key) => {
       if (o && typeof o === 'object') return o[key];
       return undefined;
     }, obj);
   };
   ```

2. Formatação de valores:
   ```typescript
   const formatFieldValue = (value: any): string => {
     if (value === null || value === undefined) return '(vazio)';
     if (typeof value === 'object') return JSON.stringify(value).substring(0, 30) + '...';
     if (value instanceof Date) return value.toLocaleString('pt-BR');
     return String(value).substring(0, 50);
   };
   ```

3. Adicionar coluna na linha de mapeamento:
   - Mostrar valor formatado
   - Tooltip com valor completo
   - Indicador se valor está vazio/null

### FASE 4: Frontend - Prevenção de Duplicidade

**Arquivo:** `frontend/src/components/bravo-erp/mapping-panel.tsx`

1. Função para obter campos disponíveis:
   ```typescript
   const getAvailableInternalFields = (currentIndex: number): CampoInterno[] => {
     const camposUsados = new Set(
       mapeamentos
         .filter((m, idx) => idx !== currentIndex && m.ativo && m.campo_interno)
         .map(m => m.campo_interno)
     );
     
     return camposInternos.filter(campo => 
       !camposUsados.has(campo.nome) || 
       mapeamentos[currentIndex]?.campo_interno === campo.nome
     );
   };
   ```

2. Atualizar Select "Campo Sistema":
   ```typescript
   <SelectContent>
     {getAvailableInternalFields(index).map((campo) => (
       <SelectItem key={campo.nome} value={campo.nome}>
         {campo.nome}
         {campo.obrigatorio && (
           <Badge variant="destructive" className="ml-2">obrigatório</Badge>
         )}
       </SelectItem>
     ))}
     {/* Campos indisponíveis como disabled */}
     {camposInternos
       .filter(campo => {
         const camposUsados = new Set(
           mapeamentos
             .filter((m, idx) => idx !== index && m.ativo && m.campo_interno)
             .map(m => m.campo_interno)
         );
         return camposUsados.has(campo.nome) && 
                mapeamentos[index]?.campo_interno !== campo.nome;
       })
       .map((campo) => (
         <SelectItem key={campo.nome} value={campo.nome} disabled>
           <div className="flex items-center justify-between w-full">
             <span className="opacity-50">{campo.nome}</span>
             <Badge variant="secondary" className="text-xs">
               Já mapeado
             </Badge>
           </div>
         </SelectItem>
       ))}
   </SelectContent>
   ```

3. Validação ao salvar:
   ```typescript
   const validateMapeamentos = (): { valid: boolean; errors: string[] } => {
     const errors: string[] = [];
     const camposUsados = new Set<string>();
     
     mapeamentos.forEach((m, index) => {
       if (m.ativo && m.campo_interno) {
         if (camposUsados.has(m.campo_interno)) {
           errors.push(`Campo "${m.campo_interno}" está duplicado`);
         }
         camposUsados.add(m.campo_interno);
       }
     });
     
     return {
       valid: errors.length === 0,
       errors,
     };
   };
   ```

---

## 🎨 Design da Interface

### Layout da Linha de Mapeamento

**Versão Compacta:**
```
┌─────────────────────┬──────────────┬──────────────────┬──────────────────┬──────┬─────┐
│ Campo Bravo ERP     │ Valor API    │ Campo Sistema    │ Transformação    │ Ativo│ 🗑️ │
├─────────────────────┼──────────────┼──────────────────┼──────────────────┼──────┼─────┤
│ ref (string)        │ "IMP001"     │ referencia ▼     │ Direto ▼         │  ✓  │ 🗑️ │
│                     │              │                  │                  │      │     │
└─────────────────────┴──────────────┴──────────────────┴──────────────────┴──────┴─────┘
```

**Versão com Tooltip:**
```
┌─────────────────────┬──────────────────┬──────────────────┬──────┬─────┐
│ Campo Bravo ERP     │ Campo Sistema    │ Transformação    │ Ativo│ 🗑️ │
├─────────────────────┼──────────────────┼──────────────────┼──────┼─────┤
│ ref (string)        │ referencia ▼     │ Direto ▼         │  ✓  │ 🗑️ │
│                     │                  │                  │      │     │
│ 💡 Valor: "IMP001"  │                  │                  │      │     │
└─────────────────────┴──────────────────┴──────────────────┴──────┴─────┘
```

### Indicador de Campo Duplicado

```
Campo Sistema ▼
├─ referencia (obrigatório)
├─ descricao
├─ marca
├─ grupo [Já mapeado] ← disabled, cinza
├─ subgrupo
└─ ...
```

---

## ✅ Checklist de Implementação

### Backend
- [ ] (Opcional) Criar endpoint `GET /bravo-erp/mapping/sample-product`
- [ ] Testar retorno do produto de exemplo

### Frontend - Visualização
- [ ] Adicionar estado `sampleProduct`
- [ ] Carregar produto de exemplo ao montar componente
- [ ] Criar função `getNestedValue()` para acessar campos aninhados
- [ ] Criar função `formatFieldValue()` para formatar valores
- [ ] Adicionar coluna/indicador de valor na linha de mapeamento
- [ ] Adicionar tooltip com valor completo
- [ ] Testar com diferentes tipos de valores (string, number, date, object, array, null)

### Frontend - Prevenção de Duplicidade
- [ ] Criar função `getAvailableInternalFields(index)`
- [ ] Atualizar Select "Campo Sistema" para filtrar campos já mapeados
- [ ] Adicionar indicador visual "Já mapeado" em campos disabled
- [ ] Adicionar tooltip mostrando onde está mapeado
- [ ] Implementar validação ao salvar mapeamentos
- [ ] Atualizar disponibilidade quando mapeamento é removido/desativado
- [ ] Testar cenários: adicionar, remover, desativar, reordenar

### Testes
- [ ] Testar com produto que tenha valores vazios/null
- [ ] Testar com campos aninhados (gtin.gtin, _ref.unidade.descricao)
- [ ] Testar duplicidade (tentar mapear mesmo campo duas vezes)
- [ ] Testar remoção de mapeamento (campo volta a ficar disponível)
- [ ] Testar desativação de mapeamento (campo volta a ficar disponível)
- [ ] Testar performance com muitos mapeamentos

---

## 🚀 Benefícios Esperados

1. **Melhor UX**: Usuário vê valores reais durante a configuração
2. **Menos erros**: Prevenção de duplicidade reduz erros de configuração
3. **Mais eficiência**: Validação visual imediata sem precisar de preview
4. **Mais profissional**: Interface mais completa e informativa

---

## 📝 Notas Técnicas

### Considerações
- Produto de exemplo deve ser carregado apenas uma vez (cache no frontend)
- Valores devem ser atualizados se produto de exemplo mudar
- Campos do sistema obrigatórios devem ter indicador visual mesmo quando mapeados
- Performance: Considerar virtualização se houver muitos campos

### Dependências
- Produto de exemplo já disponível via `getBravoFields()`
- Pode reutilizar lógica de `getNestedValue` do `MappingPreviewDialog`

---

## 🎯 Priorização

**Alta Prioridade:**
- ✅ Prevenção de duplicidade (FASE 4)
- ✅ Validação ao salvar (FASE 4)

**Média Prioridade:**
- ✅ Visualização de valores básica (FASE 3)
- ✅ Indicadores visuais (FASE 4)

**Baixa Prioridade:**
- ⚠️ Endpoint específico para produto exemplo (pode reutilizar `getBravoFields`)
- ⚠️ Tooltips avançados
- ⚠️ Expansão de detalhes
