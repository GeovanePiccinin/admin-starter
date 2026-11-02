"use server";

import { logger } from "@/lib/logger/logger";
import { writeAuditLog } from "@/lib/audit/audit-log";
import { requireAuthenticatedActor } from "@/lib/auth/get-authenticated-user";
import { DomainError } from "@/lib/errors/domain-error";
import { runServerAction } from "@/lib/observability/server-action";

import {
  completeAttendance,
  createAttendance,
  deleteAttendance,
  findAttendanceFormOptions,
  findAttendanceWorkspace,
  findAttendances,
  updateAttendance,
} from "./attendance.repository";
import {
  attendanceListQuerySchema,
  attendanceWorkspaceQuerySchema,
  type AttendanceWorkspace,
  type AttendanceListResult,
} from "./attendance.query";
import {
  createAttendanceSchema,
  deleteAttendanceSchema,
  attendanceFormOptionsSchema,
  updateAttendanceSchema,
} from "./attendance.schema";

async function getAttendanceActor() {
  const actor = await requireAuthenticatedActor();

  if (actor.role === "PROFESSIONAL" && !actor.professionalId) {
    throw new DomainError("O perfil profissional não está configurado.");
  }

  return actor;
}

function getProfessionalScope(
  actor: Awaited<ReturnType<typeof getAttendanceActor>>,
): string | undefined {
  return actor.role === "PROFESSIONAL"
    ? actor.professionalId ?? undefined
    : undefined;
}

export async function getAttendances(
  input: unknown,
): Promise<AttendanceListResult> {
  return runServerAction("attendance.list", async () => {
    const actor = await getAttendanceActor();
    const query = attendanceListQuerySchema.parse(input);

    return findAttendances(
      actor.tenantId,
      query,
      getProfessionalScope(actor),
    );
  });
}

export async function getAttendanceWorkspace(
  input: unknown,
): Promise<AttendanceWorkspace | null> {
  return runServerAction("attendance.workspace", async () => {
    const actor = await getAttendanceActor();
    const query = attendanceWorkspaceQuerySchema.parse(input);

    return findAttendanceWorkspace(
      actor.tenantId,
      query.id,
      getProfessionalScope(actor),
    );
  });
}

export async function getAttendanceFormOptions(input: unknown) {
  return runServerAction("attendance.form-options", async () => {
    const actor = await getAttendanceActor();
    const parsedInput = attendanceFormOptionsSchema.parse(input);

    return findAttendanceFormOptions(
      actor.tenantId,
      getProfessionalScope(actor),
      parsedInput.attendanceId,
    );
  });
}

export async function createAttendanceAction(input: unknown): Promise<string> {
  return runServerAction("attendance.create", async () => {
    const actor = await getAttendanceActor();
    const data = createAttendanceSchema.parse(input);
    const attendanceId = await createAttendance(
      actor.tenantId,
      data,
      getProfessionalScope(actor),
    );
    await writeAuditLog({
      tenantId: actor.tenantId,
      actorId: actor.id,
      action: "create",
      entity: "Attendance",
      entityId: attendanceId,
    });

    logger.info(
      {
        operation: "attendance.create",
        tenantId: actor.tenantId,
        attendanceId,
      },
      "Attendance created",
    );

    return attendanceId;
  });
}

export async function updateAttendanceAction(input: unknown): Promise<void> {
  return runServerAction("attendance.update", async () => {
    const actor = await getAttendanceActor();
    const data = updateAttendanceSchema.parse(input);
    await updateAttendance(
      actor.tenantId,
      data,
      getProfessionalScope(actor),
    );
    await writeAuditLog({
      tenantId: actor.tenantId,
      actorId: actor.id,
      action: "update",
      entity: "Attendance",
      entityId: data.id,
    });

    logger.info(
      {
        operation: "attendance.update",
        tenantId: actor.tenantId,
        attendanceId: data.id,
      },
      "Attendance updated",
    );
  });
}

export async function completeAttendanceAction(input: unknown): Promise<void> {
  return runServerAction("attendance.complete", async () => {
    const actor = await getAttendanceActor();
    const data = attendanceWorkspaceQuerySchema.parse(input);
    await completeAttendance(
      actor.tenantId,
      data.id,
      getProfessionalScope(actor),
    );
    await writeAuditLog({
      tenantId: actor.tenantId,
      actorId: actor.id,
      action: "complete",
      entity: "Attendance",
      entityId: data.id,
    });

    logger.info(
      {
        operation: "attendance.complete",
        tenantId: actor.tenantId,
        attendanceId: data.id,
      },
      "Attendance completed",
    );
  });
}

export async function deleteAttendanceAction(input: unknown): Promise<void> {
  return runServerAction("attendance.delete", async () => {
    const actor = await getAttendanceActor();
    const data = deleteAttendanceSchema.parse(input);
    await deleteAttendance(
      actor.tenantId,
      data.id,
      getProfessionalScope(actor),
    );
    await writeAuditLog({
      tenantId: actor.tenantId,
      actorId: actor.id,
      action: "delete",
      entity: "Attendance",
      entityId: data.id,
    });

    logger.info(
      {
        operation: "attendance.delete",
        tenantId: actor.tenantId,
        attendanceId: data.id,
      },
      "Attendance deleted",
    );
  });
}
