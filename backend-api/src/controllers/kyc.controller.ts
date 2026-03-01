import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { writeAuditLog } from "../utils/audit";
import { AppError } from "../utils/errors";

const assertCustomerAccess = async (customerId: string, userId: string, role: "ADMIN" | "USER") => {
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) {
    throw new AppError("Customer not found", 404);
  }

  if (role === "USER" && customer.userId !== userId) {
    throw new AppError("Forbidden", 403);
  }
};

export const submitKyc = async (req: Request, res: Response) => {
  if (req.user?.role !== "USER") {
    throw new AppError("Only customers can submit KYC", 403);
  }

  const customerId = String(req.params.id);
  await assertCustomerAccess(customerId, req.user!.id, req.user!.role);

  const { documentType, documentNumber, notes } = req.body as {
    documentType: string;
    documentNumber: string;
    notes?: string;
  };

  const kyc = await prisma.kyc.upsert({
    where: { customerId },
    create: {
      customerId,
      documentType,
      documentNumber,
      notes,
      dateSubmitted: new Date(),
      status: "PENDING"
    },
    update: {
      documentType,
      documentNumber,
      notes,
      dateSubmitted: new Date(),
      status: "PENDING",
      rejectionReason: null,
      reviewedAt: null,
      reviewedById: null
    }
  });

  return res.status(200).json(kyc);
};

const updateKycStatus = async (
  customerId: string,
  adminUserId: string,
  status: "PENDING" | "APPROVED" | "REJECTED",
  reason?: string
) => {
  const kyc = await prisma.kyc.findUnique({ where: { customerId } });
  if (!kyc) {
    throw new AppError("KYC not submitted", 404);
  }

  const updated = await prisma.kyc.update({
    where: { customerId },
    data: {
      status,
      rejectionReason: status === "REJECTED" ? reason ?? null : null,
      reviewedAt: new Date(),
      reviewedById: adminUserId
    }
  });

  return updated;
};

export const approveKyc = async (req: Request, res: Response) => {
  const customerId = String(req.params.id);
  const updated = await updateKycStatus(customerId, req.user!.id, "APPROVED");

  await writeAuditLog({
    actorId: req.user?.id,
    customerId,
    action: "KYC_APPROVED",
    entityType: "kyc",
    entityId: updated.id
  });

  return res.status(200).json(updated);
};

export const rejectKyc = async (req: Request, res: Response) => {
  const customerId = String(req.params.id);
  const { reason } = req.body as { reason: string };
  const updated = await updateKycStatus(customerId, req.user!.id, "REJECTED", reason);

  await writeAuditLog({
    actorId: req.user?.id,
    customerId,
    action: "KYC_REJECTED",
    entityType: "kyc",
    entityId: updated.id,
    metadata: { reason }
  });

  return res.status(200).json(updated);
};

export const changeKycStatus = async (req: Request, res: Response) => {
  const customerId = String(req.params.id);
  const { status, reason } = req.body as {
    status: "PENDING" | "APPROVED" | "REJECTED";
    reason?: string;
  };

  if (status === "REJECTED" && !reason?.trim()) {
    throw new AppError("Rejection reason is required", 422);
  }

  const updated = await updateKycStatus(customerId, req.user!.id, status, reason?.trim());

  const action =
    status === "APPROVED"
      ? "KYC_APPROVED"
      : status === "REJECTED"
        ? "KYC_REJECTED"
        : "KYC_RESET_TO_PENDING";

  await writeAuditLog({
    actorId: req.user?.id,
    customerId,
    action,
    entityType: "kyc",
    entityId: updated.id,
    metadata: status === "REJECTED" ? { reason: reason?.trim() } : { status }
  });

  return res.status(200).json(updated);
};
