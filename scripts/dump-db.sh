#!/bin/bash
# WealthTrack Database Dump Script
# Dumps the development database to a cloud-replicated location with timestamps
# Usage: bash scripts/dump-db.sh [optional: path-to-env-file]

set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Use provided env file or default to .env.dev
ENV_FILE="${1:-.env.dev}"

# Resolve to absolute path
if [[ ! "$ENV_FILE" = /* ]]; then
  ENV_FILE="$PROJECT_ROOT/$ENV_FILE"
fi

# Check if env file exists
if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Environment file not found: $ENV_FILE"
  exit 1
fi

# Load environment variables
set -a
source "$ENV_FILE"
set +a

# Generate timestamp for unique filename
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DUMP_FILE="wealthtrack_db_${TIMESTAMP}.pgdump"

# Detect cloud storage location (in priority order)
BACKUP_DIR=""

if [ -d "$HOME/Library/CloudStorage/Dropbox-"* ]; then
  # Dropbox via CloudStorage (newer macOS integration)
  CLOUD_DIR=$(ls -dt $HOME/Library/CloudStorage/Dropbox-* 2>/dev/null | head -n1)
  BACKUP_DIR="$CLOUD_DIR/WealthTrack-Backups"
  CLOUD_SERVICE="Dropbox (CloudStorage)"
elif [ -d "$HOME/Dropbox" ]; then
  # Dropbox classic location
  BACKUP_DIR="$HOME/Dropbox/WealthTrack-Backups"
  CLOUD_SERVICE="Dropbox"
elif [ -d "$HOME/Library/CloudStorage/iCloud~com~apple~CloudDocs" ]; then
  # iCloud Drive
  BACKUP_DIR="$HOME/Library/CloudStorage/iCloud~com~apple~CloudDocs/WealthTrack-Backups"
  CLOUD_SERVICE="iCloud Drive"
elif [ -d "$HOME/OneDrive" ]; then
  # Microsoft OneDrive
  BACKUP_DIR="$HOME/OneDrive/WealthTrack-Backups"
  CLOUD_SERVICE="OneDrive"
elif [ -d "$HOME/Google Drive" ]; then
  # Google Drive
  BACKUP_DIR="$HOME/Google Drive/WealthTrack-Backups"
  CLOUD_SERVICE="Google Drive"
else
  # Fallback to local backup directory
  BACKUP_DIR="$HOME/.wealthtrack-backups"
  CLOUD_SERVICE="Local Backup"
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Display what we're doing
echo "📦 WealthTrack Database Dump"
echo "=============================="
echo "Environment: $ENV_FILE"
echo "Database: $DB_NAME (port $DB_PORT)"
echo "Backup location: $CLOUD_SERVICE"
echo "Save path: $BACKUP_DIR/$DUMP_FILE"
echo ""

# Check if database container is running
echo "🔍 Checking if database container is running..."
if ! docker compose -f "$PROJECT_ROOT/docker-compose.yml" -f "$PROJECT_ROOT/docker-compose.dev.yml" --env-file "$ENV_FILE" ps db | grep -q "Up"; then
  echo "⚠️  Database container not running. Starting..."
  docker compose -f "$PROJECT_ROOT/docker-compose.yml" -f "$PROJECT_ROOT/docker-compose.dev.yml" --env-file "$ENV_FILE" up -d db
  echo "Waiting for database to be ready..."
  sleep 3
fi

# Perform the dump
echo "⏳ Dumping database..."
echo ""

docker compose -f "$PROJECT_ROOT/docker-compose.yml" -f "$PROJECT_ROOT/docker-compose.dev.yml" \
  --env-file "$ENV_FILE" exec -T db \
  pg_dump -U "$DB_USER" -d "$DB_NAME" -Fc -v \
  > "$BACKUP_DIR/$DUMP_FILE" 2>&1

# Check dump size
if [ -f "$BACKUP_DIR/$DUMP_FILE" ]; then
  DUMP_SIZE=$(du -h "$BACKUP_DIR/$DUMP_FILE" | cut -f1)
  echo ""
  echo "✅ Database dumped successfully!"
  echo "📦 Dump file size: $DUMP_SIZE"
  echo "📍 Saved to: $BACKUP_DIR/$DUMP_FILE"
  echo "☁️  Cloud sync: Automatic (via $CLOUD_SERVICE)"
  echo ""
  echo "📝 Restore command:"
  echo "   docker compose --env-file .env.dev exec -T db pg_restore \\"
  echo "     --no-owner --no-privileges -U $DB_USER -d $DB_NAME \\"
  echo "     < '$BACKUP_DIR/$DUMP_FILE'"
  echo ""
  echo "✨ Done!"
else
  echo "❌ Dump failed - file not created"
  exit 1
fi
