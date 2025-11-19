# 🌐 Como Acessar o Sistema de Outros Computadores

## Passo a Passo Rápido

### 1. No Computador Servidor (10.1.1.37)

Execute o script para configurar o firewall:

```powershell
# Execute como Administrador
.\configurar-firewall.ps1
```

Ou configure manualmente o firewall para permitir as portas 3000 e 3001.

### 2. Certifique-se de que os Serviços Estão Rodando

Execute o script de inicialização:

```powershell
.\start.ps1
```

Isso iniciará:
- ✅ Docker (PostgreSQL + Redis)
- ✅ Backend na porta 3000
- ✅ Frontend na porta 3001

### 3. No Outro Computador

Abra o navegador e acesse:

```
http://10.1.1.37:3001
```

Pronto! O sistema deve carregar normalmente.

## Verificação Rápida

**No outro computador**, teste a conectividade:

```powershell
# Testar se consegue acessar o servidor
ping 10.1.1.37

# Testar se as portas estão abertas
Test-NetConnection -ComputerName 10.1.1.37 -Port 3001
Test-NetConnection -ComputerName 10.1.1.37 -Port 3000
```

Se ambos retornarem `TcpTestSucceeded : True`, está tudo configurado!

## Problemas Comuns

### ❌ "Não foi possível conectar"

1. Verifique se o firewall está configurado (execute `.\configurar-firewall.ps1`)
2. Verifique se backend e frontend estão rodando no servidor
3. Verifique se o IP está correto (`10.1.1.37`)

### ❌ "Erro de CORS"

- Certifique-se de acessar via `http://` (não `https://`)
- Use a porta correta: `:3001` para o frontend

### ❌ Sistema carrega mas não faz login

Verifique se o `.env.local` no servidor está configurado:
```env
NEXT_PUBLIC_API_URL=http://10.1.1.37:3000
```

## Documentação Completa

Para mais detalhes, consulte: [`docs/acesso-rede-local.md`](docs/acesso-rede-local.md)

