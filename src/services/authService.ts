import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { createUser, findUserByEmail, type UserRow } from "../repositories/userRepository";

const SALT_ROUNDS = 12;

export const registerUser = async (fullName: string, email: string, password: string) => {
  const existing = await findUserByEmail(email);
  if (existing) throw new Error("Email already in use");

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await createUser(fullName, email, passwordHash);
  return user;
};

export const authenticateUser = async (email: string, password: string) => {
  const user = await findUserByEmail(email);
  if (!user) throw new Error("Invalid credentials");

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) throw new Error("Invalid credentials");

  return user;
};

export const issueToken = (user: UserRow): string => {
  return jwt.sign({ sub: user.id }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions);
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, env.JWT_SECRET) as { sub: string; iat: number; exp: number };
};
