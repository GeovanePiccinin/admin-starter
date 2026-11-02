import { Prisma } from "@/generated/prisma/client";
import { PaymentStatus } from "@/generated/prisma/enums";

import { prisma } from "@/lib/db/prisma";
import { DomainError } from "@/lib/errors/domain-error";

import type {
  PaymentAttendanceOption,
  PaymentFormOptions,
  PaymentListItem,
  PaymentListQuery,
  PaymentListResult,
} from "./payment.query";
import type { CreatePaymentData, UpdatePaymentData } from "./payment.schema";

const paymentSelect = {
  id: true,
  status: true,
  paidAt: true,
  createdAt: true,
  attendance: {
    select: {
      id: true,
      status: true,
      appointment: {
        select: {
          startAt: true,
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
    },
  },
} satisfies Prisma.PaymentSelect;

type SelectedPayment = Prisma.PaymentGetPayload<{
  select: typeof paymentSelect;
}>;

function mapPayment(payment: SelectedPayment): PaymentListItem {
  return {
    id: payment.id,
    status: payment.status,
    paidAt: payment.paidAt,
    createdAt: payment.createdAt,
    attendance: {
      id: payment.attendance.id,
      status: payment.attendance.status,
      appointment: {
        startAt: payment.attendance.appointment.startAt,
        client: payment.attendance.appointment.client,
        professional: {
          id: payment.attendance.appointment.professional.id,
          name: payment.attendance.appointment.professional.user.name,
        },
        service: payment.attendance.appointment.service,
      },
    },
  };
}

function getOrderBy(
  sortBy: PaymentListQuery["sortBy"],
  sortDirection: PaymentListQuery["sortDirection"],
): Prisma.PaymentOrderByWithRelationInput[] {
  const primaryOrder: Prisma.PaymentOrderByWithRelationInput =
    sortBy === "status"
      ? { status: sortDirection }
      : sortBy === "client"
        ? {
            attendance: {
              appointment: { client: { name: sortDirection } },
            },
          }
        : { paidAt: sortDirection };

  return [primaryOrder, { id: "asc" }];
}

export async function findPayments(
  tenantId: string,
  query: PaymentListQuery,
  professionalScopeId?: string,
): Promise<PaymentListResult> {
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

  const where: Prisma.PaymentWhereInput = {
    tenantId,
    ...(professionalScopeId
      ? { attendance: { appointment: { professionalId: professionalScopeId } } }
      : {}),
    ...(status ? { status } : {}),
    ...(from || toExclusive
      ? {
          paidAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(toExclusive ? { lt: new Date(toExclusive) } : {}),
          },
        }
      : {}),
    ...(search
      ? {
          attendance: {
            ...(professionalScopeId
              ? { appointment: { professionalId: professionalScopeId } }
              : {}),
            OR: [
              {
                appointment: {
                  client: { name: { contains: search, mode: "insensitive" } },
                },
              },
              {
                appointment: {
                  professional: {
                    user: {
                      name: { contains: search, mode: "insensitive" },
                    },
                  },
                },
              },
              {
                appointment: {
                  service: { name: { contains: search, mode: "insensitive" } },
                },
              },
            ],
          },
        }
      : {}),
  };

  const [payments, total] = await prisma.$transaction([
    prisma.payment.findMany({
      where,
      orderBy: getOrderBy(sortBy, sortDirection),
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: paymentSelect,
    }),
    prisma.payment.count({ where }),
  ]);

  const items = payments.map(mapPayment);

  return {
    items,
    total,
    page,
    pageSize,
    pageCount: Math.ceil(total / pageSize),
  };
}

export async function findPaymentForAttendance(
  tenantId: string,
  attendanceId: string,
  professionalScopeId?: string,
): Promise<PaymentListItem | null> {
  const payment = await prisma.payment.findFirst({
    where: {
      tenantId,
      attendanceId,
      ...(professionalScopeId
        ? { attendance: { appointment: { professionalId: professionalScopeId } } }
        : {}),
    },
    select: paymentSelect,
  });

  return payment ? mapPayment(payment) : null;
}

export async function findPaymentFormOptions(
  tenantId: string,
  professionalScopeId?: string,
  paymentId?: string,
): Promise<PaymentFormOptions> {
  const attendances = await prisma.attendance.findMany({
    where: {
      tenantId,
      ...(professionalScopeId
        ? { appointment: { professionalId: professionalScopeId } }
        : {}),
      OR: [
        { payment: { is: null } },
        ...(paymentId ? [{ payment: { is: { id: paymentId } } }] : []),
      ],
    },
    orderBy: { appointment: { startAt: "desc" } },
    select: {
      id: true,
      status: true,
      appointment: {
        select: {
          startAt: true,
          client: { select: { name: true } },
          professional: { select: { user: { select: { name: true } } } },
          service: { select: { name: true } },
        },
      },
    },
  });

  const options: PaymentAttendanceOption[] = attendances.map((attendance) => ({
    id: attendance.id,
    attendanceStatus: attendance.status,
    startAt: attendance.appointment.startAt,
    clientName: attendance.appointment.client.name,
    professionalName: attendance.appointment.professional.user.name,
    serviceName: attendance.appointment.service.name,
  }));

  return { attendances: options };
}

async function validateAttendance(
  transaction: Prisma.TransactionClient,
  tenantId: string,
  attendanceId: string,
  professionalScopeId?: string,
  paymentId?: string,
): Promise<void> {
  const attendance = await transaction.attendance.findFirst({
    where: {
      id: attendanceId,
      tenantId,
      ...(professionalScopeId
        ? { appointment: { professionalId: professionalScopeId } }
        : {}),
    },
    select: {
      id: true,
      payment: { select: { id: true } },
    },
  });

  if (!attendance) {
    throw new DomainError("Atendimento não encontrado.");
  }

  if (attendance.payment && attendance.payment.id !== paymentId) {
    throw new DomainError("Este atendimento já possui um pagamento.");
  }
}

function getPaidAt(
  status: PaymentStatus,
  paidAt: string | null,
): Date | null {
  return status === "PAGO" && paidAt ? new Date(paidAt) : null;
}

export async function createPayment(
  tenantId: string,
  input: CreatePaymentData,
  professionalScopeId?: string,
): Promise<string> {
  try {
    return await prisma.$transaction(async (transaction) => {
      await validateAttendance(
        transaction,
        tenantId,
        input.attendanceId,
        professionalScopeId,
      );

      const payment = await transaction.payment.create({
        data: {
          tenantId,
          attendanceId: input.attendanceId,
          status: input.status,
          paidAt: getPaidAt(input.status, input.paidAt),
        },
        select: { id: true },
      });

      return payment.id;
    });
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new DomainError("Este atendimento já possui um pagamento.");
    }

    throw error;
  }
}

