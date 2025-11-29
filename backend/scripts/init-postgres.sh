#!/bin/bash
# Script de inicialização do PostgreSQL
# Garante que o usuário seja criado como superuser

set -e

echo "Configurando permissões do usuário PostgreSQL..."

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Tornar o usuário superuser (se ainda não for)
    DO \$\$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM pg_roles WHERE rolname = '$POSTGRES_USER' AND rolsuper = true
        ) THEN
            ALTER USER $POSTGRES_USER WITH SUPERUSER CREATEDB CREATEROLE;
            RAISE NOTICE 'Usuário $POSTGRES_USER agora é superuser';
        ELSE
            RAISE NOTICE 'Usuário $POSTGRES_USER já é superuser';
        END IF;
    END
    \$\$;
    
    -- Garantir permissões no schema public
    GRANT ALL ON SCHEMA public TO $POSTGRES_USER;
    ALTER SCHEMA public OWNER TO $POSTGRES_USER;
    
    RAISE NOTICE 'Permissões configuradas com sucesso';
EOSQL

echo "✅ Permissões configuradas!"

