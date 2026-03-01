import { Router } from "express";
import { z } from "zod";
import { approveKyc, changeKycStatus, rejectKyc, submitKyc } from "../controllers/kyc.controller";
import { requireAuth, requireRole } from "../middleware/auth";
import { validateBody } from "../middleware/validate";

const router = Router();

const submitKycSchema = z.object({
  documentType: z.string().min(2),
  documentNumber: z.string().min(4),
  notes: z.string().optional()
});

const rejectKycSchema = z.object({
  reason: z.string().min(3)
});

const changeKycStatusSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
  reason: z.string().optional()
});

router.post(
  "/customers/:id/kyc/submit",
  requireAuth,
  requireRole("USER"),
  validateBody(submitKycSchema),
  submitKyc
);
router.post("/customers/:id/kyc/approve", requireAuth, requireRole("ADMIN"), approveKyc);
router.post(
  "/customers/:id/kyc/reject",
  requireAuth,
  requireRole("ADMIN"),
  validateBody(rejectKycSchema),
  rejectKyc
);
router.post(
  "/customers/:id/kyc/status",
  requireAuth,
  requireRole("ADMIN"),
  validateBody(changeKycStatusSchema),
  changeKycStatus
);

export default router;
