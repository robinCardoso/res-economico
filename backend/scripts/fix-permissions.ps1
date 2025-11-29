# Script para corrigir permissões do usuário PostgreSQL
# Execute este script UMA VEZ para tornar as migrations automáticas novamente

Write-Host "=== Corrigindo Permissões do PostgreSQL ===" -ForegroundColor Cyan
Write-Host ""

# Verificar se o container está rodando
$containerRunning = docker ps --filter "name=painel_rede_uniao_postgres" --format "{{.Names}}"

if (-not $containerRunning) {
    Write-Host "ERRO: Container PostgreSQL não está rodando!" -ForegroundColor Red
    Write-Host "Execute: docker-compose up -d" -ForegroundColor Yellow
    exit 1
}

Write-Host "Container encontrado: $containerRunning" -ForegroundColor Green
Write-Host ""

# Tentar tornar o usuário superuser usando um script SQL temporário
Write-Host "Aplicando permissões..." -ForegroundColor Yellow

# Criar script SQL temporário
$sqlScript = @"
-- Tornar usuário superuser
DO `$`$
BEGIN
    -- Verificar se já é superuser
    IF NOT EXISTS (
        SELECT 1 FROM pg_roles WHERE rolname = 'painel_uniao' AND rolsuper = true
    ) THEN
        -- Tentar tornar superuser (pode falhar se não tiver permissão)
        BEGIN
            ALTER USER painel_uniao WITH SUPERUSER CREATEDB CREATEROLE;
            RAISE NOTICE 'Usuário painel_uniao agora é superuser';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Não foi possível tornar superuser automaticamente.';
            RAISE NOTICE 'Você precisa executar manualmente como usuário postgres.';
        END;
    ELSE
        RAISE NOTICE 'Usuário painel_uniao já é superuser';
    END IF;
    
    -- Garantir permissões no schema public (sempre funciona)
    GRANT ALL ON SCHEMA public TO painel_uniao;
    ALTER SCHEMA public OWNER TO painel_uniao;
    RAISE NOTICE 'Permissões no schema public garantidas';
END
`$`$;
"@

# Salvar script temporário
$tempFile = [System.IO.Path]::GetTempFileName() + ".sql"
$sqlScript | Out-File -FilePath $tempFile -Encoding UTF8

try {
    # Executar script
    Get-Content $tempFile | docker exec -i painel_rede_uniao_postgres psql -U painel_uniao -d painel_rede_uniao_db
    
    Write-Host ""
    Write-Host "✅ Script executado!" -ForegroundColor Green
    Write-Host ""
    
    # Verificar se funcionou
    Write-Host "Verificando permissões..." -ForegroundColor Yellow
    $result = docker exec painel_rede_uniao_postgres psql -U painel_uniao -d painel_rede_uniao_db -t -c "SELECT rolsuper FROM pg_roles WHERE rolname = 'painel_uniao';"
    
    if ($result.Trim() -eq "t") {
        Write-Host "✅ Usuário agora é SUPERUSER!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Agora você pode usar o Prisma normalmente:" -ForegroundColor Cyan
        Write-Host "  npx prisma migrate dev --name nome_da_migracao" -ForegroundColor White
    } else {
        Write-Host "⚠️  Usuário ainda não é superuser" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Isso pode acontecer se o usuário não tiver permissão para alterar a si mesmo." -ForegroundColor Yellow
        Write-Host "Nesse caso, você precisa:" -ForegroundColor Yellow
        Write-Host "1. Parar o container: docker-compose down" -ForegroundColor White
        Write-Host "2. Remover o volume (CUIDADO: apaga dados!): docker volume rm painel-rede-uniao_postgres_data" -ForegroundColor Red
        Write-Host "3. Recriar: docker-compose up -d" -ForegroundColor White
        Write-Host ""
        Write-Host "OU use a migration manual (veja: docs/migration-processos-manual.md)" -ForegroundColor Yellow
    }
} finally {
    # Limpar arquivo temporário
    if (Test-Path $tempFile) {
        Remove-Item $tempFile -Force
    }
}

Write-Host ""
Write-Host "=== Concluído ===" -ForegroundColor Cyan

