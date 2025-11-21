# 📋 Plano de Implementação: Resumo Econômico

## 🎯 Objetivo

Implementar funcionalidade de **Resumo Econômico** que permite:
- Salvar análises geradas pela IA (Groq LLaMA 3.1 8B Instant)
- Manter histórico de análises
- Visualizar detalhes de análises anteriores
- Exportar insights em diferentes formatos
- Gerenciar análises salvas

**⚠️ IMPORTANTE:** Todas as análises são baseadas exclusivamente em dados do tipo **3-DRE** (Demonstração de Resultado do Exercício). O sistema filtra automaticamente apenas linhas com `tipoConta: '3-DRE'` antes de enviar para a IA.

---

## 📊 Estrutura de Dados

### 1. Modelo de Banco de Dados (Prisma)

```prisma
model ResumoEconomico {
  id            String   @id @default(uuid())
  titulo        String   // Ex: "Resumo econômico Agosto/2025"
  periodo       String   // Ex: "08/2025" ou "Agosto/2025"
  mes           Int?     // Mês (1-12)
  ano           Int      // Ano
  empresaId     String?  // Opcional: null = consolidado
  uploadId      String?  // Opcional: se baseado em upload específico
  
  // Dados da análise
  tipoAnalise   String   // UPLOAD, RELATORIO, COMPARATIVO, etc.
  parametros    Json     // Parâmetros usados na análise (DTO completo)
  resultado     Json     // Resultado completo da análise (AnaliseResponse)
  
  // Metadados
  modeloIA      String   // Ex: "Groq LLaMA 3.1 8B Instant" (modelo atual: llama-3.1-8b-instant)
  status        ResumoStatus @default(PROCESSANDO)
  criadoPor     String   // ID do usuário
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  // Relacionamentos
  empresa       Empresa? @relation(fields: [empresaId], references: [id], onDelete: SetNull)
  upload        Upload?  @relation(fields: [uploadId], references: [id], onDelete: SetNull)
  criador       Usuario  @relation(fields: [criadoPor], references: [id], onDelete: Cascade)
  
  @@index([empresaId, ano, mes])
  @@index([criadoPor, createdAt])
  @@index([status])
}

enum ResumoStatus {
  PROCESSANDO
  CONCLUIDO
  ERRO
  CANCELADO
}
```

### 2. DTOs (Data Transfer Objects)

#### `backend/src/resumos/dto/create-resumo.dto.ts`
```typescript
export class CreateResumoDto {
  titulo: string;
  mes?: number;
  ano: number;
  empresaId?: string;
  uploadId?: string;
  tipoAnalise: TipoAnalise;
  parametros: AnalisarDadosDto; // Parâmetros da análise
}
```

#### `backend/src/resumos/dto/update-resumo.dto.ts`
```typescript
export class UpdateResumoDto {
  titulo?: string;
  status?: ResumoStatus;
}
```

#### `backend/src/resumos/dto/filter-resumo.dto.ts`
```typescript
export class FilterResumoDto {
  empresaId?: string;
  ano?: number;
  mes?: number;
  status?: ResumoStatus;
  tipoAnalise?: TipoAnalise;
  page?: number;
  limit?: number;
}
```

---

## 🏗️ Arquitetura Backend

### 1. Módulo de Resumos

```
backend/src/resumos/
├── resumos.module.ts
├── resumos.service.ts
├── resumos.controller.ts
└── dto/
    ├── create-resumo.dto.ts
    ├── update-resumo.dto.ts
    └── filter-resumo.dto.ts
```

### 2. Serviço de Resumos (`resumos.service.ts`)

**Métodos principais:**
- `create(dto: CreateResumoDto, userId: string)` - Criar resumo
- `findAll(filters: FilterResumoDto)` - Listar resumos com filtros
- `findOne(id: string)` - Buscar resumo por ID
- `update(id: string, dto: UpdateResumoDto)` - Atualizar resumo
- `delete(id: string, userId: string)` - Deletar resumo
- `exportarPDF(id: string)` - Exportar para PDF
- `exportarExcel(id: string)` - Exportar para Excel
- `exportarJSON(id: string)` - Exportar para JSON

### 3. Controller de Resumos (`resumos.controller.ts`)

**Endpoints:**
- `POST /resumos` - Criar novo resumo
- `GET /resumos` - Listar resumos (com filtros)
- `GET /resumos/:id` - Buscar resumo por ID
- `PUT /resumos/:id` - Atualizar resumo
- `DELETE /resumos/:id` - Deletar resumo
- `GET /resumos/:id/export/pdf` - Exportar PDF
- `GET /resumos/:id/export/excel` - Exportar Excel
- `GET /resumos/:id/export/json` - Exportar JSON

---

## 🎨 Interface Frontend

### 1. Página de Listagem (`/resumos`)

