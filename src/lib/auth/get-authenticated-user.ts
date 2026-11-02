import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import type { Role } from "@/generated/prisma/enums";

export type AuthenticatedActor = {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: Role;
  professionalId: string | null;
};

export class AuthenticationError extends Error {
  constructor() {
    super("Usuário não autenticado.");
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends Error {
  constructor() {
    super("Você não tem permissão para executar esta operação.");
    this.name = "AuthorizationError";
  }
}

export async function findAuthenticatedActor(): Promise<AuthenticatedActor | null> {
  const session = await auth();

  if (!session?.user?.id || !session.user.tenantId) {
    return null;
  }

  const user = await prisma.user.findFirst({
    where: {
      id: session.user.id,
      tenantId: session.user.tenantId,
    },
    select: {
      id: true,
      tenantId: true,
      name: true,
      email: true,
      role: true,
      professional: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    tenantId: user.tenantId,
    name: user.name,
    email: user.email,
    role: user.role,
    professionalId: user.professional?.id ?? null,
  };
}

export async function requireAuthenticatedActor(): Promise<AuthenticatedActor> {
  const actor = await findAuthenticatedActor();

  if (!actor) {
    throw new AuthenticationError();
  }

  return actor;
}

export function requireRole(
  actor: AuthenticatedActor,
  role: Role,
): void {
  if (actor.role !== role) {
    throw new AuthorizationError();
  }
}

export async function getAuthenticatedUser(): Promise<AuthenticatedActor> {
  const actor = await findAuthenticatedActor();

  if (!actor) {
    redirect("/login");
  }

  return actor;
}
