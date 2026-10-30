import { Prisma } from "@/generated/prisma/client";
import { AttendanceStatus } from "@/generated/prisma/enums";

import { prisma } from "@/lib/db/prisma";

import type {
  AttendanceAppointmentOption,
  AttendanceFormOptions,
  AttendanceListItem,
  AttendanceListQuery,
  AttendanceListResult,
  AttendanceWorkspace,
} from "./attendance.query";
import type {
  CreateAttendanceData,
  UpdateAttendanceData,
} from "./attendance.schema";

const attendanceSelect = {
  id: true,
  status: true,
  startedAt: true,
  completedAt: true,
  notes: true,
  appointment: {
    select: {
      id: true,
      startAt: true,
      endAt: true,
      status: true,
      client: { select: { id: true, name: true } },
      professional: {
        select: {
          id: true,
          user: { select: { name: true } },
        },
      },
      service: { select: { id: true, name: true } },
    },
  },
  payment: { select: { id: true } },
  clientRecords: { select: { id: true }, take: 1 },
} satisfies Prisma.AttendanceSelect;

function getOrderBy(
  sortBy: AttendanceListQuery["sortBy"],
  sortDirection: AttendanceListQuery["sortDirection"],
): Prisma.AttendanceOrderByWithRelationInput[] {
  const orderBy: Prisma.AttendanceOrderByWithRelationInput =
    sortBy === "startAt"
      ? { appointment: { startAt: sortDirection } }
      : sortBy === "client"
        ? { appointment: { client: { name: sortDirection } } }
        : sortBy === "professional"
          ? {
              appointment: {
                professional: { user: { name: sortDirection } },
              },
            }
          : sortBy === "service"
            ? { appointment: { service: { name: sortDirection } } }
            : { status: sortDirection };

  return [orderBy, { id: "asc" }];
}

