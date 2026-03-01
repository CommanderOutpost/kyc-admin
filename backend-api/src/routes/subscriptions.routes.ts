import { Router } from "express";
import { z } from "zod";
import {
  cancelSubscription,
  createSubscription,
  getCustomerSubscriptions,
  startSubscription
} from "../controllers/subscriptions.controller";
import { requireAuth, requireRole } from "../middleware/auth";
import { validateBody } from "../middleware/validate";

const router = Router();

const createSubscriptionSchema = z.object({
  planId: z.string().min(1)
});

router.post(
  "/customers/:id/subscriptions",
  requireAuth,
  validateBody(createSubscriptionSchema),
  createSubscription
);
router.get("/customers/:id/subscriptions", requireAuth, getCustomerSubscriptions);
router.post("/subscriptions/:id/cancel", requireAuth, cancelSubscription);
router.post("/subscriptions/:id/start", requireAuth, startSubscription);

export default router;
