# 📋 Plano: Sistema de Rascunhos e Gerenciamento de Decisões/Ações

## 🎯 Objetivo

Estruturar um sistema completo para:
1. **Geração de ATAs via IA** a partir de rascunhos escritos à mão
2. **Gerenciamento de Decisões e Ações** extraídas pela IA
3. **Filtros e ferramentas** para auxiliar no gerenciamento

## 📊 Situação Atual

### O que temos:
- ✅ Importação de ATAs já registradas em cartório
- ✅ Extração de informações via IA (participantes, pautas, decisões, ações)
- ✅ Campos `decisoes` e `acoes` como JSON no banco
- ✅ Status `RASCUNHO`, `PUBLICADA`, `ARQUIVADA` no enum

### O que falta:
- ❌ Sistema de geração de ATAs a partir de rascunhos
- ❌ Gerenciamento/filtros para Decisões e Ações
- ❌ Workflow: Rascunho → Revisão → Aprovação → Publicação → Registro em Cartório
- ❌ Status de Decisões/Ações (pendente, em andamento, concluída, cancelada)
- ❌ Filtros por Decisões/Ações pendentes

## 🏗️ Arquitetura Proposta

### Fase 1: Estruturação do Banco de Dados

#### 1.1. Modelo de Decisão (Estrutura JSON Atual)
```typescript
// Atualmente em AtaReuniao.decisoes (Json)
{
  id: string;           // ID único da decisão
  descricao: string;    // Descrição da decisão
  dataDecisao: string;  // Data da decisão
  responsavel?: string; // Responsável pela decisão
  status?: string;      // NOVO: pendente, em_andamento, concluida, cancelada
  prazo?: string;       // NOVO: prazo para implementação
  observacoes?: string; // NOVO: observações adicionais
}
```

#### 1.2. Modelo de Ação (Estrutura JSON Atual)
```typescript
// Atualmente em AtaReuniao.acoes (Json)
{
  id: string;           // ID único da ação
  descricao: string;    // Descrição da ação
  responsavel?: string; // Responsável pela ação
  prazo?: string;       // Prazo para conclusão
  status?: string;      // NOVO: pendente, em_andamento, concluida, cancelada
  dataConclusao?: string; // NOVO: data de conclusão
  observacoes?: string; // NOVO: observações adicionais
}
```

#### 1.3. Campos Adicionais em AtaReuniao
```prisma
model AtaReuniao {
  // ... campos existentes ...
  
  // NOVO: Campos para rascunhos
  rascunhoOriginalUrl  String? // URL do rascunho original (foto/scan)
  rascunhoOriginalNome String? // Nome do arquivo do rascunho
  geradaDeRascunho     Boolean @default(false) // Indica se foi gerada de rascunho
  
  // NOVO: Campos para workflow
  dataAprovacao        DateTime? // Data de aprovação
  aprovadoPor          String?   // ID do usuário que aprovou
  dataRegistroCartorio DateTime? // Data de registro em cartório
  numeroRegistroCartorio String? // Número de registro em cartório
  
  // NOVO: Contadores para facilitar filtros
  totalDecisoes        Int @default(0)
  decisoesPendentes    Int @default(0)
  totalAcoes           Int @default(0)
  acoesPendentes       Int @default(0)
}
```

### Fase 2: Sistema de Geração de ATAs via IA (Futuro)

#### 2.1. Fluxo de Geração
```
1. Usuário faz upload de rascunho (foto/scan)
   ↓
2. IA processa o rascunho e gera ATA estruturada
   ↓
3. ATA criada com status RASCUNHO
   ↓
4. Usuário revisa e edita a ATA gerada
   ↓
5. Usuário aprova a ATA (status → PUBLICADA)
   ↓
6. ATA é registrada em cartório
   ↓
7. Campos de registro são preenchidos
```

#### 2.2. Endpoint de Geração
```typescript
POST /atas/gerar-de-rascunho
Body: {
  arquivo: File,           // Foto/scan do rascunho
  tipoReuniao: TipoReuniao,
  dataReuniao: Date,
  // ... outros campos opcionais
}
Response: {
  ata: AtaReuniao,        // ATA gerada com status RASCUNHO
  confianca: number,      // Nível de confiança da IA (0-100)
  alertas: string[]       // Alertas sobre dados não identificados
}
```

