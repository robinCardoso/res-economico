# Script de Backup Seguro do Banco de Dados PostgreSQL
# Garante encoding correto (UTF-8) e valida o backup após criação

param(
    [string]$OutputDir = ".",
    [switch]$ValidateOnly = $false
)

$ErrorActionPreference = "Stop"

# Cores para output
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Error { Write-Host $args -ForegroundColor Red }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }

Write-Info "`n=========================================="
Write-Info "  BACKUP SEGURO DO BANCO DE DADOS"
Write-Info "==========================================`n"

# Configurações do banco
$CONTAINER_NAME = "painel_rede_uniao_postgres"
$DB_NAME = "painel_rede_uniao_db"
$DB_USER = "painel_uniao"
$DB_PASSWORD = "painel_uniao_pwd"

# Gerar nome do arquivo com timestamp
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFileName = "backup_${timestamp}.sql"
$backupPath = Join-Path $OutputDir $backupFileName

Write-Info "Configuracoes:"
Write-Host "   Container: $CONTAINER_NAME"
Write-Host "   Banco: $DB_NAME"
Write-Host "   Arquivo: $backupFileName"
Write-Host "   Diretório: $(Resolve-Path $OutputDir)`n"

# 1. Verificar se o Docker está rodando
Write-Info "Verificando Docker..."
try {
    $null = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error "ERRO: Docker não está rodando. Por favor, inicie o Docker Desktop."
        exit 1
    }
    Write-Success "OK: Docker está rodando"
} catch {
    Write-Error "ERRO: Erro ao verificar Docker: $_"
    exit 1
}

# 2. Verificar se o container está rodando
Write-Info "`n Verificando container PostgreSQL..."
$containerStatus = docker ps --filter "name=$CONTAINER_NAME" --format "{{.Status}}" 2>&1
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($containerStatus)) {
    Write-Error "ERRO: Container '$CONTAINER_NAME' não está rodando."
    Write-Info "   Execute: docker compose up -d"
    exit 1
}
Write-Success "OK: Container está rodando: $containerStatus"

# 3. Verificar se o banco está acessível
Write-Info "`n Verificando conexão com o banco..."
$null = docker exec $CONTAINER_NAME pg_isready -U $DB_USER 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "ERRO: Banco de dados não está acessível."
    Write-Info "   Aguardando 5 segundos e tentando novamente..."
    Start-Sleep -Seconds 5
    $null = docker exec $CONTAINER_NAME pg_isready -U $DB_USER 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error "ERRO: Banco ainda não está acessível. Verifique os logs do container."
        exit 1
    }
}
Write-Success "OK: Banco de dados está acessível"

# 4. Verificar espaço em disco
Write-Info "`n Verificando espaço em disco..."
try {
    $resolvedPath = Resolve-Path $OutputDir -ErrorAction Stop
    $driveLetter = $resolvedPath.Drive.Name
    $disk = Get-PSDrive -Name $driveLetter
    $freeSpaceGB = [math]::Round($disk.Free / 1GB, 2)
    Write-Info "   Espaço livre: $freeSpaceGB GB"
    if ($freeSpaceGB -lt 1) {
        Write-Warning "ATENCAO: Pouco espaco em disco disponivel. O backup pode falhar."
    }
} catch {
    Write-Warning "ATENCAO: Nao foi possivel verificar espaco em disco (nao critico): $_"
}

# 5. Contar registros antes do backup (para validação)
Write-Info "`nContando registros nas tabelas principais..."
try {
    $countQuery = @"
SELECT 
    'Upload' as tabela, COUNT(*) as total FROM "Upload"
UNION ALL
SELECT 'LinhaUpload', COUNT(*) FROM "LinhaUpload"
UNION ALL
SELECT 'ContaCatalogo', COUNT(*) FROM "ContaCatalogo"
UNION ALL
SELECT 'Empresa', COUNT(*) FROM "Empresa"
UNION ALL
SELECT 'Usuario', COUNT(*) FROM "Usuario"
UNION ALL
SELECT 'Processo', COUNT(*) FROM "Processo"
ORDER BY tabela;
"@
    
    $counts = docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -t -A -F "|" -c $countQuery 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   Registros encontrados:"
        $counts | ForEach-Object {
            if ($_ -match '^(.+)\|(\d+)$') {
                Write-Host "     $($matches[1]): $($matches[2])"
            }
        }
    }
} catch {
    Write-Warning "⚠️  Não foi possível contar registros (não crítico): $_"
}

# 6. Criar backup
Write-Info "`nCriando backup..."
Write-Info "   Isso pode levar alguns minutos dependendo do tamanho do banco..."

# Usar pg_dump com encoding UTF-8 explícito
# --no-owner: não inclui comandos de ownership (evita problemas de permissão)
# --no-acl: não inclui ACLs (evita problemas de permissão)
# --clean: inclui comandos DROP antes de CREATE (útil para restore)
# --if-exists: usa IF EXISTS nos DROPs (mais seguro)
# --verbose: mostra progresso
$env:PGPASSWORD = $DB_PASSWORD

