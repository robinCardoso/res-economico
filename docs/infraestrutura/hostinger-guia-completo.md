# 🚀 Guia Completo: Hospedagem na Hostinger Brasil

## 🎯 Decisão: Hostinger Brasil

Este documento contém **tudo que você precisa** para hospedar seu sistema na Hostinger Brasil.

---

## ✅ Por que Hostinger Brasil?

### Vantagens Principais:
- ✅ **Datacenter em São Paulo** - Latência <10ms para usuários brasileiros
- ✅ **Conformidade LGPD** - Dados armazenados no Brasil
- ✅ **Suporte 24/7 em português** - Fácil comunicação
- ✅ **Pagamento em reais** - Sem IOF, sem spread de câmbio
- ✅ **Preço acessível** - R$ 50-80/mês (com promoções)
- ✅ **Interface em português** - Mais fácil de usar

### Recursos do VPS:
- **CPU:** 2-4 vCPU (dependendo do plano)
- **RAM:** 4-8 GB (dependendo do plano)
- **Storage:** 80-160 GB SSD (dependendo do plano)
- **Tráfego:** Geralmente limitado (verificar plano)
- **Acesso:** Root completo (SSH)

**Site:** [hostinger.com.br/precos/vps-hosting](https://www.hostinger.com/br/precos/vps-hosting)

---

## 📊 Arquitetura Completa na Hostinger

### Opção Recomendada: Tudo no VPS

```
┌─────────────────────────────────┐
│  Hostinger VPS (R$ 50-80/mês)  │
│  • Frontend Next.js             │
│  • Backend NestJS               │
│  • PostgreSQL (Docker)         │
│  • Redis (Docker)               │
│  • Storage (SSD incluído)      │
└─────────────────────────────────┘
```

**Custo Total: R$ 50-80/mês** (tudo incluído!)

**Vantagens:**
- ✅ Tudo em um lugar (mais simples)
- ✅ Latência zero entre serviços
- ✅ Sem dependências externas
- ✅ Controle total

---

## 🏗️ Requisitos do Sistema

Seu sistema precisa de:
- ✅ **Frontend Next.js** - Rodando no VPS
- ✅ **Backend NestJS** - Rodando no VPS
- ✅ **PostgreSQL 16** - Via Docker no VPS
- ✅ **Redis 7** - Via Docker no VPS
- ✅ **Processamento assíncrono** - BullMQ com Redis
- ✅ **Upload de arquivos** - Storage no SSD do VPS

**Recursos necessários:**
- **Mínimo:** 2 vCPU, 4GB RAM, 80GB SSD
- **Recomendado:** 4 vCPU, 8GB RAM, 160GB SSD

---

## 📋 Setup Passo a Passo

### Fase 1: Contratação do VPS

1. **Acesse:** [hostinger.com.br/precos/vps-hosting](https://www.hostinger.com/br/precos/vps-hosting)
2. **Escolha o plano:**
   - **Básico:** 2 vCPU, 4GB RAM, 80GB SSD (se orçamento limitado)
   - **Recomendado:** 4 vCPU, 8GB RAM, 160GB SSD (melhor performance)
3. **Configure:**
   - **Sistema Operacional:** Ubuntu 22.04 LTS
   - **Localização:** São Paulo (se disponível)
   - **Acesso:** SSH Key (recomendado) ou senha
4. **Finalize a compra**

---

### Fase 2: Configuração Inicial do Servidor

#### 1. Conectar via SSH

```bash
# Conectar no servidor
ssh root@seu-ip-do-vps

# Ou se usar chave SSH
ssh -i ~/.ssh/sua-chave root@seu-ip-do-vps
```

#### 2. Atualizar Sistema

```bash
# Atualizar pacotes
apt-get update && apt-get upgrade -y

# Instalar ferramentas básicas
apt-get install -y git curl wget nano
```

#### 3. Instalar Docker

```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Instalar Docker Compose
apt-get install docker-compose-plugin -y

# Verificar instalação
docker --version
docker compose version
```

#### 4. Instalar Node.js (para build do frontend)

```bash
# Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Verificar instalação
node --version
npm --version
```

#### 5. Instalar Nginx (Reverse Proxy)

```bash
# Instalar Nginx
apt-get install nginx -y

# Iniciar e habilitar
systemctl start nginx
systemctl enable nginx
```

---

### Fase 3: Deploy da Aplicação

#### 1. Clonar Repositório

```bash
# Criar pasta do projeto
mkdir -p /opt/res-economico
cd /opt/res-economico

# Clonar repositório
git clone https://github.com/seu-usuario/res-economico.git .

# Ou fazer upload via SCP se preferir
```

#### 2. Configurar Variáveis de Ambiente

```bash
# Criar arquivo .env
nano .env
```

**Conteúdo do .env:**

```env
# Banco de Dados
DATABASE_URL=postgresql://reseco:senha-segura@postgres:5432/reseco_db
POSTGRES_USER=reseco
POSTGRES_PASSWORD=senha-super-segura-aqui
POSTGRES_DB=reseco_db

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# JWT
JWT_SECRET=sua-chave-jwt-super-secreta-aqui

# Groq AI
GROQ_API_KEY=sua-groq-api-key

# Ambiente
NODE_ENV=production
PORT=3000

# Frontend
NEXT_PUBLIC_API_URL=https://seudominio.com/api
```

#### 3. Atualizar Docker Compose

Criar/atualizar `docker-compose.yml`:

```yaml
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    container_name: reseco_postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U ${POSTGRES_USER}']
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: reseco_redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: reseco_backend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: ${DATABASE_URL}
      REDIS_HOST: ${REDIS_HOST}
      REDIS_PORT: ${REDIS_PORT}
      JWT_SECRET: ${JWT_SECRET}
      GROQ_API_KEY: ${GROQ_API_KEY}
      NODE_ENV: ${NODE_ENV}
      PORT: ${PORT}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./backend/uploads:/app/uploads
    networks:
      - reseco_network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: reseco_frontend
    restart: unless-stopped
    ports:
      - "3001:3001"
    environment:
      - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
    depends_on:
      - backend
    networks:
      - reseco_network

volumes:
  postgres_data:
  redis_data:

networks:
  reseco_network:
    driver: bridge
```

#### 4. Criar Dockerfiles

**Backend Dockerfile (`backend/Dockerfile`):**

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
RUN npm ci

# Copiar código
COPY . .

# Build
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copiar arquivos necessários
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
```

**Frontend Dockerfile (`frontend/Dockerfile`):**

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
RUN npm ci

# Copiar código
COPY . .

# Build
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copiar arquivos necessários
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3001

CMD ["node", "server.js"]
```

**Atualizar `frontend/next.config.ts` para standalone:**

```typescript
const nextConfig: NextConfig = {
  output: 'standalone', // Adicionar esta linha
  reactCompiler: true,
  // ... resto da configuração
};
```

#### 5. Subir Serviços

```bash
# Build e subir todos os serviços
docker compose up -d --build

# Verificar status
docker compose ps

# Ver logs
docker compose logs -f
```

#### 6. Executar Migrations

```bash
# Executar migrations do Prisma
docker compose exec backend npm run migrate:deploy

# Verificar status
docker compose exec backend npm run migrate:status
```

---

### Fase 4: Configurar Nginx (Reverse Proxy)

#### 1. Criar Configuração do Nginx

```bash
# Criar arquivo de configuração
nano /etc/nginx/sites-available/res-economico
```

**Conteúdo:**

```nginx
server {
    listen 80;
    server_name seudominio.com www.seudominio.com;

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

#### 2. Ativar Site

```bash
# Criar link simbólico
ln -s /etc/nginx/sites-available/res-economico /etc/nginx/sites-enabled/

# Testar configuração
nginx -t

# Recarregar Nginx
systemctl reload nginx
```

---

### Fase 5: Configurar Domínio e DNS

**📖 Para configurar subdomínio (ex: painel.redeuniaonacional.com.br), consulte:**
**[`configuracao-subdominio.md`](./configuracao-subdominio.md)**

**Resumo rápido:**
1. Criar registro A ou CNAME no DNS apontando para IP do VPS
2. Configurar Nginx para aceitar o domínio
3. Configurar SSL (Let's Encrypt)
4. Atualizar CORS no backend
5. Atualizar variáveis de ambiente

---

### Fase 6: Configurar SSL (Let's Encrypt)

#### 1. Instalar Certbot

```bash
# Instalar Certbot
apt-get install certbot python3-certbot-nginx -y
```

#### 2. Obter Certificado SSL

```bash
# Obter certificado SSL
certbot --nginx -d seudominio.com -d www.seudominio.com

# Seguir instruções:
# - Email para notificações
# - Aceitar termos
# - Escolher redirecionar HTTP para HTTPS
```

#### 3. Renovação Automática

```bash
# Testar renovação
certbot renew --dry-run

# Renovação automática já configurada via cron
```

---

### Fase 7: Configurar Firewall

#### 1. Configurar UFW (Firewall)

```bash
# Instalar UFW
apt-get install ufw -y

# Permitir SSH
ufw allow 22/tcp

# Permitir HTTP
ufw allow 80/tcp

# Permitir HTTPS
ufw allow 443/tcp

# Ativar firewall
ufw enable

# Verificar status
ufw status
```

---

## 🔄 Deploy Automático (Opcional)

### Opção 1: GitHub Actions

Criar `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Hostinger

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Deploy no servidor
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOSTINGER_HOST }}
          username: ${{ secrets.HOSTINGER_USER }}
          key: ${{ secrets.HOSTINGER_SSH_KEY }}
          script: |
            cd /opt/res-economico
            git pull origin main
            docker compose down
            docker compose build
            docker compose up -d
            docker compose exec backend npm run migrate:deploy
            echo "Deploy concluído!"
