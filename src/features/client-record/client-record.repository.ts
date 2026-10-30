import { Prisma } from "@/generated/prisma/client";

import { prisma } from "@/lib/db/prisma";

import type {
  ClientRecordAttendanceOption,
  ClientRecordFormOptions,
  ClientRecordListItem,
  ClientRecordListQuery,
  ClientRecordListResult,
} from "./client-record.query";
import type {
  CreateClientRecordData,
  UpdateClientRecordData,
} from "./client-record.schema";

const clientRecordSelect = {
  id: true,
  content: true,
  createdAt: true,
  updatedAt: true,
  client: {
    select: {
      id: true,
      name: true,
    },
  },
  attendance: {
    select: {
      id: true,
      status: true,
      appointment: {
        select: {
          startAt: true,
        },
      },
    },
  },
} satisfies Prisma.ClientRecordSelect;

function getOrderBy(
  sortBy: ClientRecordListQuery["sortBy"],
  sortDirection: ClientRecordListQuery["sortDirection"],
): Prisma.ClientRecordOrderByWithRelationInput[] {
  const primaryOrder: Prisma.ClientRecordOrderByWithRelationInput =
    sortBy === "client"
      ? { client: { name: sortDirection } }
      : { createdAt: sortDirection };

  return [primaryOrder, { id: "asc" }];
}

export async function findClientRecords(
  tenantId: string,
  query: ClientRecordListQuery,
): Promise<ClientRecordListResult> {
  const { search, page, pageSize, sortBy, sortDirection, attendanceLink } =
    query;

  const where: Prisma.ClientRecordWhereInput = {
    tenantId,
    ...(attendanceLink === "linked"
      ? { attendanceId: { not: null } }
      : attendanceLink === "unlinked"
        ? { attendanceId: null }
        : {}),
    ...(search
      ? {
          OR: [
            { content: { contains: search, mode: "insensitive" } },
            { client: { name: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [records, total] = await prisma.$transaction([
    prisma.clientRecord.findMany({
      where,
      orderBy: getOrderBy(sortBy, sortDirection),
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: clientRecordSelect,
    }),
    prisma.clientRecord.count({ where }),
  ]);

  const items: ClientRecordListItem[] = records.map((record) => ({
    id: record.id,
    content: record.content,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    client: record.client,
    attendance: record.attendance
      ? {
          id: record.attendance.id,
          status: record.attendance.status,
          startAt: record.attendance.appointment.startAt,
        }
      : null,
  }));

  return {
    items,
    total,
    page,
    pageSize,
    pageCount: Math.ceil(total / pageSize),
  };
}

export async function findClientRecordFormOptions(
  tenantId: string,
  clientId?: string,
): Promise<ClientRecordFormOptions> {
  const [clients, attendances] = await Promise.all([
    prisma.client.findMany({
      where: { tenantId },
      orderBy: [{ name: "asc" }, { id: "asc" }],
      select: { id: true, name: true },
    }),
    clientId
      ? prisma.attendance.findMany({
          where: {
            tenantId,
            appointment: { clientId },
          },
          orderBy: { appointment: { startAt: "desc" } },
          select: {
            id: true,
            status: true,
            appointment: {
              select: {
                startAt: true,
                professional: {
                  select: { user: { select: { name: true } } },
                },
                service: { select: { name: true } },
              },
            },
          },
        })
      : Promise.resolve([]),
  ]);

  const attendanceOptions: ClientRecordAttendanceOption[] = attendances.map(
    (attendance) => ({
      id: attendance.id,
      status: attendance.status,
      startAt: attendance.appointment.startAt,
      professionalName: attendance.appointment.professional.user.name,
      serviceName: attendance.appointment.service.name,
    }),
  );

  return { clients, attendances: attendanceOptions };
}

async function validateRelations(
  transaction: Prisma.TransactionClient,
  tenantId: string,
  clientId: string,
  attendanceId: string,
): Promise<void> {
  const client = await transaction.client.findFirst({
    where: { id: clientId, tenantId },
    select: { id: true },
  });

  if (!client) {
    throw new Error("Cliente não encontrado.");
  }

  if (!attendanceId) {
    return;
  }

  const attendance = await transaction.attendance.findFirst({
    where: {
      id: attendanceId,
      tenantId,
      appointment: {
        tenantId,
        clientId,
      },
    },
    select: { id: true },
  });

  if (!attendance) {
    throw new Error(
      "O atendimento selecionado não pertence ao cliente informado.",
    );
  }
}

export async function createClientRecord(
  tenantId: string,
  input: CreateClientRecordData,
): Promise<void> {
  await prisma.$transaction(async (transaction) => {
    await validateRelations(
      transaction,
      tenantId,
      input.clientId,
      input.attendanceId,
    );

    await transaction.clientRecord.create({
      data: {
        tenantId,
        clientId: input.clientId,
        attendanceId: input.attendanceId || null,
        content: input.content,
      },
    });
  });
}

export async function updateClientRecord(
  tenantId: string,
  input: UpdateClientRecordData,
): Promise<void> {
  await prisma.$transaction(async (transaction) => {
    await validateRelations(
      transaction,
      tenantId,
      input.clientId,
      input.attendanceId,
    );

    const result = await transaction.clientRecord.updateMany({
      where: {
        id: input.id,
        tenantId,
      },
      data: {
        clientId: input.clientId,
        attendanceId: input.attendanceId || null,
        content: input.content,
      },
    });

    if (result.count === 0) {
      throw new Error("Ficha do cliente não encontrada.");
    }
  });
}

export async function deleteClientRecord(
  tenantId: string,
  clientRecordId: string,
): Promise<void> {
  const result = await prisma.clientRecord.deleteMany({
    where: {
      id: clientRecordId,
      tenantId,
    },
  });

  if (result.count === 0) {
    throw new Error("Ficha do cliente não encontrada.");
  }
}
