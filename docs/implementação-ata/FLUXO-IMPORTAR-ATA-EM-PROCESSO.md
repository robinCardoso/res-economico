# 📋 Fluxo para Importar Ata "Em Processo"

## 🎯 Objetivo
Importar uma ata que já está em processo de andamento, com histórico, prazos e ações pendentes.

## 📍 Localização
**Rota:** `/admin/atas/importar`

## 🔄 Fluxo Completo

### 1️⃣ **Acessar a Página de Importação**
- Navegue para `/admin/atas`
- Clique no botão **"Importar Ata"** ou acesse diretamente `/admin/atas/importar`

### 2️⃣ **Selecionar Tipo de Importação**
- No campo **"Tipo de Importação"**, selecione:
  - ✅ **"Em Processo - Ata em andamento com prazos e histórico"**

### 3️⃣ **Preencher Dados Obrigatórios**
- **Data da Reunião** * (obrigatório)
  - Selecione a data em que a reunião ocorreu
  
- **Tipo de Reunião** * (obrigatório)
  - Assembleia Geral
  - Conselho Diretor
  - Reunião Ordinária
  - Reunião Extraordinária
  - Comissão
  - Outro

### 4️⃣ **Selecionar Arquivo**
- **Formatos aceitos:** TXT ou PDF
- Você pode:
  - Clicar na área de upload
  - Arrastar e soltar o arquivo

### 5️⃣ **Importar**
- Clique no botão **"Importar Arquivo"**
- O sistema irá:
  1. Processar o arquivo
  2. Extrair o conteúdo
  3. Criar a ata com status `EM_PROCESSO`
  4. Redirecionar para `/admin/atas/[id]/processo`

## 📄 O que acontece no Backend?

### Endpoint: `POST /atas/importar/em-processo`

1. **Processa o arquivo** (similar ao importar normal)
   - Extrai o conteúdo do TXT ou PDF
   - Cria a ata inicial

2. **Atualiza o status**
   - Define `status = EM_PROCESSO`
   - Marca `pendenteAssinatura = true` (se não informar data de assinatura)

3. **Retorna a ata criada**
   - Com todos os dados básicos
   - Pronta para adicionar histórico e prazos

## 🎯 Após a Importação

Após importar, você será redirecionado para:
**`/admin/atas/[id]/processo`**

Nesta página você pode:

### ✅ Adicionar Histórico de Andamento
- Registrar eventos importantes
- Adicionar ações realizadas
- Documentar progresso

### ⏰ Gerenciar Prazos
- Criar prazos de ações
- Definir datas de conclusão
- Acompanhar status (Pendente, Em Andamento, Concluído, Vencido)

### 📊 Visualizar Timeline
- Ver todo o histórico em ordem cronológica
- Acompanhar o progresso da ata

## 🔍 Diferenças entre os Tipos

| Tipo | Quando Usar | Processamento IA | Histórico | Prazos |
|------|-------------|------------------|-----------|--------|
| **Finalizada** | Ata já concluída e registrada | ❌ Não | ❌ Não | ❌ Não |
| **Rascunho** | Precisa transcrever do PDF | ✅ Sim | ❌ Não | ❌ Não |
| **Em Processo** | Ata em andamento | ❌ Não | ✅ Sim | ✅ Sim |

## ⚠️ Observações Importantes

1. **Tipo de Reunião é obrigatório** para "Em Processo"
2. **Arquivo pode ser TXT ou PDF** (não apenas PDF como em Rascunho)
3. **Não há processamento com IA** - o conteúdo é importado diretamente
4. **Após importar**, você deve adicionar manualmente:
   - Histórico de andamento
   - Prazos de ações
   - Observações

## 📝 Exemplo de Uso

```
1. Usuário acessa /admin/atas/importar
2. Seleciona "Em Processo"
3. Preenche:
   - Data: 01/12/2025
   - Tipo: Assembleia Geral
4. Faz upload do arquivo "ata-assembleia-01-12.txt"
5. Clica em "Importar Arquivo"
6. Sistema redireciona para /admin/atas/[id]/processo
7. Usuário adiciona:
   - Histórico: "Ata aprovada em primeira leitura"
   - Prazo: "Enviar para assinatura até 05/12/2025"
```

## 🚀 Próximos Passos

Após importar uma ata "Em Processo", você pode:
- Adicionar histórico de andamento
- Criar prazos de ações
- Acompanhar o progresso
- Receber lembretes automáticos de prazos
- Finalizar a ata quando concluída