```

**Configurar Secrets no GitHub:**
- `HOSTINGER_HOST`: IP do seu VPS
- `HOSTINGER_USER`: root ou seu usuário
- `HOSTINGER_SSH_KEY`: Chave SSH privada

### Opção 2: Script de Deploy Local

Criar `deploy.sh`:

```bash
#!/bin/bash
echo "🚀 Iniciando deploy..."

SERVER_IP="seu-ip-do-vps"
SERVER_USER="root"
PROJECT_DIR="/opt/res-economico"

# Push no GitHub
git push origin main

# Deploy no servidor
ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
  cd /opt/res-economico
  git pull origin main
  docker compose down
  docker compose build
  docker compose up -d
  docker compose exec backend npm run migrate:deploy
  echo "✅ Deploy concluído!"
ENDSSH
```

**Uso:**
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## 💾 Backups

### 1. Backup do Banco de Dados

Criar script: `/opt/res-economico/backup-db.sh`

```bash
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Criar diretório se não existir
mkdir -p $BACKUP_DIR

# Backup do PostgreSQL
docker compose exec -T postgres pg_dump -U reseco reseco_db > $BACKUP_DIR/db_$DATE.sql

# Comprimir
gzip $BACKUP_DIR/db_$DATE.sql

# Manter apenas últimos 7 dias
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +7 -delete

