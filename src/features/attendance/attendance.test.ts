/**
 * @vitest-environment node
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db/prisma";

import {
  createAttendance,
  deleteAttendance,
  findAttendanceWorkspace,
  findAttendanceFormOptions,
  findAttendances,
  updateAttendance,
} from "./attendance.repository";
import { attendanceListQuerySchema } from "./attendance.query";
import {
  attendanceFormSchema,
  createAttendanceSchema,
  deleteAttendanceSchema,
  updateAttendanceSchema,
} from "./attendance.schema";

describe("Attendance", () => {
  let tenantAId: string;
  let tenantBId: string;
  let clientAId: string;
  let professionalAId: string;
  let serviceAId: string;
  let appointmentAId: string;

  beforeEach(async () => {
    const tenantA = await prisma.tenant.create({
      data: { name: `Attendance A ${crypto.randomUUID()}` },
    });
    const tenantB = await prisma.tenant.create({
      data: { name: `Attendance B ${crypto.randomUUID()}` },
    });
    tenantAId = tenantA.id;
    tenantBId = tenantB.id;

    const client = await prisma.client.create({
      data: { tenantId: tenantAId, name: "Ana Cliente" },
    });
    const service = await prisma.service.create({
      data: {
        tenantId: tenantAId,
        name: "Corte",
        duration: 60,
        price: 50,
      },
    });
    const user = await prisma.user.create({
      data: {
        tenantId: tenantAId,
        name: "Bruno Profissional",
        email: `attendance-${crypto.randomUUID()}@example.com`,
        passwordHash: "test-hash",
        role: "PROFESSIONAL",
      },
    });
    const professional = await prisma.professional.create({
      data: { tenantId: tenantAId, userId: user.id },
    });
    clientAId = client.id;
    serviceAId = service.id;
    professionalAId = professional.id;

    await prisma.professionalService.create({
      data: {
        tenantId: tenantAId,
        professionalId: professionalAId,
        serviceId: serviceAId,
      },
    });
    const appointment = await createAppointmentFixture({
      tenantId: tenantAId,
      clientId: clientAId,
      professionalId: professionalAId,
      serviceId: serviceAId,
      startAt: new Date("2032-04-05T10:00:00.000Z"),
      status: "CONFIRMED",
    });
    appointmentAId = appointment.id;
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
    await prisma.client.deleteMany({
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
    await prisma.tenant.deleteMany({
      where: { id: { in: tenantIds } },
    });
  });

  async function createAppointmentFixture(input: {
    tenantId: string;
    clientId: string;
    professionalId: string;
    serviceId: string;
    startAt: Date;
    status?: "SCHEDULED" | "CONFIRMED" | "CANCELLED" | "NO_SHOW";
  }) {
    const endAt = new Date(input.startAt.getTime() + 60 * 60_000);
    return prisma.appointment.create({
      data: {
        tenantId: input.tenantId,
        clientId: input.clientId,
        professionalId: input.professionalId,
        serviceId: input.serviceId,
        startAt: input.startAt,
        endAt,
        status: input.status ?? "SCHEDULED",
      },
    });
  }

  describe("schemas", () => {
    it("validates list defaults, filters, and time range", () => {
      expect(attendanceListQuerySchema.parse({})).toMatchObject({
        search: "",
        page: 1,
        pageSize: 10,
        sortBy: "startAt",
        sortDirection: "asc",
      });
      expect(
        attendanceListQuerySchema.safeParse({
          status: "IN_PROGRESS",
          from: "2032-04-01T00:00:00.000Z",
          toExclusive: "2032-04-30T00:00:00.000Z",
          sortBy: "client",
        }).success,
      ).toBe(true);
      expect(
        attendanceListQuerySchema.safeParse({
          from: "2032-05-01T00:00:00.000Z",
          toExclusive: "2032-04-01T00:00:00.000Z",
        }).success,
      ).toBe(false);
    });

    it("validates attendance input and mutation identifiers", () => {
      expect(
        createAttendanceSchema.safeParse({
          appointmentId: "appointment-1",
          notes: "",
        }).success,
      ).toBe(true);
      expect(
        attendanceFormSchema.safeParse({
          appointmentId: "appointment-1",
          status: "COMPLETED",
          notes: "",
        }).success,
      ).toBe(true);
      expect(
        updateAttendanceSchema.safeParse({
          id: "",
          appointmentId: "appointment-1",
          status: "SCHEDULED",
          notes: "",
        }).success,
      ).toBe(false);
      expect(deleteAttendanceSchema.safeParse({ id: "" }).success).toBe(false);
    });
  });

  describe("repository", () => {
    it("loads only the authorized attendance and its client's history and records", async () => {
      const current = await prisma.attendance.create({
        data: {
          tenantId: tenantAId,
          appointmentId: appointmentAId,
          notes: "Atendimento atual",
        },
      });
      const previousAppointment = await createAppointmentFixture({
        tenantId: tenantAId,
        clientId: clientAId,
        professionalId: professionalAId,
        serviceId: serviceAId,
        startAt: new Date("2032-04-04T10:00:00.000Z"),
        status: "CONFIRMED",
      });
      const previousAttendance = await prisma.attendance.create({
        data: {
          tenantId: tenantAId,
          appointmentId: previousAppointment.id,
          status: "COMPLETED",
        },
      });
      const otherClient = await prisma.client.create({
        data: { tenantId: tenantAId, name: "Outro cliente" },
      });
      await prisma.clientRecord.createMany({
        data: [
          {
            tenantId: tenantAId,
            clientId: clientAId,
            attendanceId: current.id,
            content: "Prontuário do cliente atual",
          },
          {
            tenantId: tenantAId,
            clientId: clientAId,
            content: "Registro sem atendimento",
          },
          {
            tenantId: tenantAId,
            clientId: otherClient.id,
            content: "Prontuário de outro cliente",
          },
        ],
      });

      const workspace = await findAttendanceWorkspace(
        tenantAId,
        current.id,
        professionalAId,
      );

      expect(workspace).toMatchObject({
        id: current.id,
        appointment: {
          client: { id: clientAId, name: "Ana Cliente" },
          professional: { id: professionalAId, name: "Bruno Profissional" },
          service: { id: serviceAId, name: "Corte" },
        },
      });
      expect(workspace?.history.map(({ id }) => id)).toEqual([
        previousAttendance.id,
      ]);
      expect(workspace?.clientRecords).toHaveLength(2);
      expect(workspace?.clientRecords.map(({ content }) => content)).toEqual(
        expect.arrayContaining([
          "Prontuário do cliente atual",
          "Registro sem atendimento",
        ]),
      );

      await expect(
        findAttendanceWorkspace(tenantBId, current.id),
      ).resolves.toBeNull();
      await expect(
        findAttendanceWorkspace(tenantAId, current.id, "another-professional"),
      ).resolves.toBeNull();
    });

    it("creates attendance once for a non-cancelled appointment", async () => {
      const attendanceId = await createAttendance(
        tenantAId,
        {
          appointmentId: appointmentAId,
          notes: "Recepção",
        },
        professionalAId,
      );

      await expect(
        prisma.attendance.findUniqueOrThrow({
          where: { id: attendanceId },
          select: {
            tenantId: true,
            appointmentId: true,
            status: true,
            startedAt: true,
            completedAt: true,
            notes: true,
          },
        }),
      ).resolves.toMatchObject({
        tenantId: tenantAId,
        appointmentId: appointmentAId,
        status: "SCHEDULED",
        startedAt: null,
        completedAt: null,
        notes: "Recepção",
      });

      await expect(
        createAttendance(
          tenantAId,
          { appointmentId: appointmentAId, notes: "" },
          professionalAId,
        ),
      ).rejects.toThrow();

      const cancelledAppointment = await createAppointmentFixture({
        tenantId: tenantAId,
        clientId: clientAId,
        professionalId: professionalAId,
        serviceId: serviceAId,
        startAt: new Date("2032-04-05T12:00:00.000Z"),
        status: "CANCELLED",
      });
      await expect(
        createAttendance(
          tenantAId,
          { appointmentId: cancelledAppointment.id, notes: "" },
          professionalAId,
        ),
      ).rejects.toThrow(
        "O agendamento não está disponível para este atendimento.",
      );
    });

    it("advances status sequentially and records timestamps on the server", async () => {
      const attendanceId = await createAttendance(
        tenantAId,
        { appointmentId: appointmentAId, notes: "" },
        professionalAId,
      );

      await expect(
        updateAttendance(
          tenantAId,
          {
            id: attendanceId,
            appointmentId: appointmentAId,
            status: "COMPLETED",
            notes: "",
          },
          professionalAId,
        ),
      ).rejects.toThrow("O status deve avançar sequencialmente");

      const beforeStart = Date.now();
      await updateAttendance(
        tenantAId,
        {
          id: attendanceId,
          appointmentId: appointmentAId,
          status: "IN_PROGRESS",
          notes: "Iniciado",
        },
        professionalAId,
      );
      const afterStart = Date.now();

      const inProgress = await prisma.attendance.findUniqueOrThrow({
        where: { id: attendanceId },
        select: { status: true, startedAt: true, completedAt: true },
      });
      expect(inProgress.status).toBe("IN_PROGRESS");
      expect(inProgress.startedAt?.getTime()).toBeGreaterThanOrEqual(beforeStart);
      expect(inProgress.startedAt?.getTime()).toBeLessThanOrEqual(afterStart);
      expect(inProgress.completedAt).toBeNull();

      const beforeCompletion = Date.now();
      await updateAttendance(
        tenantAId,
        {
          id: attendanceId,
          appointmentId: appointmentAId,
          status: "COMPLETED",
          notes: "",
        },
        professionalAId,
      );
      const afterCompletion = Date.now();

      const completed = await prisma.attendance.findUniqueOrThrow({
        where: { id: attendanceId },
        select: { status: true, startedAt: true, completedAt: true },
      });
      expect(completed.status).toBe("COMPLETED");
      expect(completed.completedAt?.getTime()).toBeGreaterThanOrEqual(
        beforeCompletion,
      );
      expect(completed.completedAt?.getTime()).toBeLessThanOrEqual(
        afterCompletion,
      );
      expect(completed.startedAt).toEqual(inProgress.startedAt);

      await expect(
        updateAttendance(
          tenantAId,
          {
            id: attendanceId,
            appointmentId: appointmentAId,
            status: "IN_PROGRESS",
            notes: "",
          },
          professionalAId,
        ),
      ).rejects.toThrow("O status deve avançar sequencialmente");
    });

    it("scopes list, create, update and delete to the professional tenant", async () => {
      const attendanceId = await createAttendance(
        tenantAId,
        { appointmentId: appointmentAId, notes: "" },
        professionalAId,
      );
      const own = await findAttendances(
        tenantAId,
        attendanceListQuerySchema.parse({}),
        professionalAId,
      );
      const foreignProfessionalList = await findAttendances(
        tenantAId,
        attendanceListQuerySchema.parse({}),
        "other-professional",
      );
      expect(own.total).toBe(1);
      expect(foreignProfessionalList.total).toBe(0);

      await expect(
        updateAttendance(
          tenantBId,
          {
            id: attendanceId,
            appointmentId: appointmentAId,
            status: "SCHEDULED",
            notes: "Cross tenant",
          },
        ),
      ).rejects.toThrow("O agendamento não está disponível");
      await expect(
        deleteAttendance(tenantBId, attendanceId),
      ).rejects.toThrow("Atendimento não encontrado.");
      await expect(
        prisma.attendance.findUnique({ where: { id: attendanceId } }),
      ).resolves.not.toBeNull();
    });

    it("allows reassigning attendance while keeping linked client record and payment", async () => {
      const attendanceId = await createAttendance(
        tenantAId,
        { appointmentId: appointmentAId, notes: "" },
        professionalAId,
      );
      const targetAppointment = await createAppointmentFixture({
        tenantId: tenantAId,
        clientId: clientAId,
        professionalId: professionalAId,
        serviceId: serviceAId,
        startAt: new Date("2032-04-05T12:00:00.000Z"),
      });
      const attendance = await prisma.attendance.findUniqueOrThrow({
        where: { id: attendanceId },
      });
      const clientRecord = await prisma.clientRecord.create({
        data: {
          tenantId: tenantAId,
          clientId: clientAId,
          attendanceId,
          content: "Histórico associado ao atendimento",
        },
      });
      const payment = await prisma.payment.create({
        data: {
          tenantId: tenantAId,
          attendanceId,
          status: "PENDENTE",
        },
      });

      await updateAttendance(tenantAId, {
        id: attendanceId,
        appointmentId: targetAppointment.id,
        status: "SCHEDULED",
        notes: "Reassociado",
      });

      await expect(
        prisma.attendance.findUniqueOrThrow({
          where: { id: attendanceId },
          select: { appointmentId: true, notes: true },
        }),
      ).resolves.toEqual({
        appointmentId: targetAppointment.id,
        notes: "Reassociado",
      });
      await expect(
        prisma.clientRecord.findUnique({ where: { id: clientRecord.id } }),
      ).resolves.toMatchObject({ attendanceId });
      await expect(
        prisma.payment.findUnique({ where: { id: payment.id } }),
      ).resolves.toMatchObject({ attendanceId });
      expect(attendance.id).toBe(attendanceId);
    });

    it("restricts attendance deletion when payment or client record exists", async () => {
      const attendanceId = await createAttendance(
        tenantAId,
        { appointmentId: appointmentAId, notes: "" },
        professionalAId,
      );
      const attendance = await prisma.attendance.findUniqueOrThrow({
        where: { id: attendanceId },
      });
      await prisma.payment.create({
        data: { tenantId: tenantAId, attendanceId },
      });

      await expect(
        deleteAttendance(tenantAId, attendanceId, professionalAId),
      ).rejects.toThrow(
        "Não é possível excluir este atendimento porque há uma ficha ou pagamento vinculado.",
      );
      await expect(
        prisma.attendance.findUnique({ where: { id: attendance.id } }),
      ).resolves.not.toBeNull();
    });

    it("returns only eligible appointments in the authenticated professional scope", async () => {
      const anotherAppointment = await createAppointmentFixture({
        tenantId: tenantAId,
        clientId: clientAId,
        professionalId: professionalAId,
        serviceId: serviceAId,
        startAt: new Date("2032-04-05T12:00:00.000Z"),
      });
      const options = await findAttendanceFormOptions(
        tenantAId,
        professionalAId,
      );

      expect(options.appointments.map(({ id }) => id)).toEqual([
        anotherAppointment.id,
        appointmentAId,
      ]);

      await createAttendance(
        tenantAId,
        { appointmentId: appointmentAId, notes: "" },
        professionalAId,
      );
      const editOptions = await findAttendanceFormOptions(
        tenantAId,
        professionalAId,
        await prisma.attendance
          .findFirstOrThrow({
            where: { appointmentId: appointmentAId },
            select: { id: true },
          })
          .then(({ id }) => id),
      );

      expect(editOptions.appointments.map(({ id }) => id)).toContain(
        appointmentAId,
      );
      expect(editOptions.appointments.map(({ id }) => id)).toContain(
        anotherAppointment.id,
      );
    });
  });
});
