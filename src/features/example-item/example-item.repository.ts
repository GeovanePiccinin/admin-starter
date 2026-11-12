import { Prisma } from "@/generated/prisma/client";

import { prisma } from "@/lib/db/prisma";
import { DomainError } from "@/lib/errors/domain-error";

import type {
  CreateExampleItemData,
  UpdateExampleItemData,
} from "./example-item.schema";

import type {
  ExampleItemListItem,
  ExampleItemListQuery,
  ExampleItemListResult,
} from "./example-item.query";

const exampleItemSelect = {
  id: true,
  name: true,
  description: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ExampleItemSelect;

export async function findExampleItems(
  tenantId: string,
  query: ExampleItemListQuery,
): Promise<ExampleItemListResult> {
  const { search, page, pageSize, sortBy, sortDirection } = query;

  const where: Prisma.ExampleItemWhereInput = {
    tenantId,

    ...(search
      ? {
          name: {
            contains: search,
            mode: "insensitive",
          },
        }
      : {}),
  };

  const orderBy: Prisma.ExampleItemOrderByWithRelationInput = {
    [sortBy]: sortDirection,
  };

  const [records, total] = await prisma.$transaction([
    prisma.exampleItem.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: exampleItemSelect,
    }),

    prisma.exampleItem.count({
      where,
    }),
  ]);

  const items: ExampleItemListItem[] = records.map((record) => ({
    id: record.id,
    name: record.name,
    description: record.description,
    active: record.active,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  }));

  return {
    items,
    total,
    page,
    pageSize,
    pageCount: Math.ceil(total / pageSize),
  };
}

export async function createExampleItem(
  tenantId: string,
  input: CreateExampleItemData,
): Promise<string> {
  const item = await prisma.exampleItem.create({
    data: {
      tenantId,
      name: input.name,
      description: input.description || null,
      active: input.active,
    },
    select: { id: true },
  });

  return item.id;
}

export async function updateExampleItem(
  tenantId: string,
  input: UpdateExampleItemData,
): Promise<void> {
  const result = await prisma.exampleItem.updateMany({
    where: {
      id: input.id,
      tenantId,
    },

    data: {
      name: input.name,
      description: input.description || null,
      active: input.active,
    },
  });

  if (result.count === 0) {
    throw new DomainError("Item de exemplo não encontrado.");
  }
}

export async function deleteExampleItem(
  tenantId: string,
  exampleItemId: string,
): Promise<void> {
  const result = await prisma.exampleItem.deleteMany({
    where: {
      id: exampleItemId,
      tenantId,
    },
  });

  if (result.count === 0) {
    throw new DomainError("Item de exemplo não encontrado.");
  }
}