echo "Backup concluído: db_$DATE.sql.gz"
```

**Agendar no cron:**
```bash
crontab -e
# Adicionar:
0 2 * * * /opt/res-economico/backup-db.sh
```

### 2. Backup de Arquivos

```bash
# Backup da pasta uploads
tar -czf /opt/backups/uploads_$(date +%Y%m%d).tar.gz /opt/res-economico/backend/uploads
```

### 3. Backup Completo (Snapshots)

**No painel da Hostinger:**
- Verificar se oferece snapshots automáticos
- Configurar frequência (diário, semanal)

---

## 📊 Monitoramento

### 1. Logs do Sistema

```bash
# Logs de todos os serviços
docker compose logs -f

# Logs do backend
docker compose logs -f backend

# Logs do frontend
docker compose logs -f frontend

# Logs do PostgreSQL
docker compose logs -f postgres
```

### 2. Status dos Serviços

```bash
# Ver containers rodando
docker compose ps

# Ver uso de recursos
docker stats

# Ver espaço em disco
df -h
```

### 3. Monitoramento de Recursos

```bash
# Instalar htop
apt-get install htop -y

# Ver uso de CPU/RAM
htop
```

---

## 🔐 Segurança

### 1. SSH Key (Não usar senha)

```bash
# Gerar chave SSH (no seu computador)
ssh-keygen -t ed25519 -C "hostinger@res-economico"

