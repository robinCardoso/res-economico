# 📋 Plano de Implementação: Preferências de Notificação, Push e Log de Alterações

**Data:** Janeiro 2025  
**Status:** 🚧 Em Implementação

---

## 🎯 Objetivo

Implementar três melhorias importantes para o sistema de atas:
1. **Preferências de Notificação** - Permitir usuários configurar como e quando receber notificações
2. **Notificações Push** - Notificações no navegador mesmo quando a aba está fechada
3. **Log de Alterações** - Auditoria completa de todas as mudanças nas atas

---

## 📊 1. Preferências de Notificação

### 1.1. Modelo de Dados (Prisma)

```prisma
model PreferenciaNotificacao {
  id                    String   @id @default(uuid())
  usuarioId             String   @unique
  emailAtivo            Boolean  @default(true)
  sistemaAtivo          Boolean  @default(true)
  pushAtivo             Boolean  @default(false)
  
  // Frequência de lembretes
  lembrete3Dias         Boolean  @default(true)
  lembrete1Dia          Boolean  @default(true)
  lembreteHoje          Boolean  @default(true)
  lembreteVencido       Boolean  @default(true)
  
  // Horários de notificação
  horarioInicio         String   @default("08:00")
  horarioFim            String   @default("18:00")
  diasSemana            String[] @default(["segunda", "terca", "quarta", "quinta", "sexta"])
  
  // Tipos de eventos
  notificarPrazos       Boolean  @default(true)
  notificarHistorico    Boolean  @default(false)
  notificarComentarios  Boolean  @default(false)
  notificarStatus       Boolean  @default(true)
  
  // Resumos
  resumoDiario          Boolean  @default(false)
  resumoSemanal         Boolean  @default(true)
  diaResumoSemanal      String   @default("segunda")
  horarioResumoSemanal  String   @default("09:00")
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  usuario               Usuario  @relation(fields: [usuarioId], references: [id], onDelete: Cascade)
}
```

### 1.2. Backend

**Arquivos a criar:**
- `backend/src/preferencias-notificacao/preferencias-notificacao.module.ts`
- `backend/src/preferencias-notificacao/preferencias-notificacao.service.ts`
- `backend/src/preferencias-notificacao/preferencias-notificacao.controller.ts`
- `backend/src/preferencias-notificacao/dto/create-preferencia-notificacao.dto.ts`
- `backend/src/preferencias-notificacao/dto/update-preferencia-notificacao.dto.ts`

**Endpoints:**
- `GET /preferencias-notificacao` - Buscar preferências do usuário logado
- `PUT /preferencias-notificacao` - Atualizar preferências do usuário logado
- `POST /preferencias-notificacao` - Criar preferências (se não existir)

### 1.3. Frontend

**Arquivos a criar:**
- `frontend/src/app/(app)/admin/configuracoes/notificacoes/page.tsx`
- `frontend/src/services/preferencias-notificacao.service.ts`

**Funcionalidades:**
- Formulário completo de preferências
- Toggle switches para cada opção
- Seletor de horários
- Seletor de dias da semana
- Preview das configurações

---

## 📱 2. Notificações Push

### 2.1. Service Worker

**Arquivos a criar:**
- `frontend/public/sw.js` - Service Worker
- `frontend/public/firebase-messaging-sw.js` (se usar Firebase)
- `frontend/src/lib/push-notifications.ts` - Utilitários para push

**Funcionalidades:**
- Registrar service worker
- Solicitar permissão de notificação
- Receber notificações push
- Gerenciar subscription

### 2.2. Modelo de Dados (Prisma)

```prisma
model PushSubscription {
  id            String   @id @default(uuid())
  usuarioId     String
  endpoint      String
  p256dh        String
  auth          String
  userAgent     String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  usuario       Usuario  @relation(fields: [usuarioId], references: [id], onDelete: Cascade)
  
  @@unique([usuarioId, endpoint])
  @@index([usuarioId])
}
```

### 2.3. Backend

**Arquivos a criar:**
- `backend/src/push-notifications/push-notifications.module.ts`
- `backend/src/push-notifications/push-notifications.service.ts`
- `backend/src/push-notifications/push-notifications.controller.ts`
- `backend/src/push-notifications/dto/create-subscription.dto.ts`

**Endpoints:**
- `POST /push-notifications/subscribe` - Registrar subscription
- `DELETE /push-notifications/unsubscribe` - Remover subscription
- `POST /push-notifications/send` - Enviar notificação (admin)

**Dependências:**
- `web-push` - Para enviar notificações push

### 2.4. Integração com Lembretes

Modificar `lembrete-prazo.service.ts` para:
- Verificar preferências do usuário
- Enviar push se `pushAtivo === true`
- Respeitar horários configurados

---

## 📝 3. Log de Alterações

### 3.1. Modelo de Dados (Prisma)

