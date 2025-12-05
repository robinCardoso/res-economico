# Sistema de Lembretes de Prazos das Atas

## 📋 Status Atual

### ✅ **IMPLEMENTADO**

1. **Sistema de Agendamento (Cron Jobs)**
   - ✅ Verificação diária às **9h** da manhã
   - ✅ Verificação adicional às **14h** para prazos urgentes
   - ✅ Usa `@nestjs/schedule` para agendamento automático

2. **Lógica de Verificação de Prazos**
   - ✅ Detecta prazos **vencidos**
   - ✅ Detecta prazos que vencem em **3 dias**
   - ✅ Detecta prazos que vencem **amanhã** (1 dia)
   - ✅ Detecta prazos que vencem **hoje**

3. **Criação de Lembretes**
   - ✅ Cria lembretes no banco de dados
   - ✅ Mensagens personalizadas por tipo de prazo
   - ✅ Evita duplicação (não envia mais de 1 lembrete por dia, exceto vencidos)
   - ✅ Atualiza contador de lembretes enviados no prazo

4. **Frontend - Notificações**
   - ✅ Componente `NotificacoesLembretes` implementado
   - ✅ Badge com contador de lembretes não lidos
   - ✅ Lista de lembretes pendentes
   - ✅ Marcar como lido individual ou todos
   - ✅ Atualização automática a cada 30 segundos
   - ✅ Links diretos para a ata relacionada

5. **API Backend**
   - ✅ `GET /atas/lembretes` - Lista lembretes do usuário
   - ✅ `PUT /atas/lembretes/:lembreteId/lido` - Marca como lido

### ⚠️ **PENDENTE / PARCIALMENTE IMPLEMENTADO**

1. **Envio por E-mail**
   - ❌ **NÃO IMPLEMENTADO** - Código comentado no service
   - ⚠️ Existe enum `TipoLembrete` com opções: `EMAIL`, `NOTIFICACAO_SISTEMA`, `AMBOS`
   - ⚠️ Atualmente só cria lembretes do tipo `NOTIFICACAO_SISTEMA`
   - ⚠️ Não há serviço de e-mail configurado

## 🔧 Como Funciona Atualmente

### 1. **Agendamento Automático**

O sistema executa verificações automáticas em dois horários:

```typescript
// Às 9h da manhã - Verificação completa
@Cron(CronExpression.EVERY_DAY_AT_9AM)
async handleLembretesDiarios()

// Às 14h - Verificação de prazos urgentes
@Cron('0 14 * * *')
async handleLembretesUrgentes()
```

### 2. **Verificação de Prazos**

O método `enviarLembretes()` verifica:

1. **Prazos Vencidos**: Todos os prazos com `dataPrazo < hoje` e `concluido = false`
2. **Prazos em 3 dias**: Prazos que vencem exatamente em 3 dias
3. **Prazos em 1 dia**: Prazos que vencem amanhã
4. **Prazos de hoje**: Prazos que vencem hoje

### 3. **Mensagens de Lembrete**

Cada tipo de prazo gera uma mensagem específica:

- **VENCIDO**: `⚠️ Prazo VENCIDO: "{titulo}" da ata {numero}. Data do prazo: {data}`
- **3_DIAS**: `📅 Lembrete: O prazo "{titulo}" da ata {numero} vence em 3 dias ({data})`
- **1_DIA**: `⏰ URGENTE: O prazo "{titulo}" da ata {numero} vence AMANHÃ ({data})`
- **HOJE**: `🔔 ATENÇÃO: O prazo "{titulo}" da ata {numero} vence HOJE ({data})`

### 4. **Prevenção de Duplicação**

- Para prazos não vencidos: Verifica se já foi enviado lembrete hoje
- Para prazos vencidos: Permite envio diário (não bloqueia)

### 5. **Exibição no Frontend**

O componente `NotificacoesLembretes`:
- Exibe badge com quantidade de lembretes não lidos
- Lista todos os lembretes pendentes
- Permite marcar como lido
- Atualiza automaticamente a cada 30 segundos
- Fornece links diretos para a ata

## 📧 Implementação de E-mail (Pendente)

### O que precisa ser feito:

1. **Configurar Serviço de E-mail**
   - Instalar `@nestjs-modules/mailer` ou usar Resend API
   - Configurar variáveis de ambiente (SMTP ou API Key)
   - Criar `EmailService` ou `MailService`

2. **Criar Templates de E-mail**
   - Template HTML para lembretes
   - Incluir informações do prazo e da ata
   - Link para acessar a ata no sistema

3. **Atualizar LembretePrazoService**
   - Descomentar código de envio de e-mail
   - Implementar lógica baseada em `TipoLembrete`:
     - `EMAIL`: Apenas e-mail
     - `NOTIFICACAO_SISTEMA`: Apenas notificação no sistema (atual)
     - `AMBOS`: E-mail + notificação no sistema

4. **Configurar Preferências do Usuário**
   - Permitir que usuário escolha tipo de lembrete preferido
   - Salvar preferência no perfil do usuário

### Exemplo de Implementação:

```typescript
// No LembretePrazoService
async enviarLembretePrazo(...) {
  // ... código atual ...
  
  // Enviar e-mail se configurado
  if (lembrete.tipo === TipoLembrete.EMAIL || lembrete.tipo === TipoLembrete.AMBOS) {
    await this.emailService.enviarLembrete({
      to: usuario.email,
      subject: `Lembrete de Prazo: ${prazo.titulo}`,
      template: 'lembrete-prazo',
      context: {
        nome: usuario.nome,
        tituloPrazo: prazo.titulo,
        numeroAta: prazo.ata.numero,
        dataPrazo: dataPrazoFormatada,
        mensagem: mensagem,
        linkAta: `${process.env.FRONTEND_URL}/admin/atas/${prazo.ata.id}/processo`,
      },
    });
  }
}
```

## 📊 Estrutura do Banco de Dados

### Modelo `LembretePrazo`

```prisma
model LembretePrazo {
  id        String @id @default(uuid())
  prazoId   String
  usuarioId String
  tipo      TipoLembrete
  mensagem  String
  enviado   Boolean      @default(false)
  dataEnvio DateTime?
  createdAt DateTime @default(now())
  
  prazo   PrazoAcao @relation(...)
  usuario Usuario   @relation(...)
}
```

### Enum `TipoLembrete`

```prisma
enum TipoLembrete {
  EMAIL                 // Apenas e-mail
  NOTIFICACAO_SISTEMA  // Apenas notificação no sistema (atual)
  AMBOS                // E-mail + notificação
}
```

## 🎯 Recomendações

1. **Prioridade Alta**: Implementar envio por e-mail
2. **Prioridade Média**: Permitir usuário escolher tipo de lembrete
3. **Prioridade Baixa**: Notificações push (PWA)

## 📝 Arquivos Relacionados

- `backend/src/atas/lembrete-prazo.service.ts` - Lógica de lembretes
- `backend/src/atas/lembrete-prazo.scheduler.ts` - Agendamento (Cron)
- `backend/src/atas/atas.controller.ts` - Endpoints API
- `frontend/src/components/atas/notificacoes-lembretes.tsx` - Componente UI
- `backend/prisma/schema.prisma` - Modelo de dados

