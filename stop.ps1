# Script para parar todo o ambiente de desenvolvimento

Write-Host "Parando ambiente de desenvolvimento..." -ForegroundColor Cyan

# Parar containers Docker
Write-Host "`nParando containers Docker..." -ForegroundColor Yellow
docker compose down
if ($LASTEXITCODE -eq 0) {
    Write-Host "OK: Containers parados" -ForegroundColor Green
} else {
    Write-Host "AVISO: Alguns containers podem nao ter sido parados" -ForegroundColor Yellow
}

Write-Host "`nFeche manualmente as janelas do PowerShell do backend e frontend" -ForegroundColor Yellow
Write-Host "Ambiente parado!" -ForegroundColor Cyan