**Componentes:**
- Lista de resumos salvos
- Filtros (empresa, ano, mês, status)
- Cards com informações resumidas
- Botão "Novo Resumo"
- Ações: Ver detalhes, Exportar, Deletar

### 2. Página de Detalhes (`/resumos/:id`)

**Seções:**
- Cabeçalho com título e metadados
- Resumo da análise
- Insights detalhados
- Padrões anômalos
- Sugestões de correção
- Botões de exportação

### 3. Modal de Criação

**Campos:**
- Título (sugestão automática baseada em período)
- Período (ano, mês)
- Empresa (opcional)
- Tipo de análise
- Parâmetros específicos do tipo

### 4. Integração com Análises

- Após gerar análise, botão "Salvar como Resumo"
- Formulário para definir título e metadados
- Salvar automaticamente após análise bem-sucedida (opcional)

---

## 📦 Funcionalidades de Exportação

### 1. Exportação PDF

**Biblioteca:** `jspdf` (já instalada)

**Conteúdo:**
- Cabeçalho com título e período
- Metadados (data, modelo, status)
- Resumo da análise
- Insights formatados
- Padrões anômalos
- Sugestões de correção
- Rodapé com informações do sistema

### 2. Exportação Excel

**Biblioteca:** `xlsx` (já instalada)

**Abas:**
1. **Resumo** - Informações gerais
2. **Insights** - Tabela de insights
3. **Padrões Anômalos** - Tabela de padrões
4. **Sugestões** - Tabela de sugestões

### 3. Exportação JSON

**Formato:**
- Estrutura completa do resumo
- Dados originais da análise
- Metadados completos

---

## 🔄 Fluxo de Funcionamento

### 1. Criar Resumo a partir de Análise

```
1. Usuário executa análise na página /analises
   - Sistema filtra automaticamente apenas dados 3-DRE
   - Análise é gerada usando Groq LLaMA 3.1 8B Instant
2. Análise é gerada com sucesso
3. Botão "Salvar como Resumo" aparece
4. Usuário clica e preenche formulário:
   - Título (sugestão: "Resumo econômico {Mês}/{Ano}")
   - Confirma período e empresa
5. Sistema salva:
   - Parâmetros da análise (já filtrados para 3-DRE)
   - Resultado completo da análise
   - Metadados (modelo: "Groq LLaMA 3.1 8B Instant", data, usuário)
6. Redireciona para página de detalhes do resumo
```

### 2. Criar Resumo Diretamente

```
1. Usuário acessa /resumos
2. Clica em "Novo Resumo"
3. Preenche formulário:
   - Título
   - Período (ano, mês)
   - Empresa (opcional)
   - Tipo de análise
   - Parâmetros específicos
4. Sistema:
   - Filtra automaticamente apenas dados 3-DRE
   - Executa análise automaticamente (Groq LLaMA 3.1 8B Instant)
   - Salva resultado como resumo
   - Exibe página de detalhes
```

### 3. Visualizar Histórico

```
1. Usuário acessa /resumos
2. Filtra por empresa, ano, mês, status
3. Visualiza lista de resumos salvos
4. Clica em resumo para ver detalhes
```

### 4. Exportar Resumo

```
1. Usuário visualiza resumo
2. Clica em botão de exportação (PDF/Excel/JSON)
3. Sistema gera arquivo
4. Download automático
```

---

## 📝 Checklist de Implementação

### Fase 1: Backend - Estrutura Base
- [ ] Criar migration para modelo `ResumoEconomico`
- [ ] Criar módulo `ResumosModule`
- [ ] Criar service `ResumosService` com CRUD básico
- [ ] Criar controller `ResumosController` com endpoints
- [ ] Criar DTOs (Create, Update, Filter)
- [ ] Integrar com `AiService` para salvar análises
- [ ] **Garantir que apenas dados 3-DRE sejam salvos** (já implementado no AiService)
- [ ] Salvar modelo usado: `"Groq LLaMA 3.1 8B Instant"` (llama-3.1-8b-instant)

### Fase 2: Backend - Exportação
- [ ] Implementar exportação PDF
- [ ] Implementar exportação Excel
- [ ] Implementar exportação JSON
- [ ] Testar formatos de exportação

### Fase 3: Frontend - Listagem
- [ ] Criar página `/resumos`
- [ ] Criar componente de lista de resumos
- [ ] Implementar filtros
- [ ] Criar cards de resumo
- [ ] Implementar paginação

### Fase 4: Frontend - Detalhes
- [ ] Criar página `/resumos/:id`
- [ ] Exibir resumo completo
- [ ] Implementar botões de exportação
- [ ] Adicionar ações (editar, deletar)

### Fase 5: Frontend - Integração
- [ ] Adicionar botão "Salvar como Resumo" em `/analises`
- [ ] Criar modal de criação de resumo
- [ ] Integrar criação direta em `/resumos`
- [ ] Adicionar notificações de sucesso/erro

