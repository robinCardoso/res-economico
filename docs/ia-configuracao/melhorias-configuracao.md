# Plano: Melhorias na Configuração de Modelos de Negócio

## Objetivo
Melhorar a experiência do usuário na página de configuração de modelos de negócio, facilitando o preenchimento e edição dos dados, especialmente para usuários não técnicos.

---

## Fase 1: Buscar Dados do Banco ao Editar

### 1.1 Problema Identificado
- Ao clicar em "Editar" uma configuração existente, os campos não são preenchidos com os dados do banco
- O usuário precisa digitar tudo novamente

### 1.2 Solução
**Backend:**
- ✅ Já existe endpoint `GET /configuracao-modelo-negocio/:modeloNegocio`
- ✅ Já retorna os dados completos

**Frontend:**
- Modificar função `openEditModal` para buscar dados do banco
- Preencher o formulário com os dados retornados
- Converter `modeloNegocioDetalhes` (JSON) para string para o textarea
- Converter `contasReceita` e `contasCustos` (JSON) para campos individuais
- Preencher checkbox `custosCentralizados`

### 1.3 Implementação

**Arquivo:** `frontend/src/app/(app)/configuracoes/modelos-negocio/page.tsx`

```typescript
const openEditModal = async (modelo: ModeloNegocio) => {
  try {
    setEditingModelo(modelo);
    setErrorMessage(null);
    
    // Buscar dados do banco
    const config = await configuracaoModeloNegocioService.getByModelo(modelo);
    
    // Preencher formulário
    reset({
      modeloNegocio: config.modeloNegocio,
      descricao: config.descricao || '',
      custosCentralizados: config.custosCentralizados,
      ativo: config.ativo,
      
      // Converter JSON para campos individuais
      contasReceitaMensalidades: config.contasReceita?.mensalidades || '',
      contasReceitaBonificacoes: config.contasReceita?.bonificacoes || '',
      
      contasCustosFuncionarios: config.contasCustos?.funcionarios || '',
      contasCustosSistema: config.contasCustos?.sistema || '',
      contasCustosContabilidade: config.contasCustos?.contabilidade || '',
      
      // Converter JSON para string
      modeloNegocioDetalhesJson: JSON.stringify(config.modeloNegocioDetalhes, null, 2),
    });
    
    // Preencher arrays de contas extras
    const contasReceitaExtra: Array<{ key: string; value: string }> = [];
    const contasCustosExtra: Array<{ key: string; value: string }> = [];
    
    Object.entries(config.contasReceita || {}).forEach(([key, value]) => {
      if (key !== 'mensalidades' && key !== 'bonificacoes') {
        contasReceitaExtra.push({ key, value: value as string });
      }
    });
    
    Object.entries(config.contasCustos || {}).forEach(([key, value]) => {
      if (key !== 'funcionarios' && key !== 'sistema' && key !== 'contabilidade') {
        contasCustosExtra.push({ key, value: value as string });
      }
    });
    
    setContasReceitaExtra(contasReceitaExtra);
    setContasCustosExtra(contasCustosExtra);
    
    setIsModalOpen(true);
  } catch (error) {
    console.error('Erro ao buscar configuração:', error);
    setErrorMessage('Erro ao carregar configuração para edição');
  }
};
```

---

## Fase 2: Melhorias Gerais na Interface

### 2.1 Melhorias Propostas

#### A. Validação em Tempo Real
- Validar formato de contas (ex: deve seguir padrão X.X.XX.XX)
- Mostrar erros abaixo de cada campo
- Desabilitar botão "Salvar" se houver erros

#### B. Feedback Visual
- Mostrar loading ao buscar dados
- Mensagens de sucesso/erro mais claras
- Indicador visual de campos obrigatórios

#### C. Organização Visual
- Agrupar campos relacionados em cards/seções
- Melhor espaçamento entre seções
- Tooltips explicativos em campos complexos

#### D. Autocomplete/Sugestões
- Sugerir contas baseadas em contas já cadastradas no sistema
- Histórico de contas usadas anteriormente

---

## Fase 3: Formulário Amigável para Modelo de Negócio Detalhes

### 3.1 Problema Identificado
- Campo JSON é difícil para usuários leigos
- Risco de JSON inválido
- Não há validação visual

### 3.2 Solução: Formulário Estruturado

**Opção 1: Formulário Dinâmico Baseado em Tipo**
- Criar formulário específico para cada tipo de modelo
- Exemplo para "ASSOCIACAO":
  - Campo: "Tipo de Associação" (texto)
  - Campo: "Características" (lista de checkboxes ou tags)
  - Campo: "Número de Associados" (número, opcional)
  - Campo: "Descrição Adicional" (textarea)

**Opção 2: Formulário Genérico com Builder**
- Interface visual para construir JSON
- Botão "Adicionar Campo"
- Campos: Nome, Tipo (texto/número/boolean/array), Valor
- Preview do JSON em tempo real

**Opção 3: Templates Pré-definidos**
- Templates para cada modelo de negócio
- Usuário seleciona template e preenche campos
- Sistema gera JSON automaticamente

