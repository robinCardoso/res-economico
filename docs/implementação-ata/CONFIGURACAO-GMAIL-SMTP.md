# Configuração de E-mail SMTP - Gmail

## ⚠️ Problema Comum: "Application-specific password required"

Quando você tenta usar Gmail com autenticação de dois fatores (2FA) habilitada, o Gmail requer uma **senha de aplicativo** ao invés da senha normal da conta.

## 🔧 Solução: Criar Senha de Aplicativo

### Passo 1: Verificar se 2FA está ativado

1. Acesse: https://myaccount.google.com/security
2. Verifique se "Verificação em duas etapas" está **ATIVADA**

### Passo 2: Gerar Senha de Aplicativo

1. Acesse: https://myaccount.google.com/apppasswords
   - Ou vá em: Conta Google → Segurança → Senhas de app

2. Selecione:
   - **App**: "Outro (nome personalizado)"
   - **Nome**: Digite "Sistema de Atas" ou outro nome descritivo

3. Clique em **Gerar**

4. **Copie a senha gerada** (16 caracteres, sem espaços)

### Passo 3: Configurar no Sistema

1. Acesse `/admin/configuracoes/email`
2. Preencha os campos:
   - **Host**: `smtp.gmail.com`
   - **Porta**: `587` (TLS) ou `465` (SSL)
   - **Autenticar por SMTP**: `Sim`
   - **Usuário**: Seu e-mail completo (ex: `seuemail@gmail.com`)
   - **Senha**: **Cole a senha de aplicativo gerada** (não use sua senha normal!)
   - **Enviar cópias para**: (opcional)

3. Clique em **Salvar**

4. Teste a conexão clicando no botão **Testar Conexão**

5. Envie um e-mail de teste para verificar

## 📋 Configurações Recomendadas para Gmail

| Campo | Valor |
|-------|-------|
| Host | `smtp.gmail.com` |
| Porta | `587` (recomendado) ou `465` |
| Autenticar | `Sim` |
| Usuário | Seu e-mail completo |
| Senha | Senha de aplicativo (16 caracteres) |

## 🔐 Segurança

- **NUNCA** use sua senha normal do Gmail
- Use sempre **senha de aplicativo** quando 2FA estiver ativado
- A senha de aplicativo é específica para este sistema
- Você pode revogar a senha a qualquer momento

## ❌ Erros Comuns

### "Invalid login: Application-specific password required"

**Causa**: Tentando usar senha normal com 2FA ativado

**Solução**: Gerar e usar senha de aplicativo

### "Connection timeout"

**Causa**: Porta ou host incorretos

**Solução**: 
- Verificar se porta é `587` ou `465`
- Verificar se host é `smtp.gmail.com`

### "Authentication failed"

**Causa**: Usuário ou senha incorretos

**Solução**:
- Verificar se o e-mail está completo
- Verificar se está usando senha de aplicativo (não senha normal)
- Verificar se copiou a senha corretamente (sem espaços)

## 🔄 Alternativas ao Gmail

Se preferir não usar Gmail, você pode usar:

- **Outlook/Hotmail**: `smtp-mail.outlook.com` (porta 587)
- **Yahoo**: `smtp.mail.yahoo.com` (porta 587)
- **Servidor SMTP próprio**: Configure conforme fornecido pelo provedor

## 📝 Notas

- Senhas de aplicativo são mais seguras que senhas normais
- Cada aplicativo pode ter sua própria senha
- Você pode ter múltiplas senhas de aplicativo
- Revogar uma senha não afeta outras

