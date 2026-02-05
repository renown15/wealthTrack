-- Create wealthtrack user if it doesn't exist
CREATE USER wealthtrack WITH PASSWORD 'wealthtrack_dev_password';
ALTER USER wealthtrack CREATEDB;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE wealthtrack TO wealthtrack;
