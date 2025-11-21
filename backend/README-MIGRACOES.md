# 🚀 Guia Rápido de Migrações

## Comandos Principais

### Criar Nova Migração
```bash
npm run migrate:create -- nome_da_migracao
```

### Aplicar Migrações (Desenvolvimento)
```bash
npm run migrate:dev
```

### Aplicar Migrações (Produção)
```bash
npm run migrate:deploy
```

### Ver Status
```bash
npm run migrate:status
```

### Listar Migrações
```bash
npm run migrate:list
```

### Ver Detalhes de uma Migração
```bash
npm run migrate:info nome_da_migracao
```

## 📚 Documentação Completa

Para mais detalhes, consulte: [`docs/MIGRACOES.md`](./docs/MIGRACOES.md)

## ⚠️ Importante

- **Sempre revise o SQL gerado** antes de aplicar
- **Faça backup** antes de migrações importantes
- **Teste em desenvolvimento** antes de produção

