import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { pool } from "../src/config/db";

const migrationsDir = join(process.cwd(), "scripts", "migrations");

async function ensureSchemaMigrationsTable() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await pool.query(createTableSQL);
  console.log("✓ schema_migrations table ensured");
}

async function getAppliedMigrations(): Promise<string[]> {
  const result = await pool.query("SELECT filename FROM schema_migrations ORDER BY applied_at");
  return result.rows.map((row: any) => row.filename);
}

async function applyMigration(file: string) {
  const filePath = join(migrationsDir, file);
  const sql = readFileSync(filePath, "utf8");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    console.log(`\n>> Running migration: ${file}`);
    await client.query(sql);
    await client.query(
      "INSERT INTO schema_migrations (filename) VALUES ($1)",
      [file]
    );
    await client.query("COMMIT");
    console.log(`<< Completed migration: ${file}`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(`!! Failed migration: ${file}`, error);
    throw error;
  } finally {
    client.release();
  }
}

async function run() {
  await ensureSchemaMigrationsTable();

  const appliedMigrations = await getAppliedMigrations();
  console.log("Already applied migrations:", appliedMigrations.length > 0 ? appliedMigrations : "none");

  const files = readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .map((file) => {
      const numericMatch = file.match(/^(\d+)/);
      const num = numericMatch ? parseInt(numericMatch[1], 10) : Infinity;
      return { file, num };
    })
    .sort((a, b) => {
      if (a.num !== b.num) return a.num - b.num;
      return a.file.localeCompare(b.file);
    })
    .map(({ file }) => file);

  for (const file of files) {
    if (appliedMigrations.includes(file)) {
      console.log(`⏭ Skipping already applied migration: ${file}`);
      continue;
    }
    await applyMigration(file);
  }

  await pool.end();
  console.log("All migrations executed.");
}

run().catch((err) => {
  console.error("Migration failed", err);
  pool.end().finally(() => process.exit(1));
});
