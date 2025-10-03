import type { LeadAction, SubAgentResult } from "../types/actions";
import { runSubAgent } from "../agents/subAgent";
import { env } from "../config/env";

export interface ActionEvent {
  type: "subagent:start" | "subagent:result" | "subagent:error" | "subagent:unavailable";
  payload: unknown;
}

export async function processActions(actions: LeadAction[], emit: (event: ActionEvent) => void) {
  console.log("[ACTION PROCESSOR] → Processing actions:", { count: actions.length, actions });

  for (const action of actions) {
    console.log("[ACTION PROCESSOR] → Emitting subagent:start for:", action.subreddit);
    emit({ type: "subagent:start", payload: action });

    // Check if Playwright MCP is available
    if (!env.PLAYWRIGHT_AVAILABLE) {
      console.log("[ACTION PROCESSOR] → Playwright MCP unavailable, emitting subagent:unavailable");
      emit({
        type: "subagent:unavailable",
        payload: {
          action,
          message: "Playwright MCP is not available. Browser automation cannot be performed."
        }
      });
      continue;
    }

    try {
      console.log("[ACTION PROCESSOR] → Calling runSubAgent");
      const result: SubAgentResult = await runSubAgent(action);
      console.log("[ACTION PROCESSOR] → Sub-agent completed successfully");
      emit({ type: "subagent:result", payload: { action, result } });
    } catch (error) {
      console.error("[ACTION PROCESSOR] → Sub-agent error:", error);
      emit({ type: "subagent:error", payload: { action, error: (error as Error).message } });
    }
  }

  console.log("[ACTION PROCESSOR] → All actions processed");
}
