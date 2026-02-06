-- Create wealthtrack user/role if it doesn't exist
DO
$do$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'wealthtrack') THEN
    CREATE ROLE wealthtrack WITH PASSWORD 'wealthtrack_dev_password' LOGIN;
  END IF;
END
$do$;

-- Grant privileges to wealthtrack role on database
GRANT ALL PRIVILEGES ON DATABASE wealthtrack TO wealthtrack;

-- Grant privileges on public schema
GRANT USAGE ON SCHEMA public TO wealthtrack;
GRANT CREATE ON SCHEMA public TO wealthtrack;

-- Set default privileges for future tables/sequences
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO wealthtrack;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO wealthtrack;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO wealthtrack;
