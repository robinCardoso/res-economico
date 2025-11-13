# Script para matar processos usando portas específicas
param(
    [int[]]$Ports = @(3000, 3001)
)

foreach ($port in $Ports) {
    Write-Host "`nProcurando processos usando a porta $port..." -ForegroundColor Yellow

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
                    Write-Host "Encerrando processo: $($process.ProcessName) (PID: $processId) na porta $port" -ForegroundColor Yellow
                    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                    Write-Host "OK: Processo encerrado" -ForegroundColor Green
                }
            }
        }
    } else {
        Write-Host "Nenhum processo encontrado na porta $port" -ForegroundColor Green
    }
}

Write-Host "`nConcluido!" -ForegroundColor Cyan

