import { Pool } from "pg";
import { env } from "./env";

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
  options: "-c search_path=yash,public",
});

// Handle pool errors
pool.on("error", (err) => {
  console.error("Postgres pool error", err);
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log("Closing database pool...");
  await pool.end();
  console.log("Database pool closed");
  process.exit(0);
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

export const query = (text: string, params?: unknown[]) => pool.query(text, params);
