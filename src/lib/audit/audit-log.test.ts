import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    auditLog: { create: mocks.create },
  },
}));

import { writeAuditLog } from "./audit-log";

describe("writeAuditLog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("writes only audit metadata, never operation payloads", async () => {
    mocks.create.mockResolvedValue({});

    await writeAuditLog({
      tenantId: "tenant-1",
      actorId: "user-1",
      action: "update",
      entity: "ExampleItem",
      entityId: "record-1",
    });

    expect(mocks.create).toHaveBeenCalledWith({
      data: {
        tenantId: "tenant-1",
        actorId: "user-1",
        action: "update",
        entity: "ExampleItem",
        entityId: "record-1",
      },
    });
  });
});
