"use server";

import { logger } from "@/lib/logger/logger";
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
  const actor = await requireAuthenticatedActor();

  const query = serviceListQuerySchema.parse(input);

  return findServices(actor.tenantId, query);
}

export async function createServiceAction(input: unknown): Promise<void> {
  const actor = await requireAuthenticatedActor();
  requireRole(actor, "ADMIN");
  const data = createServiceSchema.parse(input);

  try {
    await createService(actor.tenantId, data);

    logger.info(
      {
        operation: "service.create",
        tenantId: actor.tenantId,
      },
      "Service created",
    );
  } catch (error: unknown) {
    logger.error(
      {
        operation: "service.create",
        tenantId: actor.tenantId,
        error,
      },
      "Failed to create service",
    );

    throw error;
  }
}

export async function updateServiceAction(input: unknown): Promise<void> {
  const actor = await requireAuthenticatedActor();
  requireRole(actor, "ADMIN");
  const data = updateServiceSchema.parse(input);

  try {
    await updateService(actor.tenantId, data);

    logger.info(
      {
        operation: "service.update",
        tenantId: actor.tenantId,
        serviceId: data.id,
      },
      "Service updated",
    );
  } catch (error: unknown) {
    logger.error(
      {
        operation: "service.update",
        tenantId: actor.tenantId,
        serviceId: data.id,
        error,
      },
      "Failed to update service",
    );

    throw error;
  }
}

export async function deleteServiceAction(input: unknown): Promise<void> {
  const actor = await requireAuthenticatedActor();
  requireRole(actor, "ADMIN");
  const data = deleteServiceSchema.parse(input);

  try {
    await deleteService(actor.tenantId, data.id);

    logger.info(
      {
        operation: "service.delete",
        tenantId: actor.tenantId,
        serviceId: data.id,
      },
      "Service deleted",
    );
  } catch (error: unknown) {
    logger.error(
      {
        operation: "service.delete",
        tenantId: actor.tenantId,
        serviceId: data.id,
        error,
      },
      "Failed to delete service",
    );

    throw error;
  }
}
