# 🚀 Como Executar a Migration AGORA (Sem Perder Dados)

## ✅ Método Mais Simples: DBeaver (Cliente Gráfico)

Este é o método **mais fácil e garantido** de funcionar. Você não precisa saber comandos, só clicar.

### Passo 1: Baixar e Instalar DBeaver

1. Acesse: https://dbeaver.io/download/
2. Baixe a versão **Community Edition** (é gratuita)
3. Instale normalmente (Next, Next, Finish)

### Passo 2: Conectar ao Banco de Dados

1. Abra o DBeaver
2. Clique no botão **"Nova Conexão"** (ícone de plug) no canto superior esquerdo
3. Escolha **PostgreSQL** e clique em **Next**
4. Preencha os dados:

   ```
   Host: localhost
   Port: 5432
   Database: painel_rede_uniao_db
   Username: painel_uniao
   Password: painel_uniao_pwd
   ```

5. Clique em **Test Connection**
   - Se pedir para baixar driver, clique em **Download**
6. Clique em **Finish**

### Passo 3: Abrir o Arquivo SQL

1. No DBeaver, vá em **File → Open File** (ou pressione `Ctrl+O`)
2. Navegue até esta pasta:
   ```
   C:\Users\conta\source\res-eco\res-economico\backend\prisma\migrations\
   ```
3. Abra o arquivo: **`manual_add_processos_tables.sql`**

### Passo 4: Executar o SQL

1. Com o arquivo aberto no DBeaver, você verá todo o código SQL
2. Clique no botão **"Execute SQL Script"** (ícone de play ▶️) na barra de ferramentas
   - Ou pressione `Ctrl+Enter`
3. Aguarde alguns segundos
4. Você verá mensagens de sucesso ou erro na parte inferior

### Passo 5: Verificar se Funcionou

No DBeaver, execute esta consulta (digite e pressione `Ctrl+Enter`):

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('Processo', 'ProcessoItem', 'ProcessoAnexo', 'ProcessoHistorico');
```

**O que você deve ver:** 4 linhas, uma para cada tabela:
- Processo
- ProcessoItem
- ProcessoAnexo
- ProcessoHistorico

Se aparecerem as 4 tabelas, está tudo certo! ✅

---

## 🔧 Se Der Erro de Permissão no DBeaver

Se mesmo no DBeaver der erro de permissão, você precisa conectar como um usuário com mais permissões. Mas como o usuário `painel_uniao` é o único que temos, vamos tentar outra coisa:

### Solução Alternativa: Usar o Prisma Client Diretamente

Vou criar um script que tenta criar as tabelas usando o Prisma, mas se não funcionar, você precisará usar o DBeaver mesmo.

---

## 📝 Resumo Rápido

1. **Baixe DBeaver** (gratuito)
2. **Conecte** ao banco (localhost:5432, painel_rede_uniao_db)
3. **Abra** o arquivo `manual_add_processos_tables.sql`
4. **Execute** (botão play ou Ctrl+Enter)
5. **Pronto!** ✅

**Tempo estimado:** 5 minutos

**Dificuldade:** Muito fácil (só clicar)

---

## ❓ Por que o Script PowerShell Não Funcionou?

O script tentou tornar o usuário `painel_uniao` superuser, mas:
- O usuário não tem permissão para alterar a si mesmo
- Apenas um superuser pode tornar outro usuário superuser
- É um problema de "ovo e galinha" - precisa de permissões para dar permissões

**Solução:** Usar DBeaver ou outro cliente que pode se conectar diretamente e executar SQL, sem precisar de permissões especiais do Prisma.

