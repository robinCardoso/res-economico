# Script para regenerar o Prisma Client
# Use este script após aplicar migrations que alteram o schema

Write-Host "Regenerando Prisma Client..." -ForegroundColor Cyan

# Navegar para o diretório do backend
Set-Location $PSScriptRoot\..

# Regenerar Prisma Client
Write-Host "`nExecutando: npx prisma generate" -ForegroundColor Yellow
npx prisma generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nPrisma Client regenerado com sucesso!" -ForegroundColor Green
} else {
    Write-Host "`nERRO: Falha ao regenerar Prisma Client" -ForegroundColor Red
    exit 1
}

Write-Host "`nAgora você pode reiniciar o backend com: npm run start:dev" -ForegroundColor Yellow