export async function updatePayment(
  tenantId: string,
  input: UpdatePaymentData,
  professionalScopeId?: string,
): Promise<void> {
  await prisma.$transaction(async (transaction) => {
    const existing = await transaction.payment.findFirst({
      where: {
        id: input.id,
        tenantId,
        ...(professionalScopeId
          ? { attendance: { appointment: { professionalId: professionalScopeId } } }
          : {}),
      },
      select: { id: true },
    });

    if (!existing) {
      throw new DomainError("Pagamento não encontrado.");
    }

    await validateAttendance(
      transaction,
      tenantId,
      input.attendanceId,
      professionalScopeId,
      input.id,
    );

    try {
      const result = await transaction.payment.updateMany({
        where: {
          id: input.id,
          tenantId,
          ...(professionalScopeId
            ? {
                attendance: {
                  appointment: { professionalId: professionalScopeId },
                },
              }
            : {}),
        },
        data: {
          attendanceId: input.attendanceId,
          status: input.status,
          paidAt: getPaidAt(input.status, input.paidAt),
        },
      });

      if (result.count === 0) {
        throw new DomainError("Pagamento não encontrado.");
      }
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new DomainError("Este atendimento já possui um pagamento.");
      }

      throw error;
    }
  });
}

export async function deletePayment(
  tenantId: string,
  paymentId: string,
  professionalScopeId?: string,
): Promise<void> {
  const result = await prisma.payment.deleteMany({
    where: {
      id: paymentId,
      tenantId,
      ...(professionalScopeId
        ? { attendance: { appointment: { professionalId: professionalScopeId } } }
        : {}),
    },
  });

  if (result.count === 0) {
    throw new DomainError("Pagamento não encontrado.");
  }
}
