import { Router } from "express";
import { z } from "zod";
import { createCustomer, getCustomerById, getCustomers } from "../controllers/customers.controller";
import { requireAuth, requireRole } from "../middleware/auth";
import { validateBody } from "../middleware/validate";

const router = Router();

const createCustomerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  address: z.string().min(5),
  userId: z.string().optional()
});

router.post("/", requireAuth, requireRole("ADMIN"), validateBody(createCustomerSchema), createCustomer);
router.get("/", requireAuth, requireRole("ADMIN"), getCustomers);
router.get("/:id", requireAuth, requireRole("ADMIN"), getCustomerById);

export default router;
