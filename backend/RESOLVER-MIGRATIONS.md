# Resolver Migration Falha e Aplicar Tabelas de Vendas

## Problema
A migration `20250105000000_add_preferencias_push_logs` está marcada como falha no banco de dados, bloqueando novas migrations.

## Solução

### Passo 1: Resolver a migration falha
```powershell
cd backend
npx prisma migrate resolve --applied 20250105000000_add_preferencias_push_logs
```

### Passo 2: Aplicar todas as migrations pendentes
```powershell
npx prisma migrate deploy
```

### Passo 3: Regenerar o Prisma Client
```powershell
npx prisma generate
```

### Passo 4: Verificar se as tabelas foram criadas
```powershell
# Opção 1: Usar Prisma Studio
npx prisma studio

# Opção 2: Verificar diretamente no banco
# Conecte-se ao PostgreSQL e execute:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('Venda', 'VendaAnalytics', 'VendaImportacaoLog');
```

### Passo 5: Verificar build
```powershell
npm run build
```

## Se a migration realmente falhou

Se a migration `20250105000000_add_preferencias_push_logs` realmente falhou (por exemplo, tabelas já existem), você pode:

1. **Marcar como aplicada manualmente** (se as tabelas já existem):
```powershell
npx prisma migrate resolve --applied 20250105000000_add_preferencias_push_logs
```

2. **Ou marcar como revertida** (se quiser tentar aplicar novamente):
```powershell
npx prisma migrate resolve --rolled-back 20250105000000_add_preferencias_push_logs
npx prisma migrate deploy
```

## Verificar status das migrations
```powershell
npx prisma migrate status
```
