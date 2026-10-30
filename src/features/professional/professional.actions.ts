"use server";

import argon2 from "argon2";

import { auth } from "@/auth";

import { logger } from "@/lib/logger/logger";
import { prisma } from "@/lib/db/prisma";

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

async function getProfessionalActor() {
  const session = await auth();
  const userId = session?.user?.id;
  const tenantId = session?.user?.tenantId;

  if (!userId || !tenantId) {
    throw new Error("Usuário não autenticado.");
  }

  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      tenantId,
    },
    select: {
      role: true,
    },
  });

  if (!user) {
    throw new Error("Usuário não autenticado.");
  }

  return {
    tenantId,
    role: user.role,
  };
}

async function requireProfessionalManager() {
  const actor = await getProfessionalActor();

  if (actor.role !== "ADMIN") {
    throw new Error("Você não tem permissão para gerenciar profissionais.");
  }

  return actor;
}

export async function getProfessionals(
  input: unknown,
): Promise<ProfessionalListResult & { canManage: boolean }> {
  const actor = await getProfessionalActor();
  const query = professionalListQuerySchema.parse(input);
  const result = await findProfessionals(actor.tenantId, query);

  return {
    ...result,
    canManage: actor.role === "ADMIN",
  };
}

export async function getProfessionalServices() {
  const actor = await requireProfessionalManager();

  return findProfessionalServices(actor.tenantId);
}

export async function createProfessionalAction(input: unknown): Promise<void> {
  const actor = await requireProfessionalManager();
  const data = createProfessionalSchema.parse(input);

  try {
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
  } catch (error: unknown) {
    logger.error(
      {
        operation: "professional.create",
        tenantId: actor.tenantId,
        error,
      },
      "Failed to create professional",
    );

    throw error;
  }
}

export async function updateProfessionalAction(input: unknown): Promise<void> {
  const actor = await requireProfessionalManager();
  const data = updateProfessionalSchema.parse(input);

  try {
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
  } catch (error: unknown) {
    logger.error(
      {
        operation: "professional.update",
        tenantId: actor.tenantId,
        professionalId: data.id,
        error,
      },
      "Failed to update professional",
    );

    throw error;
  }
}

export async function deleteProfessionalAction(input: unknown): Promise<void> {
  const actor = await requireProfessionalManager();
  const data = deleteProfessionalSchema.parse(input);

  try {
    await deleteProfessional(actor.tenantId, data.id);

    logger.info(
      {
        operation: "professional.delete",
        tenantId: actor.tenantId,
        professionalId: data.id,
      },
      "Professional deleted",
    );
  } catch (error: unknown) {
    logger.error(
      {
        operation: "professional.delete",
        tenantId: actor.tenantId,
        professionalId: data.id,
        error,
      },
      "Failed to delete professional",
    );

    throw error;
  }
}
