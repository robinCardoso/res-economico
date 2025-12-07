# Correção de Erro de Conexão - Conflito de URLs

## Problema Identificado

O frontend está tentando conectar em `http://192.168.0.107:3000`, mas há um conflito de configuração:

- **Variável de ambiente (`NEXT_PUBLIC_API_URL`)**: `http://192.168.0.107:3000`
- **localStorage**: `http://10.1.1.37:3000`
- **Backend pode não estar acessível** na URL configurada

## Solução Rápida

### Opção 1: Limpar localStorage e usar variável de ambiente

1. Abra o console do navegador (F12)
2. Execute:
   ```javascript
   localStorage.removeItem('api-url')
   ```
3. Recarregue a página

### Opção 2: Atualizar variável de ambiente para a URL correta

1. Verifique qual IP o backend está realmente usando
2. Edite o arquivo `frontend/.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://10.1.1.37:3000
   ```
   (ou use o IP correto do seu backend)

3. Reinicie o servidor frontend

### Opção 3: Configurar via localStorage (temporário)

1. Abra o console do navegador (F12)
2. Execute:
   ```javascript
   localStorage.setItem('api-url', 'http://10.1.1.37:3000')
   ```
   (substitua pelo IP correto do seu backend)

3. Recarregue a página

## Verificação

1. Abra o console do navegador
2. Verifique os logs de inicialização:
   - `[HTTP] baseURL inicial: ...`
   - `[HTTP] NEXT_PUBLIC_API_URL: ...`
   - `[HTTP] localStorage api-url: ...`

3. Se ainda houver erro, verifique:
   - Backend está rodando?
   - Backend está escutando em `0.0.0.0:3000` (não apenas localhost)?
   - Firewall permite conexão na porta 3000?

## Como Descobrir o IP Correto

No servidor onde o backend está rodando, execute:

```powershell
# Windows PowerShell
ipconfig

# Ou use este comando para ver todos os IPs
Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -notlike "127.*"} | Select-Object IPAddress
```

Use o IP que aparece na sua rede local (geralmente começa com `10.1.x.x`, `192.168.x.x` ou `172.x.x.x`).

## Prevenção

Sempre use a mesma URL em:
- `frontend/.env.local` (variável `NEXT_PUBLIC_API_URL`)
- localStorage (se usado)
- Backend deve estar acessível nessa URL