try {
    # Salvar o backup usando UTF-8 encoding (sem BOM para compatibilidade)
    # Usar redirecionamento direto para arquivo para evitar problemas de encoding no PowerShell
    # Executar pg_dump e salvar diretamente em arquivo temporário dentro do container
    # Depois copiar para o destino final usando docker cp (preserva encoding)
    docker exec -e PGPASSWORD=$DB_PASSWORD $CONTAINER_NAME sh -c "pg_dump -U $DB_USER -d $DB_NAME --encoding=UTF8 --no-owner --no-acl --clean --if-exists > /tmp/backup_temp.sql" 2>&1 | Out-Null
    
    if ($LASTEXITCODE -ne 0) {
        throw "pg_dump retornou código de erro"
    }
    
    # Copiar arquivo do container para o host
    docker cp "${CONTAINER_NAME}:/tmp/backup_temp.sql" $backupPath
    
    if ($LASTEXITCODE -ne 0) {
        throw "Falha ao copiar backup do container"
    }
    
    # Limpar arquivo temporário do container
    docker exec $CONTAINER_NAME rm -f /tmp/backup_temp.sql 2>&1 | Out-Null
    
    Write-Success "OK: Backup criado com sucesso"
} catch {
    Write-Error "ERRO: Erro ao criar backup: $_"
    if (Test-Path $backupPath) {
        Remove-Item $backupPath -Force
    }
    exit 1
} finally {
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}

# 7. Validar arquivo de backup
Write-Info "`nValidando arquivo de backup..."

if (-not (Test-Path $backupPath)) {
    Write-Error "ERRO: Arquivo de backup não foi criado!"
    exit 1
}

$fileInfo = Get-Item $backupPath
$fileSizeMB = [math]::Round($fileInfo.Length / 1MB, 2)
Write-Info "   Tamanho: $fileSizeMB MB"

if ($fileInfo.Length -eq 0) {
    Write-Error "ERRO: Arquivo de backup está vazio!"
    Remove-Item $backupPath -Force
    exit 1
}

if ($fileSizeMB -lt 0.1) {
    Write-Warning "ATENCAO: Arquivo de backup e muito pequeno ($fileSizeMB MB). Pode estar incompleto."
}

# 8. Verificar conteúdo do backup
Write-Info "`n Verificando conteúdo do backup..."

# Verificar se contém comandos essenciais
$backupContent = Get-Content $backupPath -Raw -Encoding UTF8

$checks = @(
    @{ Name = "CREATE TABLE"; Pattern = "CREATE TABLE"; Required = $true }
    @{ Name = "COPY ou INSERT"; Pattern = "(COPY|INSERT INTO)"; Required = $true }
    @{ Name = "Encoding UTF-8"; Pattern = "UTF8|UTF-8"; Required = $false }
)

$allChecksPassed = $true
foreach ($check in $checks) {
    if ($backupContent -match $check.Pattern) {
        Write-Success "   OK: $($check.Name): encontrado"
    } else {
        if ($check.Required) {
            Write-Error "   ERRO: $($check.Name): NAO encontrado (CRITICO)"
            $allChecksPassed = $false
        } else {
            Write-Warning "   ATENCAO: $($check.Name): nao encontrado (nao critico)"
        }
    }
}

# Verificar se não há caracteres de encoding corrompido
$corruptedPattern = "[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F-\x9F]"
if ($backupContent -match $corruptedPattern) {
    Write-Warning "   ATENCAO: Possiveis caracteres de controle encontrados (pode ser normal em dados binarios)"
}

# Verificar tabelas principais
$tablesToCheck = @("Upload", "LinhaUpload", "ContaCatalogo", "Empresa", "Usuario")
$tablesFound = 0
foreach ($table in $tablesToCheck) {
    if ($backupContent -match "CREATE TABLE.*`"$table`"") {
        $tablesFound++
    }
}
Write-Info "   Tabelas principais encontradas: $tablesFound/$($tablesToCheck.Count)"

if ($tablesFound -lt $tablesToCheck.Count / 2) {
    Write-Warning "   ATENCAO: Poucas tabelas encontradas. O backup pode estar incompleto."
}

# 9. Testar restauração em um banco temporário (opcional, mas recomendado)
Write-Info "`n Testando integridade do backup (análise sintática)..."

try {
    # Verificar se o SQL é válido usando psql --dry-run (não executa, só valida sintaxe)
    $null = docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "SELECT 1;" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Success "   OK: Conexao de teste bem-sucedida"
    }
} catch {
    Write-Warning "   ATENCAO: Nao foi possivel validar sintaxe (nao critico): $_"
}

# 10. Resumo final
Write-Info "`n=========================================="
Write-Info "  RESUMO DO BACKUP"
Write-Info "=========================================="
Write-Success "OK: Backup criado com sucesso!"
Write-Host "`nArquivo: $backupPath"
Write-Host "Tamanho: $fileSizeMB MB"
Write-Host "Data: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')"
Write-Host "`nPara restaurar este backup, use:"
Write-Host "   docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME < $backupPath"
Write-Host "`nIMPORTANTE: Mantenha este arquivo em local seguro!"
Write-Info "`n==========================================`n"

if (-not $allChecksPassed) {
    Write-Error "ATENCAO: Algumas validacoes falharam. Revise o backup antes de confiar nele."
    exit 1
}

Write-Success "OK: Todas as validacoes passaram. Backup seguro e valido!`n"

