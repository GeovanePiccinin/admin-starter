"use server";

import { logger } from "@/lib/logger/logger";
import {
  requireAuthenticatedActor,
} from "@/lib/auth/get-authenticated-user";

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

async function getClientRecordActor() {
  const actor = await requireAuthenticatedActor();

  if (actor.role === "PROFESSIONAL" && !actor.professionalId) {
    throw new Error("O perfil profissional não está configurado.");
  }

  return actor;
}

function getProfessionalScope(
  actor: Awaited<ReturnType<typeof getClientRecordActor>>,
): string | undefined {
  return actor.role === "PROFESSIONAL"
    ? actor.professionalId ?? undefined
    : undefined;
}

function getProfessionalAuthor(
  actor: Awaited<ReturnType<typeof getClientRecordActor>>,
): { professionalId: string; name: string } | undefined {
  if (actor.role !== "PROFESSIONAL") {
    return undefined;
  }

  if (!actor.professionalId) {
    throw new Error("O perfil profissional não está configurado.");
  }

  return {
    professionalId: actor.professionalId,
    name: actor.name,
  };
}

export async function getClientRecords(
  input: unknown,
): Promise<ClientRecordListResult> {
  const actor = await getClientRecordActor();
  const query = clientRecordListQuerySchema.parse(input);

  return findClientRecords(
    actor.tenantId,
    query,
    getProfessionalScope(actor),
  );
}

export async function getClientRecordFormOptions(input: unknown) {
  const actor = await getClientRecordActor();
  const parsedInput = clientRecordFormOptionsSchema.parse(input);

  return findClientRecordFormOptions(
    actor.tenantId,
    parsedInput.clientId,
    getProfessionalScope(actor),
  );
}

export async function createClientRecordAction(input: unknown): Promise<void> {
  const actor = await getClientRecordActor();
  const data = createClientRecordSchema.parse(input);

  try {
    await createClientRecord(
      actor.tenantId,
      data,
      getProfessionalScope(actor),
      getProfessionalAuthor(actor),
    );

    logger.info(
      { operation: "client-record.create", tenantId: actor.tenantId },
      "Client record created",
    );
  } catch (error: unknown) {
    logger.error(
      { operation: "client-record.create", tenantId: actor.tenantId, error },
      "Failed to create client record",
    );

    throw error;
  }
}

export async function updateClientRecordAction(input: unknown): Promise<void> {
  const actor = await getClientRecordActor();
  const data = updateClientRecordSchema.parse(input);

  try {
    await updateClientRecord(
      actor.tenantId,
      data,
      getProfessionalScope(actor),
    );

    logger.info(
      {
        operation: "client-record.update",
        tenantId: actor.tenantId,
        clientRecordId: data.id,
      },
      "Client record updated",
    );
  } catch (error: unknown) {
    logger.error(
      {
        operation: "client-record.update",
        tenantId: actor.tenantId,
        clientRecordId: data.id,
        error,
      },
      "Failed to update client record",
    );

    throw error;
  }
}

export async function deleteClientRecordAction(input: unknown): Promise<void> {
  const actor = await getClientRecordActor();
  const data = deleteClientRecordSchema.parse(input);

  try {
    await deleteClientRecord(
      actor.tenantId,
      data.id,
      getProfessionalScope(actor),
    );

    logger.info(
      {
        operation: "client-record.delete",
        tenantId: actor.tenantId,
        clientRecordId: data.id,
      },
      "Client record deleted",
    );
  } catch (error: unknown) {
    logger.error(
      {
        operation: "client-record.delete",
        tenantId: actor.tenantId,
        clientRecordId: data.id,
        error,
      },
      "Failed to delete client record",
    );

    throw error;
  }
}
