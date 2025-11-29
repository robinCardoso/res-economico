# 🔧 Correção de Encoding - Status e Próximos Passos

## 📋 Problema Identificado

Quando renomeamos o banco de dados de `res-economico` para `painel-rede-uniao`, os dados foram corrompidos durante a migração. Caracteres acentuados foram perdidos ou corrompidos, aparecendo como `??` (ex: "Exerc??cio" em vez de "Exercício").

## ✅ Correções Já Aplicadas

### 1. Função `normalizeString` Corrigida
- **Arquivo**: `backend/src/uploads/excel-processor.service.ts`
- **Problema**: A função estava tentando corrigir encoding de forma incorreta, convertendo de latin1 para utf8 quando os dados já estavam em UTF-8
- **Solução**: Removida a conversão de encoding. A função agora apenas faz `trim()`, preservando os caracteres UTF-8 corretamente
- **Status**: ✅ **CORRIGIDO** - Novos uploads serão salvos corretamente

### 2. Query do Dashboard Corrigida
- **Arquivo**: `backend/src/uploads/uploads.service.ts`
- **Problema**: A query não encontrava linhas com conta 745 devido a caracteres especiais no nome
- **Solução**: Adicionados múltiplos padrões de busca (OR) para encontrar variações do nome
- **Status**: ✅ **CORRIGIDO**

### 3. Script de Correção Executado
- **Arquivo**: `backend/scripts/corrigir-encoding-dados.ts`
- **Resultado**: 
  - 341 linhas corrigidas
  - 3871 linhas ainda com problemas
  - 103 contas do catálogo corrigidas
- **Status**: ⚠️ **PARCIAL** - Muitos dados ainda corrompidos

## ⚠️ Situação Atual

- **Dados corrompidos**: ~3871 linhas ainda têm problemas de encoding
- **Causa**: Dados foram corrompidos durante a renomeação do banco
- **Caracteres perdidos**: `??` indica perda completa de dados (não pode ser recuperado automaticamente)

## 📂 Backups Disponíveis

1. `backup_antes_renomeacao_20251128_144625.sql` (14:46:25)
   - Backup criado ANTES da renomeação
   - Deve conter os dados corretos
   - Tamanho: ~7MB

2. `backup_antes_recriar_20251128_175807.sql` (17:58:07)
   - Backup criado antes de recriar o volume
   - Pode conter dados já corrompidos

## 🔄 Próximos Passos (Quando Retornar)

### Opção 1: Restaurar Dados do Backup (Recomendado)

1. **Verificar formato do backup**:
   ```powershell
   # Verificar se o backup tem dados de LinhaUpload
   Select-String -Path "backup_antes_renomeacao_20251128_144625.sql" -Pattern "LinhaUpload" | Select-Object -First 5
   ```

2. **Se o backup tiver os dados corretos**:
   - Criar script para extrair apenas `nomeConta` e `classificacao` do backup
   - Atualizar apenas os registros corrompidos no banco atual
   - Manter todos os outros dados (incluindo Processos criados depois)

3. **Executar restauração**:
   ```powershell
   cd backend
   npx ts-node scripts/restaurar-dados-encoding.ts
   ```

### Opção 2: Reprocessar Uploads Afetados

1. **Identificar uploads com dados corrompidos**:
   ```sql
   SELECT DISTINCT u.id, u."nomeArquivo", u.ano, u.mes, u."empresaId"
   FROM "Upload" u
   INNER JOIN "LinhaUpload" l ON l."uploadId" = u.id
   WHERE l."nomeConta" LIKE '%??%' OR l."classificacao" LIKE '%??%'
   ORDER BY u."createdAt" DESC;
   ```

2. **Reprocessar cada upload**:
   - Usar o botão "Reprocessar" na página de uploads
   - OU criar script para reprocessar em lote

### Opção 3: Fazer Upload Novamente

- Fazer upload novamente dos arquivos Excel originais
- Com a função `normalizeString` corrigida, os dados serão salvos corretamente

## 📝 Arquivos Modificados

1. ✅ `backend/src/uploads/excel-processor.service.ts`
   - Função `normalizeString` corrigida (2 ocorrências)

2. ✅ `backend/src/uploads/uploads.service.ts`
   - Query `getConta745` melhorada para encontrar variações

3. ✅ `backend/scripts/corrigir-encoding-dados.ts`
   - Script criado e executado (correção parcial)

4. ⚠️ `backend/scripts/restaurar-dados-encoding.ts`
   - Script criado mas não funcionou (backup pode ter formato diferente)

## 🎯 Recomendação

**Melhor abordagem**: Verificar o formato do backup e criar um script que:
1. Extrai dados corretos do backup SQL
2. Atualiza apenas os campos corrompidos (`nomeConta`, `classificacao`)
3. Mantém todos os outros dados intactos (incluindo Processos)

Se o backup não tiver os dados no formato esperado, a melhor opção é **reprocessar os uploads** usando o botão "Reprocessar" na interface, pois:
- Os arquivos Excel originais devem estar disponíveis
- A função `normalizeString` já está corrigida
- Será mais rápido que fazer upload novamente

## ✅ Garantias

- ✅ **Novos uploads**: Serão salvos corretamente (função corrigida)
- ✅ **Backend**: Compilando sem erros
- ✅ **Dashboard**: Query corrigida para encontrar conta 745
- ⚠️ **Dados antigos**: Ainda precisam ser corrigidos

## 📞 Quando Retornar

1. Verificar formato do backup SQL
2. Decidir entre restaurar do backup ou reprocessar uploads
3. Executar a correção escolhida
4. Validar que os dados estão corretos

---

**Última atualização**: 28/11/2025 18:30
**Status**: ⚠️ Aguardando correção dos dados antigos

