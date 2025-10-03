import { z } from "zod";

export const LeadActionSchema = z.object({
  type: z.literal("generate_lead"),
  subreddit: z.string().min(1),
  criteria: z.object({
    keywords: z.array(z.string()).min(1),
    minKarma: z.number().int().min(0).optional(),
    notes: z.string().optional()
  }),
  count: z.number().int().min(1)
});

export type LeadAction = z.infer<typeof LeadActionSchema>;

export const MainAgentDecisionSchema = z.object({
  reply: z.string().min(1),
  actions: z.array(LeadActionSchema)
});

export type MainAgentDecision = z.infer<typeof MainAgentDecisionSchema>;

export const SubAgentResultSchema = z.object({
  summary: z.string(),
  suggestedSearch: z.array(z.string()).optional(),
  extractionPlan: z.object({
    steps: z.array(z.string()),
    cssSelectors: z.array(z.string()).optional()
  }),
  risks: z.array(z.string()).optional()
});

export type SubAgentResult = z.infer<typeof SubAgentResultSchema>;
