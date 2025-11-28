# Plano de Avaliação - Renomeação do Banco de Dados

## 📋 Objetivo

Avaliar a complexidade e impacto de renomear o banco de dados de `res-economico` para um nome mais genérico que reflita a estrutura expandida do projeto (que incluirá Processos, Atas, Configurações, etc.).

## 🔍 Análise Atual

### Onde o Nome do Banco Está Configurado

#### 1. **Docker Compose** (`docker-compose.yml`)
```yaml
services:
  postgres:
    container_name: res_economico_postgres  # ⚠️ Precisa mudar
    environment:
      POSTGRES_USER: reseco                 # ⚠️ Opcional mudar
      POSTGRES_PASSWORD: reseco_pwd         # ⚠️ Opcional mudar
      POSTGRES_DB: reseco_db                # ⚠️ Precisa mudar
volumes:
  postgres_data:                            # ⚠️ Opcional mudar
```

#### 2. **Variável de Ambiente** (`.env` ou `.env.local`)
```env
DATABASE_URL=postgresql://reseco:reseco_pwd@localhost:5432/reseco_db
```
- ⚠️ **Precisa atualizar** o nome do banco na URL

#### 3. **Nome do Projeto** (`package.json` raiz)
```json
{
  "name": "res-economico",  // ⚠️ Opcional mudar
  "description": "Sistema de resultado econômico - Monorepo"
}
```

#### 4. **Documentação**
- `docs/plano-estrutura-usuarios-e-menus.md` - Menciona "res-economico"
- `docs/infraestrutura/*.md` - Referências em documentação
- ⚠️ **Baixo impacto** - Apenas documentação

### Onde o Nome NÃO Está Hardcoded

✅ **Código do Backend**: Não há referências hardcoded ao nome do banco
- Prisma usa `env("DATABASE_URL")` - lê da variável de ambiente
- Todos os serviços usam PrismaService - não referenciam o banco diretamente

✅ **Código do Frontend**: Não há referências ao nome do banco

✅ **Schemas Prisma**: Não há referências ao nome do banco

## 🎯 Opções de Nomes Sugeridos

### Opção 1: `rede-uniao` ou `rede-uniao-nacional`
- ✅ Reflete o nome da organização
- ✅ Genérico o suficiente para múltiplos módulos
- ✅ Curto e fácil de digitar

### Opção 2: `painel-uniao` ou `painel-rede-uniao`
- ✅ Alinha com o conceito de "painel"
- ✅ Genérico para múltiplos módulos

### Opção 3: `sistema-uniao` ou `sistema-rede-uniao`
- ✅ Genérico
- ✅ Descritivo

### Opção 4: `uniao-platform` ou `uniao-panel`
- ✅ Moderno
- ✅ Genérico

**Recomendação**: `rede-uniao` ou `rede-uniao-nacional`

## 📊 Complexidade da Mudança

### 🟢 **BAIXA COMPLEXIDADE** (Fácil)

1. **Atualizar `docker-compose.yml`**
   - Mudar `POSTGRES_DB`
   - Mudar `container_name` (opcional)
   - Mudar nome do volume (opcional, mas recomendado)

2. **Atualizar `.env` / `.env.local`**
   - Mudar `DATABASE_URL` com novo nome do banco

3. **Atualizar documentação**
   - Substituir referências em docs

### 🟡 **MÉDIA COMPLEXIDADE** (Requer Atenção)

1. **Migração de Dados Existentes**
   - Se já houver dados no banco atual, será necessário:
     - Fazer backup completo
     - Criar novo banco com novo nome
     - Restaurar dados no novo banco
     - Ou renomear o banco existente (mais simples)

2. **Volumes Docker**
   - Se usar volumes nomeados, pode precisar:
     - Criar novo volume
     - Migrar dados do volume antigo
     - Ou simplesmente renomear o volume

3. **Ambientes de Desenvolvimento/Produção**
   - Atualizar em todos os ambientes:
     - Desenvolvimento local
     - Staging (se houver)
     - Produção (se já estiver em produção)

### 🔴 **ALTA COMPLEXIDADE** (Se Aplicável)

1. **Se já estiver em Produção com Dados**
   - Requer janela de manutenção
   - Backup completo obrigatório
   - Plano de rollback

2. **Se houver múltiplos ambientes**
   - Sincronizar mudanças em todos os ambientes
   - Atualizar CI/CD se necessário

## 📝 Plano de Execução (Se Aprovado)

### Fase 1: Preparação (30 min)

1. ✅ **Backup Completo**
   ```bash
   # Backup do banco atual
   docker exec res_economico_postgres pg_dump -U reseco reseco_db > backup_antes_renomeacao.sql
   
   # Backup do volume (opcional)
   docker run --rm -v res_economico_postgres_data:/data -v ${PWD}:/backup alpine tar czf /backup/postgres_volume_backup.tar.gz /data
   ```

2. ✅ **Documentar estado atual**
   - Listar todos os dados existentes
   - Verificar se há dados críticos

### Fase 2: Atualização de Configurações (15 min)

