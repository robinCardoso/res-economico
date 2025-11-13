# Script para abrir Prisma Studio e visualizar o banco de dados

Write-Host "Abrindo Prisma Studio..." -ForegroundColor Cyan
Write-Host "O Prisma Studio sera aberto em http://localhost:5555" -ForegroundColor Yellow
Write-Host "`nPressione Ctrl+C para fechar quando terminar.`n" -ForegroundColor Gray

cd backend
npx prisma studio

