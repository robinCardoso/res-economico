# Script para iniciar todo o ambiente de desenvolvimento
# Backend NestJS, Frontend Next.js e Docker (PostgreSQL + Redis)

Write-Host "Iniciando ambiente de desenvolvimento..." -ForegroundColor Cyan

# Verificar se Docker está rodando
Write-Host "`nVerificando Docker..." -ForegroundColor Yellow
$dockerRunning = docker info 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Docker nao esta rodando. Por favor, inicie o Docker Desktop primeiro." -ForegroundColor Red
    exit 1
}
Write-Host "OK: Docker esta rodando" -ForegroundColor Green

# Iniciar containers (PostgreSQL + Redis)
Write-Host "`nIniciando containers Docker..." -ForegroundColor Yellow
docker compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Falha ao iniciar containers Docker" -ForegroundColor Red
    exit 1
}
Write-Host "OK: Containers iniciados" -ForegroundColor Green

# Aguardar alguns segundos para os containers ficarem prontos
Write-Host "`nAguardando containers ficarem prontos..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

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
Write-Host "`nIniciando backend (NestJS)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; npm run start:dev" -WindowStyle Normal
Write-Host "OK: Backend iniciado em nova janela (http://localhost:3000)" -ForegroundColor Green

# Aguardar alguns segundos antes de iniciar o frontend
Start-Sleep -Seconds 2

# Iniciar frontend em nova janela
Write-Host "`nIniciando frontend (Next.js)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev" -WindowStyle Normal
Write-Host "OK: Frontend iniciado em nova janela (http://localhost:3001)" -ForegroundColor Green

Write-Host "`nAmbiente iniciado com sucesso!" -ForegroundColor Cyan
Write-Host "`nServicos disponiveis:" -ForegroundColor White
Write-Host "   - Backend:  http://localhost:3000" -ForegroundColor Gray
Write-Host "   - Frontend: http://localhost:3001" -ForegroundColor Gray
Write-Host "   - Postgres: localhost:5432" -ForegroundColor Gray
Write-Host "   - Redis:    localhost:6379" -ForegroundColor Gray
Write-Host "`nPara parar os servicos, feche as janelas do PowerShell ou use Ctrl+C" -ForegroundColor Yellow

