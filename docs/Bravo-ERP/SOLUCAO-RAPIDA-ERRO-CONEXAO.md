# Solução Rápida - Erro de Conexão

## Problema

O frontend está tentando conectar em `http://192.168.0.107:3000`, mas há conflito de configuração:

- **Variável de ambiente**: `http://192.168.0.107:3000`
- **localStorage**: `http://10.1.1.37:3000`
- **Backend pode não estar acessível** na URL configurada

## Solução Imediata

### Passo 1: Verificar se o backend está rodando

No servidor onde o backend está rodando, verifique:
```powershell
# Ver se o backend está rodando
netstat -ano | findstr :3000
```

### Passo 2: Limpar conflito de configuração

Abra o console do navegador (F12) e execute:

```javascript
// Limpar localStorage para usar apenas variável de ambiente
localStorage.removeItem('api-url')

// Recarregar página
location.reload()
```

### Passo 3: Verificar qual IP usar

No servidor do backend, execute:
```powershell
ipconfig
```

Use o IP que aparece na sua rede (geralmente `10.1.x.x` ou `192.168.x.x`).

### Passo 4: Configurar URL correta

Edite o arquivo `frontend/.env.local` e defina:

```env
NEXT_PUBLIC_API_URL=http://10.1.1.37:3000
```

(Substitua `10.1.1.37` pelo IP correto do seu servidor)

### Passo 5: Reiniciar frontend

Após alterar `.env.local`, reinicie o servidor frontend.

## Verificação

1. Abra o console do navegador (F12)
2. Verifique os logs:
   - `[HTTP] baseURL inicial: http://10.1.1.37:3000`
   - `[HTTP] NEXT_PUBLIC_API_URL: http://10.1.1.37:3000`
   - `[HTTP] localStorage api-url: null` (ou não deve aparecer)

3. Se ainda houver erro:
   - Verifique se o backend está realmente rodando
   - Verifique se o backend está escutando em `0.0.0.0:3000` (não apenas localhost)
   - Teste abrir `http://SEU_IP:3000/health` no navegador

## Checklist

- [ ] Backend está rodando
- [ ] Backend está escutando em `0.0.0.0:3000`
- [ ] localStorage limpo (sem `api-url`)
- [ ] `.env.local` configurado com IP correto
- [ ] Frontend reiniciado após alterar `.env.local`
- [ ] Firewall permite conexão na porta 3000

## Problema Persistente?

Se o erro persistir, verifique:

1. **Firewall**: O firewall pode estar bloqueando a porta 3000
   ```powershell
   # Permitir porta 3000 no firewall
   New-NetFirewallRule -DisplayName "Backend API" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
   ```

2. **IP incorreto**: Use o IP que aparece quando você acessa o servidor
   - Se você acessa o frontend em `http://10.1.1.37:3001`, use `http://10.1.1.37:3000` para o backend

3. **Backend não está acessível**: O backend pode estar escutando apenas em localhost
   - Verifique o arquivo `backend/src/main.ts` - deve ter `app.listen(port, '0.0.0.0')`
