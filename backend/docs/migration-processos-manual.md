# Migration Manual - Tabelas de Processos

## 📋 O que é isso?

Este documento explica como criar as tabelas de Processos no banco de dados PostgreSQL. O Prisma não conseguiu fazer isso automaticamente por causa de permissões.

## 🎯 O que você precisa fazer?

Você precisa executar um arquivo SQL que cria as tabelas. Existem 3 formas de fazer isso. **Escolha a mais fácil para você:**

---

## ✅ OPÇÃO 1: Usando um Cliente Gráfico (MAIS FÁCIL - Recomendado)

Esta é a forma mais simples e visual. Você não precisa usar linha de comando.

### Passo 1: Instalar um Cliente PostgreSQL (se não tiver)

Baixe e instale um destes programas:
- **DBeaver** (gratuito): https://dbeaver.io/download/
- **pgAdmin** (gratuito): https://www.pgadmin.org/download/
- **DataGrip** (pago, mas tem trial): https://www.jetbrains.com/datagrip/

### Passo 2: Conectar ao Banco de Dados

1. Abra o programa que você instalou
2. Crie uma nova conexão com estes dados:
   - **Host/Server**: `localhost`
   - **Porta**: `5432`
   - **Database**: `painel_rede_uniao_db`
   - **Usuário**: `painel_uniao`
   - **Senha**: `painel_uniao_pwd`

### Passo 3: Abrir o Arquivo SQL

1. No programa, procure a opção "Abrir arquivo SQL" ou "Execute SQL Script"
2. Navegue até a pasta do projeto: `C:\Users\conta\source\res-eco\res-economico\backend\prisma\migrations\`
3. Abra o arquivo: `manual_add_processos_tables.sql`

### Passo 4: Executar o SQL

1. Com o arquivo aberto, clique em "Executar" ou pressione `F5`
2. Aguarde a execução terminar
3. Você verá mensagens de sucesso ou erro

### Passo 5: Verificar se Funcionou

Execute esta consulta SQL no mesmo programa para verificar:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('Processo', 'ProcessoItem', 'ProcessoAnexo', 'ProcessoHistorico');
```

Se aparecerem 4 linhas (uma para cada tabela), está tudo certo! ✅

---

## ✅ OPÇÃO 2: Usando PowerShell (Windows)

Se você prefere usar linha de comando no Windows.

### Passo 1: Abrir PowerShell

1. Pressione `Windows + X`
2. Escolha "Windows PowerShell" ou "Terminal"
3. Navegue até a pasta do backend:

```powershell
cd C:\Users\conta\source\res-eco\res-economico\backend
```

**Onde executar**: No PowerShell que você acabou de abrir

### Passo 2: Verificar se o Docker está rodando

Execute este comando:

```powershell
docker ps
```

**O que faz**: Lista os containers Docker que estão rodando

**O que você deve ver**: Uma linha com `painel_rede_uniao_postgres`

**Se não aparecer**: Execute `docker-compose up -d` na pasta raiz do projeto

### Passo 3: Executar o SQL

Execute este comando (copie e cole tudo de uma vez):

```powershell
Get-Content prisma\migrations\manual_add_processos_tables.sql | docker exec -i painel_rede_uniao_postgres psql -U painel_uniao -d painel_rede_uniao_db
```

**Onde executar**: No mesmo PowerShell do Passo 1

**O que faz**: 
- Lê o arquivo SQL
- Envia para o container do PostgreSQL
- Executa os comandos SQL

**O que você deve ver**: Mensagens de erro ou sucesso. Se aparecer "ERROR: permission denied", vá para a Opção 3.

### Passo 4: Verificar se Funcionou

Execute este comando:

```powershell
docker exec painel_rede_uniao_postgres psql -U painel_uniao -d painel_rede_uniao_db -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('Processo', 'ProcessoItem', 'ProcessoAnexo', 'ProcessoHistorico');"
```

**O que você deve ver**: 4 linhas com os nomes das tabelas

---

## ✅ OPÇÃO 3: Conceder Permissões e Depois Executar

Se a Opção 2 deu erro de permissão, use esta.

### Passo 1: Abrir PowerShell

Igual ao Passo 1 da Opção 2.

### Passo 2: Conectar ao PostgreSQL via Docker

Execute este comando:

```powershell
docker exec -it painel_rede_uniao_postgres psql -U painel_uniao -d painel_rede_uniao_db
```