### Fase 3: Gerenciamento de Decisões e Ações

#### 3.1. Página de Gerenciamento
**Rota**: `/admin/atas/decisoes-acoes` ou `/admin/atas/gerenciar`

**Funcionalidades**:
- Lista todas as decisões e ações de todas as atas
- Filtros:
  - Por status (pendente, em andamento, concluída, cancelada)
  - Por responsável
  - Por prazo (vencidas, vencendo hoje, vencendo esta semana, futuras)
  - Por ATA específica
  - Por tipo (decisão ou ação)
- Ordenação:
  - Por prazo (mais próximo primeiro)
  - Por data de criação
  - Por responsável
  - Por ATA

#### 3.2. Cards de Estatísticas na Página de Gerenciamento
```
- Total de Decisões
- Decisões Pendentes
- Decisões Vencidas
- Total de Ações
- Ações Pendentes
- Ações Vencidas
```

#### 3.3. Visualização de Decisões/Ações
- Card para cada decisão/ação
- Mostrar: descrição, responsável, prazo, status, ATA de origem
- Ações rápidas: editar, marcar como concluída, cancelar
- Link para ATA de origem

#### 3.4. Edição de Decisões/Ações
- Modal ou página para editar
- Campos editáveis:
  - Descrição
  - Responsável
  - Prazo
  - Status
  - Observações
- Histórico de alterações (opcional)

### Fase 4: Filtros na Página Principal de Atas

#### 4.1. Filtros Adicionais
```typescript
interface FiltrosAtas {
  // Filtros existentes
  busca?: string;
  tipo?: TipoReuniao;
  status?: StatusAta;
  dataInicio?: Date;
  dataFim?: Date;
  
  // NOVOS filtros
  temDecisoes?: boolean;        // ATAs que têm decisões
  temAcoes?: boolean;           // ATAs que têm ações
  decisoesPendentes?: boolean;  // ATAs com decisões pendentes
  acoesPendentes?: boolean;     // ATAs com ações pendentes
  geradaDeRascunho?: boolean;   // ATAs geradas de rascunho
  registradaEmCartorio?: boolean; // ATAs registradas em cartório
}
```

#### 4.2. Cards de Estatísticas Atualizados
```
- Total de Atas
- Processadas por IA
- Com Decisões Pendentes (NOVO)
- Com Ações Pendentes (NOVO)
- Geradas de Rascunho (NOVO - futuro)
- Registradas em Cartório (NOVO - futuro)
```

### Fase 5: Workflow de Aprovação (Futuro)

#### 5.1. Status Adicionais
```prisma
enum StatusAta {
  RASCUNHO           // ATA em rascunho (gerada ou criada manualmente)
  EM_REVISAO         // NOVO: ATA em processo de revisão
  AGUARDANDO_APROVACAO // NOVO: ATA aguardando aprovação
  APROVADA           // NOVO: ATA aprovada, pronta para registro
  PUBLICADA          // ATA publicada/registrada
  ARQUIVADA          // ATA arquivada
}
```

#### 5.2. Sistema de Aprovação
- Usuários com permissão podem aprovar ATAs
- Histórico de aprovações
- Notificações quando ATA precisa de aprovação
- Comentários durante o processo de aprovação

## 📝 Plano de Implementação

### Fase 1: Estruturação (Agora)
- [ ] Adicionar campos de status em decisões e ações (JSON)
- [ ] Adicionar campos de workflow em AtaReuniao
- [ ] Criar funções auxiliares para contar decisões/ações pendentes
- [ ] Atualizar backend para calcular contadores automaticamente

### Fase 2: Filtros e Gerenciamento (Próximo)
- [ ] Criar página de gerenciamento de decisões/ações
- [ ] Implementar filtros na página principal de atas
- [ ] Adicionar cards de estatísticas (decisões/ações pendentes)
- [ ] Implementar edição de decisões/ações

### Fase 3: Sistema de Rascunhos (Futuro)
- [ ] Criar endpoint de geração de ATA a partir de rascunho
- [ ] Implementar upload de rascunho (foto/scan)
- [ ] Integrar IA para processar rascunho
- [ ] Criar interface de revisão de ATA gerada
- [ ] Implementar workflow de aprovação