export async function findAttendances(
  tenantId: string,
  query: AttendanceListQuery,
  professionalScopeId?: string,
): Promise<AttendanceListResult> {
  const {
    search,
    page,
    pageSize,
    sortBy,
    sortDirection,
    from,
    toExclusive,
    status,
  } = query;

  const where: Prisma.AttendanceWhereInput = {
    tenantId,
    ...(professionalScopeId
      ? { appointment: { professionalId: professionalScopeId } }
      : {}),
    ...(status ? { status } : {}),
    ...(from || toExclusive
      ? {
          appointment: {
            ...(professionalScopeId
              ? { professionalId: professionalScopeId }
              : {}),
            startAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(toExclusive ? { lt: new Date(toExclusive) } : {}),
            },
          },
        }
      : {}),
    ...(search
      ? {
          OR: [
            {
              appointment: {
                client: { name: { contains: search, mode: "insensitive" } },
              },
            },
            {
              appointment: {
                professional: {
                  user: { name: { contains: search, mode: "insensitive" } },
                },
              },
            },
            {
              appointment: {
                service: { name: { contains: search, mode: "insensitive" } },
              },
            },
            { notes: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [attendances, total] = await prisma.$transaction([
    prisma.attendance.findMany({
      where,
      orderBy: getOrderBy(sortBy, sortDirection),
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: attendanceSelect,
    }),
    prisma.attendance.count({ where }),
  ]);

  const items: AttendanceListItem[] = attendances.map((attendance) => ({
    id: attendance.id,
    status: attendance.status,
    startedAt: attendance.startedAt,
    completedAt: attendance.completedAt,
    notes: attendance.notes,
    appointment: {
      ...attendance.appointment,
      professional: {
        id: attendance.appointment.professional.id,
        name: attendance.appointment.professional.user.name,
      },
    },
    hasRelatedRecords:
      attendance.payment !== null || attendance.clientRecords.length > 0,
  }));

  return {
    items,
    total,
    page,
    pageSize,
    pageCount: Math.ceil(total / pageSize),
  };
}

export async function findAttendanceWorkspace(
  tenantId: string,
  attendanceId: string,
  professionalScopeId?: string,
): Promise<AttendanceWorkspace | null> {
  const attendance = await prisma.attendance.findFirst({
    where: {
      id: attendanceId,
      tenantId,
      ...(professionalScopeId
        ? { appointment: { professionalId: professionalScopeId } }
        : {}),
    },
    select: {
      id: true,
      status: true,
      startedAt: true,
      completedAt: true,
      notes: true,
      appointment: {
        select: {
          id: true,
          startAt: true,
          endAt: true,
          status: true,
          notes: true,
          client: {
            select: { id: true, name: true, email: true, phone: true },
          },
          professional: {
            select: {
              id: true,
              user: { select: { name: true } },
            },
          },
          service: {
            select: { id: true, name: true, duration: true, price: true },
          },
        },
      },
    },
  });

  if (!attendance) {
    return null;
  }

  const clientId = attendance.appointment.client.id;
  const [history, clientRecords] = await prisma.$transaction([
    prisma.attendance.findMany({
      where: {
        tenantId,
        id: { not: attendance.id },
        appointment: {
          tenantId,
          clientId,
          ...(professionalScopeId ? { professionalId: professionalScopeId } : {}),
        },
      },
      orderBy: [{ appointment: { startAt: "desc" } }, { id: "asc" }],
      select: {
        id: true,
        status: true,
        startedAt: true,
        completedAt: true,
        notes: true,
        appointment: {
          select: {
            startAt: true,
            endAt: true,
            status: true,
            professional: { select: { user: { select: { name: true } } } },
            service: { select: { name: true } },
          },
        },
      },
    }),
    prisma.clientRecord.findMany({
      where: { tenantId, clientId },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      select: {
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        attendance: {
          select: {
            id: true,
            status: true,
            appointment: { select: { startAt: true } },
          },
        },
      },
    }),
  ]);

  return {
    id: attendance.id,
    status: attendance.status,
    startedAt: attendance.startedAt,
    completedAt: attendance.completedAt,
    notes: attendance.notes,
    appointment: {
      ...attendance.appointment,
      professional: {
        id: attendance.appointment.professional.id,
        name: attendance.appointment.professional.user.name,
      },
      service: {
        ...attendance.appointment.service,
        price: Number(attendance.appointment.service.price),
      },
    },
    history: history.map((item) => ({
      ...item,
      appointment: {
        ...item.appointment,
        professional: { name: item.appointment.professional.user.name },
      },
    })),
    clientRecords: clientRecords.map((record) => ({
      id: record.id,
      content: record.content,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      attendance: record.attendance
        ? {
            id: record.attendance.id,
            status: record.attendance.status,
            startAt: record.attendance.appointment.startAt,
          }
        : null,
    })),
  };
}

function mapAppointmentOption(
  appointment: {
    id: string;
    startAt: Date;
    endAt: Date;
    client: { name: string };
    professional: { user: { name: string } };
    service: { name: string };
  },
): AttendanceAppointmentOption {
  return {
    id: appointment.id,
    startAt: appointment.startAt,
    endAt: appointment.endAt,
    clientName: appointment.client.name,
    professionalName: appointment.professional.user.name,
    serviceName: appointment.service.name,
  };
}

export async function findAttendanceFormOptions(
  tenantId: string,
  professionalScopeId?: string,
  attendanceId?: string,
): Promise<AttendanceFormOptions> {
  const appointments = await prisma.appointment.findMany({
    where: {
      tenantId,
      status: { not: "CANCELLED" },
      ...(professionalScopeId ? { professionalId: professionalScopeId } : {}),
      OR: [
        { attendance: { is: null } },
        ...(attendanceId ? [{ attendance: { is: { id: attendanceId } } }] : []),
      ],
    },
    orderBy: { startAt: "desc" },
    select: {
      id: true,
      startAt: true,
      endAt: true,
      client: { select: { name: true } },
      professional: {
        select: { user: { select: { name: true } } },
      },
      service: { select: { name: true } },
    },
  });

  if (attendanceId) {
    const currentAttendance = await prisma.attendance.findFirst({
      where: {
        id: attendanceId,
        tenantId,
        ...(professionalScopeId
          ? { appointment: { professionalId: professionalScopeId } }
          : {}),
      },
      select: {
        appointment: {
          select: {
            id: true,
            startAt: true,
            endAt: true,
            client: { select: { name: true } },
            professional: {
              select: { user: { select: { name: true } } },
            },
            service: { select: { name: true } },
          },
        },
      },
    });

    if (
      currentAttendance &&
      !appointments.some(
        (appointment) => appointment.id === currentAttendance.appointment.id,
      )
    ) {
      appointments.unshift(currentAttendance.appointment);
    }
  }

  return {
    appointments: appointments.map(mapAppointmentOption),
  };
}

async function validateAppointment(
  transaction: Prisma.TransactionClient,
  tenantId: string,
  appointmentId: string,
  professionalScopeId?: string,
  attendanceId?: string,
): Promise<void> {
  const appointment = await transaction.appointment.findFirst({
    where: {
      id: appointmentId,
      tenantId,
      ...(professionalScopeId ? { professionalId: professionalScopeId } : {}),
      ...(!attendanceId
        ? {
            status: { not: "CANCELLED" },
            attendance: { is: null },
          }
        : {}),
    },
    select: { id: true },
  });

  if (!appointment) {
    throw new Error(
      "O agendamento não está disponível para este atendimento.",
    );
  }

  if (attendanceId) {
    const existing = await transaction.attendance.findFirst({
      where: {
        id: attendanceId,
        tenantId,
        ...(professionalScopeId
          ? { appointment: { professionalId: professionalScopeId } }
          : {}),
      },
      select: { id: true },
    });

    if (!existing) {
      throw new Error("Atendimento não encontrado.");
    }

    const target = await transaction.appointment.findFirst({
      where: { id: appointmentId, tenantId },
      select: {
        status: true,
        attendance: { select: { id: true } },
      },
    });

    if (
      !target ||
      (target.status === "CANCELLED" &&
        target.attendance?.id !== attendanceId) ||
      (target.attendance && target.attendance.id !== attendanceId)
    ) {
      throw new Error(
        "O agendamento não está disponível para este atendimento.",
      );
    }
  }
}

async function assertNextStatus(
  transaction: Prisma.TransactionClient,
  tenantId: string,
  attendanceId: string,
  nextStatus: AttendanceStatus,
  professionalScopeId?: string,
): Promise<{
  status: AttendanceStatus;
  startedAt: Date | null;
  completedAt: Date | null;
}> {
  const current = await transaction.attendance.findFirst({
    where: {
      id: attendanceId,
      tenantId,
      ...(professionalScopeId
        ? { appointment: { professionalId: professionalScopeId } }
        : {}),
    },
    select: {
      status: true,
      startedAt: true,
      completedAt: true,
    },
  });

  if (!current) {
    throw new Error("Atendimento não encontrado.");
  }

  const statusOrder: AttendanceStatus[] = [
    "SCHEDULED",
    "IN_PROGRESS",
    "COMPLETED",
  ];
  const currentIndex = statusOrder.indexOf(current.status);
  const nextIndex = statusOrder.indexOf(nextStatus);

  if (nextIndex < currentIndex || nextIndex > currentIndex + 1) {
    throw new Error(
      "O status deve avançar sequencialmente de Agendado para Em andamento e depois Concluído.",
    );
  }

  const now = new Date();

  return {
    status: nextStatus,
    startedAt:
      nextStatus === "IN_PROGRESS" && current.status === "SCHEDULED"
        ? now
        : current.startedAt,
    completedAt:
      nextStatus === "COMPLETED" && current.status === "IN_PROGRESS"
        ? now
        : current.completedAt,
  };
}

export async function createAttendance(
  tenantId: string,
  input: CreateAttendanceData,
  professionalScopeId?: string,
): Promise<string> {
  return prisma.$transaction(async (transaction) => {
    await validateAppointment(
      transaction,
      tenantId,
      input.appointmentId,
      professionalScopeId,
    );

    const attendance = await transaction.attendance.create({
      data: {
        tenantId,
        appointmentId: input.appointmentId,
        status: "SCHEDULED",
        notes: input.notes || null,
      },
      select: { id: true },
    });

    return attendance.id;
  });
}

export async function updateAttendance(
  tenantId: string,
  input: UpdateAttendanceData,
  professionalScopeId?: string,
): Promise<void> {
  await prisma.$transaction(async (transaction) => {
    await validateAppointment(
      transaction,
      tenantId,
      input.appointmentId,
      professionalScopeId,
      input.id,
    );
    const timestampData = await assertNextStatus(
      transaction,
      tenantId,
      input.id,
      input.status,
      professionalScopeId,
    );

    await transaction.attendance.update({
      where: { id: input.id },
      data: {
        appointmentId: input.appointmentId,
        status: timestampData.status,
        startedAt: timestampData.startedAt,
        completedAt: timestampData.completedAt,
        notes: input.notes || null,
      },
    });
  });
}

export async function deleteAttendance(
  tenantId: string,
  attendanceId: string,
  professionalScopeId?: string,
): Promise<void> {
  try {
    const result = await prisma.attendance.deleteMany({
      where: {
        id: attendanceId,
        tenantId,
        ...(professionalScopeId
          ? { appointment: { professionalId: professionalScopeId } }
          : {}),
      },
    });

    if (result.count === 0) {
      throw new Error("Atendimento não encontrado.");
    }
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      throw new Error(
        "Não é possível excluir este atendimento porque há uma ficha ou pagamento vinculado.",
      );
    }

    throw error;
  }
}
