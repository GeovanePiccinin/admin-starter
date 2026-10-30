import { Prisma } from "@/generated/prisma/client";

import { prisma } from "@/lib/db/prisma";

import type {
  AppointmentCalendarQuery,
  AppointmentFilterOptions,
  AppointmentFormOptions,
  AppointmentListItem,
  AppointmentListQuery,
  AppointmentListResult,
} from "./appointment.query";
import type {
  CreateAppointmentData,
  UpdateAppointmentData,
} from "./appointment.schema";

type AppointmentMutationData = Omit<
  CreateAppointmentData,
  "professionalId"
> & {
  professionalId: string;
};

const appointmentSelect = {
  id: true,
  startAt: true,
  endAt: true,
  status: true,
  origin: true,
  notes: true,
  attendance: {
    select: {
      id: true,
    },
  },
  client: {
    select: {
      id: true,
      name: true,
    },
  },
  professional: {
    select: {
      id: true,
      user: {
        select: {
          name: true,
        },
      },
    },
  },
  service: {
    select: {
      id: true,
      name: true,
      duration: true,
    },
  },
} satisfies Prisma.AppointmentSelect;

function getAppointmentOrderBy(
  sortBy: AppointmentListQuery["sortBy"],
  sortDirection: AppointmentListQuery["sortDirection"],
): Prisma.AppointmentOrderByWithRelationInput[] {
  const orderBy: Prisma.AppointmentOrderByWithRelationInput =
    sortBy === "client"
      ? { client: { name: sortDirection } }
      : sortBy === "professional"
        ? { professional: { user: { name: sortDirection } } }
        : sortBy === "service"
          ? { service: { name: sortDirection } }
          : { [sortBy]: sortDirection };

  return [orderBy, { id: "asc" }];
}

function mapAppointment(
  appointment: Prisma.AppointmentGetPayload<{
    select: typeof appointmentSelect;
  }>,
): AppointmentListItem {
  return {
    id: appointment.id,
    startAt: appointment.startAt,
    endAt: appointment.endAt,
    status: appointment.status,
    origin: appointment.origin,
    notes: appointment.notes,
    attendanceId: appointment.attendance?.id ?? null,
    hasAttendance: appointment.attendance !== null,
    client: appointment.client,
    professional: {
      id: appointment.professional.id,
      name: appointment.professional.user.name,
    },
    service: appointment.service,
  };
}

