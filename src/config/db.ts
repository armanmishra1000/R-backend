import { Pool } from "pg";
import { env } from "./env";

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.NODE_ENV === "development" ? { rejectUnauthorized: false } : undefined,
});

export const query = (text: string, params?: unknown[]) => pool.query(text, params);
