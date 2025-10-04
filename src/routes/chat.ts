import { Router, type Request, type Response } from "express";
import { runMainAgent } from "../agents/mainAgent";
import { processActions } from "../services/actionProcessor";
import { requireAuth } from "../middleware/auth";
import type { ChatMessage } from "../types/chat";

/**
 * Register the POST /chat endpoint (protected by authentication) which accepts a sequence of chat messages,
 * invokes the main agent to produce a reply and actions, and streams the reply, action events, and a completion or error event via Server-Sent Events.
 *
 * @param app - Express Router to which the chat route will be attached
 */
export function registerChatRoute(app: Router) {
  app.post("/chat", requireAuth, async (req: Request, res: Response) => {
    const { messages } = req.body as { messages: ChatMessage[] };

    if (!Array.isArray(messages)) {
      console.error("[CHAT ROUTE] → Invalid request: messages not array");
      return res.status(400).json({ error: "messages must be an array" });
    }

    console.log("[CHAT ROUTE] → Received request with", messages.length, "messages");
    console.log("[CHAT ROUTE] → Last message:", messages[messages.length - 1]);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering
    res.flushHeaders(); // Flush headers to establish SSE connection immediately

    try {
      console.log("[CHAT ROUTE] → Calling main agent");
      // Get main agent decision (non-streaming)
      const decision = await runMainAgent(messages);
      console.log("[CHAT ROUTE] → Main agent decision:", { reply: decision.reply, actionCount: decision.actions.length });

      // Stream the reply immediately
      const replyEvent = { type: "reply", text: decision.reply };
      console.log("[CHAT ROUTE] → Streaming reply event");
      res.write(`data: ${JSON.stringify(replyEvent)}\n\n`);

      // If no actions, we're done
      if (!decision.actions.length) {
        console.log("[CHAT ROUTE] → No actions, completing");
        res.write(`data: ${JSON.stringify({ type: "complete" })}\n\n`);
        return res.end();
      }

      // Process actions with sub-agent
      console.log("[CHAT ROUTE] → Processing", decision.actions.length, "actions");
      await processActions(decision.actions, (event) => {
        console.log("[CHAT ROUTE] → Streaming event:", event.type);
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      });

      console.log("[CHAT ROUTE] → All done, sending complete");
      res.write(`data: ${JSON.stringify({ type: "complete" })}\n\n`);
      res.end();
    } catch (error) {
      console.error("[CHAT ROUTE] → Error:", error);
      res.write(`data: ${JSON.stringify({ type: "error", message: (error as Error).message })}\n\n`);
      res.end();
    }
  });
}