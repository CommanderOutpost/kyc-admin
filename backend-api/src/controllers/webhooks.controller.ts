import { Request, Response } from "express";
import { env } from "../config/env";
import { prisma } from "../config/prisma";
import { writeAuditLog } from "../utils/audit";
import { buildPaginationMeta, parsePagination } from "../utils/pagination";
import {
  canActivateSubscription,
  isValidWebhookSignature,
  resolveSubscriptionStatus
} from "../utils/webhook";

type WebhookPayload = {
  eventType: "payment.success" | "payment.failed" | "subscription.canceled";
  subscriptionId: string;
  paymentReference?: string;
};

export const handlePaymentWebhook = async (req: Request, res: Response) => {
  const signature = req.header("x-webhook-signature") || "";
  const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body || {}));
  const isValid = signature.length > 0 && isValidWebhookSignature(rawBody, env.WEBHOOK_SECRET, signature);
  const payload = req.body as WebhookPayload;

  const event = await prisma.webhookEvent.create({
    data: {
      eventType: payload.eventType || "unknown",
      signature,
      isValid,
      payload,
      subscriptionId: payload.subscriptionId || null
    }
  });

  if (!isValid) {
    await writeAuditLog({
      action: "WEBHOOK_REJECTED",
      entityType: "webhook_event",
      entityId: event.id,
      metadata: { reason: "invalid_signature", eventType: payload.eventType }
    });
    return res.status(401).json({ error: "Invalid webhook signature", eventId: event.id });
  }

  const subscription = await prisma.subscription.findUnique({
    where: { id: payload.subscriptionId },
    include: {
      customer: {
        include: {
          kyc: true
        }
      }
    }
  });

  if (!subscription) {
    await writeAuditLog({
      action: "WEBHOOK_IGNORED",
      entityType: "webhook_event",
      entityId: event.id,
      metadata: { reason: "subscription_not_found", subscriptionId: payload.subscriptionId }
    });
    return res.status(200).json({ received: true, eventId: event.id, processed: false, reason: "subscription_not_found" });
  }

  let nextStatus = resolveSubscriptionStatus(payload.eventType, subscription.status);
  if (payload.eventType === "payment.success" && !canActivateSubscription(subscription.customer.kyc?.status)) {
    nextStatus = "INACTIVE";
  }

  const updateData: {
    status: "INACTIVE" | "ACTIVE" | "PAST_DUE" | "CANCELED";
    renewalDate?: Date;
    startDate?: Date;
    canceledAt?: Date;
  } = { status: nextStatus };

  if (payload.eventType === "payment.success" && nextStatus === "ACTIVE") {
    const now = new Date();
    updateData.startDate = subscription.startDate ?? now;
    updateData.renewalDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  }

  if (payload.eventType === "subscription.canceled") {
    updateData.canceledAt = new Date();
  }

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: updateData
  });

  await prisma.webhookEvent.update({
    where: { id: event.id },
    data: { processedAt: new Date() }
  });

  await writeAuditLog({
    customerId: subscription.customerId,
    action: "WEBHOOK_PROCESSED",
    entityType: "subscription",
    entityId: subscription.id,
    metadata: { eventType: payload.eventType, resultingStatus: nextStatus, eventId: event.id }
  });

  return res.status(200).json({ received: true, eventId: event.id, processed: true, status: nextStatus });
};

export const getWebhookEvents = async (req: Request, res: Response) => {
  const { page, limit, skip } = parsePagination(req);
  const total = await prisma.webhookEvent.count();

  const events = await prisma.webhookEvent.findMany({
    orderBy: { createdAt: "desc" },
    skip,
    take: limit
  });

  return res.status(200).json({
    data: events,
    pagination: buildPaginationMeta(total, page, limit)
  });
};
