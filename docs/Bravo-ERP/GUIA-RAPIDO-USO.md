# 🚀 GUIA RÁPIDO: Como Usar o Módulo Bravo ERP

## 📋 Visão Geral

Este guia explica como usar o módulo de sincronização do Bravo ERP para importar produtos automaticamente.

---

## 🎯 Pré-requisitos

1. **Backend rodando** na porta 3000
2. **Frontend rodando** na porta 3001
3. **Credenciais do Bravo ERP**:
   - URL Base (ex: `https://v2.bravoerp.com.br`)
   - Cliente (ex: `redeuniao_sc`)
   - Token da API

---

## 🔧 PASSO 1: Configurar Credenciais

### Via Interface Web

1. Acesse: `http://localhost:3001/admin/importacoes/bravo-erp/produtos`
2. Vá para a aba **"Configuração"**
3. Preencha os campos:
   - **URL Base:** `https://v2.bravoerp.com.br`
   - **Cliente:** Seu cliente do Bravo ERP
   - **Token:** Token da API (obrigatório)
   - **Outras configurações:** Opcional
4. Clique em **"Testar Conexão"** para verificar
5. Clique em **"Salvar Configuração"**

### Campos Importantes

- ✅ **Token:** Obrigatório para sincronização
- ✅ **Verificar Duplicatas:** Recomendado ativar
- ✅ **Usar Data Última Modificação:** Recomendado para sincronizações incrementais

---

## 🗺️ PASSO 2: Configurar Mapeamento (Opcional)

O sistema vem com um mapeamento padrão pré-configurado. Você pode personalizar:

1. Vá para a aba **"Mapeamento"**
2. **Opção A:** Carregar mapeamento padrão (recomendado)
   - Clique em **"Usar Mapeamento Padrão"**
3. **Opção B:** Criar mapeamento personalizado
   - Clique em **"Adicionar Mapeamento"**
   - Selecione o campo do Bravo ERP
   - Selecione o campo do sistema interno
   - Escolha o tipo de transformação
   - Ative/desative conforme necessário
4. Clique em **"Salvar Mapeamentos"**

### Campos Mapeados por Padrão

- `ref` → `referencia` (obrigatório)
- `titulo` → `descricao`
- `excluido` → `ativo` (boolean invertido)
- `gtin.gtin` → `gtin`
- `ncm` → `ncm`
- `cest` → `cest`
- E mais...

---

## 🔄 PASSO 3: Sincronizar Produtos

### Sincronização Rápida (Recomendado para Testes)

1. Vá para a aba **"Sincronização"**
2. Clique em **"Sincronizar 50"**
3. Acompanhe o progresso em tempo real
4. Aguarde a conclusão (geralmente 1-2 minutos)

### Sincronização Completa

1. Vá para a aba **"Sincronização"**
2. Clique em **"Sincronizar TODOS"**
3. Confirme a ação
4. Acompanhe o progresso (pode levar vários minutos)
5. Aguarde a conclusão

### Durante a Sincronização

- ✅ Progresso em tempo real
- ✅ Produtos processados / Total
- ✅ Página atual sendo processada
- ✅ Botão para cancelar se necessário

---

## 📊 PASSO 4: Verificar Resultados

### Estatísticas

- **Aba "Configuração":** Mostra estatísticas rápidas no topo da página
- **Total de produtos:** Produtos sincronizados no sistema
- **Última sincronização:** Data e hora da última sync

### Logs

1. Vá para a aba **"Logs"**
2. Veja o histórico completo de sincronizações
3. Clique em um log para ver detalhes
4. Sincronizações interrompidas podem ser retomadas

---

## 🔄 Retomar Sincronização Interrompida

Se uma sincronização for interrompida:

1. Vá para a aba **"Logs"**
2. Procure sincronizações com status **"Interrompida"** ou **"Em Progresso"**
3. Clique em **"Retomar Sincronização"**
4. A sincronização continuará de onde parou

---

## ❌ Cancelar Sincronização

Para cancelar uma sincronização em andamento:

1. Vá para a aba **"Sincronização"**
2. Clique em **"Cancelar Sincronização"**
3. Confirme a ação
4. A sincronização será interrompida

---

## 🐛 Solução de Problemas

### Erro: "Token não configurado"

**Solução:**
1. Vá para a aba "Configuração"
2. Preencha o campo "Token"
3. Salve as configurações

### Erro: "Não foi possível conectar"

**Solução:**
1. Verifique se o token está correto
2. Teste a conexão na aba "Configuração"
3. Verifique se a URL Base está correta

### Sincronização muito lenta

**Normal:** A sincronização completa pode levar 30-60 minutos para 30.000 produtos devido ao rate limiting (10 segundos entre páginas).

### Produtos não aparecem

**Verifique:**
1. Se o mapeamento está configurado corretamente
2. Se o campo `referencia` está mapeado (obrigatório)
3. Os logs na aba "Logs" para erros

---

## 📚 Endpoints da API

### Backend (NestJS)

```
GET  /bravo-erp/config          - Buscar configuração
POST /bravo-erp/config          - Salvar configuração
POST /bravo-erp/config/test     - Testar conexão

GET  /bravo-erp/mapeamento      - Listar mapeamentos
POST /bravo-erp/mapeamento      - Salvar mapeamentos

POST /bravo-erp/sync/sincronizar - Iniciar sincronização
GET  /bravo-erp/sync/status      - Status geral
GET  /bravo-erp/sync/progress    - Progresso em tempo real
POST /bravo-erp/sync/cancel      - Cancelar sincronização
GET  /bravo-erp/sync/logs        - Listar logs
POST /bravo-erp/sync/resume      - Retomar sincronização

GET  /bravo-erp/stats            - Estatísticas
```

---

## 💡 Dicas

1. **Primeira Sincronização:** Use "Sincronização Completa" para importar tudo
2. **Sincronizações Posteriores:** O sistema usa filtro incremental automaticamente
3. **Mapeamento:** Use o mapeamento padrão como base e personalize conforme necessário
4. **Monitoramento:** Acompanhe os logs regularmente para identificar problemas
5. **Retomada:** Não se preocupe se uma sincronização for interrompida - você pode retomar depois

---

## 📞 Suporte

Para problemas ou dúvidas:
1. Verifique os logs na aba "Logs"
2. Verifique o console do navegador (F12)
3. Verifique os logs do backend
4. Consulte a documentação técnica

---

**Última Atualização:** 2025-01-22