export async function findAppointments(
  tenantId: string,
  query: AppointmentListQuery,
  professionalScopeId?: string,
): Promise<AppointmentListResult> {
  const {
    search,
    page,
    pageSize,
    sortBy,
    sortDirection,
    from,
    toExclusive,
    professionalId,
    serviceId,
    status,
  } = query;

  const conditions: Prisma.AppointmentWhereInput[] = [];

  if (professionalScopeId) {
    conditions.push({ professionalId: professionalScopeId });
  }
  if (professionalId) {
    conditions.push({ professionalId });
  }

  const where: Prisma.AppointmentWhereInput = {
    tenantId,
    ...(conditions.length > 0 ? { AND: conditions } : {}),
    ...(serviceId ? { serviceId } : {}),
    ...(status ? { status } : {}),
    ...(from || toExclusive
      ? {
          startAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(toExclusive ? { lt: new Date(toExclusive) } : {}),
          },
        }
      : {}),
    ...(search
      ? {
          OR: [
            { client: { name: { contains: search, mode: "insensitive" } } },
            {
              professional: {
                user: { name: { contains: search, mode: "insensitive" } },
              },
            },
            { service: { name: { contains: search, mode: "insensitive" } } },
            { notes: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [appointments, total] = await prisma.$transaction([
    prisma.appointment.findMany({
      where,
      orderBy: getAppointmentOrderBy(sortBy, sortDirection),
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: appointmentSelect,
    }),
    prisma.appointment.count({ where }),
  ]);

  const items = appointments.map(mapAppointment);

  return {
    items,
    total,
    page,
    pageSize,
    pageCount: Math.ceil(total / pageSize),
  };
}

export async function findAppointmentsInRange(
  tenantId: string,
  query: AppointmentCalendarQuery,
  professionalScopeId?: string,
): Promise<AppointmentListItem[]> {
  const where: Prisma.AppointmentWhereInput = {
    tenantId,
    ...(professionalScopeId || query.professionalId
      ? {
          AND: [
            ...(professionalScopeId
              ? [{ professionalId: professionalScopeId }]
              : []),
            ...(query.professionalId
              ? [{ professionalId: query.professionalId }]
              : []),
          ],
        }
      : {}),
    startAt: { lt: new Date(query.toExclusive) },
    endAt: { gt: new Date(query.from) },
    ...(query.serviceId ? { serviceId: query.serviceId } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.search
      ? {
          OR: [
            { client: { name: { contains: query.search, mode: "insensitive" } } },
            {
              professional: {
                user: {
                  name: { contains: query.search, mode: "insensitive" },
                },
              },
            },
            {
              service: { name: { contains: query.search, mode: "insensitive" } },
            },
            { notes: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const appointments = await prisma.appointment.findMany({
    where,
    orderBy: [{ startAt: "asc" }, { id: "asc" }],
    select: appointmentSelect,
  });

  return appointments.map(mapAppointment);
}

export async function findAppointmentFilterOptions(
  tenantId: string,
  professionalScopeId?: string,
): Promise<AppointmentFilterOptions> {
  const professionalWhere: Prisma.ProfessionalWhereInput = {
    tenantId,
    ...(professionalScopeId ? { id: professionalScopeId } : {}),
  };

  const serviceWhere: Prisma.ServiceWhereInput = {
    tenantId,
    ...(professionalScopeId
      ? {
          professionalAssignments: {
            some: { professionalId: professionalScopeId },
          },
        }
      : {}),
  };

  const [professionals, services] = await prisma.$transaction([
    prisma.professional.findMany({
      where: professionalWhere,
      orderBy: { user: { name: "asc" } },
      select: {
        id: true,
        user: { select: { name: true } },
        professionalServices: { select: { serviceId: true } },
      },
    }),
    prisma.service.findMany({
      where: serviceWhere,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        duration: true,
        active: true,
      },
    }),
  ]);

  return {
    professionals: professionals.map((professional) => ({
      id: professional.id,
      name: professional.user.name,
      serviceIds: professional.professionalServices.map(
        ({ serviceId }) => serviceId,
      ),
    })),
    services,
  };
}

export async function findAppointmentFormOptions(
  tenantId: string,
  professionalScopeId?: string,
): Promise<Omit<AppointmentFormOptions, "canChooseProfessional">> {
  const professionalWhere: Prisma.ProfessionalWhereInput = {
    tenantId,
    ...(professionalScopeId ? { id: professionalScopeId } : {}),
  };

  const serviceWhere: Prisma.ServiceWhereInput = {
    tenantId,
    ...(professionalScopeId
      ? {
          professionalAssignments: {
            some: { professionalId: professionalScopeId },
          },
        }
      : {}),
  };

  const [clients, professionals, services] = await prisma.$transaction([
    prisma.client.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.professional.findMany({
      where: professionalWhere,
      orderBy: { user: { name: "asc" } },
      select: {
        id: true,
        user: { select: { name: true } },
        professionalServices: { select: { serviceId: true } },
      },
    }),
    prisma.service.findMany({
      where: serviceWhere,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        duration: true,
        active: true,
      },
    }),
  ]);

  return {
    clients,
    professionals: professionals.map((professional) => ({
      id: professional.id,
      name: professional.user.name,
      serviceIds: professional.professionalServices.map(
        ({ serviceId }) => serviceId,
      ),
    })),
    services,
  };
}

async function validateAppointmentRelations(
  transaction: Prisma.TransactionClient,
  tenantId: string,
  input: AppointmentMutationData,
): Promise<void> {
  const client = await transaction.client.findFirst({
    where: { id: input.clientId, tenantId },
    select: { id: true },
  });
  const professional = await transaction.professional.findFirst({
    where: { id: input.professionalId, tenantId },
    select: { id: true },
  });
  const service = await transaction.service.findFirst({
    where: { id: input.serviceId, tenantId },
    select: { id: true },
  });
  const assignment = await transaction.professionalService.findFirst({
    where: {
      tenantId,
      professionalId: input.professionalId,
      serviceId: input.serviceId,
    },
    select: { professionalId: true },
  });

  if (!client || !professional || !service) {
    throw new Error(
      "Cliente, profissional ou serviço não encontrado neste tenant.",
    );
  }

  if (!assignment) {
    throw new Error("O profissional não está associado a este serviço.");
  }
}

async function validateNoScheduleConflict(
  transaction: Prisma.TransactionClient,
  tenantId: string,
  input: AppointmentMutationData,
  excludedAppointmentId?: string,
): Promise<void> {
  if (input.status === "CANCELLED") {
    return;
  }

  const conflict = await transaction.appointment.findFirst({
    where: {
      tenantId,
      professionalId: input.professionalId,
      status: { not: "CANCELLED" },
      startAt: { lt: input.endAt },
      endAt: { gt: input.startAt },
      ...(excludedAppointmentId ? { id: { not: excludedAppointmentId } } : {}),
    },
    select: { id: true },
  });

  if (conflict) {
    throw new Error("O profissional já possui um agendamento nesse horário.");
  }
}

function translateAppointmentMutationError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2034") {
      throw new Error(
        "O horário foi alterado simultaneamente. Atualize a lista e tente novamente.",
      );
    }

    if (error.code === "P2004") {
      const databaseError = error.meta?.database_error;
      const constraint = error.meta?.constraint;

      if (
        constraint === "appointments_no_overlapping_active" ||
        (typeof databaseError === "string" &&
          databaseError.includes("appointments_no_overlapping_active"))
      ) {
        throw new Error(
          "O profissional já possui um agendamento nesse horário.",
        );
      }
    }
  }

  throw error;
}

export async function createAppointment(
  tenantId: string,
  input: CreateAppointmentData,
  professionalId: string,
): Promise<string> {
  const data: AppointmentMutationData = {
    ...input,
    professionalId,
  };

  try {
    return await prisma.$transaction(
      async (transaction) => {
        await validateAppointmentRelations(transaction, tenantId, data);
        await validateNoScheduleConflict(transaction, tenantId, data);

        const appointment = await transaction.appointment.create({
          data: {
            tenantId,
            clientId: data.clientId,
            professionalId: data.professionalId,
            serviceId: data.serviceId,
            startAt: data.startAt,
            endAt: data.endAt,
            status: data.status,
            origin: data.origin,
            notes: data.notes || null,
          },
          select: { id: true },
        });

        return appointment.id;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error: unknown) {
    translateAppointmentMutationError(error);
  }
}

export async function updateAppointment(
  tenantId: string,
  input: UpdateAppointmentData,
  professionalScopeId?: string,
): Promise<void> {
  const { id, ...appointmentInput } = input;
  const professionalId =
    professionalScopeId ?? appointmentInput.professionalId;

  if (!professionalId) {
    throw new Error("Selecione um profissional para o agendamento.");
  }

  try {
    await prisma.$transaction(
      async (transaction) => {
        const existing = await transaction.appointment.findFirst({
          where: {
            id,
            tenantId,
            ...(professionalScopeId
              ? { professionalId: professionalScopeId }
              : {}),
          },
          select: { id: true },
        });

        if (!existing) {
          throw new Error("Agendamento não encontrado.");
        }

        const data: AppointmentMutationData = {
          ...appointmentInput,
          professionalId,
        };

        await validateAppointmentRelations(transaction, tenantId, data);
        await validateNoScheduleConflict(transaction, tenantId, data, id);

        const result = await transaction.appointment.updateMany({
          where: {
            id,
            tenantId,
            ...(professionalScopeId
              ? { professionalId: professionalScopeId }
              : {}),
          },
          data: {
            clientId: data.clientId,
            professionalId: data.professionalId,
            serviceId: data.serviceId,
            startAt: data.startAt,
            endAt: data.endAt,
            status: data.status,
            origin: data.origin,
            notes: data.notes || null,
          },
        });

        if (result.count === 0) {
          throw new Error("Agendamento não encontrado.");
        }
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error: unknown) {
    translateAppointmentMutationError(error);
  }
}

export async function deleteAppointment(
  tenantId: string,
  appointmentId: string,
  professionalScopeId?: string,
): Promise<void> {
  try {
    const result = await prisma.appointment.deleteMany({
      where: {
        id: appointmentId,
        tenantId,
        ...(professionalScopeId
          ? { professionalId: professionalScopeId }
          : {}),
      },
    });

    if (result.count === 0) {
      throw new Error("Agendamento não encontrado.");
    }
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      throw new Error(
        "Não é possível excluir este agendamento porque existe um atendimento ou pagamento vinculado.",
      );
    }

    throw error;
  }
}
