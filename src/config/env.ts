import { config } from "dotenv";

config();

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is required");
}

export const env = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  MAIN_AGENT_PORT: Number(process.env.MAIN_AGENT_PORT ?? 5050),
  PLAYWRIGHT_AVAILABLE: process.env.PLAYWRIGHT_AVAILABLE === "true"
};
