import { z } from "zod";

import { AttendanceStatus } from "@/generated/prisma/enums";

export const clientRecordListQuerySchema = z.object({
  search: z.string().trim().max(100).default(""),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(10),
  sortBy: z.enum(["createdAt", "client"]).default("createdAt"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
  attendanceLink: z.enum(["all", "linked", "unlinked"]).default("all"),
});

export type ClientRecordListQuery = z.infer<
  typeof clientRecordListQuerySchema
>;
export type ClientRecordAttendanceStatus = keyof typeof AttendanceStatus;

export interface ClientRecordListItem {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  client: {
    id: string;
    name: string;
  };
  attendance: {
    id: string;
    status: ClientRecordAttendanceStatus;
    startAt: Date;
  } | null;
}

export interface ClientRecordListResult {
  items: ClientRecordListItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export interface ClientRecordClientOption {
  id: string;
  name: string;
}

export interface ClientRecordAttendanceOption {
  id: string;
  status: ClientRecordAttendanceStatus;
  startAt: Date;
  professionalName: string;
  serviceName: string;
}

export interface ClientRecordFormOptions {
  clients: ClientRecordClientOption[];
  attendances: ClientRecordAttendanceOption[];
}
