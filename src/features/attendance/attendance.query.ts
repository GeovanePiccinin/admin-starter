import { z } from "zod";

import {
  AppointmentStatus,
  AttendanceStatus,
} from "@/generated/prisma/enums";

export const attendanceListQuerySchema = z
  .object({
    search: z.string().trim().max(100).default(""),
    page: z.number().int().positive().default(1),
    pageSize: z.number().int().positive().max(100).default(10),
    sortBy: z
      .enum(["startAt", "status", "client", "professional", "service"])
      .default("startAt"),
    sortDirection: z.enum(["asc", "desc"]).default("asc"),
    from: z.iso.datetime().optional(),
    toExclusive: z.iso.datetime().optional(),
    status: z.enum(AttendanceStatus).optional(),
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

export const attendanceWorkspaceQuerySchema = z.object({
  id: z.string().min(1),
});

export type AttendanceListQuery = z.infer<typeof attendanceListQuerySchema>;
export type AttendanceWorkspaceQuery = z.infer<
  typeof attendanceWorkspaceQuerySchema
>;
export type AttendanceStatusValue = keyof typeof AttendanceStatus;
export type AppointmentStatusValue = keyof typeof AppointmentStatus;

export interface AttendanceWorkspace {
  id: string;
  status: AttendanceStatusValue;
  startedAt: Date | null;
  completedAt: Date | null;
  notes: string | null;
  appointment: {
    id: string;
    startAt: Date;
    endAt: Date;
    status: AppointmentStatusValue;
    notes: string | null;
    client: {
      id: string;
      name: string;
      email: string | null;
      phone: string | null;
    };
    professional: {
      id: string;
      name: string;
    };
    service: {
      id: string;
      name: string;
      duration: number;
      price: number;
    };
  };
  history: Array<{
    id: string;
    status: AttendanceStatusValue;
    startedAt: Date | null;
    completedAt: Date | null;
    notes: string | null;
    appointment: {
      startAt: Date;
      endAt: Date;
      status: AppointmentStatusValue;
      professional: { name: string };
      service: { name: string };
    };
  }>;
  clientRecords: Array<{
    id: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    attendance: {
      id: string;
      status: AttendanceStatusValue;
      startAt: Date;
    } | null;
  }>;
}

export interface AttendanceListItem {
  id: string;
  status: AttendanceStatusValue;
  startedAt: Date | null;
  completedAt: Date | null;
  notes: string | null;
  appointment: {
    id: string;
    startAt: Date;
    endAt: Date;
    status: string;
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
    };
  };
  hasRelatedRecords: boolean;
}

export interface AttendanceListResult {
  items: AttendanceListItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export interface AttendanceAppointmentOption {
  id: string;
  startAt: Date;
  endAt: Date;
  clientName: string;
  professionalName: string;
  serviceName: string;
}

export interface AttendanceFormOptions {
  appointments: AttendanceAppointmentOption[];
}