### Fase 4: Melhorias (Futuro)
- [ ] Sistema de notificações para prazos
- [ ] Dashboard de acompanhamento
- [ ] Relatórios de decisões/ações
- [ ] Integração com calendário

## 🔧 Implementação Técnica

### Backend

#### 1. Atualizar Schema Prisma
```prisma
model AtaReuniao {
  // ... campos existentes ...
  
  // Campos para rascunhos
  rascunhoOriginalUrl  String?
  rascunhoOriginalNome String?
  geradaDeRascunho     Boolean @default(false)
  
  // Campos para workflow
  dataAprovacao        DateTime?
  aprovadoPor          String?
  dataRegistroCartorio DateTime?
  numeroRegistroCartorio String?
  
  // Contadores
  totalDecisoes        Int @default(0)
  decisoesPendentes    Int @default(0)
  totalAcoes           Int @default(0)
  acoesPendentes       Int @default(0)
  
  // Relação com usuário aprovador
  aprovador Usuario? @relation("AtaAprovador", fields: [aprovadoPor], references: [id])
}
```

#### 2. Funções Auxiliares
```typescript
// Calcular contadores de decisões/ações
function calcularContadores(ata: AtaReuniao) {
  const decisoes = Array.isArray(ata.decisoes) ? ata.decisoes : [];
  const acoes = Array.isArray(ata.acoes) ? ata.acoes : [];
  
  return {
    totalDecisoes: decisoes.length,
    decisoesPendentes: decisoes.filter(d => d.status === 'pendente' || !d.status).length,
    totalAcoes: acoes.length,
    acoesPendentes: acoes.filter(a => a.status === 'pendente' || !a.status).length,
  };
}
```

#### 3. Endpoints
```typescript
// Listar decisões/ações com filtros
GET /atas/decisoes-acoes?status=pendente&tipo=acao&responsavel=...

// Atualizar decisão/ação
PUT /atas/:ataId/decisoes/:decisaoId
PUT /atas/:ataId/acoes/:acaoId

// Gerar ATA de rascunho (futuro)
POST /atas/gerar-de-rascunho
```

### Frontend

#### 1. Página de Gerenciamento
```
/admin/atas/decisoes-acoes
```

#### 2. Componentes
- `DecisaoItem` - Card de decisão
- `AcaoItem` - Card de ação
- `FiltrosDecisoesAcoes` - Componente de filtros
- `EditarDecisaoModal` - Modal para editar decisão
- `EditarAcaoModal` - Modal para editar ação

#### 3. Hooks
- `useDecisoesAcoes` - Buscar decisões/ações com filtros
- `useAtualizarDecisao` - Atualizar decisão
- `useAtualizarAcao` - Atualizar ação

## 📌 Prioridades

### Alta Prioridade (Agora):
1. ✅ Remover cards desnecessários (Rascunhos, Publicadas)
2. ✅ Manter apenas "Total de Atas" e "Processadas por IA"
3. ⏳ Adicionar estrutura de status em decisões/ações (JSON)
4. ⏳ Criar página de gerenciamento de decisões/ações
5. ⏳ Implementar filtros básicos

### Média Prioridade (Próximo):
1. Adicionar cards de estatísticas (decisões/ações pendentes)
2. Implementar edição de decisões/ações
3. Adicionar filtros na página principal de atas
4. Sistema de notificações para prazos

### Baixa Prioridade (Futuro):
1. Sistema de geração de ATAs a partir de rascunhos
2. Workflow de aprovação completo
3. Integração com calendário
4. Relatórios avançados

## 🎯 Próximos Passos Imediatos

1. **Estruturar JSON de Decisões/Ações**:
   - Adicionar campo `status` padrão
   - Documentar estrutura esperada
   - Criar validação

2. **Criar Página de Gerenciamento**:
   - Listar todas as decisões/ações
   - Filtros básicos
   - Visualização clara

3. **Adicionar Filtros na Página Principal**:
   - Filtro por "tem decisões pendentes"
   - Filtro por "tem ações pendentes"

