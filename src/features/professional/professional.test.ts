/**
 * @vitest-environment node
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db/prisma";

import {
  createProfessional,
  deleteProfessional,
  findProfessionals,
  updateProfessional,
} from "./professional.repository";
import { professionalListQuerySchema } from "./professional.query";
import {
  createProfessionalSchema,
  deleteProfessionalSchema,
  updateProfessionalSchema,
} from "./professional.schema";

describe("Professional list", () => {
  let tenantAId: string;
  let tenantBId: string;

  describe("query schema", () => {
    it("applies list defaults and trims the search term", () => {
      expect(professionalListQuerySchema.parse({ search: "  Ana  " })).toEqual({
        search: "Ana",
        page: 1,
        pageSize: 10,
        sortBy: "name",
        sortDirection: "asc",
      });
    });

    it("rejects invalid pagination, search, and sort values", () => {
      expect(
        professionalListQuerySchema.safeParse({
          search: "a".repeat(101),
          page: 1,
          pageSize: 10,
          sortBy: "tenantId",
          sortDirection: "asc",
        }).success,
      ).toBe(false);

      expect(
        professionalListQuerySchema.safeParse({
          search: "",
          page: 0,
          pageSize: 101,
          sortBy: "name",
          sortDirection: "asc",
        }).success,
      ).toBe(false);
    });
  });

  describe("mutation schemas", () => {
    it("validates and normalizes required professional details", () => {
      expect(
        createProfessionalSchema.parse({
          name: "  Ana Silva ",
          email: " ANA@EXAMPLE.COM ",
          password: "senha-segura-123",
          serviceIds: ["service-1"],
        }),
      ).toEqual({
        name: "Ana Silva",
        email: "ana@example.com",
        password: "senha-segura-123",
        serviceIds: ["service-1"],
      });
    });

    it("requires a valid email, password, and at least one unique service", () => {
      expect(
        createProfessionalSchema.safeParse({
          name: "Ana Silva",
          email: "invalid",
          password: "short",
          serviceIds: [],
        }).success,
      ).toBe(false);

      expect(
        createProfessionalSchema.safeParse({
          name: "Ana Silva",
          email: "ana@example.com",
          password: "senha-segura-123",
          serviceIds: ["service-1", "service-1"],
        }).success,
      ).toBe(false);
    });

    it("allows an unchanged password during update", () => {
      expect(
        updateProfessionalSchema.safeParse({
          id: "professional-1",
          name: "Ana Silva",
          email: "ana@example.com",
          password: "",
          serviceIds: ["service-1"],
        }).success,
      ).toBe(true);

      expect(
        updateProfessionalSchema.safeParse({
          id: "",
          name: "Ana Silva",
          email: "ana@example.com",
          serviceIds: ["service-1"],
        }).success,
      ).toBe(false);
    });

    it("requires a non-empty ID for deletion", () => {
      expect(deleteProfessionalSchema.safeParse({ id: "" }).success).toBe(
        false,
      );
    });
  });

  describe("repository", () => {
    beforeEach(async () => {
      const [tenantA, tenantB] = await Promise.all([
        prisma.tenant.create({
          data: { name: `Professional list A ${crypto.randomUUID()}` },
        }),
        prisma.tenant.create({
          data: { name: `Professional list B ${crypto.randomUUID()}` },
        }),
      ]);

      tenantAId = tenantA.id;
      tenantBId = tenantB.id;
    });

    afterEach(async () => {
      const tenantIds = [tenantAId, tenantBId];
      await prisma.professionalService.deleteMany({
        where: { tenantId: { in: tenantIds } },
      });
      await prisma.appointment.deleteMany({
        where: { tenantId: { in: tenantIds } },
      });
      await prisma.auditLog.deleteMany({
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

    async function createProfessionalFixture(
      tenantId: string,
      name: string,
      email: string,
      serviceName: string,
    ) {
      const user = await prisma.user.create({
        data: {
          tenantId,
          name,
          email: `${email}-${crypto.randomUUID()}@example.com`,
          passwordHash: "test-hash",
          role: "PROFESSIONAL",
        },
      });
      const professional = await prisma.professional.create({
        data: {
          tenantId,
          userId: user.id,
        },
      });
      const service = await prisma.service.create({
        data: {
          tenantId,
          name: serviceName,
          duration: 30,
          price: 50,
        },
      });

      await prisma.professionalService.create({
        data: {
          tenantId,
          professionalId: professional.id,
          serviceId: service.id,
        },
      });

      return professional;
    }

    it("searches by name, email, and assigned service within a tenant", async () => {
      await createProfessionalFixture(tenantAId, "Ana Silva", "ana", "Corte");
      await createProfessionalFixture(
        tenantAId,
        "Bruno Costa",
        "bruno",
        "Massagem",
      );
      await createProfessionalFixture(
        tenantBId,
        "Ana Tenant B",
        "ana-b",
        "Corte",
      );

      const nameResult = await findProfessionals(tenantAId, {
        search: "ANA SILVA",
        page: 1,
        pageSize: 10,
        sortBy: "name",
        sortDirection: "asc",
      });
      const emailResult = await findProfessionals(tenantAId, {
        search: "BRUNO-",
        page: 1,
        pageSize: 10,
        sortBy: "name",
        sortDirection: "asc",
      });
      const serviceResult = await findProfessionals(tenantAId, {
        search: "massagem",
        page: 1,
        pageSize: 10,
        sortBy: "name",
        sortDirection: "asc",
      });

      expect(nameResult.items.map((item) => item.name)).toEqual(["Ana Silva"]);
      expect(emailResult.items.map((item) => item.name)).toEqual([
        "Bruno Costa",
      ]);
      expect(serviceResult.items.map((item) => item.name)).toEqual([
        "Bruno Costa",
      ]);
      expect(serviceResult.items[0].services).toEqual([
        expect.objectContaining({ name: "Massagem" }),
      ]);
    });

    it("returns tenant-scoped sorted pages and total metadata", async () => {
      await createProfessionalFixture(tenantAId, "Ana", "ana", "Corte");
      await createProfessionalFixture(tenantAId, "Bruno", "bruno", "Massagem");
      await createProfessionalFixture(tenantAId, "Carla", "carla", "Consulta");
      await createProfessionalFixture(tenantBId, "Zoe", "zoe", "Corte");

      const result = await findProfessionals(tenantAId, {
        search: "",
        page: 2,
        pageSize: 2,
        sortBy: "name",
        sortDirection: "asc",
      });

      expect(result).toMatchObject({
        total: 3,
        page: 2,
        pageSize: 2,
        pageCount: 2,
      });
      expect(result.items.map((item) => item.name)).toEqual(["Carla"]);
    });

    it("creates and updates the account and assigned services in one tenant", async () => {
      const serviceA = await prisma.service.create({
        data: {
          tenantId: tenantAId,
          name: "Corte",
          duration: 30,
          price: 50,
        },
      });
      const serviceB = await prisma.service.create({
        data: {
          tenantId: tenantAId,
          name: "Massagem",
          duration: 60,
          price: 100,
        },
      });

      const professionalId = await createProfessional(tenantAId, {
        name: "Ana Silva",
        email: `ana-${crypto.randomUUID()}@example.com`,
        passwordHash: "hashed-password",
        serviceIds: [serviceA.id],
      });

      await updateProfessional(tenantAId, {
        id: professionalId,
        name: "Ana Atualizada",
        email: `ana-atualizada-${crypto.randomUUID()}@example.com`,
        serviceIds: [serviceB.id],
      });

      const result = await findProfessionals(tenantAId, {
        search: "Ana Atualizada",
        page: 1,
        pageSize: 10,
        sortBy: "name",
        sortDirection: "asc",
      });

      expect(result.items[0]).toMatchObject({
        name: "Ana Atualizada",
        services: [{ id: serviceB.id, name: "Massagem" }],
      });
      await expect(
        prisma.professionalService.count({
          where: {
            tenantId: tenantAId,
            professionalId,
            serviceId: serviceA.id,
          },
        }),
      ).resolves.toBe(0);
    });

    it("rejects foreign-tenant services and professional IDs", async () => {
      const ownService = await prisma.service.create({
        data: {
          tenantId: tenantAId,
          name: "Corte",
          duration: 30,
          price: 50,
        },
      });
      const foreignService = await prisma.service.create({
        data: {
          tenantId: tenantBId,
          name: "Serviço externo",
          duration: 30,
          price: 50,
        },
      });

      await expect(
        createProfessional(tenantAId, {
          name: "Tentativa",
          email: `tentativa-${crypto.randomUUID()}@example.com`,
          passwordHash: "hashed-password",
          serviceIds: [foreignService.id],
        }),
      ).rejects.toThrow("Um ou mais serviços não pertencem a este tenant.");

      const ownProfessionalId = await createProfessional(tenantAId, {
        name: "Ana Silva",
        email: `ana-${crypto.randomUUID()}@example.com`,
        passwordHash: "hashed-password",
        serviceIds: [ownService.id],
      });
      const foreignProfessionalId = await createProfessional(tenantBId, {
        name: "Bruno Costa",
        email: `bruno-${crypto.randomUUID()}@example.com`,
        passwordHash: "hashed-password",
        serviceIds: [foreignService.id],
      });

      await expect(
        updateProfessional(tenantAId, {
          id: foreignProfessionalId,
          name: "Alteração indevida",
          email: `invasao-${crypto.randomUUID()}@example.com`,
          serviceIds: [ownService.id],
        }),
      ).rejects.toThrow("Profissional não encontrado.");

      await expect(
        prisma.professional.findUniqueOrThrow({
          where: { id: ownProfessionalId },
          select: {
            user: { select: { name: true } },
          },
        }),
      ).resolves.toMatchObject({ user: { name: "Ana Silva" } });
    });

    it("reports a duplicate email without leaving partial records", async () => {
      const serviceA = await prisma.service.create({
        data: {
          tenantId: tenantAId,
          name: "Corte A",
          duration: 30,
          price: 50,
        },
      });
      const serviceB = await prisma.service.create({
        data: {
          tenantId: tenantBId,
          name: "Corte B",
          duration: 30,
          price: 50,
        },
      });
      const email = `duplicate-${crypto.randomUUID()}@example.com`;

      await createProfessional(tenantAId, {
        name: "Ana Silva",
        email,
        passwordHash: "hashed-password",
        serviceIds: [serviceA.id],
      });

      await expect(
        createProfessional(tenantBId, {
          name: "Bruno Costa",
          email,
          passwordHash: "hashed-password",
          serviceIds: [serviceB.id],
        }),
      ).rejects.toThrow(
        "Já existe uma conta cadastrada com este e-mail.",
      );
      await expect(
        prisma.professional.count({
          where: {
            tenantId: tenantBId,
          },
        }),
      ).resolves.toBe(0);
    });

    it("deletes the professional and its user account", async () => {
      const service = await prisma.service.create({
        data: {
          tenantId: tenantAId,
          name: "Corte",
          duration: 30,
          price: 50,
        },
      });
      const professionalId = await createProfessional(tenantAId, {
        name: "Ana Silva",
        email: `ana-${crypto.randomUUID()}@example.com`,
        passwordHash: "hashed-password",
        serviceIds: [service.id],
      });
      const professional = await prisma.professional.findUniqueOrThrow({
        where: { id: professionalId },
        select: { userId: true },
      });

      await expect(
        deleteProfessional(tenantAId, professionalId),
      ).resolves.toBeUndefined();
      await expect(
        prisma.professional.findUnique({ where: { id: professionalId } }),
      ).resolves.toBeNull();
      await expect(
        prisma.user.findUnique({ where: { id: professional.userId } }),
      ).resolves.toBeNull();
    });

    it("does not delete an absent or foreign-tenant professional", async () => {
      const service = await prisma.service.create({
        data: {
          tenantId: tenantBId,
          name: "Corte",
          duration: 30,
          price: 50,
        },
      });
      const foreignProfessionalId = await createProfessional(tenantBId, {
        name: "Ana Tenant B",
        email: `ana-${crypto.randomUUID()}@example.com`,
        passwordHash: "hashed-password",
        serviceIds: [service.id],
      });

      await expect(
        deleteProfessional(tenantAId, foreignProfessionalId),
      ).rejects.toThrow("Profissional não encontrado.");
      await expect(
        deleteProfessional(tenantAId, "missing-professional"),
      ).rejects.toThrow("Profissional não encontrado.");
      await expect(
        prisma.professional.findUnique({
          where: { id: foreignProfessionalId },
        }),
      ).resolves.not.toBeNull();
    });

    it("preserves the account when appointments or audit logs restrict deletion", async () => {
      const service = await prisma.service.create({
        data: {
          tenantId: tenantAId,
          name: "Corte",
          duration: 30,
          price: 50,
        },
      });
      const professionalId = await createProfessional(tenantAId, {
        name: "Ana Silva",
        email: `ana-${crypto.randomUUID()}@example.com`,
        passwordHash: "hashed-password",
        serviceIds: [service.id],
      });
      const professional = await prisma.professional.findUniqueOrThrow({
        where: { id: professionalId },
        select: { userId: true },
      });
      const client = await prisma.client.create({
        data: {
          tenantId: tenantAId,
          name: "Cliente agendado",
        },
      });
      const startAt = new Date("2035-01-01T10:00:00.000Z");

      await prisma.appointment.create({
        data: {
          tenantId: tenantAId,
          clientId: client.id,
          professionalId,
          serviceId: service.id,
          startAt,
          endAt: new Date(startAt.getTime() + 30 * 60 * 1000),
        },
      });

      await expect(deleteProfessional(tenantAId, professionalId)).rejects.toThrow(
        "Não é possível excluir este profissional porque existem agendamentos ou registros de auditoria vinculados.",
      );
      await expect(
        prisma.user.findUnique({ where: { id: professional.userId } }),
      ).resolves.not.toBeNull();

      await prisma.appointment.deleteMany({
        where: { tenantId: tenantAId },
      });
      await prisma.auditLog.create({
        data: {
          tenantId: tenantAId,
          actorId: professional.userId,
          action: "professional.test",
          entity: "Professional",
          entityId: professionalId,
        },
      });

      await expect(deleteProfessional(tenantAId, professionalId)).rejects.toThrow(
        "Não é possível excluir este profissional porque existem agendamentos ou registros de auditoria vinculados.",
      );
      await expect(
        prisma.professional.findUnique({ where: { id: professionalId } }),
      ).resolves.not.toBeNull();
    });
  });
});
