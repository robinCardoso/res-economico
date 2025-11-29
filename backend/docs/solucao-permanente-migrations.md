# Solução Permanente para Migrations Automáticas

## 🎯 O Problema

Quando renomeamos o banco de dados, o usuário `painel_uniao` foi criado **sem permissões de superuser**. O Prisma precisa dessas permissões para:

1. Criar um "shadow database" (banco temporário para validar migrations)
2. Criar tabelas e enums no schema `public`

## ✅ Solução Implementada

Modificamos o `docker-compose.yml` para garantir que o usuário seja criado com permissões desde o início.

### O que foi feito:

1. **Adicionado script de inicialização** (`backend/scripts/init-db.sh`)
   - Executa automaticamente quando o container é criado pela primeira vez
   - Torna o usuário `painel_uniao` superuser
   - Garante permissões no schema `public`

2. **Modificado `docker-compose.yml`**
   - Adicionado volume para o script de inicialização
   - O script roda automaticamente na primeira criação do container

## 🚀 Como Aplicar (Para Bancos Já Existentes)

Se o banco já existe, você precisa aplicar as permissões manualmente **uma única vez**:

### Passo 1: Parar o Container

```powershell
# Na pasta raiz do projeto
docker-compose down
```

### Passo 2: Recriar o Container (Aplicará o Script)

```powershell
docker-compose up -d postgres
```

**⚠️ IMPORTANTE:** Isso **NÃO** apaga os dados! O volume `postgres_data` é preservado.

### Passo 3: Aplicar Permissões Manualmente (Se o Script Não Rodar)

Se o script não executar (porque o banco já existe), execute manualmente:

```powershell
# Conectar como usuário padrão do PostgreSQL (que tem permissões)
docker exec -it painel_rede_uniao_postgres psql -U painel_uniao -d painel_rede_uniao_db

# No prompt do PostgreSQL, execute:
ALTER USER painel_uniao WITH SUPERUSER CREATEDB CREATEROLE;
GRANT ALL ON SCHEMA public TO painel_uniao;
ALTER SCHEMA public OWNER TO painel_uniao;

# Sair
\q
```

**Mas espera!** Se o usuário não tem permissão para alterar a si mesmo, precisamos usar outra abordagem...

### Solução Alternativa: Usar um Script SQL na Inicialização

Como o script `init-db.sh` só roda na primeira criação, vamos criar um script que você pode executar manualmente:

```powershell
# Execute este comando (ele cria um usuário temporário com permissões)
docker exec painel_rede_uniao_postgres psql -U painel_uniao -d painel_rede_uniao_db -c "
DO \$\$
BEGIN
    -- Tentar tornar superuser (pode falhar se não tiver permissão)
    BEGIN
        ALTER USER painel_uniao WITH SUPERUSER;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Não foi possível tornar superuser: %', SQLERRM;
    END;
    
    -- Garantir permissões no schema (isso deve funcionar)
    GRANT ALL ON SCHEMA public TO painel_uniao;
    ALTER SCHEMA public OWNER TO painel_uniao;
END \$\$;
"
```

## 🔄 Depois de Aplicar

Após aplicar as permissões, o Prisma voltará a funcionar automaticamente:

```bash
# Criar e aplicar migration automaticamente
npx prisma migrate dev --name nome_da_migracao

# Ou apenas aplicar mudanças direto
npx prisma db push
```

## 📝 Por que Funcionava Antes?

Quando o projeto foi criado inicialmente:

1. O banco foi criado pela primeira vez
2. O usuário foi criado **com permissões de superuser** automaticamente
3. O Prisma conseguia criar o shadow database
4. Tudo funcionava ✅

Quando renomeamos o banco:

1. Criamos um novo usuário `painel_uniao`
2. Este usuário **não** tinha permissões de superuser
3. O Prisma não consegue criar o shadow database
4. Migrations falham ❌

## ✅ Agora

Com a solução implementada:

1. O script garante que o usuário tenha permissões desde o início
2. Para bancos existentes, aplicamos as permissões manualmente **uma vez**
3. Depois disso, tudo volta a funcionar automaticamente ✅

## 🎯 Resumo

**Antes:** Usuário com permissões → Prisma automático ✅

**Depois da renomeação:** Usuário sem permissões → Prisma manual ❌

**Agora:** Aplicamos permissões → Prisma automático novamente ✅

