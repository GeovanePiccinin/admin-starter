import { z } from "zod";

import { AppointmentOrigin, AppointmentStatus } from "@/generated/prisma/enums";

const datetimeLocalSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Informe uma data e hora válidas.")
  .refine((value) => {
    const [datePart, timePart] = value.split("T");
    const dateParts = datePart?.split("-").map(Number);
    const timeParts = timePart?.split(":").map(Number);

    if (
      dateParts?.length !== 3 ||
      timeParts?.length !== 2 ||
      dateParts.some((part) => part === undefined) ||
      timeParts.some((part) => part === undefined)
    ) {
      return false;
    }

    const date = new Date(value);

    return (
      !Number.isNaN(date.getTime()) &&
      date.getFullYear() === dateParts[0] &&
      date.getMonth() === dateParts[1]! - 1 &&
      date.getDate() === dateParts[2] &&
      date.getHours() === timeParts[0] &&
      date.getMinutes() === timeParts[1]
    );
  }, "Informe uma data e hora locais válidas.");

const appointmentFormFieldsSchema = z.object({
  clientId: z.string().min(1, "Selecione um cliente."),
  professionalId: z.string().min(1, "Selecione um profissional."),
  serviceId: z.string().min(1, "Selecione um serviço."),
  startAt: datetimeLocalSchema,
  endAt: datetimeLocalSchema,
  status: z.enum(AppointmentStatus),
  origin: z.enum(AppointmentOrigin),
  notes: z.string().trim().max(2000, "As observações devem ter até 2000 caracteres."),
});

export const appointmentFormSchema = appointmentFormFieldsSchema.refine(
  (data) => new Date(data.endAt) > new Date(data.startAt),
  {
    path: ["endAt"],
    message: "O horário final deve ser posterior ao horário inicial.",
  },
);

const utcDateTimeSchema = z.iso.datetime().transform((value) => new Date(value));

const appointmentMutationFieldsSchema = z.object({
  clientId: z.string().min(1),
  professionalId: z.string().min(1).optional(),
  serviceId: z.string().min(1),
  startAt: utcDateTimeSchema,
  endAt: utcDateTimeSchema,
  status: z.enum(AppointmentStatus),
  origin: z.enum(AppointmentOrigin),
  notes: z.string().trim().max(2000),
});

export const createAppointmentSchema =
  appointmentMutationFieldsSchema.refine(
    (data) => data.endAt > data.startAt,
    {
      path: ["endAt"],
      message: "O horário final deve ser posterior ao horário inicial.",
    },
  );

export const updateAppointmentSchema = createAppointmentSchema.extend({
  id: z.string().min(1),
});

export const deleteAppointmentSchema = z.object({
  id: z.string().min(1),
});

export type AppointmentFormInput = z.input<typeof appointmentFormSchema>;
export type AppointmentFormData = z.output<typeof appointmentFormSchema>;
export type CreateAppointmentInput = z.input<typeof createAppointmentSchema>;
export type CreateAppointmentData = z.output<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.input<typeof updateAppointmentSchema>;
export type UpdateAppointmentData = z.output<typeof updateAppointmentSchema>;
