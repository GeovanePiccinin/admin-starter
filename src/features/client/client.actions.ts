"use server";

import { auth } from "@/auth";

import { logger } from "@/lib/logger/logger";

import {
  createClient,
  deleteClient,
  findClients,
  updateClient,
} from "./client.repository";
import {
  clientListQuerySchema,
  type ClientListResult,
} from "./client.query";
import {
  createClientSchema,
  deleteClientSchema,
  updateClientSchema,
} from "./client.schema";

async function getTenantId(): Promise<string> {
  const session = await auth();
  const tenantId = session?.user?.tenantId;

  if (!tenantId) {
    throw new Error("Usuário não autenticado.");
  }

  return tenantId;
}

export async function getClients(input: unknown): Promise<ClientListResult> {
  const tenantId = await getTenantId();
  const query = clientListQuerySchema.parse(input);

  return findClients(tenantId, query);
}

export async function createClientAction(input: unknown): Promise<void> {
  const tenantId = await getTenantId();
  const data = createClientSchema.parse(input);

  try {
    await createClient(tenantId, data);

    logger.info(
      {
        operation: "client.create",
        tenantId,
      },
      "Client created",
    );
  } catch (error: unknown) {
    logger.error(
      {
        operation: "client.create",
        tenantId,
        error,
      },
      "Failed to create client",
    );

    throw error;
  }
}

export async function updateClientAction(input: unknown): Promise<void> {
  const tenantId = await getTenantId();
  const data = updateClientSchema.parse(input);

  try {
    await updateClient(tenantId, data);

    logger.info(
      {
        operation: "client.update",
        tenantId,
        clientId: data.id,
      },
      "Client updated",
    );
  } catch (error: unknown) {
    logger.error(
      {
        operation: "client.update",
        tenantId,
        clientId: data.id,
        error,
      },
      "Failed to update client",
    );

    throw error;
  }
}

export async function deleteClientAction(input: unknown): Promise<void> {
  const tenantId = await getTenantId();
  const data = deleteClientSchema.parse(input);

  try {
    await deleteClient(tenantId, data.id);

    logger.info(
      {
        operation: "client.delete",
        tenantId,
        clientId: data.id,
      },
      "Client deleted",
    );
  } catch (error: unknown) {
    logger.error(
      {
        operation: "client.delete",
        tenantId,
        clientId: data.id,
        error,
      },
      "Failed to delete client",
    );

    throw error;
  }
}
