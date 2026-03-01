import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { buildPaginationMeta, parsePagination } from "../utils/pagination";
import { writeAuditLog } from "../utils/audit";
import { AppError } from "../utils/errors";
import { generateTemporaryPassword, hashPassword } from "../utils/auth";

export const createCustomer = async (req: Request, res: Response) => {
  const { name, email, phone, address, userId } = req.body as {
    name: string;
    email: string;
    phone: string;
    address: string;
    userId?: string;
  };

  const normalizedEmail = email.toLowerCase();
  const existingCustomer = await prisma.customer.findUnique({ where: { email: normalizedEmail } });
  if (existingCustomer) {
    throw new AppError("Customer email already exists", 409);
  }

  const existingUser = userId
    ? await prisma.user.findUnique({ where: { id: userId } })
    : await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (existingUser && existingUser.role !== "USER") {
    throw new AppError("Email already belongs to a non-customer account", 409);
  }

  let generatedPassword: string | null = null;

  const customer = await prisma.$transaction(async (tx) => {
    let linkedUser = existingUser;

    if (!linkedUser) {
      generatedPassword = generateTemporaryPassword();
      linkedUser = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash: await hashPassword(generatedPassword),
          role: "USER"
        }
      });
    }

    return tx.customer.create({
      data: {
        name,
        email: normalizedEmail,
        phone,
        address,
        userId: linkedUser.id
      },
      include: {
        kyc: true,
        subscriptions: true,
        user: { select: { id: true, email: true, role: true } }
      }
    });
  });

  await writeAuditLog({
    actorId: req.user?.id,
    customerId: customer.id,
    action: "CUSTOMER_CREATED",
    entityType: "customer",
    entityId: customer.id,
    metadata: { email: customer.email }
  });

  return res.status(201).json({
    customer,
    generatedCredentials: generatedPassword
      ? {
          email: customer.email,
          password: generatedPassword
        }
      : null
  });
};

export const getCustomers = async (req: Request, res: Response) => {
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const { page, limit, skip } = parsePagination(req);
  const where: Prisma.CustomerWhereInput | undefined = search
    ? {
        OR: [
          { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { email: { contains: search, mode: Prisma.QueryMode.insensitive } }
        ]
      }
    : undefined;

  const total = await prisma.customer.count({ where });

  const customers = await prisma.customer.findMany({
    where,
    include: {
      kyc: true,
      subscriptions: {
        orderBy: { createdAt: "desc" },
        take: 1
      }
    },
    orderBy: { createdAt: "desc" },
    skip,
    take: limit
  });

  return res.status(200).json({
    data: customers,
    pagination: buildPaginationMeta(total, page, limit)
  });
};

export const getCustomerById = async (req: Request, res: Response) => {
  const customerId = String(req.params.id);
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      kyc: true,
      subscriptions: {
        include: {
          webhookEvents: {
            orderBy: { createdAt: "desc" }
          }
        },
        orderBy: { createdAt: "desc" }
      },
      auditLogs: {
        include: {
          actor: {
            select: { id: true, email: true, role: true }
          }
        },
        orderBy: { createdAt: "desc" },
        take: 50
      }
    }
  });

  if (!customer) {
    throw new AppError("Customer not found", 404);
  }

  return res.status(200).json(customer);
};
