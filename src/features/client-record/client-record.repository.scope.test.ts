/**
 * @vitest-environment node
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  clientFindMany: vi.fn(),
  clientFindFirst: vi.fn(),
  attendanceFindMany: vi.fn(),
  attendanceFindFirst: vi.fn(),
  recordFindMany: vi.fn(),
  recordCount: vi.fn(),
  recordCreate: vi.fn(),
  recordUpdateMany: vi.fn(),
  recordDeleteMany: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => {
  const transactionClient = {
    client: { findFirst: mocks.clientFindFirst },
    attendance: { findFirst: mocks.attendanceFindFirst },
    clientRecord: {
      create: mocks.recordCreate,
      updateMany: mocks.recordUpdateMany,
    },
  };

  return {
    prisma: {
      client: {
        findMany: mocks.clientFindMany,
        findFirst: mocks.clientFindFirst,
      },
      attendance: {
        findMany: mocks.attendanceFindMany,
        findFirst: mocks.attendanceFindFirst,
      },
      clientRecord: {
        findMany: mocks.recordFindMany,
        count: mocks.recordCount,
        create: mocks.recordCreate,
        updateMany: mocks.recordUpdateMany,
        deleteMany: mocks.recordDeleteMany,
      },
      $transaction: vi.fn(async (operation: unknown) => {
        if (typeof operation === "function") {
          return (
            operation as (
              transaction: typeof transactionClient,
            ) => Promise<unknown>
          )(transactionClient);
        }

        if (Array.isArray(operation)) {
          return Promise.all(operation as Promise<unknown>[]);
        }

        throw new Error("Unsupported transaction operation.");
      }),
    },
  };
});

import {
  createClientRecord,
  deleteClientRecord,
  findClientRecordFormOptions,
  findClientRecords,
  updateClientRecord,
} from "./client-record.repository";
import { clientRecordListQuerySchema } from "./client-record.query";
import { findAttendanceWorkspace } from "../attendance/attendance.repository";

const tenantId = "tenant-current";
const professionalId = "professional-current";
const clientId = "client-assigned";

const assignmentScope = {
  client: {
    professionalAssignments: {
      some: { tenantId, professionalId },
    },
  },
};

describe("client-record repository professional scope", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.recordFindMany.mockResolvedValue([
      {
        id: "record-1",
        content: "Clinical note",
        authorName: null,
        createdAt: new Date("2032-04-05T10:00:00.000Z"),
        updatedAt: new Date("2032-04-05T10:00:00.000Z"),
        client: { id: clientId, name: "Assigned client" },
        attendance: null,
      },
    ]);
    mocks.recordCount.mockResolvedValue(1);
    mocks.clientFindMany.mockResolvedValue([{ id: clientId, name: "Assigned client" }]);
    mocks.attendanceFindMany.mockResolvedValue([]);
    mocks.clientFindFirst.mockResolvedValue({ id: clientId });
    mocks.attendanceFindFirst.mockResolvedValue({ id: "attendance-1" });
    mocks.recordCreate.mockResolvedValue({});
    mocks.recordUpdateMany.mockResolvedValue({ count: 1 });
    mocks.recordDeleteMany.mockResolvedValue({ count: 1 });
  });

  it("limits record lists, form clients, and attendance options to assigned clients", async () => {
    await findClientRecords(
      tenantId,
      clientRecordListQuerySchema.parse({}),
      professionalId,
    );
    await findClientRecordFormOptions(tenantId, clientId, professionalId);

    expect(mocks.recordFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId, ...assignmentScope }),
      }),
    );
    expect(mocks.recordCount).toHaveBeenCalledWith({
      where: expect.objectContaining({ tenantId, ...assignmentScope }),
    });
    expect(mocks.clientFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId,
          professionalAssignments: {
            some: { tenantId, professionalId },
          },
        }),
      }),
    );
    expect(mocks.attendanceFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId,
          appointment: {
            clientId,
            professionalId,
            client: {
              professionalAssignments: {
                some: { tenantId, professionalId },
              },
            },
          },
        },
      }),
    );
  });

  it("requires the assigned-client relation for create, update, and delete", async () => {
    await createClientRecord(
      tenantId,
      { clientId, attendanceId: "", content: "New note" },
      professionalId,
      { professionalId, name: "Current professional" },
    );
    await updateClientRecord(
      tenantId,
      {
        id: "record-1",
        clientId,
        attendanceId: "attendance-1",
        content: "Updated note",
      },
      professionalId,
    );
    await deleteClientRecord(tenantId, "record-1", professionalId);

    expect(mocks.clientFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: clientId,
          tenantId,
          professionalAssignments: {
            some: { tenantId, professionalId },
          },
        },
      }),
    );
    expect(mocks.attendanceFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "attendance-1",
          tenantId,
          appointment: {
            tenantId,
            clientId,
            professionalId,
          },
        },
      }),
    );
    expect(mocks.recordCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId,
          clientId,
          authorProfessionalId: professionalId,
          authorName: "Current professional",
        }),
      }),
    );
    expect(mocks.recordUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: "record-1",
          tenantId,
          ...assignmentScope,
        }),
      }),
    );
    expect(mocks.recordDeleteMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: "record-1",
          tenantId,
          ...assignmentScope,
        }),
      }),
    );
  });

  it("rejects clinical writes when the client is not assigned to the professional", async () => {
    mocks.clientFindFirst.mockResolvedValue(null);

    await expect(
      createClientRecord(
        tenantId,
        { clientId, attendanceId: "", content: "Out-of-scope note" },
        professionalId,
      ),
    ).rejects.toThrow("Cliente não encontrado.");

    expect(mocks.recordCreate).not.toHaveBeenCalled();
  });

  it("filters clinical records returned by the attendance workspace", async () => {
    mocks.attendanceFindFirst.mockResolvedValue({
      id: "attendance-1",
      status: "IN_PROGRESS",
      startedAt: new Date("2032-04-05T10:00:00.000Z"),
      completedAt: null,
      notes: null,
      appointment: {
        id: "appointment-1",
        startAt: new Date("2032-04-05T10:00:00.000Z"),
        endAt: new Date("2032-04-05T11:00:00.000Z"),
        status: "SCHEDULED",
        notes: null,
        client: {
          id: clientId,
          name: "Assigned client",
          email: null,
          phone: null,
        },
        professional: {
          id: professionalId,
          user: { name: "Current professional" },
        },
        service: {
          id: "service-1",
          name: "Consultation",
          duration: 60,
          price: 100,
        },
      },
    });
    mocks.recordFindMany.mockResolvedValue([]);

    await findAttendanceWorkspace(tenantId, "attendance-1", professionalId);

    expect(mocks.attendanceFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "attendance-1",
          tenantId,
          appointment: { professionalId },
        },
      }),
    );
    expect(mocks.recordFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId,
          clientId,
          ...assignmentScope,
        }),
      }),
    );
  });
});
