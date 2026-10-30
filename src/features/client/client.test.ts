/**
 * @vitest-environment node
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db/prisma";

import {
  createClient,
  deleteClient,
  findClients,
  updateClient,
} from "./client.repository";
import { clientListQuerySchema } from "./client.query";
import {
  createClientSchema,
  deleteClientSchema,
  updateClientSchema,
} from "./client.schema";

describe("Client list", () => {
  let tenantAId: string;
  let tenantBId: string;

  describe("query schema", () => {
    it("applies list defaults and trims search", () => {
      expect(clientListQuerySchema.parse({ search: "  ana  " })).toEqual({
        search: "ana",
        page: 1,
        pageSize: 10,
        sortBy: "name",
        sortDirection: "asc",
      });
    });

    it("accepts search up to 100 characters and all supported sort values", () => {
      expect(
        clientListQuerySchema.safeParse({
          search: "a".repeat(100),
          page: 1,
          pageSize: 100,
          sortBy: "email",
          sortDirection: "desc",
        }).success,
      ).toBe(true);

      expect(
        clientListQuerySchema.safeParse({
          search: "phone",
          page: 2,
          pageSize: 10,
          sortBy: "phone",
          sortDirection: "asc",
        }).success,
      ).toBe(true);
    });

    it("rejects invalid pagination and sort values", () => {
      expect(
        clientListQuerySchema.safeParse({
          search: "",
          page: 0,
          pageSize: 10,
          sortBy: "tenantId",
          sortDirection: "asc",
        }).success,
      ).toBe(false);

      expect(
        clientListQuerySchema.safeParse({
          search: "",
          page: 1,
          pageSize: 101,
          sortBy: "name",
          sortDirection: "asc",
        }).success,
      ).toBe(false);

      expect(
        clientListQuerySchema.safeParse({
          search: "a".repeat(101),
          page: 1,
          pageSize: 10,
          sortBy: "name",
          sortDirection: "asc",
        }).success,
      ).toBe(false);
    });
  });

  describe("mutation schemas", () => {
    it("trims and requires a client name", () => {
      expect(
        createClientSchema.parse({
          name: "  Ana Silva  ",
          email: "",
          phone: "",
        }),
      ).toEqual({
        name: "Ana Silva",
        email: "",
        phone: "",
      });

      expect(createClientSchema.safeParse({ name: "   " }).success).toBe(false);
    });

    it("accepts optional contact details and rejects malformed email", () => {
      expect(createClientSchema.parse({ name: "Ana Silva" })).toEqual({
        name: "Ana Silva",
      });

      expect(
        createClientSchema.safeParse({
          name: "Ana Silva",
          email: "invalid-email",
        }).success,
      ).toBe(false);
    });

    it("requires a non-empty ID for update and delete", () => {
      expect(
        updateClientSchema.safeParse({ id: "", name: "Ana Silva" }).success,
      ).toBe(false);
      expect(deleteClientSchema.safeParse({ id: "" }).success).toBe(false);
    });
  });

  describe("repository", () => {
    beforeEach(async () => {
      const tenantA = await prisma.tenant.create({
        data: {
          name: `Client list tenant A ${crypto.randomUUID()}`,
        },
      });

      const tenantB = await prisma.tenant.create({
        data: {
          name: `Client list tenant B ${crypto.randomUUID()}`,
        },
      });

      tenantAId = tenantA.id;
      tenantBId = tenantB.id;

      await prisma.client.createMany({
        data: [
          {
            tenantId: tenantAId,
            name: "Ana Silva",
            email: "ana@example.com",
            phone: "+55 11 1111-1111",
          },
          {
            tenantId: tenantAId,
            name: "Bruno Costa",
            email: "bruno@example.com",
            phone: "+55 11 2222-2222",
          },
          {
            tenantId: tenantAId,
            name: "Carla Souza",
            email: "carla@example.com",
            phone: "+55 11 3333-3333",
          },
          {
            tenantId: tenantBId,
            name: "Ana Tenant B",
            email: "ana.tenantb@example.com",
            phone: "+55 21 1111-1111",
          },
        ],
      });
    });

    afterEach(async () => {
      await prisma.clientRecord.deleteMany({
        where: {
          tenantId: {
            in: [tenantAId, tenantBId],
          },
        },
      });
      await prisma.appointment.deleteMany({
        where: {
          tenantId: {
            in: [tenantAId, tenantBId],
          },
        },
      });
      await prisma.professional.deleteMany({
        where: {
          tenantId: {
            in: [tenantAId, tenantBId],
          },
        },
      });
      await prisma.service.deleteMany({
        where: {
          tenantId: {
            in: [tenantAId, tenantBId],
          },
        },
      });

      await prisma.tenant.deleteMany({
        where: {
          id: {
            in: [tenantAId, tenantBId],
          },
        },
      });
    });

    it("searches name, email, and phone within a tenant", async () => {
      const nameMatch = await findClients(tenantAId, {
        search: "ANA",
        page: 1,
        pageSize: 10,
        sortBy: "name",
        sortDirection: "asc",
      });
      const emailMatch = await findClients(tenantAId, {
        search: "BRUNO@EXAMPLE",
        page: 1,
        pageSize: 10,
        sortBy: "name",
        sortDirection: "asc",
      });
      const phoneMatch = await findClients(tenantAId, {
        search: "3333-3333",
        page: 1,
        pageSize: 10,
        sortBy: "name",
        sortDirection: "asc",
      });

      expect(nameMatch.items.map((client) => client.name)).toEqual(["Ana Silva"]);
      expect(emailMatch.items.map((client) => client.name)).toEqual([
        "Bruno Costa",
      ]);
      expect(phoneMatch.items.map((client) => client.name)).toEqual([
        "Carla Souza",
      ]);
    });

    it("returns tenant-scoped sorted pages and total metadata", async () => {
      const result = await findClients(tenantAId, {
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

      expect(result.items.map((client) => client.name)).toEqual(["Carla Souza"]);
    });

    it("sorts results in the requested direction", async () => {
      const result = await findClients(tenantAId, {
        search: "",
        page: 1,
        pageSize: 10,
        sortBy: "name",
        sortDirection: "desc",
      });

      expect(result.items.map((client) => client.name)).toEqual([
        "Carla Souza",
        "Bruno Costa",
        "Ana Silva",
      ]);
    });

    it("uses the client ID as a deterministic sort tie-breaker", async () => {
      const clients = await Promise.all([
        prisma.client.create({
          data: { tenantId: tenantAId, name: "Nome repetido" },
        }),
        prisma.client.create({
          data: { tenantId: tenantAId, name: "Nome repetido" },
        }),
      ]);

      const result = await findClients(tenantAId, {
        search: "Nome repetido",
        page: 1,
        pageSize: 10,
        sortBy: "name",
        sortDirection: "asc",
      });

      expect(result.items.map((client) => client.id)).toEqual(
        clients.map((client) => client.id).sort(),
      );
    });

    it("creates clients with the tenant supplied by the server boundary", async () => {
      await createClient(tenantAId, {
        name: "Novo Cliente",
        email: "novo@example.com",
        phone: "+55 11 9999-9999",
      });

      await expect(
        prisma.client.findFirst({
          where: {
            tenantId: tenantAId,
            name: "Novo Cliente",
          },
        }),
      ).resolves.toMatchObject({
        email: "novo@example.com",
        phone: "+55 11 9999-9999",
      });
    });

    it("updates only a client belonging to the supplied tenant", async () => {
      const ownedClient = await prisma.client.findFirstOrThrow({
        where: {
          tenantId: tenantAId,
          name: "Ana Silva",
        },
      });
      const foreignClient = await prisma.client.findFirstOrThrow({
        where: {
          tenantId: tenantBId,
          name: "Ana Tenant B",
        },
      });

      await updateClient(tenantAId, {
        id: ownedClient.id,
        name: "Ana Atualizada",
        email: "ana.atualizada@example.com",
        phone: "+55 11 9999-0000",
      });

      await expect(
        prisma.client.findUnique({
          where: { id: ownedClient.id },
        }),
      ).resolves.toMatchObject({
        name: "Ana Atualizada",
        email: "ana.atualizada@example.com",
        phone: "+55 11 9999-0000",
      });

      await expect(
        updateClient(tenantAId, {
          id: foreignClient.id,
          name: "Alteração indevida",
          email: "",
          phone: "",
        }),
      ).rejects.toThrow("Cliente não encontrado.");

      await expect(
        prisma.client.findUnique({
          where: { id: foreignClient.id },
        }),
      ).resolves.toMatchObject({
        name: "Ana Tenant B",
        tenantId: tenantBId,
      });
    });

    it("deletes a tenant-owned client and rejects missing or foreign IDs", async () => {
      const client = await prisma.client.create({
        data: { tenantId: tenantAId, name: "Cliente para excluir" },
      });
      const foreignClient = await prisma.client.findFirstOrThrow({
        where: {
          tenantId: tenantBId,
          name: "Ana Tenant B",
        },
      });

      await expect(deleteClient(tenantAId, client.id)).resolves.toBeUndefined();
      await expect(
        prisma.client.findUnique({ where: { id: client.id } }),
      ).resolves.toBeNull();
      await expect(deleteClient(tenantAId, foreignClient.id)).rejects.toThrow(
        "Cliente não encontrado.",
      );
      await expect(deleteClient(tenantAId, "missing-client-id")).rejects.toThrow(
        "Cliente não encontrado.",
      );
    });

    it("preserves clients referenced by a client record or appointment", async () => {
      const fichaClient = await prisma.client.create({
        data: { tenantId: tenantAId, name: "Cliente com registro" },
      });
      const appointmentClient = await prisma.client.create({
        data: { tenantId: tenantAId, name: "Cliente com agendamento" },
      });
      const user = await prisma.user.create({
        data: {
          tenantId: tenantAId,
          name: "Profissional de teste",
          email: `professional-${crypto.randomUUID()}@example.com`,
          passwordHash: "test-hash",
        },
      });
      const professional = await prisma.professional.create({
        data: {
          tenantId: tenantAId,
          userId: user.id,
        },
      });
      const service = await prisma.service.create({
        data: {
          tenantId: tenantAId,
          name: "Serviço de teste",
          duration: 30,
          price: 0,
        },
      });
      const startAt = new Date("2030-01-01T10:00:00.000Z");

      await prisma.clientRecord.create({
        data: {
          tenantId: tenantAId,
          clientId: fichaClient.id,
          content: "Ficha de teste",
        },
      });
      await prisma.appointment.create({
        data: {
          tenantId: tenantAId,
          clientId: appointmentClient.id,
          professionalId: professional.id,
          serviceId: service.id,
          startAt,
          endAt: new Date(startAt.getTime() + 30 * 60 * 1000),
        },
      });

      await expect(deleteClient(tenantAId, fichaClient.id)).rejects.toThrow(
        "Não é possível excluir este cliente porque existem registros vinculados.",
      );
      await expect(
        prisma.client.findUnique({ where: { id: fichaClient.id } }),
      ).resolves.not.toBeNull();

      await expect(deleteClient(tenantAId, appointmentClient.id)).rejects.toThrow(
        "Não é possível excluir este cliente porque existem registros vinculados.",
      );
      await expect(
        prisma.client.findUnique({ where: { id: appointmentClient.id } }),
      ).resolves.not.toBeNull();
    });
  });
});
