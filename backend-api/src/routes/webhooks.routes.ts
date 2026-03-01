import { Router } from "express";
import { z } from "zod";
import { getWebhookEvents, handlePaymentWebhook } from "../controllers/webhooks.controller";
import { requireAuth, requireRole } from "../middleware/auth";
import { validateBody } from "../middleware/validate";

const router = Router();

const webhookSchema = z.object({
  eventType: z.enum(["payment.success", "payment.failed", "subscription.canceled"]),
  subscriptionId: z.string(),
  paymentReference: z.string().optional()
});

router.post("/payments", validateBody(webhookSchema), handlePaymentWebhook);
router.get("/events", requireAuth, requireRole("ADMIN"), getWebhookEvents);

export default router;
