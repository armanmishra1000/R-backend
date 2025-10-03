import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { registerUser, authenticateUser, issueToken } from "../services/authService";
import { requireAuth } from "../middleware/auth";
import { env } from "../config/env";

const registerSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: env.NODE_ENV === "production",
  path: "/",
};

export const registerAuthRoutes = (app: Router) => {
  app.post("/auth/register", async (req: Request, res: Response) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    try {
      const user = await registerUser(parsed.data.fullName, parsed.data.email, parsed.data.password);
      const token = issueToken(user);
      res.cookie("token", token, cookieOptions);
      res.status(201).json({ id: user.id, fullName: user.full_name, email: user.email });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.post("/auth/login", async (req: Request, res: Response) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    try {
      const user = await authenticateUser(parsed.data.email, parsed.data.password);
      const token = issueToken(user);
      res.cookie("token", token, cookieOptions);
      res.json({ id: user.id, fullName: user.full_name, email: user.email });
    } catch (error) {
      res.status(401).json({ error: (error as Error).message });
    }
  });

  app.post("/auth/logout", (_req: Request, res: Response) => {
    res.clearCookie("token", cookieOptions);
    res.status(204).end();
  });

  app.get("/me", requireAuth, async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    res.json({ id: req.user.id, fullName: req.user.full_name, email: req.user.email });
  });
};
