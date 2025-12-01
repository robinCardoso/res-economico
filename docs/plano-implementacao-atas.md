# Plano de Implementação - Módulo de Atas

## 📋 Análise Arquitetural

### Diferenças Principais

#### 1. **Banco de Dados**
- **painel-completo**: Usa Supabase (PostgreSQL via Supabase client)
- **Nosso projeto**: Usa Prisma diretamente com PostgreSQL
- **Schema**: Já temos `AtaReuniao`, `AtaParticipante`, `AtaAnexo` no Prisma
- **Falta**: Modelo `AtaComentario` para comentários/aprovações

#### 2. **Backend**
- **painel-completo**: Server Actions (Next.js) que chamam Supabase
- **Nosso projeto**: NestJS com Prisma
- **Status**: Backend básico já implementado, falta:
  - Endpoints de comentários
  - Endpoint de exportação HTML
  - Ajustes de mapeamento de dados

#### 3. **Frontend**
- **painel-completo**: Server Components + Client Components
- **Nosso projeto**: Client Components com API routes
- **Status**: Estrutura básica implementada, falta:
  - Componentes de busca semântica (opcional)
  - Página de edição
  - Ajustes de mapeamento de status/tipos

---

## 🗄️ Banco de Dados

### ✅ Modelo de Comentários (CONCLUÍDO)

```prisma
model AtaComentario {
  id              String   @id @default(uuid())
  ataId           String
  comentario      String
  tipo            TipoComentario
  autorId         String
  comentarioPaiId String?  // Para respostas
  
  // Relacionamentos
  ata             AtaReuniao @relation(fields: [ataId], references: [id], onDelete: Cascade)
  autor           Usuario     @relation(fields: [autorId], references: [id], onDelete: Cascade)
  comentarioPai   AtaComentario? @relation("ComentarioRespostas", fields: [comentarioPaiId], references: [id])
  respostas       AtaComentario[] @relation("ComentarioRespostas")
  
  // Metadados
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([ataId])
  @@index([autorId])
  @@index([comentarioPaiId])
}

enum TipoComentario {
  COMENTARIO
  SUGESTAO
  APROVACAO
  REPROVACAO
}
```

**Status:** ✅ Implementado e aplicado no banco

### ✅ Campos JSON e Metadados de IA (CONCLUÍDO)

**Campos adicionados ao `AtaReuniao`:**
- ✅ `pautas` (Json?) - Array de objetos estruturados
- ✅ `decisoes` (Json?) - Array de objetos estruturados (convertido de String)
- ✅ `acoes` (Json?) - Array de objetos estruturados (novo)
- ✅ `descricao` (String?) - Descrição breve da ata
- ✅ `resumo` (String?) - Resumo gerado por IA
- ✅ `geradoPorIa` (Boolean?) - Indica se foi gerado/processado por IA
- ✅ `iaUsada` (String?) - Qual IA foi usada (ex: "Groq", "Claude")
- ✅ `modeloIa` (String?) - Modelo específico usado
- ✅ `custoIa` (String?) - Custo estimado do processamento
- ✅ `tempoProcessamentoIa` (Int?) - Tempo em milissegundos
- ✅ `arquivoOriginalUrl` (String?) - URL do arquivo original
- ✅ `arquivoOriginalNome` (String?) - Nome do arquivo original
- ✅ `arquivoOriginalTipo` (String?) - Tipo/MIME do arquivo original

**Status:** ✅ Todos os campos implementados e aplicados no banco

---

## 🔧 Backend (NestJS)

### Endpoints Faltantes

#### 1. Comentários

**GET `/atas/:id/comentarios`**
- Buscar todos os comentários de uma ata
- Incluir informações do autor
- Suportar hierarquia (respostas)

**POST `/atas/:id/comentarios`**
- Criar novo comentário
- Tipos: comentario, sugestao, aprovacao, reprovacao
- Suportar resposta a outro comentário

**PUT `/atas/:id/comentarios/:comentarioId`**
- Atualizar comentário existente

**DELETE `/atas/:id/comentarios/:comentarioId`**
- Deletar comentário

#### 2. Exportação HTML

**GET `/atas/:id/export/html`**
- Gerar HTML formatado da ata
- Incluir todos os dados: participantes, pautas, decisões, ações
- Estilização adequada

#### 3. Ajustes de Mapeamento

**Status:**
- painel-completo: `rascunho`, `finalizada`, `aprovada`, `arquivada`
- Nosso schema: `RASCUNHO`, `PUBLICADA`, `ARQUIVADA`
- **Ação**: Criar função de mapeamento ou ajustar enum

**Tipos de Reunião:**
- painel-completo: `reuniao_geral`, `reuniao_diretoria`, `reuniao_tecnica`, `outro`
- Nosso schema: `ASSEMBLEIA_GERAL`, `CONSELHO_DIRETOR`, `REUNIAO_ORDINARIA`, `REUNIAO_EXTRAORDINARIA`, `COMISSAO`, `OUTRO`
- **Ação**: Mapear corretamente na API route

