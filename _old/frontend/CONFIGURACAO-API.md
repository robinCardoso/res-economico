# Configuração da URL da API

Para que o frontend se conecte automaticamente ao backend, você precisa configurar a variável de ambiente `NEXT_PUBLIC_API_URL`.

## ⚠️ Problema Comum

Se você está vendo erros de conexão como:
```
[HTTP] Erro de conexão: Não foi possível conectar ao servidor
[HTTP] URL atual configurada: http://localhost:3000
```

Isso significa que o frontend está tentando conectar em `localhost`, mas o backend está rodando em outro IP (ex: `10.1.1.37:3000`).

## ✅ Solução: Criar arquivo `.env.local` (Recomendado)

1. **Crie um arquivo `.env.local` na pasta `frontend/`**

2. **Adicione o seguinte conteúdo:**

   Se o backend está rodando em outro IP na rede:
   ```env
   NEXT_PUBLIC_API_URL=http://10.1.1.37:3000
   ```
   *(Substitua `10.1.1.37` pelo IP que aparece quando você inicia o backend)*

   Se frontend e backend estão na mesma máquina:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3000
   ```

3. **Reinicie o servidor do Next.js** (pare com Ctrl+C e inicie novamente com `npm run dev`)

## Opção 2: Configurar via localStorage (Temporário)

Se você não quiser criar o arquivo `.env.local`, pode configurar diretamente no navegador:

1. Abra o console do navegador (F12)
2. Execute o comando:
```javascript
localStorage.setItem('api-url', 'http://10.1.1.37:3000')
```
3. Recarregue a página

## Nota

- O arquivo `.env.local` não é versionado (está no `.gitignore`)
- Após criar ou modificar o `.env.local`, você precisa reiniciar o servidor de desenvolvimento do Next.js
- O frontend tentará automaticamente fazer fallback para `localhost:3000` se a URL configurada falhar

