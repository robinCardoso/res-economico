# 📦 Migração do Banco de Dados: Local → VPS

## ✅ Resposta Rápida

**SIM!** Você pode carregar todos os arquivos localmente, deixar o sistema completo, e depois migrar o banco de dados para o VPS.

---

## 🎯 Processo Completo

### Fase 1: Preparar Dados no Ambiente Local

1. **Carregue todos os arquivos** que deseja no sistema local
2. **Valide os dados** - certifique-se de que tudo está correto
3. **Teste o sistema** - verifique se tudo funciona como esperado

---

### Fase 2: Fazer Backup do Banco Local

#### Opção A: Usando Docker (Recomendado)

```bash
# No seu computador local (Windows PowerShell)
# Certifique-se de que o Docker está rodando

# Fazer backup do banco
docker compose exec -T postgres pg_dump -U reseco reseco_db > backup_local.sql

# Ou com compressão (recomendado para arquivos grandes)
docker compose exec -T postgres pg_dump -U reseco reseco_db | gzip > backup_local.sql.gz
```

#### Opção B: Usando pg_dump direto (se PostgreSQL estiver instalado)

```bash
pg_dump -h localhost -U reseco -d reseco_db > backup_local.sql
```

#### Opção C: Backup completo do volume Docker

```bash
# Fazer backup do volume completo (mais rápido para restauração)
docker run --rm -v res_economico_postgres_data:/data -v ${PWD}:/backup alpine tar czf /backup/postgres_data_backup.tar.gz /data
```

---

### Fase 3: Fazer Backup dos Arquivos Uploads

```bash
# No Windows PowerShell
# Fazer backup da pasta uploads
Compress-Archive -Path backend\uploads -DestinationPath uploads_backup.zip
```

**Ou no Linux/Mac:**
```bash
tar -czf uploads_backup.tar.gz backend/uploads/
```

---

### Fase 4: Transferir para o VPS

#### 4.1. Transferir Backup do Banco

```bash
# Usando SCP (do seu computador)
scp backup_local.sql.gz root@seu-ip-vps:/opt/res-economico/

# Ou usando SFTP (FileZilla, WinSCP, etc.)
# Conectar no VPS e fazer upload do arquivo
```

#### 4.2. Transferir Backup dos Uploads

```bash
# Transferir arquivos uploads
scp uploads_backup.zip root@seu-ip-vps:/opt/res-economico/
```

---

### Fase 5: Restaurar no VPS

#### 5.1. Conectar no VPS

```bash
ssh root@seu-ip-vps
cd /opt/res-economico
```

#### 5.2. Parar os Containers (se estiverem rodando)

```bash
docker compose down
```

#### 5.3. Criar Banco Vazio (se ainda não existe)

```bash
# Subir apenas o PostgreSQL
docker compose up -d postgres

# Aguardar o banco estar pronto
sleep 5
```

#### 5.4. Restaurar o Backup

**Se o backup está comprimido (.gz):**
```bash
# Descomprimir e restaurar
gunzip < backup_local.sql.gz | docker compose exec -T postgres psql -U reseco -d reseco_db
```

**Se o backup está sem compressão (.sql):**
```bash
# Restaurar diretamente
docker compose exec -T postgres psql -U reseco -d reseco_db < backup_local.sql
```

**Ou usando cat:**
```bash
cat backup_local.sql | docker compose exec -T postgres psql -U reseco -d reseco_db
```

#### 5.5. Verificar Restauração

```bash
# Conectar no banco e verificar
docker compose exec postgres psql -U reseco -d reseco_db -c "SELECT COUNT(*) FROM \"Upload\";"
docker compose exec postgres psql -U reseco -d reseco_db -c "SELECT COUNT(*) FROM \"LinhaUpload\";"
```

#### 5.6. Restaurar Arquivos Uploads

```bash
# Descompactar arquivos
unzip uploads_backup.zip -d backend/

# Ou se for .tar.gz
tar -xzf uploads_backup.tar.gz -C backend/

# Ajustar permissões
chown -R 1000:1000 backend/uploads
chmod -R 755 backend/uploads
```

#### 5.7. Aplicar Migrações (Importante!)

```bash
# Garantir que todas as migrações estão aplicadas
cd backend
npm run migrate:deploy
```

#### 5.8. Reiniciar Todos os Serviços

```bash
cd /opt/res-economico
docker compose up -d
```

---

## ⚠️ Considerações Importantes

### 1. **Senhas e Credenciais**

**⚠️ ATENÇÃO:** O banco local pode ter senhas diferentes do VPS!

**Solução:**
- Se as senhas forem diferentes, você precisa ajustar antes de restaurar
- Ou restaurar e depois alterar as senhas no VPS

### 2. **URLs e Configurações**

