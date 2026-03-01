import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/errors";

export const listSubscriptionPlans = async (_req: Request, res: Response) => {
  const plans = await prisma.subscriptionPlan.findMany({
    orderBy: [{ isActive: "desc" }, { amount: "asc" }]
  });

  return res.status(200).json(plans);
};

export const createSubscriptionPlan = async (req: Request, res: Response) => {
  const { name, description, amount, currency, isActive } = req.body as {
    name: string;
    description?: string;
    amount: number;
    currency: string;
    isActive?: boolean;
  };

  const existing = await prisma.subscriptionPlan.findUnique({
    where: { name: name.trim().toUpperCase() }
  });

  if (existing) {
    throw new AppError("Subscription plan already exists", 409);
  }

  const plan = await prisma.subscriptionPlan.create({
    data: {
      name: name.trim().toUpperCase(),
      description: description?.trim() || null,
      amount,
      currency: currency.trim().toUpperCase(),
      isActive: isActive ?? true
    }
  });

  return res.status(201).json(plan);
};

export const updateSubscriptionPlan = async (req: Request, res: Response) => {
  const planId = String(req.params.id);
  const { name, description, amount, currency, isActive } = req.body as {
    name: string;
    description?: string;
    amount: number;
    currency: string;
    isActive: boolean;
  };

  const existing = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
  if (!existing) {
    throw new AppError("Subscription plan not found", 404);
  }

  const normalizedName = name.trim().toUpperCase();
  const conflict = await prisma.subscriptionPlan.findFirst({
    where: {
      name: normalizedName,
      NOT: { id: planId }
    }
  });

  if (conflict) {
    throw new AppError("Subscription plan already exists", 409);
  }

  const plan = await prisma.subscriptionPlan.update({
    where: { id: planId },
    data: {
      name: normalizedName,
      description: description?.trim() || null,
      amount,
      currency: currency.trim().toUpperCase(),
      isActive
    }
  });

  return res.status(200).json(plan);
};

export const deleteSubscriptionPlan = async (req: Request, res: Response) => {
  const planId = String(req.params.id);
  const usageCount = await prisma.subscription.count({ where: { planId } });
  if (usageCount > 0) {
    throw new AppError("Cannot delete a plan that already has subscriptions", 409);
  }

  await prisma.subscriptionPlan.delete({ where: { id: planId } });
  return res.status(204).send();
};