# Copiar chave para servidor
ssh-copy-id -i ~/.ssh/id_ed25519.pub root@seu-ip

# Desabilitar login com senha
nano /etc/ssh/sshd_config
# Alterar: PasswordAuthentication no
systemctl restart sshd
```

### 2. Firewall Configurado

```bash
# Verificar regras
ufw status verbose

# Permitir apenas portas necessárias
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
```

### 3. Variáveis de Ambiente Seguras

**NUNCA commitar no GitHub:**
- `.env`
- Chaves de API
- Senhas
- JWT_SECRET

**Usar `.gitignore`:**
```
.env
.env.local
.env.production
```

---

## 💰 Custos Reais

### Setup Básico:
- **VPS Hostinger:** R$ 50-80/mês (varia com promoções)
- **Domínio:** R$ 30-50/ano (~R$ 3-5/mês)
- **Total: ~R$ 53-85/mês**

### Custos Adicionais (Opcionais):
- **Backups externos:** R$ 0-20/mês (se usar serviço externo)
- **Monitoramento:** R$ 0-10/mês (se usar serviço externo)

---

## 🚨 Troubleshooting

### Problema: Serviços não sobem

```bash
# Verificar logs
docker compose logs

# Verificar se portas estão livres
netstat -tulpn | grep -E '3000|3001|5432|6379'

# Reiniciar serviços
docker compose restart
```

### Problema: Frontend não carrega

```bash
# Verificar se frontend está rodando
docker compose ps frontend

# Ver logs do frontend
docker compose logs frontend

# Verificar Nginx
nginx -t
systemctl status nginx
```

### Problema: Banco de dados não conecta

```bash
# Verificar se PostgreSQL está rodando
docker compose ps postgres

# Testar conexão
docker compose exec postgres psql -U reseco -d reseco_db -c "SELECT 1;"
```

---

## ✅ Checklist de Deploy

Antes de colocar em produção:

- [ ] VPS contratado na Hostinger
- [ ] Docker e Docker Compose instalados
- [ ] Código clonado no servidor
- [ ] Variáveis de ambiente configuradas
- [ ] Docker Compose configurado
- [ ] Serviços rodando (docker compose ps)
- [ ] Migrations executadas
- [ ] Nginx configurado como reverse proxy
- [ ] SSL configurado (Let's Encrypt)
- [ ] Firewall configurado
- [ ] Backups automáticos configurados
- [ ] Domínio apontado (DNS)
- [ ] Testes realizados em produção

---

## 📚 Recursos Úteis

- [Hostinger Brasil VPS](https://www.hostinger.com/br/precos/vps-hosting)
- [Documentação Docker](https://docs.docker.com/)
- [Documentação Nginx](https://nginx.org/en/docs/)
- [Let's Encrypt Docs](https://letsencrypt.org/docs/)

---

## 🎯 Resumo

**Arquitetura Final:**
```
Hostinger VPS (R$ 50-80/mês)
├── Frontend Next.js (porta 3001)
├── Backend NestJS (porta 3000)
├── PostgreSQL (Docker, porta 5432)
├── Redis (Docker, porta 6379)
└── Nginx (Reverse Proxy, portas 80/443)
```

**Custo Total: R$ 50-85/mês** (tudo incluído!)

**Vantagens:**
- ✅ Tudo em um lugar
- ✅ Latência baixa (<10ms)
- ✅ Conformidade LGPD
- ✅ Suporte em português
- ✅ Pagamento em reais

---

**Última atualização:** Janeiro 2025

