# Database Dump Documentation

## Overview

The `make dump-db` target creates a full backup of the WealthTrack development database and saves it to a cloud-replicated location on your Mac. This is useful for:

- Regular backups of your dev data
- Sharing data with team members
- Disaster recovery
- Version control of database states

---

## Features

✅ **Cloud-Native** — Automatic detection and saving to cloud storage  
✅ **Timestamped Backups** — Every dump has `YYYYMMDD_HHMMSS` in filename  
✅ **Compressed Format** — Uses PostgreSQL custom format (smaller files, faster restores)  
✅ **Smart Detection** — Works with Dropbox, iCloud, OneDrive, Google Drive  
✅ **Fallback** — Uses local directory if no cloud storage detected  
✅ **Easy Restore** — Includes ready-to-use restore command  

---

## Usage

### Via Make Command (Recommended)

```bash
make dump-db
```

**Output:**
```
📦 Dumping dev database (wealthtrack on port 5433) to /Users/marklewis/Dropbox/WealthTrack-Backups/wealthtrack_db_20260412_143025.pgdump...
✅ Database dumped successfully (2.4M)
📍 Location: /Users/marklewis/Dropbox/WealthTrack-Backups/wealthtrack_db_20260412_143025.pgdump
☁️  File will sync to cloud automatically

To restore this dump:
  docker compose --env-file .env.dev exec -T db pg_restore --no-owner --no-privileges -U wealthtrack -d wealthtrack < /Users/marklewis/Dropbox/WealthTrack-Backups/wealthtrack_db_20260412_143025.pgdump
```

### Via Script Directly

```bash
bash scripts/dump-db.sh
```

Or specify a custom env file:

```bash
bash scripts/dump-db.sh .env.prod
```

---

## Cloud Storage Detection

The dump target automatically detects and uses cloud-replicated locations in this order:

### 1. **Dropbox (CloudStorage Integration)** — macOS 13+
- Path: `~/Library/CloudStorage/Dropbox-*/WealthTrack-Backups/`
- Detected if using macOS's native CloudStorage integration

### 2. **Dropbox (Classic)**
- Path: `~/Dropbox/WealthTrack-Backups/`
- Detected if using traditional Dropbox folder

### 3. **iCloud Drive**
- Path: `~/Library/CloudStorage/iCloud~com~apple~CloudDocs/WealthTrack-Backups/`
- Detected if you have iCloud Drive enabled

### 4. **OneDrive**
- Path: `~/OneDrive/WealthTrack-Backups/`
- Detected if OneDrive is installed

### 5. **Google Drive**
- Path: `~/Google Drive/WealthTrack-Backups/`
- Detected if Google Drive is installed

### 6. **Fallback (No Cloud)**
- Path: `~/.wealthtrack-backups/`
- Used if no cloud storage is detected
- Prints warning: `⚠️  No cloud storage detected, using local fallback`

---

## Backup Filename Convention

All dumps follow this naming pattern:

```
wealthtrack_db_YYYYMMDD_HHMMSS.pgdump
```

**Example:**
```
wealthtrack_db_20260412_143025.pgdump  (April 12, 2026 at 14:30:25)
```

This ensures:
- Chronological ordering (sort by name = sort by date)
- No filename collisions
- Easy identification of backup age

---

## Restoring from a Dump

### Full Restore (Replace Entire Database)

```bash
docker compose --env-file .env.dev exec -T db pg_restore \
  --no-owner --no-privileges \
  -U wealthtrack -d wealthtrack \
  < ~/Dropbox/WealthTrack-Backups/wealthtrack_db_20260412_143025.pgdump
```

### Into a New Database (No Drop)

```bash
# Create new database
docker compose --env-file .env.dev exec -T db psql -U postgres \
  -c "CREATE DATABASE wealthtrack_restore OWNER wealthtrack"

# Restore into it
docker compose --env-file .env.dev exec -T db pg_restore \
  --no-owner --no-privileges \
  -U wealthtrack -d wealthtrack_restore \
  < ~/Dropbox/WealthTrack-Backups/wealthtrack_db_20260412_143025.pgdump
```

### From a Different Environment

```bash
# To restore .env.prod dump into .env.dev
docker compose --env-file .env.dev exec -T db psql -U postgres \
  -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='wealthtrack'"

docker compose --env-file .env.dev exec -T db psql -U postgres \
  -c "DROP DATABASE IF EXISTS wealthtrack; CREATE DATABASE wealthtrack OWNER wealthtrack"

docker compose --env-file .env.dev exec -T db pg_restore \
  --no-owner --no-privileges \
  -U wealthtrack -d wealthtrack \
  < ~/Dropbox/WealthTrack-Backups/wealthtrack_db_prod_backup.pgdump
```

