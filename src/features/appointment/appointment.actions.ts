"use server";

import { auth } from "@/auth";

import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger/logger";

import {
  createAppointment,
  deleteAppointment,
  findAppointmentsInRange,
  findAppointmentFilterOptions,
  findAppointmentFormOptions,
  findAppointments,
  updateAppointment,
} from "./appointment.repository";
import {
  appointmentCalendarQuerySchema,
  appointmentListQuerySchema,
  type AppointmentListItem,
  type AppointmentListResult,
} from "./appointment.query";
import {
  createAppointmentSchema,
  deleteAppointmentSchema,
  updateAppointmentSchema,
} from "./appointment.schema";

async function getAppointmentActor() {
  const session = await auth();
  const userId = session?.user?.id;
  const tenantId = session?.user?.tenantId;

  if (!userId || !tenantId) {
    throw new Error("Usuário não autenticado.");
  }

  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      tenantId,
    },
    select: {
      role: true,
      professional: {
        select: {
          id: true,
        },
      },
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

export async function getAppointments(
  input: unknown,
): Promise<AppointmentListResult & { canChooseProfessional: boolean }> {
  const actor = await getAppointmentActor();
  const query = appointmentListQuerySchema.parse(input);
  const result = await findAppointments(
    actor.tenantId,
    query,
    actor.role === "PROFESSIONAL" ? actor.professionalId : undefined,
  );

  return {
    ...result,
    canChooseProfessional: actor.role === "ADMIN",
  };
}

export async function getAppointmentCalendarEvents(
  input: unknown,
): Promise<AppointmentListItem[]> {
  const actor = await getAppointmentActor();
  const query = appointmentCalendarQuerySchema.parse(input);

  return findAppointmentsInRange(
    actor.tenantId,
    query,
    actor.role === "PROFESSIONAL" ? actor.professionalId : undefined,
  );
}

export async function getAppointmentFilterOptions() {
  const actor = await getAppointmentActor();

  return findAppointmentFilterOptions(
    actor.tenantId,
    actor.role === "PROFESSIONAL" ? actor.professionalId : undefined,
  );
}

export async function getAppointmentFormOptions() {
  const actor = await getAppointmentActor();

  const options = await findAppointmentFormOptions(
    actor.tenantId,
    actor.role === "PROFESSIONAL" ? actor.professionalId : undefined,
  );

  return {
    ...options,
    canChooseProfessional: actor.role === "ADMIN",
  };
}

export async function createAppointmentAction(input: unknown): Promise<void> {
  const actor = await getAppointmentActor();
  const data = createAppointmentSchema.parse(input);

  const professionalId =
    actor.role === "PROFESSIONAL" ? actor.professionalId : data.professionalId;

  if (!professionalId) {
    throw new Error("Selecione um profissional para o agendamento.");
  }

  try {
    const appointmentId = await createAppointment(
      actor.tenantId,
      data,
      professionalId,
    );

    logger.info(
      {
        operation: "appointment.create",
        tenantId: actor.tenantId,
        appointmentId,
      },
      "Appointment created",
    );
  } catch (error: unknown) {
    logger.error(
      {
        operation: "appointment.create",
        tenantId: actor.tenantId,
        error,
      },
      "Failed to create appointment",
    );

    throw error;
  }
}

export async function updateAppointmentAction(input: unknown): Promise<void> {
  const actor = await getAppointmentActor();
  const data = updateAppointmentSchema.parse(input);
  const professionalId =
    actor.role === "PROFESSIONAL" ? actor.professionalId : data.professionalId;

  if (!professionalId) {
    throw new Error("Selecione um profissional para o agendamento.");
  }

  try {
    await updateAppointment(
      actor.tenantId,
      {
        ...data,
        professionalId,
      },
      actor.role === "PROFESSIONAL" ? actor.professionalId : undefined,
    );

    logger.info(
      {
        operation: "appointment.update",
        tenantId: actor.tenantId,
        appointmentId: data.id,
      },
      "Appointment updated",
    );
  } catch (error: unknown) {
    logger.error(
      {
        operation: "appointment.update",
        tenantId: actor.tenantId,
        appointmentId: data.id,
        error,
      },
      "Failed to update appointment",
    );

    throw error;
  }
}

export async function deleteAppointmentAction(input: unknown): Promise<void> {
  const actor = await getAppointmentActor();
  const data = deleteAppointmentSchema.parse(input);

  try {
    await deleteAppointment(
      actor.tenantId,
      data.id,
      actor.role === "PROFESSIONAL" ? actor.professionalId : undefined,
    );

    logger.info(
      {
        operation: "appointment.delete",
        tenantId: actor.tenantId,
        appointmentId: data.id,
      },
      "Appointment deleted",
    );
  } catch (error: unknown) {
    logger.error(
      {
        operation: "appointment.delete",
        tenantId: actor.tenantId,
        appointmentId: data.id,
        error,
      },
      "Failed to delete appointment",
    );

    throw error;
  }
}
