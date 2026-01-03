# Script combinado para deploy do frontend na Vercel e backend no Railway
Write-Host "🚀 Iniciando deploy combinado (frontend na Vercel + backend no Railway)..." -ForegroundColor Cyan

# Função para verificar se um comando está disponível
function Test-Command {
    param([string]$cmd)
    $exists = $null -ne (Get-Command $cmd -ErrorAction SilentlyContinue)
    return $exists
}

# Verificar se as ferramentas estão instaladas
if (-not (Test-Command "vercel")) {
    Write-Host "❌ O comando 'vercel' não está instalado." -ForegroundColor Red
    Write-Host "💡 Instale usando: npm install -g vercel" -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Command "railway")) {
    Write-Host "❌ O comando 'railway' não está instalado." -ForegroundColor Red
    Write-Host "💡 Instale usando: npm install -g @railway/cli" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Ferramentas necessárias estão instaladas" -ForegroundColor Green

# Confirmar antes de continuar
$confirmation = Read-Host "Tem certeza que deseja fazer deploy de ambos (frontend e backend)? (y/N)"
if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
    Write-Host "❌ Deploy cancelado pelo usuário" -ForegroundColor Red
    exit 1
}

# Fazer deploy do frontend primeiro
Write-Host "📦 Fazendo deploy do frontend na Vercel..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\frontend"

if (Test-Path ".env") {
    Write-Host "✅ Arquivo .env encontrado no frontend" -ForegroundColor Green
} else {
    Write-Host "⚠️  Arquivo .env não encontrado no frontend" -ForegroundColor Yellow
}

# Executar deploy do frontend
$frontendResult = vercel --prod
Write-Host "✅ Frontend deploy concluído!" -ForegroundColor Green
Write-Host "🌐 Verifique o painel da Vercel para a URL do frontend" -ForegroundColor Gray

# Voltar e fazer deploy do backend
Write-Host "📦 Fazendo deploy do backend no Railway..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\backend"

if (Test-Path ".env") {
    Write-Host "✅ Arquivo .env encontrado no backend" -ForegroundColor Green
} else {
    Write-Host "⚠️  Arquivo .env não encontrado no backend" -ForegroundColor Yellow
}

# Executar deploy do backend
$railwayResult = railway up
Write-Host "✅ Backend deploy concluído!" -ForegroundColor Green

Write-Host "🎉 Deploy combinado concluído com sucesso!" -ForegroundColor Cyan
Write-Host "🌐 Frontend: Verifique o painel da Vercel para a URL" -ForegroundColor Gray
Write-Host "🌐 Backend: Verifique o painel do Railway para a URL do backend" -ForegroundColor Gray

Write-Host "`n📋 Próximos passos:" -ForegroundColor White
Write-Host "   1. Atualize as configurações de autenticação no Supabase com os domínios do frontend" -ForegroundColor Gray
Write-Host "   2. Teste a integração completa entre frontend e backend" -ForegroundColor Gray
Write-Host "   3. Verifique os logs em ambas as plataformas" -ForegroundColor Gray