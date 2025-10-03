import { GoogleGenAI } from "@google/genai";
import { SubAgentResultSchema, type LeadAction, type SubAgentResult } from "../types/actions";
import { env } from "../config/env";

const ai = new GoogleGenAI({});

const getSubAgentPrompt = (playwrightAvailable: boolean) => {
  if (!playwrightAvailable) {
    return `You are a sub-agent tasked with lead harvesting, but Playwright MCP is currently unavailable.

Respond with JSON explaining this limitation:
{
  "summary": "Playwright MCP browser automation is currently offline and cannot execute this task.",
  "suggestedSearch": [],
  "extractionPlan": {
    "steps": ["Wait for Playwright MCP to be enabled"],
    "cssSelectors": []
  },
  "risks": ["Browser automation is unavailable"]
}`;
  }

  return `You are a research specialist who prepares actionable steps for harvesting leads from Reddit using Playwright MCP.
Input will contain subreddit, criteria, and desired count.
Return JSON with: summary, suggestedSearch (array), extractionPlan { steps[], cssSelectors[] }, risks[].
Do not suggest automation steps that violate Reddit policies.`;
};

export async function runSubAgent(action: LeadAction): Promise<SubAgentResult> {
  console.log("[SUB AGENT] → Starting for subreddit:", action.subreddit);
  console.log("[SUB AGENT] → Action:", action);
  console.log("[SUB AGENT] → Playwright available:", env.PLAYWRIGHT_AVAILABLE);

  const subAgentPrompt = getSubAgentPrompt(env.PLAYWRIGHT_AVAILABLE);

  console.log("[SUB AGENT] → Calling Gemini API");
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-001",
    contents: [
      {
        role: "user",
        parts: [{ text: subAgentPrompt }]
      },
      {
        role: "user",
        parts: [{
          text: JSON.stringify({
            instruction: "Prepare a lead harvesting plan",
            action
          })
        }]
      }
    ],
    config: { responseMimeType: "application/json" }
  });

  const text = response.text;
  console.log("[SUB AGENT] → Raw response:", text?.substring(0, 200) + "...");

  if (!text) {
    console.error("[SUB AGENT] → Empty response");
    throw new Error("Sub agent returned empty response");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
    console.log("[SUB AGENT] → Parsed JSON successfully");
  } catch {
    console.error("[SUB AGENT] → Failed to parse JSON:", text);
    throw new Error(`Sub agent returned non-JSON payload: ${text}`);
  }

  const result = SubAgentResultSchema.parse(parsed);
  console.log("[SUB AGENT] → Result validated:", {
    summaryLength: result.summary.length,
    stepCount: result.extractionPlan.steps.length
  });

  return result;
}
