import { z } from "zod";

import { AttendanceStatus } from "@/generated/prisma/enums";

const attendanceFieldsSchema = z.object({
  appointmentId: z.string().min(1, "Selecione um agendamento."),
  notes: z.string().trim().max(2000, "As observações devem ter até 2000 caracteres."),
});

export const attendanceFormSchema = attendanceFieldsSchema.extend({
  status: z.enum(AttendanceStatus),
});

export const createAttendanceSchema = attendanceFieldsSchema;

export const updateAttendanceSchema = attendanceFormSchema.extend({
  id: z.string().min(1),
});

export const deleteAttendanceSchema = z.object({
  id: z.string().min(1),
});

export const attendanceFormOptionsSchema = z.object({
  attendanceId: z.string().min(1).optional(),
});

export type AttendanceFormInput = z.input<typeof attendanceFormSchema>;
export type AttendanceFormData = z.output<typeof attendanceFormSchema>;
export type CreateAttendanceData = z.output<typeof createAttendanceSchema>;
export type UpdateAttendanceData = z.output<typeof updateAttendanceSchema>;
