import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import authRoutes from "./routes/auth.routes";
import auditRoutes from "./routes/audit.routes";
import customersRoutes from "./routes/customers.routes";
import kycRoutes from "./routes/kyc.routes";
import subscriptionsRoutes from "./routes/subscriptions.routes";
import subscriptionPlansRoutes from "./routes/subscription-plans.routes";
import webhooksRoutes from "./routes/webhooks.routes";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";

export const app = express();

app.use(
  express.json({
    verify: (req, _res, buf) => {
      (req as any).rawBody = Buffer.from(buf);
    }
  })
);
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));
app.get("/docs.json", (_req, res) => res.status(200).json(swaggerSpec));
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/auth", authRoutes);
app.use("/customers", customersRoutes);
app.use("/", kycRoutes);
app.use("/", subscriptionsRoutes);
app.use("/subscription-plans", subscriptionPlansRoutes);
app.use("/webhooks", webhooksRoutes);
app.use("/audit-logs", auditRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
