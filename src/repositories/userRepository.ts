import { query } from "../config/db";

export interface UserRow {
  id: string;
  full_name: string;
  email: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export const createUser = async (fullName: string, email: string, passwordHash: string) => {
  const result = await query(
    `INSERT INTO yash.users (full_name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [fullName, email.toLowerCase(), passwordHash]
  );
  const user = result.rows[0];
  if (!user) throw new Error("Failed to create user");
  return user as UserRow;
};

export const findUserByEmail = async (email: string) => {
  const result = await query(`SELECT * FROM yash.users WHERE email = $1`, [email.toLowerCase()]);
  return result.rows[0] as UserRow | undefined;
};

export const findUserById = async (id: string) => {
  const result = await query(`SELECT * FROM yash.users WHERE id = $1`, [id]);
  return result.rows[0] as UserRow | undefined;
};