---

## 🎨 Frontend

### Componentes Faltantes

#### 1. Busca Semântica (OPCIONAL - pode ser simplificado)
- `AtaSearchWrapper` - Wrapper principal
- `AtaSearchBar` - Barra de busca
- `AtaSearchFilters` - Filtros
- `AtaSearchResults` - Resultados

**Nota**: A busca semântica requer embeddings e pode ser complexa. 
**Solução temporária**: Usar busca full-text simples via backend.

#### 2. Página de Edição
- `/admin/atas/[id]/editar/page.tsx`
- Formulário completo de edição
- Similar à página de detalhes, mas editável

#### 3. Ajustes de Mapeamento
- Adaptar interfaces para mapear status/tipos corretamente
- Garantir que dados do backend sejam transformados para o formato esperado pelo frontend

---

## 📦 Dependências

### Verificar se já estão instaladas:

```json
{
  "date-fns": "^3.x", // ✅ Já instalado
  "mammoth": "^1.x"   // ❓ Para DOCX (opcional)
}
```

### Dependências de IA (já no backend):
- `groq-sdk` - ✅ Já usado
- Outras IAs podem ser adicionadas depois

---

## ✅ Checklist de Implementação

### Fase 1: Banco de Dados ✅ CONCLUÍDA
- [x] Adicionar modelo `AtaComentario` ao schema.prisma
- [x] Adicionar enum `TipoComentario`
- [x] Adicionar campos JSON (pautas, decisoes, acoes)
- [x] Adicionar metadados de IA (geradoPorIa, iaUsada, modeloIa, etc)
- [x] Adicionar campos de arquivo original
- [x] Aplicar mudanças no banco (db push)
- [x] Gerar Prisma Client atualizado

### Fase 2: Backend - Comentários ✅ CONCLUÍDA
- [x] Criar DTOs para comentários
  - `CreateComentarioDto` - Para criar novo comentário
  - `UpdateComentarioDto` - Para atualizar comentário
- [x] Implementar métodos em `AtasService`
  - `findComentarios(ataId)` - Buscar todos os comentários de uma ata
  - `createComentario(ataId, dto, userId)` - Criar novo comentário
  - `updateComentario(id, dto, userId)` - Atualizar comentário
  - `removeComentario(id, userId)` - Deletar comentário
- [x] Criar controller com endpoints REST
  - `GET /atas/:id/comentarios` - Listar comentários
  - `POST /atas/:id/comentarios` - Criar comentário
  - `PUT /atas/:id/comentarios/:comentarioId` - Atualizar comentário
  - `DELETE /atas/:id/comentarios/:comentarioId` - Deletar comentário
- [x] Adicionar validações (class-validator)
- [x] Criar API routes no frontend
- [x] Conectar componente `ComentariosAta` ao backend

### Fase 3: Backend - Exportação ✅ CONCLUÍDA
- [x] Criar método `exportarHTML` no service
- [x] Implementar template HTML (completo com estilos CSS)
- [x] Criar endpoint GET `/atas/:id/export/html` no backend
- [x] Criar API route `/api/export-ata` no frontend
- [x] Conectar botão de download HTML na página de detalhes

### Fase 4: Backend - Ajustes ✅ CONCLUÍDA
- [x] Criar função de mapeamento status (painel-completo ↔ nosso schema)
- [x] Criar função de mapeamento tipos
- [x] Ajustar transformação de dados na API route `/api/admin/atas/[id]`
- [x] Verificar todos os campos estão sendo mapeados corretamente
- [x] Atualizar DTOs para aceitar campos JSON diretamente
- [x] Atualizar rotas de decisões e ações para usar campos JSON

### Fase 5: Frontend - Comentários ✅ CONCLUÍDA
- [x] Conectar componente `ComentariosAta` ao backend
- [x] Implementar criação de comentários
- [x] Implementar respostas
- [x] Criar API routes para comentários

### Fase 6: Frontend - Página de Edição
- [ ] Criar `/admin/atas/[id]/editar/page.tsx`
- [ ] Implementar formulário de edição
- [ ] Conectar ao backend
- [ ] Testar edição

### Fase 7: Frontend - Busca (Opcional)
- [ ] Decidir: implementar busca semântica ou simplificar
- [ ] Se simplificar: usar busca full-text do backend
- [ ] Se implementar: criar componentes de busca

### Fase 8: Testes e Ajustes
- [ ] Testar importação de atas
- [ ] Testar visualização de detalhes
- [ ] Testar comentários e aprovações
- [ ] Testar edição
- [ ] Testar exportação HTML
- [ ] Verificar mapeamento de dados em todos os fluxos

---

## 🔄 Mapeamento de Dados

