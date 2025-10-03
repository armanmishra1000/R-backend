#!/bin/bash
# Run database migration
# This script can be run from any directory

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Define paths
ENV_FILE="$PROJECT_ROOT/.env"
MIGRATION_FILE="$SCRIPT_DIR/migrations/001_init.sql"

# Check if .env file exists
if [ ! -f "$ENV_FILE" ]; then
  echo "❌ ERROR: .env file not found at $ENV_FILE"
  exit 1
fi

# Check if migration file exists
if [ ! -f "$MIGRATION_FILE" ]; then
  echo "❌ ERROR: Migration file not found at $MIGRATION_FILE"
  exit 1
fi

# Load DATABASE_URL from .env file
# Use export to properly set environment variable
export $(grep "^DATABASE_URL=" "$ENV_FILE" | xargs)

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL not found in .env file"
  exit 1
fi

echo "🔄 Running migration: 001_init.sql"
echo "📁 Migration file: $MIGRATION_FILE"
psql "$DATABASE_URL" -f "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
  echo "✅ Migration completed successfully!"
else
  echo "❌ Migration failed!"
  exit 1
fi
