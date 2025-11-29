#!/bin/bash
# Script Bash para executar a migration de Processos
# Execute este script a partir do diretório backend

echo "Executando migration de Processos..."

# Ler variáveis do .env
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
else
    echo "ERRO: Arquivo .env não encontrado"
    exit 1
fi

if [ -z "$DATABASE_URL" ]; then
    echo "ERRO: DATABASE_URL não encontrado no .env"
    exit 1
fi

# Extrair informações da URL
# Formato: postgresql://user:password@host:port/database
DB_URL=$(echo $DATABASE_URL | sed 's|postgresql://||')
DB_USER=$(echo $DB_URL | cut -d: -f1)
DB_PASS=$(echo $DB_URL | cut -d: -f2 | cut -d@ -f1)
DB_HOST=$(echo $DB_URL | cut -d@ -f2 | cut -d: -f1)
DB_PORT=$(echo $DB_URL | cut -d: -f3 | cut -d/ -f1)
DB_NAME=$(echo $DB_URL | cut -d/ -f2 | cut -d? -f1)

echo "Conectando ao banco: $DB_NAME em $DB_HOST:$DB_PORT"

# Executar SQL usando psql
export PGPASSWORD=$DB_PASS
SQL_FILE="prisma/migrations/manual_add_processos_tables.sql"

if [ -f "$SQL_FILE" ]; then
    echo "Executando arquivo SQL: $SQL_FILE"
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $SQL_FILE
    
    if [ $? -eq 0 ]; then
        echo "Migration executada com sucesso!"
    else
        echo "ERRO ao executar migration"
        exit 1
    fi
else
    echo "ERRO: Arquivo SQL não encontrado: $SQL_FILE"
    exit 1
fi

echo "Concluído!"