### Status
```typescript
// painel-completo → Nosso schema
const statusMap = {
  'rascunho': 'RASCUNHO',
  'finalizada': 'PUBLICADA',
  'aprovada': 'PUBLICADA', // Pode precisar de novo status
  'arquivada': 'ARQUIVADA'
};

// Nosso schema → painel-completo (para frontend)
const statusMapReverse = {
  'RASCUNHO': 'rascunho',
  'PUBLICADA': 'finalizada',
  'ARQUIVADA': 'arquivada'
};
```

### Tipos de Reunião
```typescript
// painel-completo → Nosso schema
const tipoMap = {
  'reuniao_geral': 'REUNIAO_ORDINARIA',
  'reuniao_diretoria': 'CONSELHO_DIRETOR',
  'reuniao_tecnica': 'COMISSAO',
  'outro': 'OUTRO'
};
```

---

## 📝 Notas Importantes

1. **Supabase vs Prisma**: painel-completo usa Supabase que tem funcionalidades extras (Storage, Auth integrado). Nosso projeto usa Prisma + NestJS, então precisamos adaptar.

2. **Server Actions vs API Routes**: painel-completo usa Server Actions (Next.js 13+), nosso projeto usa API Routes. Já temos estrutura de API routes criada.

3. **Busca Semântica**: Requer embeddings e pode ser complexa. Pode ser implementada depois ou simplificada com busca full-text.

4. **Storage de Arquivos**: painel-completo usa Supabase Storage. Nosso projeto salva localmente em `uploads/atas`. Já está funcionando.

5. **Autenticação**: painel-completo usa Supabase Auth. Nosso projeto usa JWT via NestJS. Já está funcionando.

---

## 🚀 Ordem de Prioridade

1. **Alta Prioridade**:
   - ✅ Modelo de comentários no banco
   - ✅ Campos JSON e metadados de IA
   - 🔄 **PRÓXIMO: Endpoints de comentários no backend**
   - Conectar componente de comentários ao backend
   - Ajustar mapeamento de status/tipos

2. **Média Prioridade**:
   - Página de edição
   - Exportação HTML
   - Ajustes finos de mapeamento

3. **Baixa Prioridade**:
   - Busca semântica (pode ser simplificada)
   - Suporte a DOCX (mammoth)

---

## 📍 Status Atual

### ✅ Concluído:
- Modelo `AtaComentario` criado e aplicado
- Campos JSON (pautas, decisoes, acoes) adicionados
- Metadados de IA adicionados
- Campos de arquivo original adicionados
- Schema Prisma atualizado e sincronizado com banco

### 🔄 Em Progresso:
- Nenhum no momento

### ⏳ Próximo Passo:
**Criar página de edição de atas (Fase 6) ou testar funcionalidades implementadas**

---

## 📚 Referências

- Schema Prisma: `backend/prisma/schema.prisma`
- Backend Service: `backend/src/atas/atas.service.ts`
- Frontend Page: `frontend/src/app/(app)/admin/atas/[id]/page.tsx`
- painel-completo: `painel-completo/src/app/admin/atas/`

---

## 🎯 Próximo Passo Detalhado

### Implementar Endpoints de Comentários no Backend

**Arquivos a criar/modificar:**

1. **DTOs** (`backend/src/atas/dto/`):
   - `create-comentario.dto.ts` - DTO para criar comentário
   - `update-comentario.dto.ts` - DTO para atualizar comentário

2. **Service** (`backend/src/atas/atas.service.ts`):
   - Adicionar métodos:
     - `findComentarios(ataId: string)` - Buscar todos os comentários
     - `createComentario(ataId: string, dto: CreateComentarioDto, userId: string)` - Criar comentário
     - `updateComentario(id: string, dto: UpdateComentarioDto, userId: string)` - Atualizar comentário
     - `removeComentario(id: string, userId: string)` - Deletar comentário

3. **Controller** (`backend/src/atas/atas.controller.ts`):
   - Adicionar rotas:
     - `GET /atas/:id/comentarios` - Listar comentários
     - `POST /atas/:id/comentarios` - Criar comentário
     - `PUT /atas/:id/comentarios/:comentarioId` - Atualizar comentário
     - `DELETE /atas/:id/comentarios/:comentarioId` - Deletar comentário

**Estrutura esperada dos endpoints:**
```
GET    /atas/:id/comentarios          - Listar todos os comentários (com hierarquia)
POST   /atas/:id/comentarios          - Criar novo comentário
PUT    /atas/:id/comentarios/:comentarioId - Atualizar comentário
DELETE /atas/:id/comentarios/:comentarioId - Deletar comentário
```

**Referência do painel-completo:**
- `painel-completo/src/server/actions/atas/atas-comentarios.ts`

**Validações necessárias:**
- Verificar se a ata existe
- Verificar se o usuário tem permissão
- Validar tipo de comentário (COMENTARIO, SUGESTAO, APROVACAO, REPROVACAO)
- Validar se comentário pai existe (para respostas)