Após restaurar, verifique:
- URLs de API no frontend
- Configurações de CORS
- Variáveis de ambiente

### 3. **IDs de Usuários**

Se você criou usuários localmente, os IDs podem ser diferentes. Você pode precisar:
- Recriar os usuários no VPS
- Ou ajustar os IDs no banco

### 4. **Arquivos Uploads**

Os arquivos físicos precisam estar no mesmo caminho relativo:
- Local: `backend/uploads/`
- VPS: `/opt/res-economico/backend/uploads/`

---

## 🔄 Processo Alternativo: Migração Incremental

Se você quiser continuar adicionando dados localmente e depois sincronizar:

### 1. Fazer Backup Incremental

```bash
# Backup apenas de dados novos (após uma data)
docker compose exec -T postgres pg_dump -U reseco reseco_db \
  --data-only \
  --table="Upload" \
  --table="LinhaUpload" \
  --where="created_at > '2025-01-20'" \
  > backup_incremental.sql
```

### 2. Restaurar no VPS

```bash
cat backup_incremental.sql | docker compose exec -T postgres psql -U reseco -d reseco_db
```

---

## 📋 Checklist Completo

### Antes de Migrar

- [ ] Todos os dados foram carregados localmente
- [ ] Sistema testado e funcionando
- [ ] Backup do banco criado
- [ ] Backup dos arquivos uploads criado
- [ ] Verificado tamanho dos backups

### Durante a Migração

- [ ] VPS configurado e acessível
- [ ] Docker instalado no VPS
- [ ] Arquivos transferidos para o VPS
- [ ] Banco restaurado com sucesso
- [ ] Arquivos uploads restaurados
- [ ] Migrações aplicadas
- [ ] Permissões ajustadas

### Após a Migração

- [ ] Sistema iniciado no VPS
- [ ] Dados verificados (contagem de registros)
- [ ] Uploads acessíveis
- [ ] Sistema testado (login, uploads, relatórios)
- [ ] URLs e configurações atualizadas

---

## 🚨 Troubleshooting

### Erro: "database does not exist"

**Solução:**
```bash
# Criar banco primeiro
docker compose exec postgres psql -U reseco -c "CREATE DATABASE reseco_db;"
```

### Erro: "permission denied"

**Solução:**
```bash
# Ajustar permissões
chmod 644 backup_local.sql
chown root:root backup_local.sql
```

### Erro: "connection refused"

**Solução:**
```bash
# Verificar se PostgreSQL está rodando
docker compose ps
docker compose logs postgres
```

### Dados não aparecem após restauração

**Solução:**
```bash
# Verificar se restauração foi bem-sucedida
docker compose exec postgres psql -U reseco -d reseco_db -c "\dt"
docker compose exec postgres psql -U reseco -d reseco_db -c "SELECT COUNT(*) FROM \"Upload\";"

# Verificar logs do backend
docker compose logs backend
```

---

## 💡 Dicas

1. **Teste primeiro em ambiente de staging** se possível
2. **Faça backup do VPS antes** de restaurar (caso algo dê errado)
3. **Mantenha os backups locais** por segurança
4. **Documente o processo** para futuras migrações
5. **Use compressão** para backups grandes (`.gz` ou `.zip`)

---

## 📊 Exemplo de Comandos Completos

### Backup Local (Windows PowerShell)

```powershell
# 1. Backup do banco
docker compose exec -T postgres pg_dump -U reseco reseco_db | Out-File -Encoding UTF8 backup_local.sql

# 2. Backup dos uploads
Compress-Archive -Path backend\uploads -DestinationPath uploads_backup.zip

# 3. Transferir para VPS (usando SCP ou WinSCP)
scp backup_local.sql root@seu-ip-vps:/opt/res-economico/
scp uploads_backup.zip root@seu-ip-vps:/opt/res-economico/
```

### Restauração no VPS (Linux)

```bash
# 1. Conectar no VPS
ssh root@seu-ip-vps
cd /opt/res-economico

# 2. Parar serviços
docker compose down

# 3. Subir PostgreSQL
docker compose up -d postgres
sleep 5

# 4. Restaurar banco
cat backup_local.sql | docker compose exec -T postgres psql -U reseco -d reseco_db

# 5. Restaurar uploads
unzip uploads_backup.zip -d backend/
chown -R 1000:1000 backend/uploads

# 6. Aplicar migrações
cd backend && npm run migrate:deploy && cd ..

# 7. Reiniciar tudo
docker compose up -d
```

---

## ✅ Resultado Final

Após seguir este processo, você terá:
- ✅ Todos os dados do ambiente local no VPS
- ✅ Todos os arquivos uploads disponíveis
- ✅ Sistema funcionando em produção
- ✅ Histórico completo preservado

---

**Última atualização:** Janeiro 2025

