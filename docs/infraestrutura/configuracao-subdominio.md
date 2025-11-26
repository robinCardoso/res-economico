# 🌐 Configuração de Subdomínio: painel.redeuniaonacional.com.br

## 🎯 Objetivo

Configurar o subdomínio `painel.redeuniaonacional.com.br` para apontar para o sistema hospedado na Hostinger.

---

## ✅ Como Funciona

### O que você quer fazer:

```
painel.redeuniaonacional.com.br
         ↓ (CNAME)
    IP do VPS Hostinger
         ↓
    Sistema RESECO
```

### Passos Necessários:

1. **Configurar DNS** - Criar registro CNAME apontando para o IP do VPS
2. **Configurar Nginx** - Aceitar requisições do subdomínio
3. **Configurar SSL** - Certificado HTTPS para o subdomínio
4. **Atualizar CORS** - Permitir requisições do novo domínio
5. **Atualizar Variáveis** - Configurar URLs no sistema

---

## 📋 Passo a Passo Completo

### Fase 1: Obter IP do VPS Hostinger

1. **Acesse o painel da Hostinger**
2. **Vá em VPS** → Seu servidor
3. **Copie o IP público** do servidor
   - Exemplo: `185.123.45.67`

**Anote este IP!** Você vai precisar dele.

---

### Fase 2: Configurar DNS (Registro CNAME)

#### Opção A: Se o domínio está na Hostinger

1. **Acesse:** Painel Hostinger → Domínios → `redeuniaonacional.com.br`
2. **Vá em:** Gerenciar DNS / Zona DNS
3. **Adicione novo registro:**

```
Tipo: CNAME
Nome: painel
Valor: seu-ip-do-vps.hostinger.com
TTL: 3600 (ou padrão)
```

**OU se não tiver hostname, use registro A:**

```
Tipo: A
Nome: painel
Valor: 185.123.45.67 (IP do seu VPS)
TTL: 3600 (ou padrão)
```

#### Opção B: Se o domínio está em outro provedor (Registro.br, GoDaddy, etc.)

1. **Acesse o painel do seu provedor de domínio**
2. **Vá em:** Gerenciar DNS / Zona DNS
3. **Adicione novo registro:**

**Registro A (Recomendado):**
```
Tipo: A
Nome/Host: painel
Valor/Conteúdo: 185.123.45.67 (IP do seu VPS Hostinger)
TTL: 3600
```

**OU Registro CNAME (se Hostinger fornecer hostname):**
```
Tipo: CNAME
Nome/Host: painel
Valor/Conteúdo: seu-vps.hostinger.com (ou IP direto)
TTL: 3600
```

**⚠️ Importante:**
- Use **Registro A** se tiver o IP do VPS (mais direto)
- Use **CNAME** apenas se Hostinger fornecer um hostname
- O **TTL** pode levar até 24-48 horas para propagar (geralmente 1-2 horas)

---

### Fase 3: Verificar Propagação DNS

Após configurar o DNS, verifique se está funcionando:

```bash
# No terminal (Windows PowerShell ou Linux)
nslookup painel.redeuniaonacional.com.br

# Ou
ping painel.redeuniaonacional.com.br

# Ou usar ferramenta online:
# https://www.whatsmydns.net/#CNAME/painel.redeuniaonacional.com.br
```

**Deve retornar o IP do seu VPS Hostinger.**

---

### Fase 4: Configurar Nginx no VPS

#### 1. Atualizar Configuração do Nginx

```bash
# Conectar no VPS
ssh root@seu-ip-do-vps

# Editar configuração do Nginx
nano /etc/nginx/sites-available/res-economico
```

**Conteúdo atualizado:**

```nginx
server {
    listen 80;
    server_name painel.redeuniaonacional.com.br www.painel.redeuniaonacional.com.br;

    # Frontend
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support (se necessário)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Uploads
    location /uploads {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
    }
}
```

#### 2. Testar e Recarregar Nginx

```bash
# Testar configuração
nginx -t

# Se OK, recarregar
systemctl reload nginx
```

---

### Fase 5: Configurar SSL (Let's Encrypt)

#### 1. Obter Certificado SSL

```bash
# Obter certificado SSL para o subdomínio
certbot --nginx -d painel.redeuniaonacional.com.br -d www.painel.redeuniaonacional.com.br

# Seguir instruções:
# - Email para notificações
# - Aceitar termos
# - Escolher redirecionar HTTP para HTTPS
```

#### 2. Verificar Renovação Automática

```bash
# Testar renovação
certbot renew --dry-run
```

**Pronto!** Agora o site está acessível em `https://painel.redeuniaonacional.com.br`

---

### Fase 6: Atualizar CORS no Backend

#### 1. Atualizar `backend/src/main.ts`

```typescript
// Habilitar CORS
app.enableCors({
  origin: [
    'http://localhost:3001',
    'http://localhost:3000',
    /^http:\/\/10\.1\.\d+\.\d+:3001$/, // Rede local
    /^http:\/\/10\.1\.\d+\.\d+:3000$/, // Rede local
    'https://painel.redeuniaonacional.com.br', // Subdomínio em produção
    'https://www.painel.redeuniaonacional.com.br', // Subdomínio com www
  ],
  credentials: true,
});
```

#### 2. Rebuild e Reiniciar Backend

