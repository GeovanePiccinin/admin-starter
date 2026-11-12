/**
 * @vitest-environment node
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn<() => Promise<null>>(),
  findFirst: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: {
      findFirst: mocks.findFirst,
    },
  },
}));

import {
  createExampleItemAction,
  deleteExampleItemAction,
  getExampleItems,
  updateExampleItemAction,
} from "./example-item.actions";

describe("ExampleItem server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue(null);
  });

  it("requires authentication for listing", async () => {
    await expect(
      getExampleItems({
        search: "",
        page: 1,
        pageSize: 20,
        sortBy: "name",
        sortDirection: "asc",
      }),
    ).rejects.toThrow("Usuário não autenticado.");
  });

  it("requires authentication for create, update, and delete", async () => {
    await expect(
      createExampleItemAction({
        name: "Item",
        description: "",
        active: true,
      }),
    ).rejects.toThrow("Usuário não autenticado.");

    await expect(
      updateExampleItemAction({
        id: "example-item-1",
        name: "Item",
        description: "",
        active: true,
      }),
    ).rejects.toThrow("Usuário não autenticado.");

    await expect(
      deleteExampleItemAction({ id: "example-item-1" }),
    ).rejects.toThrow("Usuário não autenticado.");

    expect(mocks.findFirst).not.toHaveBeenCalled();
  });
});
