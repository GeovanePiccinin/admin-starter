"use server";

import { logger } from "@/lib/logger/logger";
import { requireAuthenticatedActor } from "@/lib/auth/get-authenticated-user";

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
  const actor = await requireAuthenticatedActor();

  if (actor.role === "PROFESSIONAL" && !actor.professionalId) {
    throw new Error("O perfil profissional não está configurado.");
  }

  return actor;
}

function getProfessionalScope(
  actor: Awaited<ReturnType<typeof getAppointmentActor>>,
): string | undefined {
  return actor.role === "PROFESSIONAL"
    ? actor.professionalId ?? undefined
    : undefined;
}

export async function getAppointments(
  input: unknown,
): Promise<AppointmentListResult & { canChooseProfessional: boolean }> {
  const actor = await getAppointmentActor();
  const query = appointmentListQuerySchema.parse(input);
  const result = await findAppointments(
    actor.tenantId,
    query,
    getProfessionalScope(actor),
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
    getProfessionalScope(actor),
  );
}

export async function getAppointmentFilterOptions() {
  const actor = await getAppointmentActor();

  return findAppointmentFilterOptions(
    actor.tenantId,
    getProfessionalScope(actor),
  );
}

export async function getAppointmentFormOptions() {
  const actor = await getAppointmentActor();

  const options = await findAppointmentFormOptions(
    actor.tenantId,
    getProfessionalScope(actor),
  );

  return {
    ...options,
    canChooseProfessional: actor.role === "ADMIN",
  };
}

export async function createAppointmentAction(input: unknown): Promise<void> {
  const actor = await getAppointmentActor();
  const data = createAppointmentSchema.parse(input);

  const professionalId = getProfessionalScope(actor) ?? data.professionalId;

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
      getProfessionalScope(actor),
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
      getProfessionalScope(actor),
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
