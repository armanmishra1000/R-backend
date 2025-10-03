import { config } from "dotenv";

config();

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is required");
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is required");
}

export const env = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  MAIN_AGENT_PORT: Number(process.env.MAIN_AGENT_PORT ?? 5050),
  PLAYWRIGHT_AVAILABLE: process.env.PLAYWRIGHT_AVAILABLE === "true",
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "7d",
  NODE_ENV: process.env.NODE_ENV ?? "development"
};
