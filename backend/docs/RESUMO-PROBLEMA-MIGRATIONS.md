# 🔍 Por que as Migrations não funcionam mais automaticamente?

## Resposta Direta

**Antes funcionava porque:**
- Quando o projeto foi criado pela primeira vez, o PostgreSQL criou o usuário **com permissões de superuser automaticamente**
- O Prisma conseguia criar um "shadow database" (banco temporário para validar migrations)
- Tudo funcionava automaticamente ✅

**Agora não funciona porque:**
- Quando renomeamos o banco (`res-economico` → `painel-rede-uniao`), criamos um novo usuário `painel_uniao`
- Este usuário foi criado **SEM permissões de superuser**
- O Prisma precisa dessas permissões para criar o shadow database
- Por isso, as migrations falham ❌

## 🎯 Solução Simples

Execute este script **uma única vez**:

```powershell
# Na pasta backend
.\scripts\fix-permissions.ps1
```

Ou execute manualmente:

```powershell
docker exec painel_rede_uniao_postgres psql -U painel_uniao -d painel_rede_uniao_db -c "ALTER USER painel_uniao WITH SUPERUSER;"
```

**⚠️ Se der erro**, significa que o usuário não pode alterar a si mesmo. Nesse caso, você precisa:

1. Usar a migration manual (já documentada em `migration-processos-manual.md`)
2. Ou recriar o banco do zero (apaga dados!)

## ✅ Depois de Aplicar

Após dar as permissões, o Prisma volta a funcionar automaticamente:

```bash
npx prisma migrate dev --name nome_da_migracao
```

## 📚 Documentos Relacionados

- `explicacao-migrations.md` - Explicação detalhada do problema
- `solucao-permanente-migrations.md` - Solução completa
- `migration-processos-manual.md` - Como executar migration manualmente
- `scripts/fix-permissions.ps1` - Script automático para corrigir permissões

