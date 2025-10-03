#!/bin/bash
# Run database migration

# Load environment variables
source <(grep DATABASE_URL ../.env | xargs)

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL not found in .env file"
  exit 1
fi

echo "🔄 Running migration: 001_init.sql"
psql "$DATABASE_URL" -f migrations/001_init.sql

if [ $? -eq 0 ]; then
  echo "✅ Migration completed successfully!"
else
  echo "❌ Migration failed!"
  exit 1
fi