---

## Dump Format Details

### Why `-Fc` (Custom Format)?

The `pg_dump` command uses `-Fc` (custom/compressed format) because:

- **Compressed** — ~70% smaller than plain SQL dumps
- **Parallel restore** — Can restore faster with multiple workers
- **Selective restore** — Can restore individual objects
- **Efficient** — Optimized for PostgreSQL internals

### File Size Examples

- Plain SQL (`.sql`): ~8-12 MB
- Custom format (`.pgdump`): ~2-3 MB
- Gzipped SQL (`.sql.gz`): ~1-2 MB

---

## Scheduling Regular Backups

### Via Cron (Mac)

Edit your crontab:
```bash
crontab -e
```

Add a daily dump at 2 AM:
```cron
0 2 * * * cd ~/dev/wealthTrack && make dump-db >> ~/.wealthtrack-backup.log 2>&1
```

Or weekly (Sundays at 3 AM):
```cron
0 3 * * 0 cd ~/dev/wealthTrack && make dump-db >> ~/.wealthtrack-backup.log 2>&1
```

### Via Launchd (Mac Native)

Create `~/Library/LaunchAgents/com.wealthtrack.backup.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.wealthtrack.backup</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>-c</string>
    <string>cd ~/dev/wealthTrack && make dump-db</string>
  </array>
  <key>StartCalendarInterval</key>
  <dict>
    <key>Hour</key>
    <integer>2</integer>
    <key>Minute</key>
    <integer>0</integer>
  </dict>
  <key>StandardErrorPath</key>
  <string>/tmp/wealthtrack-backup.err</string>
  <key>StandardOutPath</key>
  <string>/tmp/wealthtrack-backup.log</string>
</dict>
</plist>
```

Load it:
```bash
launchctl load ~/Library/LaunchAgents/com.wealthtrack.backup.plist
```

---

## Troubleshooting

### Database Container Not Running

**Problem:** `Error: Cannot locate a Docker Compose environment`

**Solution:**
```bash
make docker-up        # Start containers first
make dump-db          # Then try dump again
```

### No .env.dev File

**Problem:** `❌ .env.dev not found`

**Solution:**
```bash
cp .env.dev.example .env.dev
# Fill in values for your environment
make dump-db
```

### Dump File Very Small (~1-2 KB)

**Problem:** File seems too small, might be an error

**Solution:** Check the dump file for errors:
```bash
file ~/Dropbox/WealthTrack-Backups/wealthtrack_db_*.pgdump
```

If custom format got skipped, try verbose restore:
```bash
docker compose --env-file .env.dev exec -T db pg_restore -v \
  < ~/Dropbox/WealthTrack-Backups/wealthtrack_db_*.pgdump
```

### Cloud Storage Not Detected

**Problem:** Dump went to `~/.wealthtrack-backups` instead of cloud

**Solution:**
1. Check if cloud app is running
2. Verify cloud folder exists:
   ```bash
   ls -la ~/Dropbox/          # for Dropbox
   ls -la ~/Library/CloudStorage/  # for iCloud
   ```
3. Manually specify location:
   ```bash
   mkdir -p ~/Dropbox/WealthTrack-Backups
   bash scripts/dump-db.sh     # Will now detect Dropbox
   ```

---

## Best Practices

✅ **Do:**
- Run dumps regularly (daily or weekly)
- Keep dumps in cloud storage for automatic sync
- Version control by timestamp (they're already timestamped!)
- Test restores occasionally to ensure validity
- Share dumps via cloud (not email)

❌ **Don't:**
- Commit dumps to Git (they're binary, use for storage)
- Edit `.pgdump` files manually
- Delete all old dumps (rotate them, keep several versions)
- Dump when making migrations (wait for completion)

---

## Cloud Sync Notes

Once the dump is saved to your cloud folder, it automatically syncs:

- **Dropbox** — Syncs within seconds, viewable on mobile
- **iCloud** — Syncs if device signed in, visible in iCloud app
- **OneDrive** — Syncs to Microsoft 365
- **Google Drive** — Syncs through Google's sync app

No additional action needed — the file is already cloud-ready!

---

## Advanced: Multi-Database Dumps

To dump both dev and test databases:

```bash
make dump-db          # Dev database
bash scripts/dump-db.sh .env.test  # Test database
```

Files will be saved to separate paths but both in cloud storage.

---

## Related Commands

```bash
make docker-up        # Ensure database is running
make seed-db          # Seed with reference data after restore
make migrate          # Apply migrations to a restored DB
```

---

## Documentation

- Full Makefile: `Makefile`
- Dump script: `scripts/dump-db.sh`
- This guide: `docs/dump-db-guide.md`
