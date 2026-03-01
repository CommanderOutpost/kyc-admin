import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

type AppRole = "ADMIN" | "USER";

export const hashPassword = (password: string) => bcrypt.hash(password, env.BCRYPT_ROUNDS);
export const comparePassword = (password: string, hash: string) => bcrypt.compare(password, hash);
export const generateTemporaryPassword = (length = 12) =>
  crypto
    .randomBytes(length)
    .toString("base64")
    .replace(/[^A-Za-z0-9]/g, "")
    .slice(0, length);

export const signToken = (user: { id: string; role: AppRole }) =>
  jwt.sign(user, env.JWT_SECRET, { expiresIn: "1d" });

export const verifyToken = (token: string) =>
  jwt.verify(token, env.JWT_SECRET) as {
    id: string;
    role: AppRole;
    iat: number;
    exp: number;
  };
