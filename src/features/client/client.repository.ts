import { Prisma } from "@/generated/prisma/client";

import { prisma } from "@/lib/db/prisma";

import type {
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
): Promise<void> {
  await prisma.client.create({
    data: {
      tenantId,
      name: input.name,
      email: input.email || null,
      phone: input.phone || null,
    },
  });
}

export async function updateClient(
  tenantId: string,
  input: UpdateClientData,
): Promise<void> {
  const result = await prisma.client.updateMany({
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
