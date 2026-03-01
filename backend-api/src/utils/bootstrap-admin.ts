import { prisma } from "../config/prisma";
import { env } from "../config/env";
import { hashPassword } from "./auth";

export const ensureDefaultAdmin = async () => {
  const existingAdmin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true, email: true }
  });

  if (existingAdmin) {
    return existingAdmin;
  }

  const admin = await prisma.user.create({
    data: {
      email: env.DEFAULT_ADMIN_EMAIL.toLowerCase(),
      passwordHash: await hashPassword(env.DEFAULT_ADMIN_PASSWORD),
      role: "ADMIN"
    },
    select: { id: true, email: true }
  });

  return admin;
};
