import { prisma } from "@/lib/db/prisma";

export type AuditAction = "create" | "update" | "delete" | "complete" | "login";

interface WriteAuditLogInput {
  tenantId: string;
  actorId?: string;
  action: AuditAction;
  entity: string;
  entityId?: string;
}

export async function writeAuditLog(input: WriteAuditLogInput): Promise<void> {
  await prisma.auditLog.create({
    data: {
      tenantId: input.tenantId,
      actorId: input.actorId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
    },
  });
}
