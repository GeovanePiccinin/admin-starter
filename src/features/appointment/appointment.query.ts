import { z } from "zod";

import { AppointmentOrigin, AppointmentStatus } from "@/generated/prisma/enums";

const isoDateTimeSchema = z.iso.datetime();

export const appointmentListQuerySchema = z
  .object({
    search: z.string().trim().max(100).default(""),
    page: z.number().int().positive().default(1),
    pageSize: z.number().int().positive().max(100).default(10),
    sortBy: z
      .enum(["startAt", "status", "client", "professional", "service", "createdAt"])
      .default("startAt"),
    sortDirection: z.enum(["asc", "desc"]).default("asc"),
    from: isoDateTimeSchema.optional(),
    toExclusive: isoDateTimeSchema.optional(),
    professionalId: z.string().min(1).optional(),
    serviceId: z.string().min(1).optional(),
    status: z.enum(AppointmentStatus).optional(),
  })
  .superRefine((query, context) => {
    if (
      query.from &&
      query.toExclusive &&
      new Date(query.from) >= new Date(query.toExclusive)
    ) {
      context.addIssue({
        code: "custom",
        path: ["toExclusive"],
        message: "O período final deve ser posterior ao período inicial.",
      });
    }
  });

export const appointmentCalendarQuerySchema = z
  .object({
    search: z.string().trim().max(100).default(""),
    from: isoDateTimeSchema,
    toExclusive: isoDateTimeSchema,
    professionalId: z.string().min(1).optional(),
    serviceId: z.string().min(1).optional(),
    status: z.enum(AppointmentStatus).optional(),
  })
  .superRefine((query, context) => {
    const from = new Date(query.from).getTime();
    const to = new Date(query.toExclusive).getTime();

    if (from >= to) {
      context.addIssue({
        code: "custom",
        path: ["toExclusive"],
        message: "O período final deve ser posterior ao período inicial.",
      });
    } else if (to - from > 62 * 24 * 60 * 60 * 1000) {
      context.addIssue({
        code: "custom",
        path: ["toExclusive"],
        message: "O intervalo do calendário não pode exceder 62 dias.",
      });
    }
  });

export type AppointmentListQuery = z.infer<typeof appointmentListQuerySchema>;
export type AppointmentCalendarQuery = z.infer<
  typeof appointmentCalendarQuerySchema
>;

export type AppointmentStatusValue = keyof typeof AppointmentStatus;
export type AppointmentOriginValue = keyof typeof AppointmentOrigin;

export interface AppointmentListItem {
  id: string;
  startAt: Date;
  endAt: Date;
  status: AppointmentStatusValue;
  origin: AppointmentOriginValue;
  notes: string | null;
  attendanceId: string | null;
  hasAttendance: boolean;
  client: {
    id: string;
    name: string;
  };
  professional: {
    id: string;
    name: string;
  };
  service: {
    id: string;
    name: string;
    duration: number;
  };
}

export interface AppointmentListResult {
  items: AppointmentListItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export interface AppointmentProfessionalOption {
  id: string;
  name: string;
  serviceIds: string[];
}

export interface AppointmentServiceOption {
  id: string;
  name: string;
  duration: number;
  active: boolean;
}

export interface AppointmentClientOption {
  id: string;
  name: string;
}

export interface AppointmentFilterOptions {
  professionals: AppointmentProfessionalOption[];
  services: AppointmentServiceOption[];
}

export interface AppointmentFormOptions extends AppointmentFilterOptions {
  clients: AppointmentClientOption[];
  canChooseProfessional: boolean;
}