1. ✅ **Atualizar `docker-compose.yml`**
   ```yaml
   services:
     postgres:
       container_name: rede_uniao_postgres  # Novo nome
       environment:
         POSTGRES_USER: redeuniao           # Novo usuário (opcional)
         POSTGRES_PASSWORD: redeuniao_pwd    # Nova senha (opcional)
         POSTGRES_DB: rede_uniao_db         # Novo nome do banco
   volumes:
     postgres_data:                         # Pode manter ou renomear
   ```

2. ✅ **Atualizar `.env` / `.env.local`**
   ```env
   DATABASE_URL=postgresql://redeuniao:redeuniao_pwd@localhost:5432/rede_uniao_db
   ```

3. ✅ **Atualizar `package.json` (opcional)**
   ```json
   {
     "name": "rede-uniao",
     "description": "Sistema de gestão da Rede União Nacional - Monorepo"
   }
   ```

### Fase 3: Migração de Dados (30-60 min)

**Opção A: Renomear Banco Existente (Mais Simples)**
```sql
-- Conectar ao PostgreSQL
docker exec -it res_economico_postgres psql -U reseco

-- Renomear banco
ALTER DATABASE reseco_db RENAME TO rede_uniao_db;

-- Renomear usuário (opcional)
ALTER USER reseco RENAME TO redeuniao;
```

**Opção B: Criar Novo Banco e Migrar (Mais Seguro)**
```bash
# 1. Parar containers
docker compose down

# 2. Atualizar docker-compose.yml e .env

# 3. Iniciar novo container
docker compose up -d

# 4. Criar novo banco (já criado automaticamente pelo POSTGRES_DB)

# 5. Restaurar dados
docker exec -i rede_uniao_postgres psql -U redeuniao rede_uniao_db < backup_antes_renomeacao.sql

# 6. Executar migrations do Prisma (se necessário)
cd backend
npm run migrate:deploy
```

### Fase 4: Validação (15 min)

1. ✅ **Verificar conexão**
   ```bash
   cd backend
   npm run prisma:studio
   # Deve conectar ao novo banco
   ```

2. ✅ **Testar aplicação**
   - Iniciar backend e frontend
   - Testar login
   - Testar operações CRUD básicas
   - Verificar se dados foram migrados corretamente

3. ✅ **Verificar logs**
   - Backend não deve apresentar erros de conexão
   - Prisma deve conectar ao novo banco

### Fase 5: Limpeza (10 min)

1. ✅ **Remover containers/volumes antigos** (se usar Opção B)
   ```bash
   docker compose down -v  # Remove volumes antigos
   ```

2. ✅ **Atualizar documentação**
   - Substituir referências a "res-economico" por novo nome
   - Atualizar scripts e guias

## ⚠️ Riscos e Considerações

### Riscos

1. **Perda de Dados** (se backup falhar)
   - **Mitigação**: Fazer backup múltiplo antes de iniciar

2. **Downtime** (se em produção)
   - **Mitigação**: Planejar janela de manutenção

3. **Inconsistências** (se migração falhar parcialmente)
   - **Mitigação**: Validar todos os dados após migração

### Considerações

1. **Volumes Docker**
   - Se renomear o volume, dados serão preservados
   - Se criar novo volume, precisa migrar dados

2. **Ambientes Múltiplos**
   - Atualizar todos os ambientes simultaneamente
   - Manter sincronização

3. **CI/CD**
   - Atualizar variáveis de ambiente nos pipelines
   - Atualizar secrets/configs

## 📊 Estimativa de Tempo Total

- **Desenvolvimento Local (sem dados críticos)**: 1-2 horas
- **Desenvolvimento Local (com dados)**: 2-3 horas
- **Produção (com backup e validação)**: 3-4 horas + janela de manutenção

## ✅ Checklist de Decisão

Antes de prosseguir, verificar:

- [ ] Há dados críticos no banco atual?
- [ ] O projeto está em produção?
- [ ] Há múltiplos ambientes (dev/staging/prod)?
- [ ] Há CI/CD configurado?
- [ ] Todos os desenvolvedores estão cientes da mudança?
- [ ] Backup completo foi realizado?
- [ ] Novo nome foi aprovado pela equipe?

## 🎯 Recomendação Final

### ✅ **RECOMENDADO** se:
- Projeto ainda está em desenvolvimento
- Não há dados críticos em produção
- Time está alinhado com a mudança
- Novo nome reflete melhor o escopo do projeto

### ⚠️ **CUIDADO** se:
- Projeto já está em produção com usuários ativos
- Há dados críticos que não podem ser perdidos
- Múltiplos ambientes precisam ser sincronizados

### ❌ **NÃO RECOMENDADO** se:
- Projeto está em produção crítica
- Não há janela de manutenção disponível
- Time não está preparado para a mudança

## 📌 Próximos Passos

1. **Decidir novo nome** (sugestão: `rede-uniao` ou `rede-uniao-nacional`)
2. **Aprovar plano** com a equipe
3. **Agendar execução** (preferencialmente em horário de baixo uso)
4. **Executar plano** seguindo as fases acima
5. **Validar** todos os sistemas após mudança

