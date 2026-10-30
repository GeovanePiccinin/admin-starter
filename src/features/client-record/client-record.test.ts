/**
 * @vitest-environment node
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db/prisma";

import {
  createClientRecord,
  deleteClientRecord,
  findClientRecordFormOptions,
  findClientRecords,
  updateClientRecord,
} from "./client-record.repository";
import { clientRecordListQuerySchema } from "./client-record.query";
import {
  clientRecordFormSchema,
  createClientRecordSchema,
  deleteClientRecordSchema,
  updateClientRecordSchema,
} from "./client-record.schema";

describe("ClientRecord", () => {
  let tenantAId: string;
  let tenantBId: string;
  let clientAId: string;
  let otherClientAId: string;
  let clientBId: string;
  let professionalAId: string;
  let serviceAId: string;
  let attendanceAId: string;
  let otherClientAttendanceId: string;

  beforeEach(async () => {
    const tenantA = await prisma.tenant.create({
      data: { name: `ClientRecord A ${crypto.randomUUID()}` },
    });
    const tenantB = await prisma.tenant.create({
      data: { name: `ClientRecord B ${crypto.randomUUID()}` },
    });
    tenantAId = tenantA.id;
    tenantBId = tenantB.id;

    const [clientA, otherClientA, clientB] = await Promise.all([
      prisma.client.create({
        data: { tenantId: tenantAId, name: "Ana Cliente" },
      }),
      prisma.client.create({
        data: { tenantId: tenantAId, name: "Bruna Cliente" },
      }),
      prisma.client.create({
        data: { tenantId: tenantBId, name: "Cliente de outro tenant" },
      }),
    ]);
    clientAId = clientA.id;
    otherClientAId = otherClientA.id;
    clientBId = clientB.id;

    const service = await prisma.service.create({
      data: {
        tenantId: tenantAId,
        name: "Consulta",
        duration: 60,
        price: 50,
      },
    });
    const user = await prisma.user.create({
      data: {
        tenantId: tenantAId,
        name: "Profissional de teste",
        email: `client-record-${crypto.randomUUID()}@example.com`,
        passwordHash: "test-hash",
      },
    });
    const professional = await prisma.professional.create({
      data: { tenantId: tenantAId, userId: user.id },
    });
    serviceAId = service.id;
    professionalAId = professional.id;

    const [appointmentA, otherClientAppointment] = await Promise.all([
      createAppointmentFixture({
        clientId: clientAId,
        startAt: new Date("2032-05-01T10:00:00.000Z"),
      }),
      createAppointmentFixture({
        clientId: otherClientAId,
        startAt: new Date("2032-05-02T10:00:00.000Z"),
      }),
    ]);
    const [attendanceA, otherClientAttendance] = await Promise.all([
      prisma.attendance.create({
        data: { tenantId: tenantAId, appointmentId: appointmentA.id },
      }),
      prisma.attendance.create({
        data: {
          tenantId: tenantAId,
          appointmentId: otherClientAppointment.id,
        },
      }),
    ]);
    attendanceAId = attendanceA.id;
    otherClientAttendanceId = otherClientAttendance.id;
  });

  afterEach(async () => {
    const tenantIds = [tenantAId, tenantBId];
    await prisma.clientRecord.deleteMany({
      where: { tenantId: { in: tenantIds } },
    });
    await prisma.payment.deleteMany({
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
      where: { tenantId: { in: tenantIds } },
    });
    await prisma.tenant.deleteMany({
      where: { id: { in: tenantIds } },
    });
  });

  async function createAppointmentFixture(input: {
    clientId: string;
    startAt: Date;
  }) {
    return prisma.appointment.create({
      data: {
        tenantId: tenantAId,
        clientId: input.clientId,
        professionalId: professionalAId,
        serviceId: serviceAId,
        startAt: input.startAt,
        endAt: new Date(input.startAt.getTime() + 60 * 60_000),
      },
    });
  }

  describe("schemas", () => {
    it("validates list defaults, filters, and supported sorting", () => {
      expect(clientRecordListQuerySchema.parse({})).toMatchObject({
        search: "",
        page: 1,
        pageSize: 10,
        sortBy: "createdAt",
        sortDirection: "desc",
        attendanceLink: "all",
      });
      expect(
        clientRecordListQuerySchema.safeParse({
          attendanceLink: "linked",
          sortBy: "client",
          sortDirection: "asc",
        }).success,
      ).toBe(true);
      expect(
        clientRecordListQuerySchema.safeParse({
          attendanceLink: "invalid",
        }).success,
      ).toBe(false);
    });

    it("validates record content and mutation identifiers", () => {
      expect(
        clientRecordFormSchema.safeParse({
          clientId: "client-1",
          attendanceId: "",
          content: "Anamnese",
        }).success,
      ).toBe(true);
      expect(
        createClientRecordSchema.safeParse({
          clientId: "",
          attendanceId: "",
          content: "Anamnese",
        }).success,
      ).toBe(false);
      expect(
        updateClientRecordSchema.safeParse({
          id: "",
          clientId: "client-1",
          attendanceId: "",
          content: "Anamnese",
        }).success,
      ).toBe(false);
      expect(deleteClientRecordSchema.safeParse({ id: "" }).success).toBe(
        false,
      );
    });
  });

  describe("repository", () => {
    it("creates records with optional attendance and validates ownership", async () => {
      await createClientRecord(tenantAId, {
        clientId: clientAId,
        attendanceId: attendanceAId,
        content: "Registro com atendimento",
      });
      await createClientRecord(tenantAId, {
        clientId: otherClientAId,
        attendanceId: "",
        content: "Registro sem atendimento",
      });

      const records = await prisma.clientRecord.findMany({
        where: { tenantId: tenantAId },
        orderBy: { content: "asc" },
        select: { clientId: true, attendanceId: true, content: true },
      });
      expect(records).toEqual([
        {
          clientId: clientAId,
          attendanceId: attendanceAId,
          content: "Registro com atendimento",
        },
        {
          clientId: otherClientAId,
          attendanceId: null,
          content: "Registro sem atendimento",
        },
      ]);

      await expect(
        createClientRecord(tenantAId, {
          clientId: clientAId,
          attendanceId: otherClientAttendanceId,
          content: "Vínculo de outro cliente",
        }),
      ).rejects.toThrow("não pertence ao cliente informado");
      await expect(
        createClientRecord(tenantAId, {
          clientId: clientBId,
          attendanceId: "",
          content: "Cliente de outro tenant",
        }),
      ).rejects.toThrow("Cliente não encontrado.");
    });

    it("searches, filters, paginates, and scopes records by tenant", async () => {
      await createClientRecord(tenantAId, {
        clientId: clientAId,
        attendanceId: attendanceAId,
        content: "Consulta inicial",
      });
      await createClientRecord(tenantAId, {
        clientId: otherClientAId,
        attendanceId: "",
        content: "Observação sem vínculo",
      });
      await createClientRecord(tenantBId, {
        clientId: clientBId,
        attendanceId: "",
        content: "Registro não visível",
      });

      const linked = await findClientRecords(
        tenantAId,
        clientRecordListQuerySchema.parse({ attendanceLink: "linked" }),
      );
      const search = await findClientRecords(
        tenantAId,
        clientRecordListQuerySchema.parse({ search: "bruna" }),
      );
      const page = await findClientRecords(
        tenantAId,
        clientRecordListQuerySchema.parse({ pageSize: 1 }),
      );

      expect(linked.total).toBe(1);
      expect(linked.items[0]?.attendance?.id).toBe(attendanceAId);
      expect(search.total).toBe(1);
      expect(search.items[0]?.client.name).toBe("Bruna Cliente");
      expect(page.total).toBe(2);
      expect(page.items).toHaveLength(1);
      expect(page.pageCount).toBe(2);
    });

    it("updates content and relations only within the tenant", async () => {
      await createClientRecord(tenantAId, {
        clientId: clientAId,
        attendanceId: "",
        content: "Antes",
      });
      const record = await prisma.clientRecord.findFirstOrThrow({
        where: { tenantId: tenantAId, content: "Antes" },
        select: { id: true },
      });

      await updateClientRecord(tenantAId, {
        id: record.id,
        clientId: clientAId,
        attendanceId: attendanceAId,
        content: "Depois",
      });

      await expect(
        prisma.clientRecord.findUniqueOrThrow({
          where: { id: record.id },
          select: { content: true, attendanceId: true },
        }),
      ).resolves.toEqual({
        content: "Depois",
        attendanceId: attendanceAId,
      });
      await expect(
        updateClientRecord(tenantBId, {
          id: record.id,
          clientId: clientBId,
          attendanceId: "",
          content: "Não autorizado",
        }),
      ).rejects.toThrow("Ficha do cliente não encontrada.");
      await expect(
        updateClientRecord(tenantAId, {
          id: record.id,
          clientId: clientAId,
          attendanceId: otherClientAttendanceId,
          content: "Vínculo inválido",
        }),
      ).rejects.toThrow("não pertence ao cliente informado");
    });

    it("deletes only tenant-owned records and leaves linked attendance intact", async () => {
      await createClientRecord(tenantAId, {
        clientId: clientAId,
        attendanceId: attendanceAId,
        content: "Registro vinculado",
      });
      const record = await prisma.clientRecord.findFirstOrThrow({
        where: { tenantId: tenantAId },
        select: { id: true },
      });

      await expect(
        deleteClientRecord(tenantBId, record.id),
      ).rejects.toThrow("Ficha do cliente não encontrada.");
      await expect(
        prisma.clientRecord.findUnique({ where: { id: record.id } }),
      ).resolves.not.toBeNull();

      await deleteClientRecord(tenantAId, record.id);

      await expect(
        prisma.clientRecord.findUnique({ where: { id: record.id } }),
      ).resolves.toBeNull();
      await expect(
        prisma.attendance.findUnique({ where: { id: attendanceAId } }),
      ).resolves.not.toBeNull();
    });

    it("provides tenant-scoped client and same-client attendance options", async () => {
      const options = await findClientRecordFormOptions(tenantAId, clientAId);

      expect(options.clients.map(({ id }) => id)).toEqual(
        expect.arrayContaining([clientAId, otherClientAId]),
      );
      expect(options.clients.map(({ id }) => id)).not.toContain(clientBId);
      expect(options.attendances.map(({ id }) => id)).toEqual([attendanceAId]);
    });
  });
});