### Fase 6: Testes e Refinamentos
- [ ] Testar fluxo completo
- [ ] Validar exportações
- [ ] Ajustar UI/UX
- [ ] Adicionar loading states
- [ ] Tratar erros

---

## 🔧 Detalhes Técnicos

### 1. Integração com AiService

Modificar `AiService.analisarDados()` para:
- Aceitar parâmetro opcional `salvarComoResumo?: boolean`
- Retornar ID do resumo criado (se salvo)
- Ou criar método separado `analisarESalvar()`

**IMPORTANTE:** O `AiService` já filtra automaticamente apenas dados do tipo `3-DRE` em todas as análises:
- ✅ Análise de Upload: filtra linhas com `tipoConta: '3-DRE'`
- ✅ Análise de Relatório: filtra linhas com `tipoConta: '3-DRE'`
- ✅ Análise Comparativa: usa `RelatoriosService` que já filtra DRE

**Modelo de IA atual:** `llama-3.1-8b-instant` (Groq)
- Rápido e eficiente para análises financeiras
- Limite de 6000 tokens por minuto (plano on_demand)
- Respostas em português brasileiro

### 2. Geração de Título Automático

```typescript
function gerarTituloAutomatico(tipo: TipoAnalise, mes?: number, ano: number, empresa?: string): string {
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const mesNome = mes ? meses[mes - 1] : '';
  const periodo = mes ? `${mesNome}/${ano}` : `${ano}`;
  const empresaNome = empresa ? ` - ${empresa}` : '';
  
  switch (tipo) {
    case TipoAnalise.UPLOAD:
      return `Análise de Upload - ${periodo}${empresaNome}`;
    case TipoAnalise.RELATORIO:
      return `Resumo econômico ${periodo}${empresaNome}`;
    case TipoAnalise.COMPARATIVO:
      return `Análise Comparativa - ${periodo}${empresaNome}`;
    default:
      return `Análise - ${periodo}${empresaNome}`;
  }
}
```

**Nota:** Todos os resumos são baseados em análises que filtram apenas dados do tipo `3-DRE` (Demonstração de Resultado do Exercício).

### 3. Estrutura de Exportação PDF

```typescript
interface PDFContent {
  titulo: string;
  periodo: string;
  metadados: {
    criadoEm: string;
    modelo: string;
    status: string;
    empresa?: string;
  };
  resumo: string;
  insights: Insight[];
  padroesAnomalos: PadraoAnomalo[];
  sugestoes: SugestaoCorrecao[];
}
```

### 4. Cache e Performance

- Cache de resumos recentes (últimos 10)
- Indexação no banco para buscas rápidas
- Paginação para listagens grandes

---

## 🎯 Prioridades

### Alta Prioridade
1. ✅ Estrutura de banco de dados
2. ✅ CRUD básico de resumos
3. ✅ Integração com análises existentes
4. ✅ Página de listagem

### Média Prioridade
5. ⚠️ Página de detalhes
6. ⚠️ Exportação PDF
7. ⚠️ Exportação Excel

### Baixa Prioridade
8. 📋 Exportação JSON
9. 📋 Edição de resumos
10. 📋 Compartilhamento de resumos

---

## 📚 Referências

- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [jsPDF Documentation](https://github.com/parallax/jsPDF)
- [SheetJS (xlsx) Documentation](https://sheetjs.com/)

---

## ⚠️ Observações Importantes

### Filtro de Dados 3-DRE

**TODAS as análises já filtram automaticamente apenas dados do tipo `3-DRE`:**

1. **Análise de Upload:**
   - Estatísticas: `tipoConta: '3-DRE'`
   - Top linhas: `tipoConta: '3-DRE'`
   - Linhas anômalas: `tipoConta: '3-DRE'`

2. **Análise de Relatório:**
   - Busca linhas com `tipoConta: '3-DRE'`
   - Estatísticas apenas de linhas DRE
   - Top linhas e anômalas apenas DRE

3. **Análise Comparativa:**
   - Usa `RelatoriosService.gerarRelatorioComparativo()` que já filtra DRE

**✅ Não é necessário adicionar filtros adicionais - já está implementado no `AiService`!**

### Modelo de IA

**Modelo atual:** `llama-3.1-8b-instant` (Groq)
- **Nome para exibição:** `"Groq LLaMA 3.1 8B Instant"`
- **Código do modelo:** `llama-3.1-8b-instant`
- **Localização no código:** `backend/src/ai/ai.service.ts` linha 20
- **Limite:** 6000 tokens por minuto (plano on_demand)
- **Características:** Rápido, eficiente, otimizado para análises financeiras
- **Respostas:** Português brasileiro

**Alternativas disponíveis (se necessário no futuro):**
- `mixtral-8x7b-32768`: Para análises mais complexas
- `gemma-7b-it`: Alternativa leve

**Nota:** O modelo `llama-3.1-70b-versatile` foi descontinuado pelo Groq.

---

**Última atualização:** 2025-11-19

