import { Router } from "express";
import { z } from "zod";
import {
  createSubscriptionPlan,
  deleteSubscriptionPlan,
  listSubscriptionPlans,
  updateSubscriptionPlan
} from "../controllers/subscription-plans.controller";
import { requireAuth, requireRole } from "../middleware/auth";
import { validateBody } from "../middleware/validate";

const router = Router();

const subscriptionPlanSchema = z.object({
  name: z.string().min(2),
  description: z.string().max(240).optional().or(z.literal("")),
  amount: z.number().int().positive(),
  currency: z.string().length(3),
  isActive: z.boolean().optional()
});

const subscriptionPlanUpdateSchema = subscriptionPlanSchema.extend({
  isActive: z.boolean()
});

router.get("/", requireAuth, listSubscriptionPlans);
router.post("/", requireAuth, requireRole("ADMIN"), validateBody(subscriptionPlanSchema), createSubscriptionPlan);
router.put("/:id", requireAuth, requireRole("ADMIN"), validateBody(subscriptionPlanUpdateSchema), updateSubscriptionPlan);
router.delete("/:id", requireAuth, requireRole("ADMIN"), deleteSubscriptionPlan);

export default router;
