# 🌐 Configuração para Rede Compartilhada

## 📋 Situação Atual

Você está conectado em **duas redes**:
- **172.22.224.1** - Rede compartilhada (VPN/Compartilhada)
- **10.1.1.37** - Outra rede local

## ⚠️ Problema

Se você configurou `NEXT_PUBLIC_API_URL=http://localhost:3000` no frontend, isso **só funciona na própria máquina**. Outros computadores na rede compartilhada não conseguem acessar usando `localhost`.

## ✅ Solução

### Passo 1: Identificar qual rede você está usando

Execute no terminal:
```powershell
ipconfig | findstr /i "IPv4"
```

Você verá algo como:
```
Endereço IPv4. . . . . . . .  . . . . . . . : 172.22.224.1
Endereço IPv4. . . . . . . .  . . . . . . . : 10.1.1.37
```

### Passo 2: Verificar qual IP o backend detectou

Quando você inicia o backend, ele mostra qual IP detectou:
```
🚀 Backend rodando em http://localhost:3000
🌐 Acessível na rede local: http://172.22.224.1:3000
📱 Outros computadores na rede podem acessar em: http://172.22.224.1:3001
💡 Configure NEXT_PUBLIC_API_URL=http://172.22.224.1:3000 no arquivo frontend/.env.local
```

**Use o IP que aparece na mensagem do backend!**

### Passo 3: Configurar o Frontend

1. **Crie ou edite o arquivo `frontend/.env.local`**

2. **Adicione a linha com o IP correto:**

   **Se você está na rede compartilhada (172.22.224.1):**
   ```env
   NEXT_PUBLIC_API_URL=http://172.22.224.1:3000
   ```

   **Se você está na outra rede (10.1.1.37):**
   ```env
   NEXT_PUBLIC_API_URL=http://10.1.1.37:3000
   ```

3. **Reinicie o servidor do frontend:**
   ```powershell
   # Pare o servidor (Ctrl+C)
   # Depois inicie novamente
   cd frontend
   npm run dev
   ```

### Passo 4: Verificar se funcionou

1. Abra o console do navegador (F12)
2. Procure por mensagens como:
   ```
   [HTTP] baseURL inicial: http://172.22.224.1:3000
   ```
3. Se aparecer `localhost:3000`, a configuração não foi aplicada - reinicie o servidor

## 🔄 Mudando de Rede

Se você mudar de rede (ex: desconectar da VPN e conectar em outra rede):

1. **Verifique o novo IP:**
   ```powershell
   ipconfig | findstr /i "IPv4"
   ```

2. **Atualize o `.env.local`** com o novo IP

3. **Reinicie o backend e frontend**

## 📝 Notas Importantes

- ✅ O arquivo `.env.local` não é versionado (está no `.gitignore`)
- ✅ Cada desenvolvedor pode ter seu próprio `.env.local` com o IP da sua rede
- ✅ O backend detecta automaticamente o IP e mostra na mensagem de inicialização
- ⚠️ **NÃO use `localhost`** quando outras pessoas precisam acessar pela rede
- ⚠️ Se você mudar de rede, precisa atualizar o `.env.local`

## 🎯 Exemplo Completo

**Cenário:** Você está na rede compartilhada (172.22.224.1)

1. Backend inicia e mostra: `🌐 Acessível na rede local: http://172.22.224.1:3000`

2. Crie `frontend/.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://172.22.224.1:3000
   ```

3. Reinicie o frontend

4. Agora outros computadores na rede podem acessar:
   - Frontend: `http://172.22.224.1:3001`
   - Backend: `http://172.22.224.1:3000`

## 🐛 Troubleshooting

### Problema: "Não foi possível conectar ao servidor"

**Solução:**
1. Verifique se o backend está rodando
2. Verifique se o IP no `.env.local` está correto
3. Verifique se você está na mesma rede
4. Teste acessar diretamente: `http://SEU_IP:3000` no navegador

### Problema: Backend detecta IP errado

O backend agora mostra **todos os IPs detectados**. Use o IP que corresponde à rede que você quer usar.

Se o IP principal não for o correto, você pode:
1. Desconectar da outra rede (se possível)
2. Ou usar manualmente o IP correto no `.env.local`

