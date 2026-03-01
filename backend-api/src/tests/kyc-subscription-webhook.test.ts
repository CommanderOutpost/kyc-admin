process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/kyc_admin";
process.env.JWT_SECRET = "supersecuresecretkey";
process.env.WEBHOOK_SECRET = "webhooksecret";
process.env.BCRYPT_ROUNDS = "4";

import { approveKyc, changeKycStatus } from "../controllers/kyc.controller";
import { createSubscription, startSubscription } from "../controllers/subscriptions.controller";
import { handlePaymentWebhook } from "../controllers/webhooks.controller";
import { prisma } from "../config/prisma";
import { computeWebhookSignature, resolveSubscriptionStatus } from "../utils/webhook";
import { createMockResponse } from "./test-helpers";

jest.mock("../config/prisma", () => {
  const prismaMock = {
    kyc: {
      findUnique: jest.fn(),
      update: jest.fn()
    },
    customer: {
      findUnique: jest.fn()
    },
    subscriptionPlan: {
      findUnique: jest.fn()
    },
    subscription: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn()
    },
    webhookEvent: {
      create: jest.fn(),
      update: jest.fn()
    },
    auditLog: {
      create: jest.fn()
    }
  };

  return { prisma: prismaMock };
});

describe("kyc, subscription, and webhook logic", () => {
  it("approves submitted kyc", async () => {
    const req = {
      params: { id: "cust_1" },
      user: { id: "admin_1", role: "ADMIN" }
    } as any;
    const res = createMockResponse();

    (prisma.kyc.findUnique as jest.Mock).mockResolvedValue({ id: "kyc_1" });
    (prisma.kyc.update as jest.Mock).mockResolvedValue({ status: "APPROVED", reviewedById: "admin_1" });

    await approveKyc(req, res as any);

    expect(prisma.kyc.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "APPROVED", reviewedById: "admin_1" })
      })
    );
    expect((res.status as jest.Mock).mock.calls[0][0]).toBe(200);
  });

  it("can reset kyc back to pending", async () => {
    const req = {
      params: { id: "cust_1" },
      body: { status: "PENDING" },
      user: { id: "admin_1", role: "ADMIN" }
    } as any;
    const res = createMockResponse();

    (prisma.kyc.findUnique as jest.Mock).mockResolvedValue({ id: "kyc_1", status: "APPROVED" });
    (prisma.kyc.update as jest.Mock).mockResolvedValue({ id: "kyc_1", status: "PENDING" });

    await changeKycStatus(req, res as any);

    expect(prisma.kyc.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "PENDING" })
      })
    );
    expect((res.status as jest.Mock).mock.calls[0][0]).toBe(200);
  });

  it("creates inactive subscription and indicates kyc block", async () => {
    const req = {
      params: { id: "cust_1" },
      user: { id: "admin_1", role: "ADMIN" },
      body: { planId: "plan_pro" }
    } as any;
    const res = createMockResponse();

    (prisma.customer.findUnique as jest.Mock).mockResolvedValue({
      id: "cust_1",
      userId: "user_1",
      kyc: { status: "PENDING" }
    });
    (prisma.subscriptionPlan.findUnique as jest.Mock).mockResolvedValue({
      id: "plan_pro",
      name: "PRO",
      amount: 1500000,
      currency: "NGN",
      isActive: true
    });
    (prisma.subscription.create as jest.Mock).mockResolvedValue({
      id: "sub_1",
      status: "INACTIVE",
      plan: "PRO",
      amount: 500000,
      currency: "NGN",
      subscriptionPlan: { id: "plan_pro", name: "PRO" }
    });

    await createSubscription(req, res as any);

    expect(prisma.subscription.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "INACTIVE",
          plan: "PRO",
          planId: "plan_pro",
          amount: 1500000,
          currency: "NGN"
        })
      })
    );
    expect((res.json as jest.Mock).mock.calls[0][0].activationBlockedUntilKycApproved).toBe(true);
  });

  it("processes payment success webhook and activates subscription if kyc approved", async () => {
    const body = { eventType: "payment.success", subscriptionId: "sub_approved" };
    const rawBody = Buffer.from(JSON.stringify(body));
    const signature = computeWebhookSignature(rawBody, "webhooksecret");

    const req = {
      body,
      rawBody,
      header: jest.fn().mockReturnValue(signature)
    } as any;
    const res = createMockResponse();

    (prisma.webhookEvent.create as jest.Mock).mockResolvedValue({ id: "evt_1" });
    (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
      id: "sub_approved",
      customerId: "cust_1",
      status: "INACTIVE",
      startDate: null,
      customer: { kyc: { status: "APPROVED" } }
    });
    (prisma.subscription.update as jest.Mock).mockResolvedValue({});
    (prisma.webhookEvent.update as jest.Mock).mockResolvedValue({});

    await handlePaymentWebhook(req, res as any);

    expect(prisma.subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "ACTIVE" })
      })
    );
    expect((res.status as jest.Mock).mock.calls[0][0]).toBe(200);
  });

  it("resolves payment.failed into PAST_DUE", () => {
    expect(resolveSubscriptionStatus("payment.failed", "ACTIVE")).toBe("PAST_DUE");
  });

  it("can restart a canceled subscription", async () => {
    const req = {
      params: { id: "sub_1" },
      user: { id: "user_1", role: "USER" }
    } as any;
    const res = createMockResponse();

    (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
      id: "sub_1",
      customerId: "cust_1",
      status: "CANCELED",
      customer: { userId: "user_1" }
    });
    (prisma.subscription.update as jest.Mock).mockResolvedValue({
      id: "sub_1",
      status: "INACTIVE",
      canceledAt: null
    });

    await startSubscription(req, res as any);

    expect(prisma.subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "INACTIVE", canceledAt: null })
      })
    );
    expect((res.status as jest.Mock).mock.calls[0][0]).toBe(200);
  });
});
