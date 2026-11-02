import { Prisma } from "@/generated/prisma/client";

import { prisma } from "@/lib/db/prisma";
import { DomainError } from "@/lib/errors/domain-error";

import type { CreateServiceData, UpdateServiceData } from "./service.schema";

import type {
  ServiceListItem,
  ServiceListQuery,
  ServiceListResult,
} from "./service.query";

const serviceSelect = {
  id: true,
  name: true,
  description: true,
  duration: true,
  price: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ServiceSelect;

export async function findServices(
  tenantId: string,
  query: ServiceListQuery,
): Promise<ServiceListResult> {
  const { search, page, pageSize, sortBy, sortDirection } = query;

  const where: Prisma.ServiceWhereInput = {
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

  const orderBy: Prisma.ServiceOrderByWithRelationInput = {
    [sortBy]: sortDirection,
  };

  const [services, total] = await prisma.$transaction([
    prisma.service.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: serviceSelect,
    }),

    prisma.service.count({
      where,
    }),
  ]);

  const items: ServiceListItem[] = services.map((service) => ({
    id: service.id,
    name: service.name,
    description: service.description,
    duration: service.duration,
    price: service.price.toString(),
    active: service.active,
    createdAt: service.createdAt,
    updatedAt: service.updatedAt,
  }));

  return {
    items,
    total,
    page,
    pageSize,
    pageCount: Math.ceil(total / pageSize),
  };
}

export async function createService(
  tenantId: string,
  input: CreateServiceData,
): Promise<void> {
  await prisma.service.create({
    data: {
      tenantId,
      name: input.name,
      description: input.description || null,
      duration: input.duration,
      price: input.price,
      active: input.active,
    },
  });
}

export async function updateService(
  tenantId: string,
  input: UpdateServiceData,
): Promise<void> {
  const result = await prisma.service.updateMany({
    where: {
      id: input.id,
      tenantId,
    },

    data: {
      name: input.name,
      description: input.description || null,
      duration: input.duration,
      price: input.price,
      active: input.active,
    },
  });

  if (result.count === 0) {
    throw new DomainError("Serviço não encontrado.");
  }
}

export async function deleteService(
  tenantId: string,
  serviceId: string,
): Promise<void> {
  const result = await prisma.service.deleteMany({
    where: {
      id: serviceId,
      tenantId,
    },
  });

  if (result.count === 0) {
    throw new DomainError("Serviço não encontrado.");
  }
}
