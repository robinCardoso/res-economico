# Script PowerShell para executar a migration de Processos
# Execute este script a partir do diretório backend

Write-Host "Executando migration de Processos..." -ForegroundColor Cyan

# Ler variáveis do .env
$envContent = Get-Content .env | Where-Object { $_ -match "^DATABASE_URL=" }
if ($envContent) {
    $databaseUrl = $envContent -replace "^DATABASE_URL=", ""
    Write-Host "DATABASE_URL encontrado" -ForegroundColor Green
} else {
    Write-Host "ERRO: DATABASE_URL não encontrado no .env" -ForegroundColor Red
    exit 1
}

# Extrair informações da URL
if ($databaseUrl -match "postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)") {
    $user = $matches[1]
    $password = $matches[2]
    $host = $matches[3]
    $port = $matches[4]
    $database = $matches[5] -replace '\?.*$', ''
    
    Write-Host "Conectando ao banco: $database em $host:$port" -ForegroundColor Yellow
    
    # Executar SQL usando psql
    $env:PGPASSWORD = $password
    $sqlFile = "prisma\migrations\manual_add_processos_tables.sql"
    
    if (Test-Path $sqlFile) {
        Write-Host "Executando arquivo SQL: $sqlFile" -ForegroundColor Yellow
        & psql -h $host -p $port -U $user -d $database -f $sqlFile
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Migration executada com sucesso!" -ForegroundColor Green
        } else {
            Write-Host "ERRO ao executar migration. Código de saída: $LASTEXITCODE" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "ERRO: Arquivo SQL não encontrado: $sqlFile" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "ERRO: Formato de DATABASE_URL inválido" -ForegroundColor Red
    exit 1
}

Write-Host "Concluído!" -ForegroundColor Green

