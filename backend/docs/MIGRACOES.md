# 📚 Guia de Migrações do Banco de Dados

Este documento descreve o processo de criação, aplicação e gerenciamento de migrações do Prisma.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Criando uma Nova Migração](#criando-uma-nova-migração)
- [Aplicando Migrações](#aplicando-migrações)
- [Revertendo Migrações](#revertendo-migrações)
- [Boas Práticas](#boas-práticas)
- [Estrutura de Migrações](#estrutura-de-migrações)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

O Prisma usa migrações para versionar o schema do banco de dados. Cada migração representa uma mudança no schema (`schema.prisma`) e é aplicada sequencialmente ao banco.

**Localização das migrações:** `prisma/migrations/`

---

## ➕ Criando uma Nova Migração

### 1. Modificar o Schema

Primeiro, edite o arquivo `prisma/schema.prisma` com as mudanças desejadas.

**Exemplo:**
```prisma
model Usuario {
  id    String @id @default(uuid())
  email String @unique
  // Adicionando novo campo
  telefone String? // Campo opcional
}
```

### 2. Criar a Migração

Execute o comando para criar uma nova migração:

```bash
npm run migrate:create -- nome_da_migracao
```

**Ou usando Prisma diretamente:**
```bash
npx prisma migrate dev --name nome_da_migracao
```

**Exemplo:**
```bash
npm run migrate:create -- add_telefone_to_usuario
```

### 3. Revisar o SQL Gerado

O Prisma gera automaticamente o arquivo SQL em:
```
prisma/migrations/YYYYMMDDHHMMSS_nome_da_migracao/migration.sql
```

**⚠️ IMPORTANTE:** Sempre revise o SQL gerado antes de aplicar!

### 4. Aplicar a Migração

A migração é aplicada automaticamente em desenvolvimento. Em produção, use:

```bash
npm run migrate:deploy
```

---

## 🚀 Aplicando Migrações

### Desenvolvimento

```bash
# Aplica migrações pendentes e regenera o Prisma Client
npm run migrate:dev

# Ou com nome específico
npx prisma migrate dev --name nome_da_migracao
```

### Produção

```bash
# Aplica apenas migrações pendentes (não regenera client)
npm run migrate:deploy
```

### Verificar Status

```bash
# Ver status das migrações
npm run migrate:status
```

---

## ⏪ Revertendo Migrações

### ⚠️ ATENÇÃO: Reverter migrações pode causar perda de dados!

### Opção 1: Reset Completo (Apenas em Desenvolvimento)

```bash
# ⚠️ APAGA TODOS OS DADOS!
npm run migrate:reset
```

### Opção 2: Reverter Última Migração

```bash
# Reverte a última migração aplicada
npx prisma migrate resolve --rolled-back nome_da_migracao
```

### Opção 3: Criar Migração de Reversão

Crie uma nova migração que desfaz as mudanças:

```bash
npm run migrate:create -- revert_nome_da_migracao
```

---

## ✅ Boas Práticas

### 1. **Nomes Descritivos**

✅ **Bom:**
```bash
add_telefone_to_usuario
add_index_upload_status_ano
rename_conta_to_classificacao
```

❌ **Ruim:**
```bash
migration1
fix
update
```

### 2. **Uma Mudança por Migração**

✅ **Bom:** Migrações pequenas e focadas
❌ **Ruim:** Uma migração gigante com múltiplas mudanças

### 3. **Sempre Revisar o SQL**

O Prisma gera SQL automaticamente, mas pode não ser otimizado. Revise e ajuste se necessário.

### 4. **Testar em Desenvolvimento Primeiro**

Nunca aplique migrações diretamente em produção sem testar antes.

### 5. **Backup Antes de Migrações Importantes**

```bash
# Fazer backup do banco antes de migrações grandes
pg_dump -U usuario -d reseco_db > backup_antes_migracao.sql
```

### 6. **Documentar Mudanças Importantes**

Adicione comentários no SQL quando necessário:

```sql
-- Migração: Adicionar índice para otimizar queries de relatórios
-- Data: 2025-01-20
-- Autor: Equipe de Desenvolvimento
-- Motivo: Melhorar performance de queries por status e ano

CREATE INDEX IF NOT EXISTS "Upload_status_ano_idx" 
ON "Upload"("status", "ano");
```

### 7. **Índices e Constraints**

Para adicionar índices ou constraints complexos, use scripts auxiliares:

```bash
# Aplicar índices customizados
npm run aplicar-indices
```

---

## 📁 Estrutura de Migrações

```
prisma/
├── migrations/
│   ├── migration_lock.toml          # Lock do provider (PostgreSQL)
│   ├── 20250115130000_add_uf_to_empresa/
│   │   └── migration.sql
│   ├── 20250118150000_migrate_conta_catalogo_data/
│   │   └── migration.sql
│   └── ...
└── schema.prisma                     # Schema principal
```

**Formato do nome:** `YYYYMMDDHHMMSS_descricao_da_migracao`

---

## 🔧 Scripts Disponíveis

### Criar Migração
```bash
npm run migrate:create -- nome_da_migracao
```

### Aplicar em Desenvolvimento
```bash
npm run migrate:dev
```

### Aplicar em Produção
```bash
npm run migrate:deploy
```

### Ver Status
```bash
npm run migrate:status
```

### Reset (⚠️ APAGA DADOS!)
```bash
npm run migrate:reset
```

### Aplicar Índices Customizados
```bash
npm run aplicar-indices
```

### Gerar Prisma Client
```bash
npm run prisma:generate
```

### Visualizar Schema no Browser
```bash
npm run prisma:studio
```

---

## 🐛 Troubleshooting

### Erro: "Migration failed to apply"

**Causa:** Migração anterior falhou ou banco está em estado inconsistente.

**Solução:**
```bash
# Verificar status
npm run migrate:status

# Resolver migração marcada como aplicada mas que falhou
npx prisma migrate resolve --applied nome_da_migracao

# Ou marcar como revertida
npx prisma migrate resolve --rolled-back nome_da_migracao
```

### Erro: "Database schema is not in sync"

**Causa:** Schema do Prisma não corresponde ao banco.

**Solução:**
```bash
# Sincronizar schema com banco (apenas em desenvolvimento!)
npx prisma db push

# Ou aplicar migrações pendentes
npm run migrate:deploy
```

### Erro: "Migration lock file is out of sync"

**Causa:** Arquivo `migration_lock.toml` está desatualizado.

**Solução:**
```bash
# Verificar e corrigir lock file
npx prisma migrate resolve --applied nome_da_migracao
```

### Migração Aplicada Parcialmente

**Solução:**
1. Fazer backup do banco
2. Reverter manualmente as mudanças no banco
3. Marcar migração como revertida:
   ```bash
   npx prisma migrate resolve --rolled-back nome_da_migracao
   ```
4. Corrigir a migração e reaplicar

---

## 📝 Checklist Antes de Aplicar em Produção

- [ ] Migração testada em ambiente de desenvolvimento
- [ ] SQL revisado e validado
- [ ] Backup do banco de dados criado
- [ ] Documentação atualizada
- [ ] Time notificado sobre a migração
- [ ] Janela de manutenção agendada (se necessário)
- [ ] Plano de rollback preparado

---

## 🔗 Referências

- [Documentação Prisma Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Prisma Migrate Workflows](https://www.prisma.io/docs/guides/migrate/production-troubleshooting)
- [Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)

---

**Última atualização:** 2025-01-20

