import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { comparePassword, hashPassword, signToken } from "../utils/auth";
import { AppError } from "../utils/errors";

export const register = async (req: Request, res: Response) => {
  const { email, password, role, name, phone, address } = req.body as {
    email: string;
    password: string;
    role?: "ADMIN" | "USER";
    name?: string;
    phone?: string;
    address?: string;
  };
  const normalizedEmail = email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    throw new AppError("Email already registered", 409);
  }

  const resolvedRole = role ?? "USER";

  if (resolvedRole === "USER" && (!name || !phone || !address)) {
    throw new AppError("Name, phone, and address are required for user registration", 422);
  }

  const user = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        email: normalizedEmail,
        passwordHash: await hashPassword(password),
        role: resolvedRole
      },
      select: { id: true, email: true, role: true }
    });

    if (resolvedRole === "USER") {
      await tx.customer.create({
        data: {
          name: name!,
          email: normalizedEmail,
          phone: phone!,
          address: address!,
          userId: createdUser.id
        }
      });
    }

    return createdUser;
  });

  return res.status(201).json(user);
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !(await comparePassword(password, user.passwordHash))) {
    throw new AppError("Invalid credentials", 401);
  }

  const token = signToken({ id: user.id, role: user.role });

  return res.status(200).json({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role
    }
  });
};

export const me = async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: {
      customer: {
        include: {
          kyc: true,
          subscriptions: {
            orderBy: { createdAt: "desc" }
          }
        }
      }
    }
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return res.status(200).json({
    id: user.id,
    email: user.email,
    role: user.role,
    customer: user.customer
  });
};
