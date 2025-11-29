# 🔧 Correção: Erro de Conexão com Backend

## 📋 Problema Identificado

O frontend está tentando conectar ao backend em `http://localhost:3000`, mas o backend não está rodando.

**Erro no console:**
```
[HTTP] Erro de conexão: {}
[HTTP] Sugestão: Verifique se o backend está rodando e se o IP/URL está correto.
```

## ✅ Status da Infraestrutura

- ✅ **PostgreSQL**: Rodando e saudável (`painel_rede_uniao_postgres`)
- ✅ **Redis**: Rodando e saudável (`painel_rede_uniao_redis`)
- ✅ **Dependências**: Instaladas (`node_modules` existe)
- ✅ **Prisma Client**: Gerado
- ✅ **Arquivo .env**: Configurado com `DATABASE_URL`
- ❌ **Backend NestJS**: Não está rodando na porta 3000

## 🚀 Solução

### Opção 1: Iniciar Backend Manualmente (Recomendado)

1. Abra um **novo terminal** (PowerShell ou CMD)
2. Navegue até a pasta do backend:
   ```powershell
   cd C:\Users\conta\source\res-eco\res-economico\backend
   ```
3. Execute o comando para iniciar o backend:
   ```powershell
   npm run start:dev
   ```
4. Aguarde a mensagem de sucesso:
   ```
   🚀 Backend rodando em http://localhost:3000
   ```
5. **Mantenha este terminal aberto** enquanto estiver desenvolvendo

### Opção 2: Usar Script de Inicialização

Crie um arquivo `start-backend.ps1` na raiz do projeto:

```powershell
# start-backend.ps1
cd backend
npm run start:dev
```

Execute:
```powershell
.\start-backend.ps1
```

## 🔍 Verificação

Após iniciar o backend, verifique se está rodando:

```powershell
# Verificar se a porta 3000 está em uso
netstat -ano | findstr :3000

# Ou verificar processos Node
Get-Process -Name node | Select-Object Id, ProcessName
```

## 📝 Notas

- O backend precisa estar rodando **antes** de acessar o frontend
- O backend usa **hot reload** (`start:dev`), então ele reinicia automaticamente quando você faz alterações
- Se você fechar o terminal do backend, ele para de rodar
- Para produção, use `npm run start:prod` (após build)

## 🐛 Troubleshooting

### Backend não inicia

1. Verifique se há erros no terminal
2. Verifique se o PostgreSQL está rodando:
   ```powershell
   docker ps --filter "name=postgres"
   ```
3. Verifique se o Redis está rodando:
   ```powershell
   docker ps --filter "name=redis"
   ```
4. Verifique se o arquivo `.env` existe e está configurado corretamente
5. Tente reinstalar as dependências:
   ```powershell
   cd backend
   rm -r node_modules
   npm install
   ```

### Erro de conexão persiste

1. Verifique se o backend realmente está na porta 3000:
   ```powershell
   netstat -ano | findstr :3000
   ```
2. Verifique se há firewall bloqueando a porta 3000
3. Tente acessar diretamente: `http://localhost:3000` no navegador
4. Verifique os logs do backend no terminal onde ele está rodando

## ✅ Próximos Passos

Após corrigir o problema:

1. ✅ Backend rodando na porta 3000
2. ✅ Frontend consegue conectar ao backend
3. ✅ Erros de conexão desaparecem do console
4. 🚀 Prosseguir com a **Etapa 5: Clonagem de Atas**

