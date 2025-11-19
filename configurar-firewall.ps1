# Script para configurar Firewall do Windows para permitir acesso à rede local
# Execute como Administrador

Write-Host "Configurando Firewall do Windows para ResEco..." -ForegroundColor Cyan

# Verificar se está rodando como Administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERRO: Este script precisa ser executado como Administrador!" -ForegroundColor Red
    Write-Host "Clique com botão direito e selecione 'Executar como administrador'" -ForegroundColor Yellow
    exit 1
}

# Criar regras de firewall para Backend (porta 3000)
Write-Host "`nCriando regra para Backend (porta 3000)..." -ForegroundColor Yellow
try {
    $ruleExists = Get-NetFirewallRule -DisplayName "ResEco Backend" -ErrorAction SilentlyContinue
    if ($ruleExists) {
        Write-Host "Regra já existe, removendo..." -ForegroundColor Gray
        Remove-NetFirewallRule -DisplayName "ResEco Backend" -ErrorAction SilentlyContinue
    }
    
    New-NetFirewallRule -DisplayName "ResEco Backend" `
        -Direction Inbound `
        -LocalPort 3000 `
        -Protocol TCP `
        -Action Allow `
        -Profile Domain,Private,Public `
        -Description "Permite acesso ao backend do sistema ResEco na rede local"
    
    Write-Host "✓ Regra criada com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "ERRO ao criar regra do backend: $_" -ForegroundColor Red
}

# Criar regras de firewall para Frontend (porta 3001)
Write-Host "`nCriando regra para Frontend (porta 3001)..." -ForegroundColor Yellow
try {
    $ruleExists = Get-NetFirewallRule -DisplayName "ResEco Frontend" -ErrorAction SilentlyContinue
    if ($ruleExists) {
        Write-Host "Regra já existe, removendo..." -ForegroundColor Gray
        Remove-NetFirewallRule -DisplayName "ResEco Frontend" -ErrorAction SilentlyContinue
    }
    
    New-NetFirewallRule -DisplayName "ResEco Frontend" `
        -Direction Inbound `
        -LocalPort 3001 `
        -Protocol TCP `
        -Action Allow `
        -Profile Domain,Private,Public `
        -Description "Permite acesso ao frontend do sistema ResEco na rede local"
    
    Write-Host "✓ Regra criada com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "ERRO ao criar regra do frontend: $_" -ForegroundColor Red
}

# Obter IP da rede local
Write-Host "`nDetectando IP da rede local..." -ForegroundColor Yellow
$networkInterfaces = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
    $_.IPAddress -like "10.1.*" -and $_.InterfaceAlias -notlike "*Loopback*"
}

if ($networkInterfaces) {
    $localIp = $networkInterfaces[0].IPAddress
    Write-Host "✓ IP detectado: $localIp" -ForegroundColor Green
    Write-Host "`n" -ForegroundColor White
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  Sistema configurado com sucesso!" -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "`nAcesse o sistema de outros computadores usando:" -ForegroundColor White
    Write-Host "  Frontend: http://$localIp:3001" -ForegroundColor Yellow
    Write-Host "  Backend:  http://$localIp:3000" -ForegroundColor Yellow
    Write-Host "`nCertifique-se de que:" -ForegroundColor White
    Write-Host "  1. Backend está rodando (npm run start:dev na pasta backend)" -ForegroundColor Gray
    Write-Host "  2. Frontend está rodando (npm run dev na pasta frontend)" -ForegroundColor Gray
    Write-Host "  3. Outros computadores estão na mesma rede (10.1.x.x)" -ForegroundColor Gray
} else {
    Write-Host "⚠ Não foi possível detectar IP da rede 10.1.x.x" -ForegroundColor Yellow
    Write-Host "  Verifique manualmente o IP do computador" -ForegroundColor Gray
}

Write-Host "`nPressione qualquer tecla para continuar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

