import { Router } from "express";
import { z } from "zod";
import { login, me, register } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth";
import { authRateLimiter } from "../middleware/rate-limit";
import { validateBody } from "../middleware/validate";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["ADMIN", "USER"]).optional(),
  name: z.string().min(2).optional(),
  phone: z.string().min(7).optional(),
  address: z.string().min(5).optional()
}).superRefine((value, ctx) => {
  const role = value.role ?? "USER";
  if (role === "USER") {
    if (!value.name) {
      ctx.addIssue({ code: "custom", path: ["name"], message: "Name is required for user registration" });
    }
    if (!value.phone) {
      ctx.addIssue({ code: "custom", path: ["phone"], message: "Phone is required for user registration" });
    }
    if (!value.address) {
      ctx.addIssue({ code: "custom", path: ["address"], message: "Address is required for user registration" });
    }
  }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

router.post("/register", authRateLimiter, validateBody(registerSchema), register);
router.post("/login", authRateLimiter, validateBody(loginSchema), login);
router.get("/me", requireAuth, me);

export default router;
