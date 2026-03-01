import { Router } from "express";
import { getAuditLogs } from "../controllers/audit.controller";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

router.get("/", requireAuth, requireRole("ADMIN"), getAuditLogs);

export default router;
