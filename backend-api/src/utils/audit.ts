import { prisma } from "../config/prisma";

type AuditLogInput = {
  actorId?: string;
  customerId?: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: unknown;
};

export const writeAuditLog = async (input: AuditLogInput) => {
  await prisma.auditLog.create({
    data: {
      actorId: input.actorId,
      customerId: input.customerId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: (input.metadata ?? null) as any
    }
  });
};
