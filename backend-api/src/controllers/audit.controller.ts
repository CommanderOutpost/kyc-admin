import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { buildPaginationMeta, parsePagination } from "../utils/pagination";

export const getAuditLogs = async (req: Request, res: Response) => {
  const customerId = typeof req.query.customerId === "string" ? req.query.customerId : undefined;
  const action = typeof req.query.action === "string" ? req.query.action : undefined;
  const { page, limit, skip } = parsePagination(req);
  const where = {
    customerId,
    action
  };

  const total = await prisma.auditLog.count({ where });

  const logs = await prisma.auditLog.findMany({
    where,
    include: {
      actor: {
        select: {
          id: true,
          email: true,
          role: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    },
    skip,
    take: limit
  });

  return res.status(200).json({
    data: logs,
    pagination: buildPaginationMeta(total, page, limit)
  });
};
