# 🐳 Docker Engine no VPS - Guia Completo

## ✅ Resposta Rápida

**SIM!** No VPS vamos usar **Docker Engine** (não Docker Desktop).

**E SIM!** Ele inicia automaticamente por comando terminal e também pode ser configurado para iniciar automaticamente quando o servidor reiniciar.

---

## 🎯 Diferença: Docker Desktop vs Docker Engine

### Docker Desktop (Windows/Mac - Seu Computador)
- ✅ Interface gráfica
- ✅ Mais fácil de usar
- ❌ Precisa abrir manualmente
- ❌ Consome mais recursos
- ❌ Pago para empresas grandes

### Docker Engine (Linux - VPS)
- ✅ **Gratuito sempre**
- ✅ **Inicia por comando terminal**
- ✅ **Pode iniciar automaticamente no boot**
- ✅ Mais leve e eficiente
- ✅ Ideal para servidores

---

## 🚀 Como Funciona no VPS

### 1. Instalação do Docker Engine

No VPS (Linux), você instala o Docker Engine via terminal:

```bash
# Instalar Docker Engine
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Verificar instalação
docker --version
```

### 2. Iniciar Docker Engine

**Docker Engine inicia automaticamente após instalação**, mas você pode controlá-lo:

```bash
# Verificar status
sudo systemctl status docker

# Iniciar Docker (se estiver parado)
sudo systemctl start docker

# Parar Docker
sudo systemctl stop docker

# Reiniciar Docker
sudo systemctl restart docker
```

### 3. Configurar Inicialização Automática

**O Docker Engine já vem configurado para iniciar automaticamente**, mas você pode garantir:

```bash
# Habilitar Docker para iniciar no boot do servidor
sudo systemctl enable docker

# Verificar se está habilitado
sudo systemctl is-enabled docker
# Deve retornar: enabled
```

### 4. Usar Docker Compose

```bash
# Iniciar todos os containers
docker compose up -d

# Parar todos os containers
docker compose down

# Ver status dos containers
docker compose ps

# Ver logs
docker compose logs -f
```

---

## 📋 Comandos Úteis no VPS

### Gerenciar Docker Engine

```bash
# Status do serviço Docker
sudo systemctl status docker

# Iniciar Docker
sudo systemctl start docker

# Parar Docker
sudo systemctl stop docker

# Reiniciar Docker
sudo systemctl restart docker

# Habilitar inicialização automática
sudo systemctl enable docker

# Desabilitar inicialização automática
sudo systemctl disable docker
```

### Gerenciar Containers

```bash
# Ver containers rodando
docker ps

# Ver todos os containers (incluindo parados)
docker ps -a

# Ver logs de um container
docker logs nome_do_container

# Entrar no container
docker exec -it nome_do_container sh

# Parar container
docker stop nome_do_container

# Iniciar container
docker start nome_do_container

# Reiniciar container
docker restart nome_do_container
```

### Gerenciar Docker Compose

```bash
# Iniciar todos os serviços
cd /opt/res-economico
docker compose up -d

# Parar todos os serviços
docker compose down

# Reiniciar todos os serviços
docker compose restart

# Reiniciar serviço específico
docker compose restart backend

# Ver logs de todos os serviços
docker compose logs -f

# Ver logs de um serviço específico
docker compose logs -f backend

# Reconstruir e iniciar
docker compose up -d --build
```

---

## ⚙️ Configuração Automática no Boot

### Docker Engine

O Docker Engine **já inicia automaticamente** após instalação, mas você pode verificar:

```bash
# Verificar se está habilitado
sudo systemctl is-enabled docker

# Se retornar "enabled", está configurado ✅
# Se retornar "disabled", habilitar com:
sudo systemctl enable docker
```

### Containers (Docker Compose)

Para que os containers iniciem automaticamente quando o servidor reiniciar:

```bash
# No docker-compose.yml, os containers já têm:
restart: unless-stopped

# Isso significa que eles vão iniciar automaticamente quando:
# 1. O Docker Engine iniciar
# 2. O servidor reiniciar
# 3. O container parar inesperadamente
```

**Exemplo no `docker-compose.yml`:**

```yaml
services:
  postgres:
    restart: unless-stopped  # ← Inicia automaticamente
    # ...
  
  backend:
    restart: unless-stopped  # ← Inicia automaticamente
    # ...
```

---

## 🔄 Fluxo de Inicialização no VPS

### Quando o servidor liga/reinicia:

1. **Sistema operacional inicia** (Ubuntu)
2. **Docker Engine inicia automaticamente** (via systemd)
3. **Containers iniciam automaticamente** (via `restart: unless-stopped`)

**Você não precisa fazer nada!** Tudo inicia automaticamente.

### Comandos manuais (quando necessário):

```bash
# Se precisar iniciar manualmente
sudo systemctl start docker
docker compose up -d

# Se precisar parar
docker compose down
sudo systemctl stop docker
```

---

## 💰 Custo do Docker Engine

### ✅ **100% GRATUITO**

- **Docker Engine:** Gratuito e open source
- **Docker Compose:** Gratuito e open source
- **Uso em servidores:** Sempre gratuito
- **Sem limites:** Use quantos containers quiser
- **Sem licenças:** Não precisa pagar nada

### Comparação:

| Tipo | Custo | Uso |
|------|-------|-----|
| **Docker Engine (VPS)** | ✅ **Gratuito** | Servidores Linux |
| **Docker Desktop (Pessoal)** | ✅ **Gratuito** | Desenvolvimento pessoal |
| **Docker Desktop (Empresa)** | 💰 **Pago** | Empresas grandes (>250 funcionários) |

**Para seu caso:** Tudo gratuito! ✅

---

## 🛠️ Troubleshooting

### Docker não inicia

```bash
# Verificar status
sudo systemctl status docker

# Ver logs de erro
sudo journalctl -u docker.service

# Tentar iniciar manualmente
sudo systemctl start docker

# Se der erro de permissão, adicionar usuário ao grupo docker
sudo usermod -aG docker $USER
# Depois fazer logout e login novamente
```

### Containers não iniciam

```bash
# Verificar se Docker está rodando
sudo systemctl status docker

# Ver logs do Docker Compose
docker compose logs

# Verificar se há erros no docker-compose.yml
docker compose config

# Reconstruir containers
docker compose up -d --build
```

### Reiniciar tudo

```bash
# Parar tudo
docker compose down
sudo systemctl stop docker

# Iniciar tudo
sudo systemctl start docker
docker compose up -d
```

---

## 📝 Resumo

### ✅ No VPS você terá:

1. **Docker Engine** instalado via terminal
2. **Inicia automaticamente** quando o servidor liga
3. **Containers iniciam automaticamente** (configurado no docker-compose.yml)
4. **100% gratuito** - sem custos
5. **Comandos via terminal** - tudo pelo SSH

### 🎯 Vantagens:

- ✅ Não precisa abrir interface gráfica
- ✅ Funciona via terminal (SSH)
- ✅ Inicia automaticamente
- ✅ Mais leve e eficiente
- ✅ Gratuito para sempre

---

## 🔗 Referências

- [Docker Engine Installation](https://docs.docker.com/engine/install/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Systemd Service Management](https://www.freedesktop.org/software/systemd/man/systemctl.html)

---

**Última atualização:** Janeiro 2025

