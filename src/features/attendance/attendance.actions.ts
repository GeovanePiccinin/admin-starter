"use server";

import { logger } from "@/lib/logger/logger";
import { requireAuthenticatedActor } from "@/lib/auth/get-authenticated-user";

import {
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
    throw new Error("O perfil profissional não está configurado.");
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
  const actor = await getAttendanceActor();
  const query = attendanceListQuerySchema.parse(input);

  return findAttendances(
    actor.tenantId,
    query,
    getProfessionalScope(actor),
  );
}

export async function getAttendanceWorkspace(
  input: unknown,
): Promise<AttendanceWorkspace | null> {
  const actor = await getAttendanceActor();
  const query = attendanceWorkspaceQuerySchema.parse(input);

  return findAttendanceWorkspace(
    actor.tenantId,
    query.id,
    getProfessionalScope(actor),
  );
}

export async function getAttendanceFormOptions(input: unknown) {
  const actor = await getAttendanceActor();
  const parsedInput = attendanceFormOptionsSchema.parse(input);

  return findAttendanceFormOptions(
    actor.tenantId,
    getProfessionalScope(actor),
    parsedInput.attendanceId,
  );
}

export async function createAttendanceAction(input: unknown): Promise<string> {
  const actor = await getAttendanceActor();
  const data = createAttendanceSchema.parse(input);

  try {
    const attendanceId = await createAttendance(
      actor.tenantId,
      data,
      getProfessionalScope(actor),
    );

    logger.info(
      {
        operation: "attendance.create",
        tenantId: actor.tenantId,
        attendanceId,
      },
      "Attendance created",
    );

    return attendanceId;
  } catch (error: unknown) {
    logger.error(
      {
        operation: "attendance.create",
        tenantId: actor.tenantId,
        error,
      },
      "Failed to create attendance",
    );

    throw error;
  }
}

export async function updateAttendanceAction(input: unknown): Promise<void> {
  const actor = await getAttendanceActor();
  const data = updateAttendanceSchema.parse(input);

  try {
    await updateAttendance(
      actor.tenantId,
      data,
      getProfessionalScope(actor),
    );

    logger.info(
      {
        operation: "attendance.update",
        tenantId: actor.tenantId,
        attendanceId: data.id,
      },
      "Attendance updated",
    );
  } catch (error: unknown) {
    logger.error(
      {
        operation: "attendance.update",
        tenantId: actor.tenantId,
        attendanceId: data.id,
        error,
      },
      "Failed to update attendance",
    );

    throw error;
  }
}

export async function deleteAttendanceAction(input: unknown): Promise<void> {
  const actor = await getAttendanceActor();
  const data = deleteAttendanceSchema.parse(input);

  try {
    await deleteAttendance(
      actor.tenantId,
      data.id,
      getProfessionalScope(actor),
    );

    logger.info(
      {
        operation: "attendance.delete",
        tenantId: actor.tenantId,
        attendanceId: data.id,
      },
      "Attendance deleted",
    );
  } catch (error: unknown) {
    logger.error(
      {
        operation: "attendance.delete",
        tenantId: actor.tenantId,
        attendanceId: data.id,
        error,
      },
      "Failed to delete attendance",
    );

    throw error;
  }
}
