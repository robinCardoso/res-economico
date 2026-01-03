# Script para iniciar o ambiente de desenvolvimento com Supabase Cloud
# Backend NestJS e Frontend Next.js (conectando ao Supabase Cloud em vez de PostgreSQL local)

Write-Host "Iniciando ambiente de desenvolvimento com Supabase Cloud..." -ForegroundColor Cyan

# Verificar se as variáveis de ambiente do Supabase estão configuradas
Write-Host "`nVerificando variaveis de ambiente do Supabase..." -ForegroundColor Yellow

$supabaseUrl = $env:SUPABASE_URL
$supabaseAnonKey = $env:SUPABASE_ANON_KEY

if (-not $supabaseUrl) {
    Write-Host "AVISO: SUPABASE_URL nao esta definida no ambiente. Verifique seu .env" -ForegroundColor Yellow
    # Tenta ler do arquivo .env
    if (Test-Path ".env") {
        $envContent = Get-Content ".env"
        $supabaseUrl = ($envContent | Select-String "SUPABASE_URL=").ToString().Split('=')[1]
    }
}

if (-not $supabaseAnonKey) {
    Write-Host "AVISO: SUPABASE_ANON_KEY nao esta definida no ambiente. Verifique seu .env" -ForegroundColor Yellow
    # Tenta ler do arquivo .env
    if (Test-Path ".env") {
        $envContent = Get-Content ".env"
        $supabaseAnonKey = ($envContent | Select-String "SUPABASE_ANON_KEY=").ToString().Split('=')[1]
    }
}

if ($supabaseUrl -and $supabaseAnonKey) {
    Write-Host "OK: Variaveis de ambiente do Supabase configuradas" -ForegroundColor Green
} else {
    Write-Host "AVISO: Variaveis de ambiente do Supabase nao encontradas. O sistema pode nao funcionar corretamente." -ForegroundColor Red
}

# Verificar e encerrar processos nas portas 3000 e 3001
Write-Host "`nVerificando portas 3000 e 3001..." -ForegroundColor Yellow
foreach ($port in @(3000, 3001)) {
    $connections = netstat -ano | findstr ":$port"
    if ($connections) {
        $pids = $connections | ForEach-Object {
            if ($_ -match '\s+(\d+)\s*$') {
                $matches[1]
            }
        } | Select-Object -Unique
        
        foreach ($processId in $pids) {
            if ($processId -and $processId -ne "0") {
                $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
                if ($process) {
                    Write-Host "Encerrando processo na porta ${port}: $($process.ProcessName) (PID: $processId)" -ForegroundColor Yellow
                    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                }
            }
        }
        Start-Sleep -Seconds 1
    }
}

# Iniciar backend em nova janela
Write-Host "`nIniciando backend (NestJS) com Supabase Cloud..." -ForegroundColor Yellow
Write-Host "   Comando: cd backend; npm run start:dev" -ForegroundColor Gray
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; npm run start:dev" -WindowStyle Normal
Write-Host "OK: Backend iniciado em nova janela (http://localhost:3000)" -ForegroundColor Green

# Aguardar alguns segundos antes de iniciar o frontend
Start-Sleep -Seconds 2

# Iniciar frontend em nova janela
Write-Host "`nIniciando frontend (Next.js) com Supabase Cloud..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev" -WindowStyle Normal
Write-Host "OK: Frontend iniciado em nova janela (http://localhost:3001)" -ForegroundColor Green

Write-Host "`nAmbiente iniciado com sucesso!" -ForegroundColor Cyan
Write-Host "`nServicos disponiveis:" -ForegroundColor White
Write-Host "   - Backend:  http://localhost:3000" -ForegroundColor Gray
Write-Host "   - Frontend: http://localhost:3001" -ForegroundColor Gray
Write-Host "`nAgora conectado ao Supabase Cloud (em vez de PostgreSQL local)" -ForegroundColor Green
Write-Host "`nPara parar os servicos, feche as janelas do PowerShell ou use Ctrl+C" -ForegroundColor Yellow

Write-Host "`n--- DEPLOY PARA VERCEL ---" -ForegroundColor Cyan
Write-Host "Para fazer deploy na Vercel:" -ForegroundColor White
Write-Host "1. Frontend: Use o comando 'vercel --prod' no diretorio frontend/" -ForegroundColor Gray
Write-Host "2. Backend: Use uma plataforma como Railway, Render ou AWS/Azure" -ForegroundColor Gray
Write-Host "   Exemplo para Railway:" -ForegroundColor Gray
Write-Host "   - Conecte seu repositorio ao Railway" -ForegroundColor Gray
Write-Host "   - Configure as variaveis de ambiente conforme deploy/railway.txt" -ForegroundColor Gray
Write-Host "   - Defina o comando de build como 'npm run build'" -ForegroundColor Gray
Write-Host "   - Defina o comando de start como 'npm start'" -ForegroundColor Gray