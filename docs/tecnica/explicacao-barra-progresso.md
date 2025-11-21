# Explicação: Barra de Progresso do Upload

## Quando a Barra de Progresso Aparece?

A barra de progresso **só aparece na página de detalhes do upload** (`/uploads/[id]`), e **apenas quando o upload está com status `PROCESSANDO`**.

### Fluxo Completo:

1. **Usuário cria upload** (`/uploads/novo`)
   - Seleciona arquivo, empresa, mês, ano
   - Clica em "Enviar arquivo"
   - O arquivo é enviado ao backend

2. **Backend recebe o arquivo**
   - Cria registro no banco com status `PROCESSANDO`
   - Adiciona job na fila BullMQ para processamento assíncrono
   - Retorna o upload criado para o frontend

3. **Frontend redireciona automaticamente**
   - Após criar o upload, o usuário é **redirecionado para `/uploads/[id]`**
   - Esta é a página onde a barra de progresso aparece

4. **Barra de progresso aparece**
   - **Condição**: `upload.status === 'PROCESSANDO'`
   - **Localização**: Página de detalhes (`/uploads/[id]`)
   - **Atualização**: A cada 2 segundos enquanto processando
   - **Para automaticamente**: Quando progresso chega a 100% ou status muda

5. **Etapas do processamento** (mostradas na barra):
   - 10-20%: Lendo arquivo Excel
   - 20-50%: Processando e validando linhas
   - 50-70%: Criando registros no banco
   - 70-80%: Atualizando catálogo de contas
   - 80-95%: Detectando alertas
   - 95-100%: Finalizando processamento

## Por que não aparece na lista de uploads?

A página de lista (`/uploads`) mostra apenas o **status** do upload (Processando, Concluído, Com alertas), mas não a barra de progresso detalhada. Isso porque:

- A lista pode ter muitos uploads
- A barra de progresso ocuparia muito espaço
- O progresso detalhado é mais útil na página de detalhes

## Atualização Automática

### Página de Lista (`/uploads`):
- Atualiza automaticamente a cada 5 segundos **se houver uploads processando**
- Quando não há uploads processando, não atualiza automaticamente (economiza recursos)

### Página de Detalhes (`/uploads/[id]`):
- Atualiza automaticamente a cada 3 segundos **se o upload estiver processando**
- A barra de progresso atualiza a cada 2 segundos
- Para automaticamente quando o processamento termina

## Solução para o Problema Reportado

**Problema**: Após criar upload, a lista não mostrava o novo upload sem dar F5.

**Solução implementada**:
1. Após criar upload, a query `['uploads']` é invalidada
2. O usuário é redirecionado para a página de detalhes (`/uploads/[id]`)
3. Na página de detalhes, o usuário vê a barra de progresso em tempo real
4. Se o usuário voltar para a lista, ela já estará atualizada (devido à invalidação)

## Como Testar

1. Crie um novo upload em `/uploads/novo`
2. Após enviar, você será redirecionado para `/uploads/[id]`
3. A barra de progresso aparecerá automaticamente
4. Você verá o progresso atualizando em tempo real
5. Quando terminar, o status mudará para "Concluído" ou "Com alertas"

