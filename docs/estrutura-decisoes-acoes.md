# 📋 Estrutura de Decisões e Ações - Documentação

## 🎯 Objetivo

Documentar a estrutura JSON esperada para `decisoes` e `acoes` no sistema de ATAs, incluindo campos de status e gerenciamento.

## 📊 Estrutura Atual (JSON)

### Decisão
```typescript
interface Decisao {
  id?: string;              // ID único (gerado automaticamente se não fornecido)
  descricao: string;        // Descrição da decisão/norma/regra
  dataDecisao?: string;     // Data da decisão (formato ISO ou DD/MM/YYYY)
  responsavel?: string;      // Responsável pela decisão
  status?: string;          // Status: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada'
  prazo?: string;           // Prazo para implementação (formato ISO ou DD/MM/YYYY)
  observacoes?: string;     // Observações adicionais
}
```

### Ação
```typescript
interface Acao {
  id?: string;              // ID único (gerado automaticamente se não fornecido)
  descricao: string;        // Descrição da ação/obrigação/tarefa
  responsavel?: string;     // Responsável pela ação
  prazo?: string;           // Prazo para conclusão (formato ISO ou DD/MM/YYYY)
  status?: string;          // Status: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada'
  dataConclusao?: string;  // Data de conclusão (formato ISO ou DD/MM/YYYY)
  observacoes?: string;     // Observações adicionais
}
```

## 🔄 Valores de Status

### Status Padrão
- **`pendente`** (padrão): Decisão/ação ainda não iniciada
- **`em_andamento`**: Decisão/ação em processo de execução
- **`concluida`**: Decisão/ação finalizada
- **`cancelada`**: Decisão/ação cancelada

### Comportamento
- Se `status` não for fornecido, assume-se `'pendente'`
- Status é case-insensitive (aceita maiúsculas/minúsculas)
- Valores inválidos são tratados como `'pendente'`

## 📝 Exemplos

### Exemplo de Decisão
```json
{
  "id": "dec-001",
  "descricao": "Aprovar orçamento para o ano de 2026",
  "dataDecisao": "2025-12-01",
  "responsavel": "João Silva",
  "status": "concluida",
  "prazo": "2025-12-31",
  "observacoes": "Orçamento aprovado por unanimidade"
}
```

### Exemplo de Ação
```json
{
  "id": "acao-001",
  "descricao": "Realizar reunião de trabalho com equipe de marketing",
  "responsavel": "Maria Oliveira",
  "prazo": "2026-01-15",
  "status": "em_andamento",
  "dataConclusao": null,
  "observacoes": "Aguardando disponibilidade da equipe"
}
```

### Exemplo de Array Completo
```json
{
  "decisoes": [
    {
      "id": "dec-001",
      "descricao": "Aprovar orçamento para o ano de 2026",
      "dataDecisao": "2025-12-01",
      "responsavel": "João Silva",
      "status": "concluida"
    },
    {
      "id": "dec-002",
      "descricao": "Nomear novo membro para a diretoria",
      "dataDecisao": "2025-12-01",
      "responsavel": "Conselho Diretor",
      "status": "pendente"
    }
  ],
  "acoes": [
    {
      "id": "acao-001",
      "descricao": "Realizar reunião de trabalho com equipe de marketing",
      "responsavel": "Maria Oliveira",
      "prazo": "2026-01-15",
      "status": "em_andamento"
    },
    {
      "id": "acao-002",
      "descricao": "Contratar novo funcionário para equipe de vendas",
      "responsavel": "Carlos Souza",
      "prazo": "2026-02-01",
      "status": "pendente"
    }
  ]
}
```

## 🔧 Funções Auxiliares

### Gerar ID Único
```typescript
function gerarIdDecisaoAcao(): string {
  return `dec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
```

### Validar Status
```typescript
function validarStatus(status?: string): string {
  const statusValidos = ['pendente', 'em_andamento', 'concluida', 'cancelada'];
  if (!status) return 'pendente';
  const statusLower = status.toLowerCase();
  return statusValidos.includes(statusLower) ? statusLower : 'pendente';
}
```

### Normalizar Decisão/Ação
```typescript
function normalizarDecisao(dec: any): Decisao {
  return {
    id: dec.id || gerarIdDecisaoAcao(),
    descricao: dec.descricao || '',
    dataDecisao: dec.dataDecisao,
    responsavel: dec.responsavel,
    status: validarStatus(dec.status),
    prazo: dec.prazo,
    observacoes: dec.observacoes,
  };
}
```

## 📌 Notas Importantes

1. **IDs**: Se não fornecidos, devem ser gerados automaticamente
2. **Status**: Sempre normalizar para lowercase
3. **Datas**: Aceitar múltiplos formatos, normalizar para ISO quando possível
4. **Validação**: Sempre validar estrutura antes de salvar
5. **Backward Compatibility**: Manter compatibilidade com estruturas antigas sem status

## 🚀 Próximos Passos

1. Atualizar prompt da IA para incluir status nas decisões/ações
2. Criar funções de validação no backend
3. Implementar normalização automática ao salvar
4. Criar interface de gerenciamento no frontend

