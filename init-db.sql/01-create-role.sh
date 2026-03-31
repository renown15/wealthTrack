#!/bin/bash
set -e

# DB_PASSWORD is passed via docker-compose environment; falls back to dev default
WEALTHTRACK_PASSWORD="${DB_PASSWORD:-wealthtrack_dev_password}"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  DO
  \$do\$
  BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'wealthtrack') THEN
      CREATE ROLE wealthtrack WITH PASSWORD '$WEALTHTRACK_PASSWORD' LOGIN;
    END IF;
  END
  \$do\$;

  GRANT ALL PRIVILEGES ON DATABASE $POSTGRES_DB TO wealthtrack;
  GRANT USAGE ON SCHEMA public TO wealthtrack;
  GRANT CREATE ON SCHEMA public TO wealthtrack;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO wealthtrack;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO wealthtrack;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO wealthtrack;
EOSQL
