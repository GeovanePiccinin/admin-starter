import { Prisma } from "@/generated/prisma/client";

import { prisma } from "@/lib/db/prisma";

import type {
  ClientAssignmentOptions,
  ClientListItem,
  ClientListQuery,
  ClientListResult,
} from "./client.query";
import type { CreateClientData, UpdateClientData } from "./client.schema";

const clientSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
} satisfies Prisma.ClientSelect;

export async function findClients(
  tenantId: string,
  query: ClientListQuery,
): Promise<ClientListResult> {
  const { search, page, pageSize, sortBy, sortDirection } = query;

  const where: Prisma.ClientWhereInput = {
    tenantId,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const orderBy: Prisma.ClientOrderByWithRelationInput[] = [
    { [sortBy]: sortDirection },
    { id: "asc" },
  ];

  const [clients, total] = await prisma.$transaction([
    prisma.client.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: clientSelect,
    }),
    prisma.client.count({ where }),
  ]);

  const items: ClientListItem[] = clients.map((client) => ({
    id: client.id,
    name: client.name,
    email: client.email,
    phone: client.phone,
  }));

  return {
    items,
    total,
    page,
    pageSize,
    pageCount: Math.ceil(total / pageSize),
  };
}

export async function createClient(
  tenantId: string,
  input: CreateClientData,
  professionalIds?: string[],
): Promise<void> {
  await prisma.$transaction(async (transaction) => {
    await validateProfessionalIds(transaction, tenantId, professionalIds);

    const client = await transaction.client.create({
      data: {
        tenantId,
        name: input.name,
        email: input.email || null,
        phone: input.phone || null,
      },
      select: { id: true },
    });

    if (professionalIds?.length) {
      await transaction.clientProfessional.createMany({
        data: professionalIds.map((professionalId) => ({
          tenantId,
          clientId: client.id,
          professionalId,
        })),
      });
    }
  });
}

export async function updateClient(
  tenantId: string,
  input: UpdateClientData,
): Promise<void> {
  await prisma.$transaction(async (transaction) => {
    const result = await transaction.client.updateMany({
      where: {
        id: input.id,
        tenantId,
      },
      data: {
        name: input.name,
        email: input.email || null,
        phone: input.phone || null,
      },
    });

    if (result.count === 0) {
      throw new Error("Cliente não encontrado.");
    }

    if (input.professionalIds !== undefined) {
      await validateProfessionalIds(
        transaction,
        tenantId,
        input.professionalIds,
      );

      await transaction.clientProfessional.deleteMany({
        where: {
          tenantId,
          clientId: input.id,
        },
      });

      if (input.professionalIds.length) {
        await transaction.clientProfessional.createMany({
          data: input.professionalIds.map((professionalId) => ({
            tenantId,
            clientId: input.id,
            professionalId,
          })),
        });
      }
    }
  });
}

async function validateProfessionalIds(
  transaction: Prisma.TransactionClient,
  tenantId: string,
  professionalIds?: string[],
): Promise<void> {
  if (!professionalIds?.length) {
    return;
  }

  const professionals = await transaction.professional.findMany({
    where: {
      tenantId,
      id: { in: professionalIds },
    },
    select: { id: true },
  });

  if (professionals.length !== professionalIds.length) {
    throw new Error("Um ou mais profissionais não foram encontrados.");
  }
}

export async function findClientAssignmentOptions(
  tenantId: string,
  clientId?: string,
): Promise<ClientAssignmentOptions> {
  const [professionals, client] = await Promise.all([
    prisma.professional.findMany({
      where: { tenantId },
      orderBy: [{ user: { name: "asc" } }, { id: "asc" }],
      select: {
        id: true,
        user: { select: { name: true } },
      },
    }),
    clientId
      ? prisma.client.findFirst({
          where: { id: clientId, tenantId },
          select: {
            professionalAssignments: {
              select: { professionalId: true },
              orderBy: { professionalId: "asc" },
            },
          },
        })
      : Promise.resolve(null),
  ]);

  if (clientId && !client) {
    throw new Error("Cliente não encontrado.");
  }

  return {
    professionals: professionals.map((professional) => ({
      id: professional.id,
      name: professional.user.name,
    })),
    professionalIds:
      client?.professionalAssignments.map(
        (assignment) => assignment.professionalId,
      ) ?? [],
  };
}

export async function deleteClient(
  tenantId: string,
  clientId: string,
): Promise<void> {
  try {
    const result = await prisma.client.deleteMany({
      where: {
        id: clientId,
        tenantId,
      },
    });

    if (result.count === 0) {
      throw new Error("Cliente não encontrado.");
    }
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      throw new Error(
        "Não é possível excluir este cliente porque existem registros vinculados.",
      );
    }

    throw error;
  }
}