```prisma
model LogAlteracaoAta {
  id              String   @id @default(uuid())
  ataId           String
  usuarioId       String
  tipoAlteracao   TipoAlteracaoAta
  campo           String?  // Nome do campo alterado
  valorAnterior   String?  // Valor antes da alteração (JSON se necessário)
  valorNovo       String?  // Valor após alteração (JSON se necessário)
  descricao       String?  // Descrição da alteração
  metadata        Json?    // Dados adicionais (IP, user agent, etc.)
  createdAt       DateTime @default(now())
  
  ata             AtaReuniao @relation(fields: [ataId], references: [id], onDelete: Cascade)
  usuario         Usuario    @relation(fields: [usuarioId], references: [id])
  
  @@index([ataId])
  @@index([usuarioId])
  @@index([tipoAlteracao])
  @@index([createdAt])
}

enum TipoAlteracaoAta {
  CRIACAO
  EDICAO
  EXCLUSAO
  MUDANCA_STATUS
  ADICAO_HISTORICO
  EDICAO_HISTORICO
  EXCLUSAO_HISTORICO
  ADICAO_PRAZO
  EDICAO_PRAZO
  EXCLUSAO_PRAZO
  CONCLUSAO_PRAZO
  ADICAO_COMENTARIO
  EDICAO_COMENTARIO
  EXCLUSAO_COMENTARIO
  UPLOAD_ARQUIVO
  DOWNLOAD_ARQUIVO
}
```

### 3.2. Backend

**Arquivos a criar:**
- `backend/src/log-alteracoes/log-alteracoes.module.ts`
- `backend/src/log-alteracoes/log-alteracoes.service.ts`
- `backend/src/log-alteracoes/log-alteracoes.controller.ts`
- `backend/src/log-alteracoes/dto/filter-logs.dto.ts`

**Endpoints:**
- `GET /atas/:id/logs` - Listar logs de uma ata
- `GET /log-alteracoes` - Listar todos os logs (com filtros)
- `GET /log-alteracoes/:id` - Detalhes de um log

**Integração:**
- Criar decorator `@LogAlteracao()` para métodos
- Interceptor para capturar alterações automaticamente
- Service para registrar logs manualmente

### 3.3. Frontend

**Arquivos a criar:**
- `frontend/src/app/(app)/admin/atas/[id]/logs/page.tsx` - Página de logs
- `frontend/src/services/log-alteracoes.service.ts`

**Funcionalidades:**
- Timeline de alterações
- Filtros por tipo, usuário, data
- Visualização de diff (valor anterior vs novo)
- Exportação de logs

---

## 🗂️ Estrutura de Arquivos

### Backend
```
backend/src/
├── preferencias-notificacao/
│   ├── preferencias-notificacao.module.ts
│   ├── preferencias-notificacao.service.ts
│   ├── preferencias-notificacao.controller.ts
│   └── dto/
│       ├── create-preferencia-notificacao.dto.ts
│       └── update-preferencia-notificacao.dto.ts
├── push-notifications/
│   ├── push-notifications.module.ts
│   ├── push-notifications.service.ts
│   ├── push-notifications.controller.ts
│   └── dto/
│       └── create-subscription.dto.ts
└── log-alteracoes/
    ├── log-alteracoes.module.ts
    ├── log-alteracoes.service.ts
    ├── log-alteracoes.controller.ts
    ├── decorators/
    │   └── log-alteracao.decorator.ts
    ├── interceptors/
    │   └── log-alteracao.interceptor.ts
    └── dto/
        └── filter-logs.dto.ts
```

### Frontend
```
frontend/src/
├── app/(app)/admin/configuracoes/
│   └── notificacoes/
│       └── page.tsx
├── app/(app)/admin/atas/[id]/
│   └── logs/
│       └── page.tsx
├── services/
│   ├── preferencias-notificacao.service.ts
│   └── log-alteracoes.service.ts
└── lib/
    └── push-notifications.ts
```

---

## 📅 Ordem de Implementação

### Fase 1: Preferências de Notificação (2-3 dias)
1. ✅ Criar modelo Prisma
2. ✅ Migration
3. ✅ Backend (service, controller, DTOs)
4. ✅ Frontend (página de configurações)
5. ✅ Integrar com sistema de lembretes

### Fase 2: Log de Alterações (2-3 dias)
1. ✅ Criar modelo Prisma
2. ✅ Migration
3. ✅ Backend (service, controller, decorator, interceptor)
4. ✅ Integrar com endpoints existentes
5. ✅ Frontend (página de logs)

### Fase 3: Notificações Push (3-4 dias)
1. ✅ Instalar dependências (`web-push`)
2. ✅ Criar service worker
3. ✅ Criar modelo Prisma
4. ✅ Migration
5. ✅ Backend (service, controller)
6. ✅ Frontend (registro de subscription)
7. ✅ Integrar com lembretes

---

## 🔧 Dependências

### Backend
```json
{
  "web-push": "^3.6.6"
}
```

### Frontend
```json
{
  "@types/web-push": "^3.6.0"
}
```

---

## ✅ Checklist de Implementação

### Preferências de Notificação
- [ ] Modelo Prisma criado
- [ ] Migration aplicada
- [ ] Backend implementado
- [ ] Frontend implementado
- [ ] Integração com lembretes
- [ ] Testes

### Log de Alterações
- [ ] Modelo Prisma criado
- [ ] Migration aplicada
- [ ] Backend implementado
- [ ] Decorator e interceptor criados
- [ ] Integração com endpoints
- [ ] Frontend implementado
- [ ] Testes

### Notificações Push
- [ ] Service worker criado
- [ ] Modelo Prisma criado
- [ ] Migration aplicada
- [ ] Backend implementado
- [ ] Frontend implementado
- [ ] Integração com lembretes
- [ ] Testes

---

## 🎯 Próximos Passos

1. Criar modelos Prisma
2. Criar migrations
3. Implementar backend (começar por preferências)
4. Implementar frontend
5. Integrar com sistema existente
6. Testes e ajustes

---

**Última Atualização:** Janeiro 2025

