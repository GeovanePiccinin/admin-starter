/**
 * @vitest-environment node
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db/prisma";

import {
  createPayment,
  deletePayment,
  findPaymentFormOptions,
  findPayments,
  updatePayment,
} from "./payment.repository";
import { paymentListQuerySchema } from "./payment.query";
import {
  createPaymentSchema,
  deletePaymentSchema,
  paymentFormSchema,
  updatePaymentSchema,
} from "./payment.schema";

describe("Payment", () => {
  let tenantAId: string;
  let tenantBId: string;
  let clientAId: string;
  let clientBId: string;
  let serviceAId: string;
  let serviceBId: string;
  let professionalAId: string;
  let professionalBId: string;
  let attendanceAId: string;
  let attendanceA2Id: string;
  let attendanceA3Id: string;
  let attendanceBId: string;

  beforeEach(async () => {
    const tenantA = await prisma.tenant.create({
      data: { name: `Payment A ${crypto.randomUUID()}` },
    });
    const tenantB = await prisma.tenant.create({
      data: { name: `Payment B ${crypto.randomUUID()}` },
    });
    tenantAId = tenantA.id;
    tenantBId = tenantB.id;

    const [clientA, clientB, serviceA, serviceB] = await Promise.all([
      prisma.client.create({
        data: { tenantId: tenantAId, name: "Ana Cliente" },
      }),
      prisma.client.create({
        data: { tenantId: tenantBId, name: "Cliente Tenant B" },
      }),
      prisma.service.create({
        data: {
          tenantId: tenantAId,
          name: "Consulta",
          duration: 60,
          price: 100,
        },
      }),
      prisma.service.create({
        data: {
          tenantId: tenantBId,
          name: "Serviço Tenant B",
          duration: 60,
          price: 100,
        },
      }),
    ]);
    clientAId = clientA.id;
    clientBId = clientB.id;
    serviceAId = serviceA.id;
    serviceBId = serviceB.id;

    const [userA, userA2, userB] = await Promise.all([
      prisma.user.create({
        data: {
          tenantId: tenantAId,
          name: "Profissional A",
          email: `payment-a-${crypto.randomUUID()}@example.com`,
          passwordHash: "test-hash",
        },
      }),
      prisma.user.create({
        data: {
          tenantId: tenantAId,
          name: "Profissional A2",
          email: `payment-a2-${crypto.randomUUID()}@example.com`,
          passwordHash: "test-hash",
        },
      }),
      prisma.user.create({
        data: {
          tenantId: tenantBId,
          name: "Profissional B",
          email: `payment-b-${crypto.randomUUID()}@example.com`,
          passwordHash: "test-hash",
        },
      }),
    ]);
    const [professionalA, professionalA2, professionalB] = await Promise.all([
      prisma.professional.create({
        data: { tenantId: tenantAId, userId: userA.id },
      }),
      prisma.professional.create({
        data: { tenantId: tenantAId, userId: userA2.id },
      }),
      prisma.professional.create({
        data: { tenantId: tenantBId, userId: userB.id },
      }),
    ]);
    professionalAId = professionalA.id;
    professionalBId = professionalB.id;

    const [attendanceA, attendanceA2, attendanceA3, attendanceB] = await Promise.all([
      createAttendanceFixture({
        tenantId: tenantAId,
        clientId: clientAId,
        professionalId: professionalA.id,
        startAt: new Date("2032-06-01T10:00:00.000Z"),
      }),
      createAttendanceFixture({
        tenantId: tenantAId,
        clientId: clientAId,
        professionalId: professionalA2.id,
        startAt: new Date("2032-06-02T10:00:00.000Z"),
      }),
      createAttendanceFixture({
        tenantId: tenantAId,
        clientId: clientAId,
        professionalId: professionalA.id,
        startAt: new Date("2032-06-04T10:00:00.000Z"),
      }),
      createAttendanceFixture({
        tenantId: tenantBId,
        clientId: clientBId,
        professionalId: professionalB.id,
        startAt: new Date("2032-06-03T10:00:00.000Z"),
      }),
    ]);
    attendanceAId = attendanceA.id;
    attendanceA2Id = attendanceA2.id;
    attendanceA3Id = attendanceA3.id;
    attendanceBId = attendanceB.id;
  });

  afterEach(async () => {
    const tenantIds = [tenantAId, tenantBId];
    await prisma.payment.deleteMany({
      where: { tenantId: { in: tenantIds } },
    });
    await prisma.clientRecord.deleteMany({
      where: { tenantId: { in: tenantIds } },
    });
    await prisma.attendance.deleteMany({
      where: { tenantId: { in: tenantIds } },
    });
    await prisma.appointment.deleteMany({
      where: { tenantId: { in: tenantIds } },
    });
    await prisma.professionalService.deleteMany({
      where: { tenantId: { in: tenantIds } },
    });
    await prisma.professional.deleteMany({
      where: { tenantId: { in: tenantIds } },
    });
    await prisma.user.deleteMany({
      where: { tenantId: { in: tenantIds } },
    });
    await prisma.service.deleteMany({
      where: { tenantId: { in: tenantIds } },
    });
    await prisma.client.deleteMany({
      where: { tenantId: { in: tenantIds },
      },
    });
    await prisma.tenant.deleteMany({
      where: { id: { in: tenantIds } },
    });
  });

  async function createAttendanceFixture(input: {
    tenantId: string;
    clientId: string;
    professionalId: string;
    startAt: Date;
  }) {
    const appointment = await prisma.appointment.create({
      data: {
        tenantId: input.tenantId,
        clientId: input.clientId,
        professionalId: input.professionalId,
        serviceId: input.tenantId === tenantAId ? serviceAId : serviceBId,
        startAt: input.startAt,
        endAt: new Date(input.startAt.getTime() + 60 * 60_000),
      },
    });

    return prisma.attendance.create({
      data: { tenantId: input.tenantId, appointmentId: appointment.id },
    });
  }

  describe("schemas", () => {
    it("validates payment list defaults, filters, and range", () => {
      expect(paymentListQuerySchema.parse({})).toMatchObject({
        search: "",
        page: 1,
        pageSize: 10,
        sortBy: "paidAt",
        sortDirection: "desc",
      });
      expect(
        paymentListQuerySchema.safeParse({
          status: "PAGO",
          from: "2032-06-01T00:00:00.000Z",
          toExclusive: "2032-06-30T00:00:00.000Z",
          sortBy: "client",
        }).success,
      ).toBe(true);
      expect(
        paymentListQuerySchema.safeParse({
          from: "2032-06-30T00:00:00.000Z",
          toExclusive: "2032-06-01T00:00:00.000Z",
        }).success,
      ).toBe(false);
    });

    it("requires a paid date only for PAGO and validates identifiers", () => {
      expect(
        paymentFormSchema.safeParse({
          attendanceId: "attendance-1",
          status: "PENDENTE",
          paidAt: "",
        }).success,
      ).toBe(true);
      expect(
        paymentFormSchema.safeParse({
          attendanceId: "attendance-1",
          status: "PAGO",
          paidAt: "",
        }).success,
      ).toBe(false);
      expect(
        paymentFormSchema.safeParse({
          attendanceId: "attendance-1",
          status: "PENDENTE",
          paidAt: "2032-06-01T10:00",
        }).success,
      ).toBe(false);
      expect(
        createPaymentSchema.safeParse({
          attendanceId: "attendance-1",
          status: "PAGO",
          paidAt: null,
        }).success,
      ).toBe(false);
      expect(
        updatePaymentSchema.safeParse({
          id: "",
          attendanceId: "attendance-1",
          status: "PENDENTE",
          paidAt: null,
        }).success,
      ).toBe(false);
      expect(deletePaymentSchema.safeParse({ id: "" }).success).toBe(false);
    });
  });

  describe("repository", () => {
    it("creates pending and paid payments with consistent paidAt", async () => {
      await createPayment(tenantAId, {
        attendanceId: attendanceAId,
        status: "PENDENTE",
        paidAt: null,
      });
      await createPayment(tenantAId, {
        attendanceId: attendanceA2Id,
        status: "PAGO",
        paidAt: "2032-06-04T14:30:00.000Z",
      });

      const payments = await prisma.payment.findMany({
        where: { tenantId: tenantAId },
        orderBy: { attendanceId: "asc" },
        select: { attendanceId: true, status: true, paidAt: true },
      });
      expect(payments).toHaveLength(2);
      expect(payments).toContainEqual({
        attendanceId: attendanceAId,
        status: "PENDENTE",
        paidAt: null,
      });
      expect(payments).toContainEqual({
        attendanceId: attendanceA2Id,
        status: "PAGO",
        paidAt: new Date("2032-06-04T14:30:00.000Z"),
      });
    });

    it("rejects foreign tenant attendances and duplicate attendance payments", async () => {
      await expect(
        createPayment(tenantAId, {
          attendanceId: attendanceBId,
          status: "PENDENTE",
          paidAt: null,
        }),
      ).rejects.toThrow("Atendimento não encontrado.");

      await createPayment(tenantAId, {
        attendanceId: attendanceAId,
        status: "PENDENTE",
        paidAt: null,
      });
      await expect(
        createPayment(tenantAId, {
          attendanceId: attendanceAId,
          status: "PAGO",
          paidAt: "2032-06-04T14:30:00.000Z",
        }),
      ).rejects.toThrow("já possui um pagamento");
    });

    it("updates payment status, paidAt, and attendance relation", async () => {
      await createPayment(tenantAId, {
        attendanceId: attendanceAId,
        status: "PENDENTE",
        paidAt: null,
      });
      const payment = await prisma.payment.findFirstOrThrow({
        where: { tenantId: tenantAId, attendanceId: attendanceAId },
        select: { id: true },
      });

      await updatePayment(tenantAId, {
        id: payment.id,
        attendanceId: attendanceA2Id,
        status: "PAGO",
        paidAt: "2032-06-05T11:15:00.000Z",
      });
      await updatePayment(tenantAId, {
        id: payment.id,
        attendanceId: attendanceA2Id,
        status: "PENDENTE",
        paidAt: null,
      });

      await expect(
        prisma.payment.findUniqueOrThrow({
          where: { id: payment.id },
          select: { attendanceId: true, status: true, paidAt: true },
        }),
      ).resolves.toEqual({
        attendanceId: attendanceA2Id,
        status: "PENDENTE",
        paidAt: null,
      });
    });

    it("rejects cross-tenant payment updates and preserves the record", async () => {
      await createPayment(tenantAId, {
        attendanceId: attendanceAId,
        status: "PAGO",
        paidAt: "2032-06-04T14:30:00.000Z",
      });
      const payment = await prisma.payment.findFirstOrThrow({
        where: { tenantId: tenantAId },
        select: { id: true },
      });

      await expect(
        updatePayment(tenantBId, {
          id: payment.id,
          attendanceId: attendanceBId,
          status: "PENDENTE",
          paidAt: null,
        }),
      ).rejects.toThrow("Pagamento não encontrado.");
      await expect(
        prisma.payment.findUnique({ where: { id: payment.id } }),
      ).resolves.toMatchObject({
        attendanceId: attendanceAId,
        status: "PAGO",
      });
    });

    it("scopes payment lists and form options to the professional", async () => {
      await createPayment(tenantAId, {
        attendanceId: attendanceAId,
        status: "PENDENTE",
        paidAt: null,
      });
      await createPayment(tenantAId, {
        attendanceId: attendanceA2Id,
        status: "PENDENTE",
        paidAt: null,
      });

      const ownPayments = await findPayments(
        tenantAId,
        paymentListQuerySchema.parse({}),
        professionalAId,
      );
      const otherPayments = await findPayments(
        tenantAId,
        paymentListQuerySchema.parse({}),
        "nonexistent-professional",
      );
      const options = await findPaymentFormOptions(
        tenantAId,
        professionalAId,
      );

      expect(ownPayments.total).toBe(1);
      expect(ownPayments.items[0]?.attendance.id).toBe(attendanceAId);
      expect(otherPayments.total).toBe(0);
      expect(options.attendances.map(({ id }) => id)).toEqual([
        attendanceA3Id,
      ]);
      const professionalA2Payment = await prisma.payment.findFirstOrThrow({
        where: { tenantId: tenantAId, attendanceId: attendanceA2Id },
        select: { id: true },
      });
      await expect(
        updatePayment(
          tenantAId,
          {
            id: professionalA2Payment.id,
            attendanceId: attendanceA2Id,
            status: "PENDENTE",
            paidAt: null,
          },
          professionalAId,
        ),
      ).rejects.toThrow("Pagamento não encontrado.");
      expect(professionalBId).not.toBe(professionalAId);
    });

    it("filters by payment status and paid date", async () => {
      await createPayment(tenantAId, {
        attendanceId: attendanceAId,
        status: "PAGO",
        paidAt: "2032-06-04T14:30:00.000Z",
      });
      await createPayment(tenantAId, {
        attendanceId: attendanceA2Id,
        status: "PENDENTE",
        paidAt: null,
      });

      const paid = await findPayments(
        tenantAId,
        paymentListQuerySchema.parse({ status: "PAGO" }),
      );
      const dateRange = await findPayments(
        tenantAId,
        paymentListQuerySchema.parse({
          from: "2032-06-04T00:00:00.000Z",
          toExclusive: "2032-06-05T00:00:00.000Z",
        }),
      );

      expect(paid.total).toBe(1);
      expect(dateRange.total).toBe(1);
      expect(dateRange.items[0]?.status).toBe("PAGO");
    });

    it("allows deleting a paid payment without deleting attendance", async () => {
      await createPayment(tenantAId, {
        attendanceId: attendanceAId,
        status: "PAGO",
        paidAt: "2032-06-04T14:30:00.000Z",
      });
      const payment = await prisma.payment.findFirstOrThrow({
        where: { tenantId: tenantAId },
        select: { id: true },
      });

      await expect(
        deletePayment(tenantBId, payment.id),
      ).rejects.toThrow("Pagamento não encontrado.");
      await deletePayment(tenantAId, payment.id);

      await expect(
        prisma.payment.findUnique({ where: { id: payment.id } }),
      ).resolves.toBeNull();
      await expect(
        prisma.attendance.findUnique({ where: { id: attendanceAId } }),
      ).resolves.not.toBeNull();
    });
  });
});
