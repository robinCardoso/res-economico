# Plano de Implementação - Sistema de E-mail e Configurações

## 🎯 Objetivos

1. Criar sistema de configuração de e-mail reutilizável para todo o sistema
2. Permitir configuração via interface (SMTP)
3. Implementar logs de envio com status (sucesso/falha)
4. Integrar com lembretes de prazos das atas
5. Criar menu "Configurações" com abas (escalável para futuro)
6. Permitir envio para criador da ata OU criador do prazo (configurável)

## 📋 Estrutura Proposta

### Backend

#### 1. Modelos Prisma

```prisma
model ConfiguracaoEmail {
  id              String   @id @default(uuid())
  nome            String   // Nome da configuração (ex: "Principal", "Backup")
  host            String   // smtp.gmail.com
  porta           Int      // 587, 465, 25
  autenticar      Boolean  @default(true)
  usuario         String   // e-mail
  senha           String   // senha criptografada
  copiasPara      String?  // e-mails separados por ponto e vírgula
  ativo           Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  logsEnvio       LogEnvioEmail[]
}

model LogEnvioEmail {
  id                String            @id @default(uuid())
  configuracaoId    String
  destinatario      String
  assunto           String
  status            StatusEnvioEmail  @default(PENDENTE)
  erro              String?
  tentativas        Int               @default(0)
  enviadoEm         DateTime?
  createdAt         DateTime          @default(now())
  configuracao      ConfiguracaoEmail @relation(fields: [configuracaoId], references: [id])
  
  @@index([configuracaoId])
  @@index([status])
  @@index([createdAt])
}

enum StatusEnvioEmail {
  PENDENTE
  ENVIADO
  FALHA
  CANCELADO
}
```

#### 2. Módulo de Configurações

- `ConfiguracoesModule` - Módulo principal
- `ConfiguracoesController` - Endpoints de configuração
- `ConfiguracoesService` - Lógica de configurações
- `EmailService` - Serviço genérico de envio de e-mail
- `EmailLogService` - Gerenciamento de logs

#### 3. Endpoints

```
GET    /configuracoes/email              - Listar configurações
GET    /configuracoes/email/:id          - Obter configuração
POST   /configuracoes/email               - Criar configuração
PUT    /configuracoes/email/:id           - Atualizar configuração
DELETE /configuracoes/email/:id           - Deletar configuração
POST   /configuracoes/email/:id/testar     - Testar envio
GET    /configuracoes/email/logs          - Listar logs de envio
```

### Frontend

#### 1. Estrutura de Rotas

```
/admin/configuracoes
  ├── /email              - Aba: Envio de E-mail
  ├── /geral              - Aba: Geral (futuro)
  ├── /auditoria          - Aba: Auditoria (futuro)
  └── /...                - Outras abas futuras
```

#### 2. Componentes

- `ConfiguracoesLayout` - Layout com abas
- `ConfiguracaoEmailForm` - Formulário de configuração
- `EmailLogsTable` - Tabela de logs
- `TestarEmailDialog` - Dialog para testar envio

#### 3. Menu Sidebar

Adicionar item "Configurações" no `AdminSidebar`

## 🔧 Funcionalidades

### 1. Configuração de E-mail

- Campos:
  - Host SMTP
  - Porta
  - Autenticar por SMTP (Sim/Não)
  - Usuário (e-mail)
  - Senha (criptografada)
  - Enviar cópias para (opcional)
- Validação de configuração
- Teste de envio
- Múltiplas configurações (principal/backup)

### 2. Logs de Envio

- Status: PENDENTE, ENVIADO, FALHA, CANCELADO
- Tentativas de envio
- Mensagem de erro (se houver)
- Data/hora de envio
- Filtros e busca

### 3. Integração com Lembretes

- Usar `EmailService` no `LembretePrazoService`
- Configuração de destinatário:
  - Criador da ATA
  - Criador do PRAZO
  - Ambos
- Respeitar `TipoLembrete` (EMAIL, NOTIFICACAO_SISTEMA, AMBOS)

### 4. Reutilização

O `EmailService` pode ser usado em:
- Lembretes de prazos
- Notificações de processos
- Alertas do sistema
- Relatórios automáticos
- Qualquer outro módulo que precise enviar e-mail

## 📝 Implementação

### Fase 1: Backend - Modelos e Estrutura
1. Adicionar modelos no Prisma
2. Criar migration
3. Criar DTOs
4. Criar módulo e serviços base

### Fase 2: Backend - EmailService
1. Implementar envio via SMTP (nodemailer)
2. Implementar logs
3. Implementar retry em caso de falha
4. Criptografar senha

### Fase 3: Backend - Endpoints
1. CRUD de configurações
2. Endpoint de teste
3. Endpoint de logs

### Fase 4: Frontend - Estrutura
1. Criar layout com abas
2. Adicionar menu no sidebar
3. Criar rotas

### Fase 5: Frontend - Formulário
1. Formulário de configuração
2. Validação
3. Teste de envio
4. Tabela de logs

### Fase 6: Integração
1. Integrar com LembretePrazoService
2. Testar envio de lembretes
3. Verificar logs

## 🔐 Segurança

- Senha criptografada no banco (bcrypt ou similar)
- Validação de permissões (apenas admin)
- Rate limiting para envios
- Validação de e-mails

## 🚀 Escalabilidade

- Sistema preparado para múltiplas configurações
- Logs para auditoria
- Fácil adicionar novas abas em Configurações
- EmailService reutilizável em qualquer módulo

