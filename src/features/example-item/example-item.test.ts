/**
 * @vitest-environment node
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db/prisma";

import { createExampleItem, findExampleItems } from "./example-item.repository";

import { createExampleItemSchema } from "./example-item.schema";

describe("ExampleItem", () => {
  let tenantAId: string;
  let tenantBId: string;

  describe("schema", () => {
    it("accepts valid data", () => {
      const result = createExampleItemSchema.safeParse({
        name: "Primeiro item",
        description: "Item de exemplo",
        active: true,
      });

      expect(result.success).toBe(true);
    });

    it("rejects invalid data", () => {
      const result = createExampleItemSchema.safeParse({
        name: "",
        description: "",
        active: true,
      });

      expect(result.success).toBe(false);
    });
  });

  describe("repository", () => {
    beforeEach(async () => {
      const tenantA = await prisma.tenant.create({
        data: {
          name: `Example Item Tenant A ${crypto.randomUUID()}`,
        },
      });

      const tenantB = await prisma.tenant.create({
        data: {
          name: `Example Item Tenant B ${crypto.randomUUID()}`,
        },
      });

      tenantAId = tenantA.id;
      tenantBId = tenantB.id;
    });

    afterEach(async () => {
      if (!tenantAId && !tenantBId) {
        return;
      }

      await prisma.tenant.deleteMany({
        where: { id: { in: [tenantAId, tenantBId].filter(Boolean) } },
      });
    });

    it("creates and lists an item", async () => {
      await createExampleItem(tenantAId, {
        name: "Primeiro item",
        description: "Item de demonstração",
        active: true,
      });

      const result = await findExampleItems(tenantAId, {
        search: "",
        page: 1,
        pageSize: 20,
        sortBy: "name",
        sortDirection: "asc",
      });

      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toMatchObject({
        name: "Primeiro item",
        description: "Item de demonstração",
        active: true,
      });
    });

    it("isolates items by tenant", async () => {
      await createExampleItem(tenantAId, {
        name: "Item do tenant A",
        description: "",
        active: true,
      });

      await createExampleItem(tenantBId, {
        name: "Item do tenant B",
        description: "",
        active: true,
      });

      const result = await findExampleItems(tenantAId, {
        search: "",
        page: 1,
        pageSize: 20,
        sortBy: "name",
        sortDirection: "asc",
      });

      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe("Item do tenant A");
    });
  });
});
