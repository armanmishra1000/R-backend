import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../services/authService";
import { findUserById, type UserRow } from "../repositories/userRepository";

declare global {
  namespace Express {
    interface Request {
      user?: UserRow;
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const payload = verifyToken(token);
    const user = await findUserById(payload.sub);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized" });
  }
};
