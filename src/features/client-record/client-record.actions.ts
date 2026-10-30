"use server";

import { auth } from "@/auth";

import { logger } from "@/lib/logger/logger";

import {
  createClientRecord,
  deleteClientRecord,
  findClientRecordFormOptions,
  findClientRecords,
  updateClientRecord,
} from "./client-record.repository";
import {
  clientRecordListQuerySchema,
  type ClientRecordListResult,
} from "./client-record.query";
import {
  clientRecordFormOptionsSchema,
  createClientRecordSchema,
  deleteClientRecordSchema,
  updateClientRecordSchema,
} from "./client-record.schema";

async function getTenantId(): Promise<string> {
  const session = await auth();
  const tenantId = session?.user?.tenantId;

  if (!tenantId) {
    throw new Error("Usuário não autenticado.");
  }

  return tenantId;
}

export async function getClientRecords(
  input: unknown,
): Promise<ClientRecordListResult> {
  const tenantId = await getTenantId();
  const query = clientRecordListQuerySchema.parse(input);

  return findClientRecords(tenantId, query);
}

export async function getClientRecordFormOptions(input: unknown) {
  const tenantId = await getTenantId();
  const parsedInput = clientRecordFormOptionsSchema.parse(input);

  return findClientRecordFormOptions(tenantId, parsedInput.clientId);
}

export async function createClientRecordAction(input: unknown): Promise<void> {
  const tenantId = await getTenantId();
  const data = createClientRecordSchema.parse(input);

  try {
    await createClientRecord(tenantId, data);

    logger.info(
      { operation: "client-record.create", tenantId },
      "Client record created",
    );
  } catch (error: unknown) {
    logger.error(
      { operation: "client-record.create", tenantId, error },
      "Failed to create client record",
    );

    throw error;
  }
}

export async function updateClientRecordAction(input: unknown): Promise<void> {
  const tenantId = await getTenantId();
  const data = updateClientRecordSchema.parse(input);

  try {
    await updateClientRecord(tenantId, data);

    logger.info(
      {
        operation: "client-record.update",
        tenantId,
        clientRecordId: data.id,
      },
      "Client record updated",
    );
  } catch (error: unknown) {
    logger.error(
      {
        operation: "client-record.update",
        tenantId,
        clientRecordId: data.id,
        error,
      },
      "Failed to update client record",
    );

    throw error;
  }
}

export async function deleteClientRecordAction(input: unknown): Promise<void> {
  const tenantId = await getTenantId();
  const data = deleteClientRecordSchema.parse(input);

  try {
    await deleteClientRecord(tenantId, data.id);

    logger.info(
      {
        operation: "client-record.delete",
        tenantId,
        clientRecordId: data.id,
      },
      "Client record deleted",
    );
  } catch (error: unknown) {
    logger.error(
      {
        operation: "client-record.delete",
        tenantId,
        clientRecordId: data.id,
        error,
      },
      "Failed to delete client record",
    );

    throw error;
  }
}
