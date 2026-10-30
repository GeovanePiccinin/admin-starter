/**
 * @vitest-environment node
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db/prisma";

import {
  createAppointment,
  deleteAppointment,
  findAppointments,
  findAppointmentsInRange,
  updateAppointment,
} from "./appointment.repository";
import {
  appointmentCalendarQuerySchema,
  appointmentListQuerySchema,
} from "./appointment.query";
import {
  appointmentFormSchema,
  createAppointmentSchema,
  deleteAppointmentSchema,
  updateAppointmentSchema,
  type CreateAppointmentData,
} from "./appointment.schema";

const startAt = new Date("2031-02-05T10:00:00.000Z");
const endAt = new Date("2031-02-05T11:00:00.000Z");

describe("Appointment", () => {
  let tenantAId: string;
  let tenantBId: string;
  let clientAId: string;
  let professionalAId: string;
  let serviceAId: string;

  beforeEach(async () => {
    const tenantA = await prisma.tenant.create({
      data: { name: `Appointment A ${crypto.randomUUID()}` },
    });
    const tenantB = await prisma.tenant.create({
      data: { name: `Appointment B ${crypto.randomUUID()}` },
    });

    tenantAId = tenantA.id;
    tenantBId = tenantB.id;

    const client = await prisma.client.create({
      data: {
        tenantId: tenantAId,
        name: "Ana Cliente",
      },
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
        email: `appointment-${crypto.randomUUID()}@example.com`,
        passwordHash: "test-hash",
        role: "PROFESSIONAL",
      },
    });

    clientAId = client.id;
    serviceAId = service.id;

    const professional = await prisma.professional.create({
      data: {
        tenantId: tenantAId,
        userId: user.id,
      },
    });
    professionalAId = professional.id;

    await prisma.professionalService.create({
      data: {
        tenantId: tenantAId,
        professionalId: professionalAId,
        serviceId: serviceAId,
      },
    });
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

  function appointmentData(
    overrides: Partial<CreateAppointmentData> = {},
  ): CreateAppointmentData {
    return {
      clientId: clientAId,
      professionalId: professionalAId,
      serviceId: serviceAId,
      startAt,
      endAt,
      status: "SCHEDULED",
      origin: "MANUAL",
      notes: "",
      ...overrides,
    };
  }

  describe("query schema", () => {
    it("applies pagination and sorting defaults", () => {
      expect(appointmentListQuerySchema.parse({})).toMatchObject({
        search: "",
        page: 1,
        pageSize: 10,
        sortBy: "startAt",
        sortDirection: "asc",
      });

    });

    it("validates supported filters and rejects invalid periods or sort values", () => {
      const valid = appointmentListQuerySchema.safeParse({
        search: "  Ana  ",
        page: 2,
        pageSize: 20,
        sortBy: "professional",
        sortDirection: "desc",
        from: "2031-02-01T00:00:00.000Z",
        toExclusive: "2031-03-01T00:00:00.000Z",
        status: "CONFIRMED",
      });
      expect(valid.success).toBe(true);

      expect(
        appointmentListQuerySchema.safeParse({
          sortBy: "tenantId",
        }).success,
      ).toBe(false);
      expect(
        appointmentListQuerySchema.safeParse({
          from: "2031-03-01T00:00:00.000Z",
          toExclusive: "2031-02-01T00:00:00.000Z",
        }).success,
      ).toBe(false);
    });
  });

  describe("mutation schemas", () => {
    it("validates local form datetimes and requires end after start", () => {
      const valid = {
        clientId: "client-1",
        professionalId: "professional-1",
        serviceId: "service-1",
        startAt: "2031-02-05T10:00",
        endAt: "2031-02-05T11:00",
        status: "SCHEDULED",
        origin: "MANUAL",
        notes: "",
      };

      expect(appointmentFormSchema.safeParse(valid).success).toBe(true);
      expect(
        appointmentFormSchema.safeParse({
          ...valid,
          endAt: "2031-02-05T09:00",
        }).success,
      ).toBe(false);
      expect(
        appointmentFormSchema.safeParse({
          ...valid,
          startAt: "2031-02-31T10:00",
        }).success,
      ).toBe(false);
    });

    it("parses UTC mutation dates and validates IDs", () => {
      const valid = {
        clientId: "client-1",
        professionalId: "professional-1",
        serviceId: "service-1",
        startAt: "2031-02-05T10:00:00.000Z",
        endAt: "2031-02-05T11:00:00.000Z",
        status: "SCHEDULED",
        origin: "MANUAL",
        notes: "",
      };

      expect(createAppointmentSchema.parse(valid).startAt).toBeInstanceOf(Date);
      expect(
        updateAppointmentSchema.safeParse({ id: "", ...valid }).success,
      ).toBe(false);
      expect(deleteAppointmentSchema.safeParse({ id: "" }).success).toBe(false);
    });
  });

  describe("repository", () => {
    it("lists appointments overlapping the range with filters and tenant/professional scope", async () => {
      const crossingAppointmentId = await createAppointment(
        tenantAId,
        appointmentData({
          startAt: new Date("2031-02-05T09:30:00.000Z"),
          endAt: new Date("2031-02-05T10:30:00.000Z"),
        }),
        professionalAId,
      );
      await createAppointment(
        tenantAId,
        appointmentData({
          startAt: new Date("2031-02-05T10:30:00.000Z"),
          endAt: new Date("2031-02-05T11:30:00.000Z"),
        }),
        professionalAId,
      );

      const secondUser = await prisma.user.create({
        data: {
          tenantId: tenantAId,
          name: "Carla Profissional",
          email: `appointment-calendar-${crypto.randomUUID()}@example.com`,
          passwordHash: "test-hash",
          role: "PROFESSIONAL",
        },
      });
      const secondProfessional = await prisma.professional.create({
        data: { tenantId: tenantAId, userId: secondUser.id },
      });
      await prisma.professionalService.create({
        data: {
          tenantId: tenantAId,
          professionalId: secondProfessional.id,
          serviceId: serviceAId,
        },
      });
      const secondProfessionalAppointmentId = await createAppointment(
        tenantAId,
        appointmentData({
          professionalId: secondProfessional.id,
          status: "CONFIRMED",
          startAt: new Date("2031-02-05T09:30:00.000Z"),
          endAt: new Date("2031-02-05T10:30:00.000Z"),
        }),
        secondProfessional.id,
      );

      const foreignClient = await prisma.client.create({
        data: { tenantId: tenantBId, name: "Cliente externo" },
      });
      const foreignService = await prisma.service.create({
        data: {
          tenantId: tenantBId,
          name: "Serviço externo",
          duration: 60,
          price: 50,
        },
      });
      const foreignUser = await prisma.user.create({
        data: {
          tenantId: tenantBId,
          name: "Profissional externo",
          email: `appointment-calendar-foreign-${crypto.randomUUID()}@example.com`,
          passwordHash: "test-hash",
          role: "PROFESSIONAL",
        },
      });
      const foreignProfessional = await prisma.professional.create({
        data: { tenantId: tenantBId, userId: foreignUser.id },
      });
      await prisma.professionalService.create({
        data: {
          tenantId: tenantBId,
          professionalId: foreignProfessional.id,
          serviceId: foreignService.id,
        },
      });
      await createAppointment(
        tenantBId,
        appointmentData({
          clientId: foreignClient.id,
          professionalId: foreignProfessional.id,
          serviceId: foreignService.id,
          startAt: new Date("2031-02-05T09:30:00.000Z"),
          endAt: new Date("2031-02-05T10:30:00.000Z"),
        }),
        foreignProfessional.id,
      );

      const query = appointmentCalendarQuerySchema.parse({
        from: "2031-02-05T10:00:00.000Z",
        toExclusive: "2031-02-05T10:30:00.000Z",
        search: "Ana Cliente",
      });
      const appointments = await findAppointmentsInRange(tenantAId, query);
      const professionalAppointments = await findAppointmentsInRange(
        tenantAId,
        query,
        professionalAId,
      );
      const filteredAppointments = await findAppointmentsInRange(tenantAId, {
        ...query,
        professionalId: secondProfessional.id,
        status: "CONFIRMED",
      });
      const overriddenScope = await findAppointmentsInRange(
        tenantAId,
        { ...query, professionalId: secondProfessional.id },
        professionalAId,
      );

      expect(appointments.map(({ id }) => id).sort()).toEqual(
        [crossingAppointmentId, secondProfessionalAppointmentId].sort(),
      );
      expect(professionalAppointments.map(({ id }) => id)).toEqual([
        crossingAppointmentId,
      ]);
      expect(filteredAppointments.map(({ id }) => id)).toEqual([
        secondProfessionalAppointmentId,
      ]);
      expect(overriddenScope).toHaveLength(0);
    });

    it("lists tenant-scoped appointments with search, filters and pagination", async () => {
      await createAppointment(tenantAId, appointmentData(), professionalAId);
      await createAppointment(
        tenantAId,
        appointmentData({
          startAt: new Date("2031-02-05T11:00:00.000Z"),
          endAt: new Date("2031-02-05T12:00:00.000Z"),
          status: "CONFIRMED",
        }),
        professionalAId,
      );
      await createAppointment(
        tenantAId,
        appointmentData({
          startAt: new Date("2031-02-05T12:00:00.000Z"),
          endAt: new Date("2031-02-05T13:00:00.000Z"),
          status: "CANCELLED",
        }),
        professionalAId,
      );

      const result = await findAppointments(
        tenantAId,
        appointmentListQuerySchema.parse({
          search: "ana cliente",
          page: 1,
          pageSize: 1,
          sortBy: "startAt",
          sortDirection: "asc",
          from: "2031-02-05T00:00:00.000Z",
          toExclusive: "2031-02-06T00:00:00.000Z",
          status: "CONFIRMED",
        }),
      );

      expect(result).toMatchObject({
        total: 1,
        page: 1,
        pageSize: 1,
        pageCount: 1,
      });
      expect(result.items[0]).toMatchObject({
        status: "CONFIRMED",
        attendanceId: null,
        hasAttendance: false,
        client: { id: clientAId, name: "Ana Cliente" },
        professional: { id: professionalAId, name: "Bruno Profissional" },
        service: { id: serviceAId, name: "Corte", duration: 60 },
      });
    });

    it("follows the database rule: only CANCELLED appointments do not block overlapping times", async () => {
      await createAppointment(tenantAId, appointmentData(), professionalAId);

      await expect(
        createAppointment(
          tenantAId,
          appointmentData({
            startAt: new Date("2031-02-05T10:30:00.000Z"),
            endAt: new Date("2031-02-05T11:30:00.000Z"),
            status: "CONFIRMED",
          }),
          professionalAId,
        ),
      ).rejects.toThrow("O profissional já possui um agendamento nesse horário.");

      await expect(
        createAppointment(
          tenantAId,
          appointmentData({
            startAt: new Date("2031-02-05T11:00:00.000Z"),
            endAt: new Date("2031-02-05T12:00:00.000Z"),
          }),
          professionalAId,
        ),
      ).resolves.toBeTruthy();

      const simultaneousStart = new Date("2031-02-06T10:00:00.000Z");
      const simultaneousData = appointmentData({
        startAt: simultaneousStart,
        endAt: new Date("2031-02-06T11:00:00.000Z"),
      });
      const simultaneousWrites = await Promise.allSettled([
        createAppointment(tenantAId, simultaneousData, professionalAId),
        createAppointment(tenantAId, simultaneousData, professionalAId),
      ]);

      expect(
        simultaneousWrites.filter((result) => result.status === "fulfilled"),
      ).toHaveLength(1);
      await expect(
        prisma.appointment.count({
          where: {
            tenantId: tenantAId,
            professionalId: professionalAId,
            startAt: simultaneousStart,
          },
        }),
      ).resolves.toBe(1);

      await expect(
        createAppointment(
          tenantAId,
          appointmentData({
            startAt: new Date("2031-02-05T10:30:00.000Z"),
            endAt: new Date("2031-02-05T11:30:00.000Z"),
            status: "NO_SHOW",
          }),
          professionalAId,
        ),
      ).rejects.toThrow("O profissional já possui um agendamento nesse horário.");

      await expect(
        createAppointment(
          tenantAId,
          appointmentData({
            startAt: new Date("2031-02-05T10:30:00.000Z"),
            endAt: new Date("2031-02-05T11:30:00.000Z"),
            status: "CANCELLED",
          }),
          professionalAId,
        ),
      ).resolves.toBeTruthy();
    });

    it("rejects foreign tenant relations and unassigned services", async () => {
      const foreignClient = await prisma.client.create({
        data: {
          tenantId: tenantBId,
          name: "Cliente externo",
        },
      });
      const unassignedService = await prisma.service.create({
        data: {
          tenantId: tenantAId,
          name: "Serviço sem associação",
          duration: 30,
          price: 25,
        },
      });
      const foreignService = await prisma.service.create({
        data: {
          tenantId: tenantBId,
          name: "Serviço de outro tenant",
          duration: 30,
          price: 25,
        },
      });
      const foreignUser = await prisma.user.create({
        data: {
          tenantId: tenantBId,
          name: "Profissional externo",
          email: `foreign-${crypto.randomUUID()}@example.com`,
          passwordHash: "test-hash",
          role: "PROFESSIONAL",
        },
      });
      const foreignProfessional = await prisma.professional.create({
        data: {
          tenantId: tenantBId,
          userId: foreignUser.id,
        },
      });
      await prisma.professionalService.create({
        data: {
          tenantId: tenantBId,
          professionalId: foreignProfessional.id,
          serviceId: foreignService.id,
        },
      });

      await expect(
        createAppointment(
          tenantAId,
          appointmentData({ clientId: foreignClient.id }),
          professionalAId,
        ),
      ).rejects.toThrow("Cliente, profissional ou serviço não encontrado neste tenant.");

      await expect(
        createAppointment(
          tenantAId,
          appointmentData({ professionalId: foreignProfessional.id }),
          foreignProfessional.id,
        ),
      ).rejects.toThrow("Cliente, profissional ou serviço não encontrado neste tenant.");

      await expect(
        createAppointment(
          tenantAId,
          appointmentData({ serviceId: foreignService.id }),
          professionalAId,
        ),
      ).rejects.toThrow("Cliente, profissional ou serviço não encontrado neste tenant.");

      await expect(
        createAppointment(
          tenantAId,
          appointmentData({ serviceId: unassignedService.id }),
          professionalAId,
        ),
      ).rejects.toThrow("O profissional não está associado a este serviço.");
    });

    it("scopes professional results and updates to their own appointments", async () => {
      const appointmentId = await createAppointment(
        tenantAId,
        appointmentData(),
        professionalAId,
      );
      const query = appointmentListQuerySchema.parse({});

      const ownAppointments = await findAppointments(
        tenantAId,
        query,
        professionalAId,
      );
      const otherAppointments = await findAppointments(
        tenantAId,
        query,
        "another-professional",
      );
      const attemptedScopeOverride = await findAppointments(
        tenantAId,
        {
          ...query,
          professionalId: "another-professional",
        },
        professionalAId,
      );

      expect(ownAppointments.total).toBe(1);
      expect(otherAppointments.total).toBe(0);
      expect(attemptedScopeOverride.total).toBe(0);

      await expect(
        updateAppointment(
          tenantAId,
          {
            ...appointmentData({
              startAt: new Date("2031-02-05T11:00:00.000Z"),
              endAt: new Date("2031-02-05T12:00:00.000Z"),
            }),
            id: appointmentId,
          },
          "another-professional",
        ),
      ).rejects.toThrow("Agendamento não encontrado.");
    });

    it("allows edits with attendance but preserves the database delete restriction", async () => {
      const appointmentId = await createAppointment(
        tenantAId,
        appointmentData(),
        professionalAId,
      );
      const attendance = await prisma.attendance.create({
        data: {
          tenantId: tenantAId,
          appointmentId,
        },
      });
      const payment = await prisma.payment.create({
        data: {
          tenantId: tenantAId,
          attendanceId: attendance.id,
        },
      });

      await expect(
        updateAppointment(tenantAId, {
          ...appointmentData({
            startAt: new Date("2031-02-05T11:00:00.000Z"),
            endAt: new Date("2031-02-05T12:00:00.000Z"),
            notes: "Atualizado após atendimento",
          }),
          id: appointmentId,
        }),
      ).resolves.toBeUndefined();

      await expect(
        deleteAppointment(tenantAId, appointmentId),
      ).rejects.toThrow(
        "Não é possível excluir este agendamento porque existe um atendimento ou pagamento vinculado.",
      );

      await expect(
        prisma.appointment.findUnique({
          where: { id: appointmentId },
          select: { id: true, notes: true },
        }),
      ).resolves.toEqual({
        id: appointmentId,
        notes: "Atualizado após atendimento",
      });
      await expect(
        prisma.attendance.findUnique({ where: { id: attendance.id } }),
      ).resolves.not.toBeNull();
      await expect(
        prisma.payment.findUnique({ where: { id: payment.id } }),
      ).resolves.not.toBeNull();
    });

    it("allows an end time that differs from the service duration", async () => {
      const appointmentId = await createAppointment(
        tenantAId,
        appointmentData({
          endAt: new Date("2031-02-05T10:45:00.000Z"),
        }),
        professionalAId,
      );

      await expect(
        prisma.appointment.findUniqueOrThrow({
          where: { id: appointmentId },
          select: { startAt: true, endAt: true, service: { select: { duration: true } } },
        }),
      ).resolves.toMatchObject({
        endAt: new Date("2031-02-05T10:45:00.000Z"),
        service: { duration: 60 },
      });
    });

    it("does not delete appointments from another tenant", async () => {
      const appointmentId = await createAppointment(
        tenantAId,
        appointmentData(),
        professionalAId,
      );

      await expect(
        deleteAppointment(tenantBId, appointmentId),
      ).rejects.toThrow("Agendamento não encontrado.");
      await expect(
        prisma.appointment.findUnique({ where: { id: appointmentId } }),
      ).resolves.not.toBeNull();
    });
  });
});