### 3.3 Implementação Recomendada: Opção 1 + Opção 3

**Estrutura:**
```typescript
// Componente: ModeloNegocioDetalhesForm
interface ModeloNegocioDetalhesFormProps {
  modeloNegocio: ModeloNegocio;
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}

// Para ASSOCIACAO
const AssociacaoForm = ({ value, onChange }) => {
  return (
    <div className="space-y-4">
      <div>
        <label>Tipo de Associação</label>
        <input
          value={value.tipo || ''}
          onChange={(e) => onChange({ ...value, tipo: e.target.value })}
          placeholder="Ex: Associação para Retificas"
        />
      </div>
      
      <div>
        <label>Características</label>
        <TagInput
          value={value.caracteristicas || []}
          onChange={(tags) => onChange({ ...value, caracteristicas: tags })}
          placeholder="Adicione características (pressione Enter)"
        />
      </div>
      
      <div>
        <label>Número de Associados (opcional)</label>
        <input
          type="number"
          value={value.numeroAssociados || ''}
          onChange={(e) => onChange({ ...value, numeroAssociados: parseInt(e.target.value) || undefined })}
        />
      </div>
      
      <div>
        <label>Descrição Adicional</label>
        <textarea
          value={value.descricao || ''}
          onChange={(e) => onChange({ ...value, descricao: e.target.value })}
          rows={3}
        />
      </div>
    </div>
  );
};

// Para outros modelos, criar formulários específicos ou genérico
```

**Templates:**
```typescript
const TEMPLATES: Record<ModeloNegocio, Record<string, unknown>> = {
  ASSOCIACAO: {
    tipo: 'Associação para Retificas',
    caracteristicas: [],
    descricao: '',
  },
  COMERCIO: {
    tipo: 'Comércio Varejista',
    segmento: '',
    canaisVenda: [],
  },
  INDUSTRIA: {
    tipo: 'Indústria de Transformação',
    setor: '',
    processos: [],
  },
  // ...
};
```

### 3.4 Interface do Formulário

**Layout:**
```
┌─────────────────────────────────────────┐
│ Modelo de Negócio Detalhes              │
├─────────────────────────────────────────┤
│                                         │
│ [ ] Usar formulário visual              │
│ [✓] Editar JSON diretamente             │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Tipo de Associação                  │ │
│ │ [Associação para Retificas      ]   │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Características                      │ │
│ │ [Tag 1] [Tag 2] [+ Adicionar]       │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Número de Associados (opcional)      │ │
│ │ [        ]                           │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Descrição Adicional                  │ │
│ │ [                                    │ │
│ │                                      │ │
│ │ ]                                    │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Preview JSON:                           │
│ ┌─────────────────────────────────────┐ │
│ │ {                                    │ │
│ │   "tipo": "Associação para Retificas"│ │
│ │   "caracteristicas": []              │ │
│ │ }                                    │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## Fase 4: Melhorias Adicionais

### 4.1 Validação de Contas
- Validar se a conta existe no catálogo de contas
- Sugerir contas similares se não encontrar
- Mostrar nome completo da conta ao lado do código

### 4.2 Histórico e Auditoria
- Mostrar quando a configuração foi criada/editada
- Mostrar quem criou/editou (se disponível)
- Histórico de alterações

### 4.3 Exportar/Importar
- Botão para exportar configuração como JSON
- Botão para importar configuração de JSON
- Útil para backup e migração entre ambientes

### 4.4 Teste de Configuração
- Botão "Testar Configuração"
- Validar se as contas informadas existem nos uploads
- Mostrar estatísticas (ex: quantos uploads têm essas contas)

---

## Priorização

### Alta Prioridade
1. ✅ **Fase 1**: Buscar dados do banco ao editar
2. ✅ **Fase 3**: Formulário amigável para JSON (Opção 1 - Formulário Específico)

### Média Prioridade
3. **Fase 2.1**: Validação em tempo real
4. **Fase 2.2**: Feedback visual melhorado
5. **Fase 4.1**: Validação de contas

### Baixa Prioridade
6. **Fase 2.3**: Organização visual melhorada
7. **Fase 2.4**: Autocomplete de contas
8. **Fase 4.2**: Histórico e auditoria
9. **Fase 4.3**: Exportar/Importar
10. **Fase 4.4**: Teste de configuração

---

## Estimativa de Tempo

- **Fase 1**: 2-3 horas
- **Fase 3**: 4-6 horas (formulário específico para ASSOCIACAO)
- **Fase 2.1 + 2.2**: 2-3 horas
- **Fase 4.1**: 3-4 horas

**Total (Alta Prioridade)**: 6-9 horas

---

## Próximos Passos

1. Implementar Fase 1 (buscar dados ao editar)
2. Criar componente `ModeloNegocioDetalhesForm` para ASSOCIACAO
3. Adicionar validação básica nos campos
4. Testar com dados reais
5. Expandir formulário para outros modelos de negócio conforme necessário