**Onde executar**: No PowerShell

**O que faz**: Conecta você diretamente ao banco de dados PostgreSQL

**O que você deve ver**: O prompt muda para algo como `painel_rede_uniao_db=#`

### Passo 3: Tornar o Usuário Superuser

Com o prompt do PostgreSQL aberto, execute:

```sql
ALTER USER painel_uniao WITH SUPERUSER;
```

**Onde executar**: No prompt do PostgreSQL (não no PowerShell)

**O que faz**: Dá permissões de administrador ao usuário

**O que você deve ver**: `ALTER ROLE`

### Passo 4: Sair do PostgreSQL

Digite:

```sql
\q
```

**Onde executar**: No prompt do PostgreSQL

**O que faz**: Fecha a conexão e volta para o PowerShell

### Passo 5: Executar o SQL (Agora com Permissões)

Volte para o PowerShell e execute:

```powershell
Get-Content prisma\migrations\manual_add_processos_tables.sql | docker exec -i painel_rede_uniao_postgres psql -U painel_uniao -d painel_rede_uniao_db
```

**Onde executar**: No PowerShell

**O que faz**: Agora deve funcionar sem erros de permissão!

### Passo 6: Verificar se Funcionou

Igual ao Passo 4 da Opção 2.

---

## 🔍 Verificação Detalhada

Após executar qualquer uma das opções acima, verifique se tudo foi criado corretamente.

### Verificar Tabelas

Execute esta consulta SQL (no cliente gráfico ou via PowerShell):

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('Processo', 'ProcessoItem', 'ProcessoAnexo', 'ProcessoHistorico');
```

**O que você deve ver**: 4 linhas, uma para cada tabela:
- Processo
- ProcessoItem
- ProcessoAnexo
- ProcessoHistorico

### Verificar Enums

Execute esta consulta SQL:

```sql
SELECT typname 
FROM pg_type 
WHERE typname IN ('TipoProcesso', 'SituacaoProcesso', 'CategoriaReclamacao', 'PrioridadeProcesso', 'TipoArquivoProcesso');
```

**O que você deve ver**: 5 linhas, uma para cada enum

---

## 📁 Localização do Arquivo SQL

O arquivo que você precisa executar está aqui:

```
C:\Users\conta\source\res-eco\res-economico\backend\prisma\migrations\manual_add_processos_tables.sql
```

**Como abrir**: Clique com o botão direito no arquivo → "Abrir com" → Escolha um editor de texto ou cliente PostgreSQL

---

## ✅ Próximos Passos (Após Executar a Migration)

Depois que a migration for executada com sucesso, faça o seguinte:

### Passo 1: Gerar o Prisma Client

1. Abra o PowerShell
2. Navegue até a pasta do backend:

```powershell
cd C:\Users\conta\source\res-eco\res-economico\backend
```

3. Execute:

```powershell
npx prisma generate
```

**Onde executar**: No PowerShell, na pasta `backend`

**O que faz**: Atualiza o código do Prisma para reconhecer as novas tabelas

**O que você deve ver**: Mensagens de sucesso e "Generated Prisma Client"

### Passo 2: Reiniciar o Backend

1. Se o backend estiver rodando, pare-o (Ctrl+C)
2. Inicie novamente:

```powershell
npm run start:dev
```

**Onde executar**: No PowerShell, na pasta `backend`

### Passo 3: Testar no Frontend

1. Acesse: `http://localhost:3001/admin/processos`
2. Você deve ver a página de Processos funcionando

---

## ❓ Problemas Comuns

### Erro: "permission denied"

**Solução**: Use a Opção 3 para dar permissões ao usuário primeiro

### Erro: "container não encontrado"

**Solução**: Execute `docker-compose up -d` na pasta raiz do projeto

### Erro: "arquivo não encontrado"

**Solução**: Certifique-se de estar na pasta `backend` quando executar os comandos

### Não sei qual opção escolher

**Recomendação**: Use a **Opção 1** (cliente gráfico). É a mais fácil e visual.

---

## 📞 Precisa de Ajuda?

Se ainda tiver dúvidas:
1. Tente a Opção 1 primeiro (é a mais simples)
2. Se der erro, tente a Opção 3 (resolve problemas de permissão)
3. Verifique se o Docker está rodando: `docker ps`

