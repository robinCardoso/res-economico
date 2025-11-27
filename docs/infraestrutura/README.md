# 🏗️ Documentação de Infraestrutura - Hostinger Brasil

## 📋 Documentos Disponíveis

### ⭐ Documento Principal

- **`hostinger-guia-completo.md`** - **Guia completo de hospedagem na Hostinger Brasil**
  - Setup passo a passo
  - Configuração de Docker
  - Deploy da aplicação
  - Configuração de Nginx e SSL
  - Backups e monitoramento
  - Troubleshooting

### 📚 Documentos Complementares

- **`docker-engine-vps.md`** - Como funciona Docker Engine no VPS
  - Diferença entre Docker Desktop e Docker Engine
  - Como iniciar por terminal
  - Inicialização automática
  - Comandos úteis
  - **100% gratuito** - sem custos

- **`configuracao-subdominio.md`** - Guia para configurar subdomínio
  - Exemplo: painel.redeuniaonacional.com.br
  - Configuração de CNAME
  - Nginx reverse proxy

- **`migracao-banco-local-para-vps.md`** - Migrar banco de dados
  - Backup do banco local
  - Restore no VPS
  - Preservar todos os dados

- **`frontend-vercel-vs-vps.md`** - Comparação: Frontend na Vercel vs VPS (Hostinger)
  - Quando usar cada opção
  - Como configurar
  - Recomendações

---

## 🎯 Arquitetura Escolhida

### Hostinger VPS - Tudo Junto

```
┌─────────────────────────────────┐
│  Hostinger VPS (R$ 50-80/mês)  │
│  • Frontend Next.js             │
│  • Backend NestJS               │
│  • PostgreSQL (Docker)          │
│  • Redis (Docker)               │
│  • Storage (SSD incluído)      │
└─────────────────────────────────┘
```

**Custo Total: R$ 50-80/mês** (tudo incluído!)

---

## ✅ Vantagens da Hostinger

- ✅ **Datacenter em São Paulo** - Latência <10ms
- ✅ **Conformidade LGPD** - Dados no Brasil
- ✅ **Suporte 24/7 em português**
- ✅ **Pagamento em reais** - Sem IOF
- ✅ **Preço acessível** - R$ 50-80/mês
- ✅ **Interface em português**

---

## 🚀 Próximos Passos

1. **Contratar VPS na Hostinger**
   - Acesse: [hostinger.com.br/precos/vps-hosting](https://www.hostinger.com/br/precos/vps-hosting)
   - Escolha plano com 4GB RAM mínimo (recomendado: 8GB RAM)

2. **Seguir Guia Completo**
   - Abra: `hostinger-guia-completo.md`
   - Siga passo a passo

3. **Configurar Deploy**
   - Escolha: Deploy automático (GitHub Actions) ou manual
   - Veja seção de deploy no guia completo

---

**Última atualização:** Janeiro 2025

