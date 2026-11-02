"use server";

import { logger } from "@/lib/logger/logger";
import {
  requireAuthenticatedActor,
  requireRole,
} from "@/lib/auth/get-authenticated-user";
import { runServerAction } from "@/lib/observability/server-action";

import {
  createClient,
  deleteClient,
  findClientAssignmentOptions,
  findClients,
  updateClient,
} from "./client.repository";
import {
  clientListQuerySchema,
  type ClientListResult,
} from "./client.query";
import {
  clientAssignmentOptionsSchema,
  createClientSchema,
  deleteClientSchema,
  updateClientSchema,
} from "./client.schema";

export async function getClients(
  input: unknown,
): Promise<ClientListResult & { canManage: boolean }> {
  return runServerAction("client.list", async () => {
    const actor = await requireAuthenticatedActor();
    const query = clientListQuerySchema.parse(input);
    const result = await findClients(actor.tenantId, query);

    return {
      ...result,
      canManage: actor.role === "ADMIN",
    };
  });
}

export async function getClientAssignmentOptions(input: unknown) {
  return runServerAction("client.assignment-options", async () => {
    const actor = await requireAuthenticatedActor();
    requireRole(actor, "ADMIN");
    const data = clientAssignmentOptionsSchema.parse(input);

    return findClientAssignmentOptions(actor.tenantId, data.clientId);
  });
}

export async function createClientAction(input: unknown): Promise<void> {
  return runServerAction("client.create", async () => {
    const actor = await requireAuthenticatedActor();
    const data = createClientSchema.parse(input);
    const { professionalIds, ...clientData } = data;
    if (actor.role === "ADMIN" && professionalIds !== undefined) {
      await createClient(actor.tenantId, clientData, professionalIds);
    } else {
      await createClient(actor.tenantId, clientData);
    }

    logger.info(
      {
        operation: "client.create",
        tenantId: actor.tenantId,
      },
      "Client created",
    );
  });
}

export async function updateClientAction(input: unknown): Promise<void> {
  return runServerAction("client.update", async () => {
    const actor = await requireAuthenticatedActor();
    requireRole(actor, "ADMIN");
    const data = updateClientSchema.parse(input);
    await updateClient(actor.tenantId, data);

    logger.info(
      {
        operation: "client.update",
        tenantId: actor.tenantId,
        clientId: data.id,
      },
      "Client updated",
    );
  });
}

export async function deleteClientAction(input: unknown): Promise<void> {
  return runServerAction("client.delete", async () => {
    const actor = await requireAuthenticatedActor();
    requireRole(actor, "ADMIN");
    const data = deleteClientSchema.parse(input);
    await deleteClient(actor.tenantId, data.id);

    logger.info(
      {
        operation: "client.delete",
        tenantId: actor.tenantId,
        clientId: data.id,
      },
      "Client deleted",
    );
  });
}
