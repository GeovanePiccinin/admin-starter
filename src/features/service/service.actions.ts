"use server";

import { logger } from "@/lib/logger/logger";
import { writeAuditLog } from "@/lib/audit/audit-log";
import { runServerAction } from "@/lib/observability/server-action";
import {
  requireAuthenticatedActor,
  requireRole,
} from "@/lib/auth/get-authenticated-user";

import {
  createServiceSchema,
  deleteServiceSchema,
  updateServiceSchema,
} from "./service.schema";

import {
  createService,
  deleteService,
  findServices,
  updateService,
} from "./service.repository";

import {
  serviceListQuerySchema,
  type ServiceListResult,
} from "./service.query";

export async function getServices(input: unknown): Promise<ServiceListResult> {
  return runServerAction("service.list", async () => {
    const actor = await requireAuthenticatedActor();

    const query = serviceListQuerySchema.parse(input);

    return findServices(actor.tenantId, query);
  });
}

export async function createServiceAction(input: unknown): Promise<void> {
  return runServerAction("service.create", async () => {
    const actor = await requireAuthenticatedActor();
    requireRole(actor, "ADMIN");
    const data = createServiceSchema.parse(input);
    const serviceId = await createService(actor.tenantId, data);
    await writeAuditLog({
      tenantId: actor.tenantId,
      actorId: actor.id,
      action: "create",
      entity: "Service",
      entityId: serviceId,
    });

    logger.info(
      {
        operation: "service.create",
        tenantId: actor.tenantId,
      },
      "Service created",
    );
  });
}

export async function updateServiceAction(input: unknown): Promise<void> {
  return runServerAction("service.update", async () => {
    const actor = await requireAuthenticatedActor();
    requireRole(actor, "ADMIN");
    const data = updateServiceSchema.parse(input);
    await updateService(actor.tenantId, data);
    await writeAuditLog({
      tenantId: actor.tenantId,
      actorId: actor.id,
      action: "update",
      entity: "Service",
      entityId: data.id,
    });

    logger.info(
      {
        operation: "service.update",
        tenantId: actor.tenantId,
        serviceId: data.id,
      },
      "Service updated",
    );
  });
}

export async function deleteServiceAction(input: unknown): Promise<void> {
  return runServerAction("service.delete", async () => {
    const actor = await requireAuthenticatedActor();
    requireRole(actor, "ADMIN");
    const data = deleteServiceSchema.parse(input);
    await deleteService(actor.tenantId, data.id);
    await writeAuditLog({
      tenantId: actor.tenantId,
      actorId: actor.id,
      action: "delete",
      entity: "Service",
      entityId: data.id,
    });

    logger.info(
      {
        operation: "service.delete",
        tenantId: actor.tenantId,
        serviceId: data.id,
      },
      "Service deleted",
    );
  });
}
