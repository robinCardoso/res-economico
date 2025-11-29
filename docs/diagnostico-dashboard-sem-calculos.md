# 🔍 Diagnóstico: Dashboard Parou de Calcular Valores

## 📋 Problema Reportado

- `/admin/resultado-economico/dashboard` parou de calcular os valores
- Possível problema geral: sistema parou de acessar o banco de dados e fazer cálculos

## ✅ Verificações Realizadas

### 1. Backend está rodando
- ✅ Backend responde em `http://localhost:3000` (Status 200)
- ✅ Endpoint `/uploads/dashboard/conta-745` existe e está protegido (retorna 401 sem autenticação)

### 2. Endpoint do Dashboard
- ✅ **Rota**: `GET /uploads/dashboard/conta-745`
- ✅ **Controller**: `backend/src/uploads/uploads.controller.ts` (linha 114-123)
- ✅ **Service**: `backend/src/uploads/uploads.service.ts` (linha 456-598)
- ✅ **Método**: `getConta745(ano?, mes?, empresaId?)`

### 3. Lógica de Cálculo
O método `getConta745`:
1. Busca uploads com status `CONCLUIDO` ou `COM_ALERTAS`
2. Filtra por ano, mês e/ou empresa (se fornecidos)
3. Busca linhas com conta `'745'` e nome contendo `'Resultado do Exercício'`
4. Soma os valores de `saldoAtual` das linhas
5. Agrupa por período (mensal ou anual)
6. Retorna dados consolidados e por empresa

## 🔍 Possíveis Causas

### 1. Problema de Autenticação
**Sintomas:**
- Requisições retornam 401 (Não Autorizado)
- Token JWT expirado ou inválido
- Usuário não está autenticado

**Como verificar:**
1. Abra o console do navegador (F12)
2. Vá para a aba "Network"
3. Recarregue a página do dashboard
4. Procure por requisições para `/uploads/dashboard/conta-745`
5. Verifique o status da resposta:
   - **401**: Problema de autenticação
   - **500**: Erro no servidor
   - **200**: Dados retornados (verificar se estão vazios)

**Solução:**
- Fazer logout e login novamente
- Verificar se o token está sendo enviado no header `Authorization: Bearer <token>`
- Verificar se o token não expirou

### 2. Problema de Conexão com Banco de Dados
**Sintomas:**
- Backend não consegue acessar o PostgreSQL
- Erros 500 no backend
- Timeout nas requisições

**Como verificar:**
1. Verificar logs do backend (terminal onde `npm run start:dev` está rodando)
2. Verificar se o PostgreSQL está rodando:
   ```powershell
   docker ps --filter "name=postgres"
   ```
3. Verificar se há erros de conexão nos logs

**Solução:**
- Verificar se o PostgreSQL está rodando
- Verificar se a `DATABASE_URL` no `.env` está correta
- Reiniciar o container do PostgreSQL se necessário

### 3. Dados Não Encontrados
**Sintomas:**
- Endpoint retorna 200, mas dados vazios
- Não há uploads com status `CONCLUIDO` ou `COM_ALERTAS`
- Não há linhas com conta `'745'`

**Como verificar:**
1. Verificar no banco de dados se há uploads:
   ```sql
   SELECT id, status, ano, mes, empresaId 
   FROM "Upload" 
   WHERE status IN ('CONCLUIDO', 'COM_ALERTAS')
   ORDER BY ano DESC, mes DESC;
   ```
2. Verificar se há linhas com conta 745:
   ```sql
   SELECT COUNT(*) 
   FROM "Linha" 
   WHERE conta = '745' 
   AND "nomeConta" ILIKE '%Resultado do Exercício%';
   ```

**Solução:**
- Fazer upload de novos arquivos Excel
- Verificar se os uploads foram processados corretamente
- Verificar se as linhas foram criadas com a conta correta

### 4. Erro Silencioso no Frontend
**Sintomas:**
- Requisição é feita, mas dados não aparecem
- Erro no console do navegador
- React Query não está atualizando o cache

**Como verificar:**
1. Abrir o console do navegador (F12)
2. Verificar erros em vermelho
3. Verificar a aba "Network" para ver as requisições
4. Verificar se React Query está retornando dados:
   ```javascript
   // No console do navegador
   console.log(window.__REACT_QUERY_STATE__)
   ```

**Solução:**
- Limpar cache do navegador
- Verificar se há erros de JavaScript
- Verificar se o React Query está configurado corretamente

## 🛠️ Passos para Diagnóstico Completo

### Passo 1: Verificar Autenticação
1. Abra o console do navegador (F12)
2. Vá para a aba "Application" > "Local Storage"
3. Procure por `auth-storage`
4. Verifique se existe e se contém um token válido
5. Se não existir ou estiver vazio, faça login novamente

### Passo 2: Verificar Requisições
1. Abra o console do navegador (F12)
2. Vá para a aba "Network"
3. Recarregue a página do dashboard
4. Procure por `/uploads/dashboard/conta-745`
5. Clique na requisição e verifique:
   - **Status**: Deve ser 200 (OK)
   - **Headers**: Deve ter `Authorization: Bearer <token>`
   - **Response**: Deve conter `consolidado` e `porEmpresa`

### Passo 3: Verificar Logs do Backend
1. Abra o terminal onde o backend está rodando
2. Procure por erros ou warnings
3. Verifique se há mensagens sobre:
   - Conexão com banco de dados
   - Erros de processamento
   - Timeouts

### Passo 4: Verificar Banco de Dados
1. Conecte-se ao PostgreSQL:
   ```powershell
   docker exec -it painel_rede_uniao_postgres psql -U painel_uniao -d painel_rede_uniao_db
   ```
2. Execute as queries de verificação acima
3. Verifique se há dados disponíveis

## 📝 Checklist de Verificação

- [ ] Backend está rodando (porta 3000)
- [ ] PostgreSQL está rodando e saudável
- [ ] Usuário está autenticado (token válido)
- [ ] Requisições estão sendo feitas (ver Network tab)
- [ ] Requisições retornam 200 (não 401 ou 500)
- [ ] Dados estão sendo retornados (não vazios)
- [ ] React Query está atualizando o cache
- [ ] Não há erros no console do navegador
- [ ] Não há erros nos logs do backend
- [ ] Há uploads processados no banco de dados
- [ ] Há linhas com conta 745 no banco de dados

## 🚀 Próximos Passos

Após identificar a causa raiz:

1. **Se for autenticação**: Fazer logout/login ou verificar token
2. **Se for banco de dados**: Verificar conexão e dados
3. **Se for dados vazios**: Fazer upload de novos arquivos
4. **Se for erro no código**: Verificar logs e corrigir

## 📞 Informações para Suporte

Se o problema persistir, forneça:
1. Screenshot do console do navegador (com erros)
2. Screenshot da aba Network (com a requisição)
3. Logs do backend (últimas 50 linhas)
4. Status do PostgreSQL (`docker ps`)
5. Resultado das queries SQL de verificação

