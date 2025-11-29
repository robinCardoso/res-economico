# Por que as Migrations não funcionam mais automaticamente?

## 🔍 O Problema

Quando o projeto foi iniciado, as migrations funcionavam automaticamente. Agora não funcionam mais. Por quê?

### O que mudou:

1. **Quando o projeto foi criado inicialmente:**
   - O banco de dados foi criado com um usuário que tinha permissões de **superuser**
   - O Prisma conseguia criar um "shadow database" (banco temporário para validar migrations)
   - Tudo funcionava automaticamente ✅

2. **Quando renomeamos o banco (`res-economico` → `painel-rede-uniao`):**
   - Criamos um novo usuário: `painel_uniao`
   - Este usuário **NÃO** tem permissões de superuser
   - O Prisma precisa de permissões especiais para:
     - Criar um "shadow database" (banco temporário)
     - Criar tabelas e enums no schema `public`
   - Por isso, as migrations falham ❌

## 🎯 A Solução (Tornar Automático Novamente)

Vamos dar as permissões necessárias ao usuário para que o Prisma funcione automaticamente novamente.

### Opção 1: Tornar o Usuário Superuser (Mais Simples)

Isso dá todas as permissões necessárias ao usuário.

**Execute no PowerShell (na pasta raiz do projeto):**

```powershell
# Conectar ao PostgreSQL e tornar o usuário superuser
docker exec -it painel_rede_uniao_postgres psql -U painel_uniao -d painel_rede_uniao_db -c "ALTER USER painel_uniao WITH SUPERUSER;"
```

**⚠️ IMPORTANTE:** Se isso não funcionar (erro de permissão), use a Opção 2.

### Opção 2: Usar o Usuário Padrão do PostgreSQL

O PostgreSQL cria automaticamente um usuário com o mesmo nome do `POSTGRES_USER` no docker-compose, mas esse usuário pode não ter todas as permissões. Vamos verificar e corrigir:

**Execute no PowerShell:**

```powershell
# 1. Verificar qual usuário tem permissões
docker exec painel_rede_uniao_postgres psql -U painel_uniao -d painel_rede_uniao_db -c "SELECT rolname, rolsuper FROM pg_roles WHERE rolname LIKE '%painel%' OR rolname = 'postgres';"

# 2. Se não houver superuser, precisamos criar um ou usar o usuário padrão
# O usuário criado pelo POSTGRES_USER no docker-compose geralmente tem permissões
# Mas vamos garantir que ele seja superuser
```

### Opção 3: Modificar o Docker Compose (Solução Permanente)

Vamos modificar o `docker-compose.yml` para garantir que o usuário tenha permissões desde o início:

**Adicione esta linha no serviço postgres:**

```yaml
command: postgres -c log_statement=all
```

Mas isso não resolve o problema de permissões. A melhor solução é tornar o usuário superuser.

## ✅ Solução Recomendada (Execute Agora)

Execute este comando para tornar o usuário superuser permanentemente:

```powershell
# No PowerShell, na pasta raiz do projeto
docker exec painel_rede_uniao_postgres psql -U painel_uniao -d painel_rede_uniao_db -c "ALTER USER painel_uniao WITH SUPERUSER;"
```

**Se der erro**, significa que o usuário `painel_uniao` não tem permissão para alterar a si mesmo. Nesse caso:

1. Pare o container: `docker-compose down`
2. Modifique o `docker-compose.yml` para usar um usuário postgres padrão
3. Ou execute a migration manualmente (como já documentamos)

## 🔄 Depois de Corrigir

Após tornar o usuário superuser, você pode usar o Prisma normalmente:

```bash
# Criar e aplicar migration automaticamente
npx prisma migrate dev --name nome_da_migracao

# Ou apenas aplicar mudanças direto (sem shadow database)
npx prisma db push
```

## 📝 Resumo

**Antes:** Usuário tinha permissões → Prisma funcionava automaticamente ✅

**Agora:** Usuário sem permissões → Prisma precisa de permissões ❌

**Solução:** Dar permissões ao usuário → Prisma volta a funcionar automaticamente ✅

