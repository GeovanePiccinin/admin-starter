"use server";

import { logger } from "@/lib/logger/logger";
import { requireAuthenticatedActor } from "@/lib/auth/get-authenticated-user";
import { DomainError } from "@/lib/errors/domain-error";
import { runServerAction } from "@/lib/observability/server-action";

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
    throw new DomainError("O perfil profissional não está configurado.");
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
  return runServerAction("appointment.list", async () => {
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
  });
}

export async function getAppointmentCalendarEvents(
  input: unknown,
): Promise<AppointmentListItem[]> {
  return runServerAction("appointment.calendar", async () => {
    const actor = await getAppointmentActor();
    const query = appointmentCalendarQuerySchema.parse(input);

    return findAppointmentsInRange(
      actor.tenantId,
      query,
      getProfessionalScope(actor),
    );
  });
}

export async function getAppointmentFilterOptions() {
  return runServerAction("appointment.filter-options", async () => {
    const actor = await getAppointmentActor();

    return findAppointmentFilterOptions(
      actor.tenantId,
      getProfessionalScope(actor),
    );
  });
}

export async function getAppointmentFormOptions() {
  return runServerAction("appointment.form-options", async () => {
    const actor = await getAppointmentActor();

    const options = await findAppointmentFormOptions(
      actor.tenantId,
      getProfessionalScope(actor),
    );

    return {
      ...options,
      canChooseProfessional: actor.role === "ADMIN",
    };
  });
}

export async function createAppointmentAction(input: unknown): Promise<void> {
  return runServerAction("appointment.create", async () => {
    const actor = await getAppointmentActor();
    const data = createAppointmentSchema.parse(input);

    const professionalId = getProfessionalScope(actor) ?? data.professionalId;

    if (!professionalId) {
      throw new DomainError("Selecione um profissional para o agendamento.");
    }
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
  });
}

export async function updateAppointmentAction(input: unknown): Promise<void> {
  return runServerAction("appointment.update", async () => {
    const actor = await getAppointmentActor();
    const data = updateAppointmentSchema.parse(input);
    const professionalId =
      actor.role === "PROFESSIONAL" ? actor.professionalId : data.professionalId;

    if (!professionalId) {
      throw new DomainError("Selecione um profissional para o agendamento.");
    }
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
  });
}

export async function deleteAppointmentAction(input: unknown): Promise<void> {
  return runServerAction("appointment.delete", async () => {
    const actor = await getAppointmentActor();
    const data = deleteAppointmentSchema.parse(input);
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
  });
}
