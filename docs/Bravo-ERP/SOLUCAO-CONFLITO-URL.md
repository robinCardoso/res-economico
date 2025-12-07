# Solução para Conflito de URL - Erro de Conexão

## Problema

O frontend está tentando conectar em `http://192.168.0.107:3000`, mas há conflito:
- **Variável de ambiente**: `http://192.168.0.107:3000` (sendo usada)
- **localStorage**: `http://10.1.1.37:3000` (ignorado, mas causando confusão)
- **Backend pode não estar acessível** na URL `192.168.0.107:3000`

## Soluções

### ✅ Solução 1: Limpar localStorage (Rápida)

1. Abra o console do navegador (F12)
2. Execute:
   ```javascript
   localStorage.removeItem('api-url')
   location.reload()
   ```
3. Isso remove o conflito e usa apenas a variável de ambiente

### ✅ Solução 2: Corrigir variável de ambiente (Recomendada)

1. Descubra o IP correto do seu backend:
   ```powershell
   # No servidor do backend
   ipconfig
   ```

2. Edite o arquivo `frontend/.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://10.1.1.37:3000
   ```
   (Substitua pelo IP correto)

3. Reinicie o servidor frontend

### ✅ Solução 3: Usar localStorage (Temporária)

1. Abra o console do navegador (F12)
2. Execute:
   ```javascript
   localStorage.setItem('api-url', 'http://10.1.1.37:3000')
   location.reload()
   ```
   (Substitua pelo IP correto do seu backend)

## Verificações Importantes

1. **Backend está rodando?**
   - Verifique se o processo está ativo
   - Teste: `http://SEU_IP:3000` no navegador

2. **Backend está acessível na rede?**
   - Deve estar escutando em `0.0.0.0:3000` (não apenas localhost)
   - Verifique o arquivo `backend/src/main.ts`

3. **Firewall está permitindo conexão?**
   - Porta 3000 deve estar aberta
   - Teste: `Test-NetConnection -ComputerName SEU_IP -Port 3000`

## Ordem de Prioridade das URLs

O sistema usa URLs nesta ordem:
1. **Variável de ambiente** (`NEXT_PUBLIC_API_URL`) - **TEM PRIORIDADE**
2. localStorage (`api-url`) - se não houver variável de ambiente
3. Fallback: `http://localhost:3000`

## Checklist de Correção

- [ ] Verificar se backend está rodando
- [ ] Limpar localStorage: `localStorage.removeItem('api-url')`
- [ ] Corrigir `frontend/.env.local` com IP correto
- [ ] Reiniciar servidor frontend
- [ ] Verificar logs no console do navegador
- [ ] Testar conexão
