import { Prisma } from "@/generated/prisma/client";

import { prisma } from "@/lib/db/prisma";

import type {
  ProfessionalListItem,
  ProfessionalListQuery,
  ProfessionalListResult,
  ProfessionalServiceOption,
} from "./professional.query";
import type {
  CreateProfessionalData,
  UpdateProfessionalData,
} from "./professional.schema";

type CreateProfessionalRecord = Omit<
  CreateProfessionalData,
  "password"
> & { passwordHash: string };

type UpdateProfessionalRecord = Omit<
  UpdateProfessionalData,
  "password"
> & { passwordHash?: string };

const professionalSelect = {
  id: true,
  createdAt: true,
  user: {
    select: {
      name: true,
      email: true,
    },
  },
  professionalServices: {
    select: {
      service: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      service: {
        name: "asc",
      },
    },
  },
} satisfies Prisma.ProfessionalSelect;

async function validateServiceOwnership(
  transaction: Prisma.TransactionClient,
  tenantId: string,
  serviceIds: string[],
): Promise<void> {
  const serviceCount = await transaction.service.count({
    where: {
      tenantId,
      id: { in: serviceIds },
    },
  });

  if (serviceCount !== serviceIds.length) {
    throw new Error("Um ou mais serviços não pertencem a este tenant.");
  }
}

function translateDuplicateEmail(error: unknown): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    throw new Error("Já existe uma conta cadastrada com este e-mail.");
  }

  throw error;
}

export async function findProfessionals(
  tenantId: string,
  query: ProfessionalListQuery,
): Promise<ProfessionalListResult> {
  const { search, page, pageSize, sortBy, sortDirection } = query;

  const where: Prisma.ProfessionalWhereInput = {
    tenantId,
    ...(search
      ? {
          OR: [
            { user: { name: { contains: search, mode: "insensitive" } } },
            { user: { email: { contains: search, mode: "insensitive" } } },
            {
              professionalServices: {
                some: {
                  service: {
                    name: { contains: search, mode: "insensitive" },
                  },
                },
              },
            },
          ],
        }
      : {}),
  };

  const orderBy: Prisma.ProfessionalOrderByWithRelationInput[] =
    sortBy === "createdAt"
      ? [{ createdAt: sortDirection }, { id: "asc" }]
      : [{ user: { [sortBy]: sortDirection } }, { id: "asc" }];

  const [professionals, total] = await prisma.$transaction([
    prisma.professional.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: professionalSelect,
    }),
    prisma.professional.count({ where }),
  ]);

  const items: ProfessionalListItem[] = professionals.map((professional) => ({
    id: professional.id,
    name: professional.user.name,
    email: professional.user.email,
    services: professional.professionalServices.map(
      ({ service }) => service,
    ),
    createdAt: professional.createdAt,
  }));

  return {
    items,
    total,
    page,
    pageSize,
    pageCount: Math.ceil(total / pageSize),
  };
}

export async function findProfessionalServices(
  tenantId: string,
): Promise<ProfessionalServiceOption[]> {
  return prisma.service.findMany({
    where: { tenantId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      active: true,
    },
  });
}

export async function createProfessional(
  tenantId: string,
  input: CreateProfessionalRecord,
): Promise<string> {
  try {
    return await prisma.$transaction(async (transaction) => {
      await validateServiceOwnership(transaction, tenantId, input.serviceIds);

      const user = await transaction.user.create({
        data: {
          tenantId,
          name: input.name,
          email: input.email,
          passwordHash: input.passwordHash,
          role: "PROFESSIONAL",
        },
        select: {
          id: true,
        },
      });

      const professional = await transaction.professional.create({
        data: {
          tenantId,
          userId: user.id,
        },
        select: {
          id: true,
        },
      });

      await transaction.professionalService.createMany({
        data: input.serviceIds.map((serviceId) => ({
          tenantId,
          professionalId: professional.id,
          serviceId,
        })),
      });

      return professional.id;
    });
  } catch (error: unknown) {
    translateDuplicateEmail(error);
  }
}

export async function updateProfessional(
  tenantId: string,
  input: UpdateProfessionalRecord,
): Promise<void> {
  try {
    await prisma.$transaction(async (transaction) => {
      await validateServiceOwnership(transaction, tenantId, input.serviceIds);

      const professional = await transaction.professional.findFirst({
        where: {
          id: input.id,
          tenantId,
        },
        select: {
          id: true,
          userId: true,
        },
      });

      if (!professional) {
        throw new Error("Profissional não encontrado.");
      }

      await transaction.user.updateMany({
        where: {
          id: professional.userId,
          tenantId,
        },
        data: {
          name: input.name,
          email: input.email,
          ...(input.passwordHash
            ? {
                passwordHash: input.passwordHash,
              }
            : {}),
        },
      });

      await transaction.professionalService.deleteMany({
        where: {
          tenantId,
          professionalId: professional.id,
        },
      });
      await transaction.professionalService.createMany({
        data: input.serviceIds.map((serviceId) => ({
          tenantId,
          professionalId: professional.id,
          serviceId,
        })),
      });
    });
  } catch (error: unknown) {
    translateDuplicateEmail(error);
  }
}

export async function deleteProfessional(
  tenantId: string,
  professionalId: string,
): Promise<void> {
  try {
    await prisma.$transaction(async (transaction) => {
      const professional = await transaction.professional.findFirst({
        where: {
          id: professionalId,
          tenantId,
        },
        select: {
          userId: true,
        },
      });

      if (!professional) {
        throw new Error("Profissional não encontrado.");
      }

      const result = await transaction.user.deleteMany({
        where: {
          id: professional.userId,
          tenantId,
        },
      });

      if (result.count === 0) {
        throw new Error("Profissional não encontrado.");
      }
    });
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      throw new Error(
        "Não é possível excluir este profissional porque existem agendamentos ou registros de auditoria vinculados.",
      );
    }

    throw error;
  }
}
