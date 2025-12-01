# Configuração de Rede para Acesso Compartilhado

## Problema
Quando você está em uma rede compartilhada e outras pessoas precisam acessar o sistema, o backend precisa estar configurado para escutar em todas as interfaces de rede, não apenas em `localhost`.

## ✅ Solução

### 1. Backend já está configurado corretamente
O arquivo `backend/src/main.ts` já está configurado para escutar em `0.0.0.0`, o que permite acesso de outras máquinas na rede:

```typescript
await app.listen(port, '0.0.0.0'); // Escutar em todas as interfaces de rede
```

### 2. Configurar o Frontend

Crie ou edite o arquivo `frontend/.env.local` e adicione:

```env
NEXT_PUBLIC_API_URL=http://10.1.1.37:3000
```

**Importante:** Substitua `10.1.1.37` pelo IP da máquina onde o backend está rodando.

### 3. Verificar se o Backend está acessível

#### No Windows:
1. Abra o PowerShell ou CMD
2. Execute: `ipconfig`
3. Procure pelo IP na seção "Adaptador Ethernet" ou "Adaptador Wi-Fi"
4. O IP deve estar no formato `10.1.x.x`

#### Verificar se o backend está escutando corretamente:
Quando você iniciar o backend, você deve ver mensagens como:
```
🚀 Backend rodando em http://localhost:3000
🌐 Acessível na rede local: http://10.1.1.37:3000
📱 Outros computadores na rede podem acessar em: http://10.1.1.37:3001
```

### 4. Verificar Firewall

O Windows Firewall pode estar bloqueando a porta 3000. Para permitir:

1. Abra "Firewall do Windows Defender"
2. Clique em "Configurações avançadas"
3. Clique em "Regras de Entrada" → "Nova Regra"
4. Selecione "Porta" → "TCP" → "Portas específicas" → Digite `3000`
5. Selecione "Permitir a conexão"
6. Aplique para todos os perfis
7. Dê um nome como "Backend API - Porta 3000"

### 5. Testar Conectividade

De outra máquina na mesma rede, teste se consegue acessar:
```bash
# No navegador ou via curl
http://10.1.1.37:3000/health
# ou
curl http://10.1.1.37:3000/health
```

Se retornar uma resposta (mesmo que seja erro 404), significa que o backend está acessível.

### 6. Reiniciar o Frontend

Após configurar o `.env.local`:
1. Pare o servidor Next.js (Ctrl+C)
2. Reinicie com `npm run dev` ou `yarn dev`
3. O Next.js precisa ser reiniciado para carregar variáveis de ambiente

## ⚠️ Problemas Comuns

### Backend não responde na rede
- Verifique se está rodando: `netstat -an | findstr :3000`
- Verifique se está escutando em 0.0.0.0 (já está configurado)
- Verifique firewall

### Frontend não encontra o backend
- Verifique se `NEXT_PUBLIC_API_URL` está correto no `.env.local`
- Reinicie o servidor Next.js após alterar `.env.local`
- Verifique o console do navegador para ver qual URL está sendo usada

### Outras pessoas não conseguem acessar
- Verifique se estão na mesma rede (mesmo Wi-Fi ou mesma rede local)
- Verifique se o IP está correto (pode mudar se usar DHCP)
- Considere usar um IP estático para o servidor

## 📝 Nota Importante

**NÃO use `localhost:3000`** no `.env.local` quando outras pessoas precisam acessar, pois `localhost` sempre aponta para a própria máquina. Use o IP da rede (`10.1.1.37:3000` ou o IP correto da sua máquina).

