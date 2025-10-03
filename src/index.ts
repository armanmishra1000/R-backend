import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { registerChatRoute } from "./routes/chat";

const app = express();
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true
}));
app.use(express.json());

registerChatRoute(app);

app.listen(env.MAIN_AGENT_PORT, () => {
  console.log(`Main agent listening on :${env.MAIN_AGENT_PORT}`);
});