```bash
# No servidor
cd /opt/res-economico
docker compose restart backend
```

---

### Fase 7: Atualizar Variáveis de Ambiente

#### 1. Atualizar `.env` no servidor

```bash
# Editar .env
nano /opt/res-economico/.env
```

**Adicionar/Atualizar:**

```env
# Frontend - URL pública
NEXT_PUBLIC_API_URL=https://painel.redeuniaonacional.com.br/api
```

#### 2. Rebuild Frontend

```bash
# Rebuild frontend com nova variável
cd /opt/res-economico
docker compose build frontend
docker compose restart frontend
```

---

## ✅ Checklist Completo

- [ ] **DNS Configurado**
  - [ ] Registro A ou CNAME criado
  - [ ] Nome: `painel`
  - [ ] Valor: IP do VPS Hostinger
  - [ ] TTL: 3600

- [ ] **Propagação DNS Verificada**
  - [ ] `nslookup painel.redeuniaonacional.com.br` retorna IP correto
  - [ ] Aguardou propagação (1-24 horas)

- [ ] **Nginx Configurado**
  - [ ] Arquivo `/etc/nginx/sites-available/res-economico` atualizado
  - [ ] `server_name` inclui `painel.redeuniaonacional.com.br`
  - [ ] Nginx testado (`nginx -t`)
  - [ ] Nginx recarregado

- [ ] **SSL Configurado**
  - [ ] Certificado Let's Encrypt obtido
  - [ ] HTTPS funcionando
  - [ ] Renovação automática testada

- [ ] **CORS Atualizado**
  - [ ] Backend atualizado com novo domínio
  - [ ] Backend reiniciado

- [ ] **Variáveis de Ambiente**
  - [ ] `NEXT_PUBLIC_API_URL` atualizado
  - [ ] Frontend rebuildado
  - [ ] Frontend reiniciado

- [ ] **Testes Finais**
  - [ ] Acessar `https://painel.redeuniaonacional.com.br`
  - [ ] Testar login
  - [ ] Testar funcionalidades principais
  - [ ] Verificar se não há erros de CORS

---

## 🔍 Verificações

### 1. Verificar DNS

```bash
# Windows PowerShell
nslookup painel.redeuniaonacional.com.br

# Linux/Mac
dig painel.redeuniaonacional.com.br
```

**Deve retornar:** IP do seu VPS Hostinger

### 2. Verificar SSL

```bash
# Verificar certificado SSL
openssl s_client -connect painel.redeuniaonacional.com.br:443 -servername painel.redeuniaonacional.com.br
```

**Ou acesse no navegador:** `https://painel.redeuniaonacional.com.br`
- Deve mostrar cadeado verde
- Sem avisos de certificado inválido

### 3. Verificar Nginx

```bash
# Ver logs do Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### 4. Verificar CORS

**No console do navegador (F12):**
- Não deve aparecer erros de CORS
- Requisições devem funcionar normalmente

---

## 🚨 Troubleshooting

### Problema: DNS não resolve

**Sintomas:**
- `nslookup` não retorna IP
- Site não carrega

**Soluções:**
1. Verificar se registro DNS está correto
2. Aguardar propagação (pode levar até 48 horas)
3. Limpar cache DNS:
   ```bash
   # Windows
   ipconfig /flushdns
   
   # Linux
   sudo systemd-resolve --flush-caches
   ```

### Problema: Certificado SSL não funciona

**Sintomas:**
- Aviso de certificado inválido
- HTTPS não carrega

**Soluções:**
1. Verificar se DNS está propagado antes de gerar certificado
2. Verificar se porta 80 está aberta (necessária para validação Let's Encrypt)
3. Regenerar certificado:
   ```bash
   certbot delete --cert-name painel.redeuniaonacional.com.br
   certbot --nginx -d painel.redeuniaonacional.com.br
   ```

### Problema: Erro de CORS

**Sintomas:**
- Erro no console: "CORS policy"
- Requisições bloqueadas

**Soluções:**
1. Verificar se domínio está no CORS do backend
2. Verificar se está usando `https://` (não `http://`)
3. Reiniciar backend após atualizar CORS

### Problema: Site carrega mas API não funciona

**Sintomas:**
- Frontend carrega
- Requisições API falham

**Soluções:**
1. Verificar `NEXT_PUBLIC_API_URL` no `.env`
2. Verificar se backend está rodando
3. Verificar logs do backend:
   ```bash
   docker compose logs backend
   ```

---

## 📊 Resumo do Fluxo

```
1. DNS: painel.redeuniaonacional.com.br → IP do VPS
2. Nginx: Recebe requisição → Proxy para frontend/backend
3. SSL: Let's Encrypt → Certificado HTTPS
4. Backend: CORS permite requisições do domínio
5. Frontend: Usa API_URL com novo domínio
```

---

## 🎯 Resultado Final

Após configurar tudo:

✅ **Acesso:** `https://painel.redeuniaonacional.com.br`
✅ **SSL:** Certificado válido (cadeado verde)
✅ **Funcional:** Login, uploads, relatórios funcionando
✅ **Profissional:** Domínio próprio da empresa

---

## 📚 Referências

- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Nginx Reverse Proxy](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)
- [DNS Propagation Check](https://www.whatsmydns.net/)

---

**Última atualização:** Janeiro 2025

