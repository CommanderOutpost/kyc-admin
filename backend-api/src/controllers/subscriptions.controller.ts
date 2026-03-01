import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { writeAuditLog } from "../utils/audit";
import { AppError } from "../utils/errors";
import { buildPaginationMeta, parsePagination } from "../utils/pagination";

const assertCustomerAccess = async (customerId: string, userId: string, role: "ADMIN" | "USER") => {
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) {
    throw new AppError("Customer not found", 404);
  }

  if (role === "USER" && customer.userId !== userId) {
    throw new AppError("Forbidden", 403);
  }
};

export const createSubscription = async (req: Request, res: Response) => {
  const customerId = String(req.params.id);
  await assertCustomerAccess(customerId, req.user!.id, req.user!.role);
  const customer = await prisma.customer.findUnique({ where: { id: customerId }, include: { kyc: true } });

  if (!customer) {
    throw new AppError("Customer not found", 404);
  }

  const { planId } = req.body as {
    planId: string;
  };
  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });

  if (!plan || !plan.isActive) {
    throw new AppError("Subscription plan not found", 404);
  }

  const subscription = await prisma.subscription.create({
    data: {
      customerId,
      planId: plan.id,
      plan: plan.name,
      amount: plan.amount,
      currency: plan.currency,
      status: "INACTIVE"
    },
    include: {
      subscriptionPlan: true
    }
  });

  await writeAuditLog({
    actorId: req.user?.id,
    customerId,
    action: "SUBSCRIPTION_CREATED",
    entityType: "subscription",
    entityId: subscription.id,
    metadata: { planId: plan.id, plan: plan.name, amount: plan.amount, currency: plan.currency }
  });

  return res.status(201).json({
    ...subscription,
    activationBlockedUntilKycApproved: customer.kyc?.status !== "APPROVED"
  });
};

export const getCustomerSubscriptions = async (req: Request, res: Response) => {
  const customerId = String(req.params.id);
  await assertCustomerAccess(customerId, req.user!.id, req.user!.role);
  const { page, limit, skip } = parsePagination(req);

  const total = await prisma.subscription.count({
    where: { customerId }
  });

  const subscriptions = await prisma.subscription.findMany({
    where: { customerId },
    include: {
      subscriptionPlan: true
    },
    orderBy: { createdAt: "desc" },
    skip,
    take: limit
  });

  return res.status(200).json({
    data: subscriptions,
    pagination: buildPaginationMeta(total, page, limit)
  });
};

export const cancelSubscription = async (req: Request, res: Response) => {
  const subscriptionId = String(req.params.id);
  const existing = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { customer: true }
  });
  if (!existing) {
    throw new AppError("Subscription not found", 404);
  }

  if (req.user?.role === "USER" && existing.customer.userId !== req.user.id) {
    throw new AppError("Forbidden", 403);
  }

  if (req.user?.role !== "USER" && req.user?.role !== "ADMIN") {
    throw new AppError("Forbidden", 403);
  }

  const subscription = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: "CANCELED",
      canceledAt: new Date()
    }
  });

  await writeAuditLog({
    actorId: req.user?.id,
    customerId: existing.customerId,
    action: "SUBSCRIPTION_CANCELED",
    entityType: "subscription",
    entityId: subscription.id
  });

  return res.status(200).json(subscription);
};

export const startSubscription = async (req: Request, res: Response) => {
  const subscriptionId = String(req.params.id);
  const existing = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { customer: true }
  });

  if (!existing) {
    throw new AppError("Subscription not found", 404);
  }

  if (req.user?.role === "USER" && existing.customer.userId !== req.user.id) {
    throw new AppError("Forbidden", 403);
  }

  if (req.user?.role !== "USER" && req.user?.role !== "ADMIN") {
    throw new AppError("Forbidden", 403);
  }

  if (existing.status === "ACTIVE") {
    throw new AppError("Subscription is already active", 409);
  }

  const subscription = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: "INACTIVE",
      canceledAt: null
    }
  });

  await writeAuditLog({
    actorId: req.user?.id,
    customerId: existing.customerId,
    action: "SUBSCRIPTION_STARTED",
    entityType: "subscription",
    entityId: subscription.id
  });

  return res.status(200).json(subscription);
};
