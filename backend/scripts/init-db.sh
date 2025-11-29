#!/bin/bash
# Script para garantir que o usuário painel_uniao tenha permissões de superuser
# Este script é executado automaticamente quando o container PostgreSQL é criado pela primeira vez

set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Tornar o usuário superuser (se ainda não for)
    ALTER USER $POSTGRES_USER WITH SUPERUSER CREATEDB CREATEROLE;
    
    -- Garantir permissões no schema public
    GRANT ALL ON SCHEMA public TO $POSTGRES_USER;
    ALTER SCHEMA public OWNER TO $POSTGRES_USER;
EOSQL

echo "✅ Permissões configuradas para o usuário $POSTGRES_USER"

