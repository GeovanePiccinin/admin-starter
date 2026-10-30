"use server";

import { auth } from "@/auth";

import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger/logger";

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
  const session = await auth();
  const userId = session?.user?.id;
  const tenantId = session?.user?.tenantId;

  if (!userId || !tenantId) {
    throw new Error("Usuário não autenticado.");
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, tenantId },
    select: {
      role: true,
      professional: { select: { id: true } },
    },
  });

  if (!user) {
    throw new Error("Usuário não autenticado.");
  }

  if (user.role === "PROFESSIONAL" && !user.professional) {
    throw new Error("O perfil profissional não está configurado.");
  }

  return {
    tenantId,
    role: user.role,
    professionalId: user.professional?.id,
  };
}

export async function getAttendances(
  input: unknown,
): Promise<AttendanceListResult> {
  const actor = await getAttendanceActor();
  const query = attendanceListQuerySchema.parse(input);

  return findAttendances(
    actor.tenantId,
    query,
    actor.role === "PROFESSIONAL" ? actor.professionalId : undefined,
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
    actor.role === "PROFESSIONAL" ? actor.professionalId : undefined,
  );
}

export async function getAttendanceFormOptions(input: unknown) {
  const actor = await getAttendanceActor();
  const parsedInput = attendanceFormOptionsSchema.parse(input);

  return findAttendanceFormOptions(
    actor.tenantId,
    actor.role === "PROFESSIONAL" ? actor.professionalId : undefined,
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
      actor.role === "PROFESSIONAL" ? actor.professionalId : undefined,
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
      actor.role === "PROFESSIONAL" ? actor.professionalId : undefined,
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
      actor.role === "PROFESSIONAL" ? actor.professionalId : undefined,
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
