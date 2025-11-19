# Guia de Acesso à Rede Local

Este documento explica como acessar o sistema Resultado Econômico de outros computadores na mesma rede.

## Configuração Atual

- **IP do servidor:** `10.1.1.37`
- **Frontend:** Porta `3001` (acessível em `http://10.1.1.37:3001`)
- **Backend:** Porta `3000` (acessível em `http://10.1.1.37:3000`)
- **Rede:** Todos os computadores estão na mesma rede local (10.1.x.x)

## Como Acessar de Outro Computador

### Opção 1: Acesso Direto (Recomendado)

1. **No computador que vai acessar**, abra o navegador
2. Digite na barra de endereços:
   ```
   http://10.1.1.37:3001
   ```
3. O sistema deve carregar normalmente

### Opção 2: Configurar Variável de Ambiente (Opcional)

Se você quiser que o outro computador também tenha acesso completo (para desenvolvimento), pode criar um arquivo `.env.local` no frontend apontando para o IP do servidor:

```env
NEXT_PUBLIC_API_URL=http://10.1.1.37:3000
```

**Nota:** Isso só é necessário se você quiser rodar o frontend em outro computador. Para apenas acessar o sistema já rodando, use a Opção 1.

## Verificações Necessárias

### 1. Firewall do Windows

O firewall pode estar bloqueando as portas 3000 e 3001. Para permitir:

**Opção A: Usar o script automático (Recomendado)**

No computador servidor, execute como Administrador:

```powershell
.\configurar-firewall.ps1
```

O script irá:
- Criar regras de firewall automaticamente
- Detectar o IP da rede local
- Mostrar as URLs para acesso

**Opção B: Configuração Manual**

**No computador servidor (10.1.1.37):**

1. Abra o **Firewall do Windows Defender**
2. Clique em **Configurações Avançadas**
3. Clique em **Regras de Entrada** → **Nova Regra**
4. Selecione **Porta** → **Próximo**
5. Selecione **TCP** e **Portas específicas locais**: `3000,3001`
6. Selecione **Permitir a conexão** → **Próximo**
7. Marque todos os perfis (Domínio, Privado, Público) → **Próximo**
8. Dê um nome: "ResEco - Backend e Frontend" → **Concluir**

**Opção C: Via PowerShell (como Administrador):**

```powershell
New-NetFirewallRule -DisplayName "ResEco Backend" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "ResEco Frontend" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
```

### 2. Verificar se os Serviços Estão Rodando

**No computador servidor**, verifique se ambos estão rodando:

- Backend: `http://localhost:3000` deve retornar "Hello World!"
- Frontend: `http://localhost:3001` deve abrir a página de login

### 3. Testar Conectividade

**No outro computador**, teste se consegue acessar:

```powershell
# Testar backend
Test-NetConnection -ComputerName 10.1.1.37 -Port 3000

# Testar frontend
Test-NetConnection -ComputerName 10.1.1.37 -Port 3001
```

Se ambos retornarem `TcpTestSucceeded : True`, a conexão está funcionando.

## Troubleshooting

### Erro: "Não foi possível conectar"

1. Verifique se o firewall está permitindo as portas
2. Verifique se o backend e frontend estão rodando no servidor
3. Verifique se o IP está correto (`10.1.1.37`)
4. Tente pingar o servidor: `ping 10.1.1.37`

### Erro de CORS

O CORS já está configurado para aceitar IPs `10.1.x.x`. Se ainda houver erro:
- Verifique se está acessando via `http://` (não `https://`)
- Verifique se a porta está correta (`:3001` para frontend)

### O sistema carrega mas não faz login

Verifique se o `.env.local` no servidor está configurado corretamente:
```env
NEXT_PUBLIC_API_URL=http://10.1.1.37:3000
```

## Configuração Atual do Sistema

- ✅ Backend escuta em `0.0.0.0:3000` (todas as interfaces)
- ✅ Frontend escuta em `0.0.0.0:3001` (todas as interfaces)
- ✅ CORS permite IPs `10.1.x.x:3001` e `10.1.x.x:3000`
- ✅ Sistema pronto para acesso em rede local

## Próximos Passos

Após configurar o firewall, qualquer computador na rede `10.1.x.x` poderá acessar o sistema em:
```
http://10.1.1.37:3001
```

