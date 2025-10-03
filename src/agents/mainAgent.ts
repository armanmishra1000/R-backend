import { GoogleGenAI } from "@google/genai";
import type { ChatMessage } from "../types/chat";
import { MainAgentDecisionSchema, type MainAgentDecision } from "../types/actions";
import { env } from "../config/env";

const ai = new GoogleGenAI({}); // reads GEMINI_API_KEY from env

const getSystemPrompt = () => {
  return `You are the main coordinator for Reddit lead generation.

You delegate work to a sub-agent that handles browser automation and data extraction.

Your responsibilities:
1. Clarify missing details (subreddit, keywords, lead format, minimum karma) with the user
2. When you have enough information, create actions for the sub-agent to execute
3. Let the sub-agent report if tools are unavailable - you just coordinate

Response format (JSON ONLY):
{
  "reply": "Your message to the user explaining what you're doing",
  "actions": [] or [{"type":"generate_lead", "subreddit":"...", "criteria":{...}, "count":N}]
}

Guidelines:
- When you have complete information (subreddit, keywords, format, count, minKarma), create actions
- Your reply should tell the user you're delegating to the sub-agent (e.g., "I'm asking my sub-agent to find those leads...")
- If information is missing, ask for it with actions set to []
- Trust the sub-agent to report if it can't complete the task`;
};

export async function runMainAgent(messages: ChatMessage[]): Promise<MainAgentDecision> {
  console.log("[MAIN AGENT] → Starting with", messages.length, "messages");

  // Prepend system instruction as first user message
  const systemPrompt = getSystemPrompt();
  const contentsWithSystem = [
    { role: "user" as const, parts: [{ text: systemPrompt }] },
    ...messages.map(({ role, content }) => ({ role, parts: [{ text: content }] }))
  ];

  console.log("[MAIN AGENT] → Calling Gemini API");
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-001",
    contents: contentsWithSystem,
    config: {
      responseMimeType: "application/json"
    }
  });

  const text = response.text;
  console.log("[MAIN AGENT] → Raw response:", text?.substring(0, 200) + "...");

  if (!text) {
    throw new Error("Main agent returned empty response");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
    console.log("[MAIN AGENT] → Parsed JSON successfully");
  } catch {
    console.error("[MAIN AGENT] → Failed to parse JSON:", text);
    throw new Error(`Main agent returned non-JSON payload: ${text}`);
  }

  const decision = MainAgentDecisionSchema.parse(parsed);
  console.log("[MAIN AGENT] → Decision validated:", {
    replyLength: decision.reply.length,
    actionCount: decision.actions.length
  });

  return decision;
}
