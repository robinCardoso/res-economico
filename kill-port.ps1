# Script para matar processos usando uma porta específica
param(
    [int]$Port = 3000
)

Write-Host "Procurando processos usando a porta $Port..." -ForegroundColor Yellow

$connections = netstat -ano | findstr ":$Port"
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
                Write-Host "Encerrando processo: $($process.ProcessName) (PID: $processId)" -ForegroundColor Yellow
                Stop-Process -Id $processId -Force
                Write-Host "OK: Processo encerrado" -ForegroundColor Green
            }
        }
    }
} else {
    Write-Host "Nenhum processo encontrado na porta $Port" -ForegroundColor Green
}

