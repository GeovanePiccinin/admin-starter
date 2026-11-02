"use server";

import argon2 from "argon2";

import { logger } from "@/lib/logger/logger";
import { runServerAction } from "@/lib/observability/server-action";
import {
  requireAuthenticatedActor,
  requireRole,
} from "@/lib/auth/get-authenticated-user";

import {
  createProfessional,
  deleteProfessional,
  findProfessionalServices,
  findProfessionals,
  updateProfessional,
} from "./professional.repository";
import {
  professionalListQuerySchema,
  type ProfessionalListResult,
} from "./professional.query";
import {
  createProfessionalSchema,
  deleteProfessionalSchema,
  updateProfessionalSchema,
} from "./professional.schema";

async function requireProfessionalManager() {
  const actor = await requireAuthenticatedActor();
  requireRole(actor, "ADMIN");
  return actor;
}

export async function getProfessionals(
  input: unknown,
): Promise<ProfessionalListResult & { canManage: boolean }> {
  return runServerAction("professional.list", async () => {
    const actor = await requireAuthenticatedActor();
    const query = professionalListQuerySchema.parse(input);
    const result = await findProfessionals(actor.tenantId, query);

    return {
      ...result,
      canManage: actor.role === "ADMIN",
    };
  });
}

export async function getProfessionalServices() {
  return runServerAction("professional.service-options", async () => {
    const actor = await requireProfessionalManager();

    return findProfessionalServices(actor.tenantId);
  });
}

export async function createProfessionalAction(input: unknown): Promise<void> {
  return runServerAction("professional.create", async () => {
    const actor = await requireProfessionalManager();
    const data = createProfessionalSchema.parse(input);
    const { password, ...professionalData } = data;
    const passwordHash = await argon2.hash(password);
    const professionalId = await createProfessional(actor.tenantId, {
      ...professionalData,
      passwordHash,
    });

    logger.info(
      {
        operation: "professional.create",
        tenantId: actor.tenantId,
        professionalId,
      },
      "Professional created",
    );
  });
}

export async function updateProfessionalAction(input: unknown): Promise<void> {
  return runServerAction("professional.update", async () => {
    const actor = await requireProfessionalManager();
    const data = updateProfessionalSchema.parse(input);
    const { id, password, ...professionalData } = data;
    const passwordHash = password ? await argon2.hash(password) : undefined;

    await updateProfessional(actor.tenantId, {
      id,
      ...professionalData,
      ...(passwordHash ? { passwordHash } : {}),
    });

    logger.info(
      {
        operation: "professional.update",
        tenantId: actor.tenantId,
        professionalId: id,
      },
      "Professional updated",
    );
  });
}

export async function deleteProfessionalAction(input: unknown): Promise<void> {
  return runServerAction("professional.delete", async () => {
    const actor = await requireProfessionalManager();
    const data = deleteProfessionalSchema.parse(input);
    await deleteProfessional(actor.tenantId, data.id);

    logger.info(
      {
        operation: "professional.delete",
        tenantId: actor.tenantId,
        professionalId: data.id,
      },
      "Professional deleted",
    );
  });
}
