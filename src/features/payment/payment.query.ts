import { z } from "zod";

import { PaymentStatus } from "@/generated/prisma/enums";

export const paymentListQuerySchema = z
  .object({
    search: z.string().trim().max(100).default(""),
    page: z.number().int().positive().default(1),
    pageSize: z.number().int().positive().max(100).default(10),
    sortBy: z.enum(["paidAt", "status", "client"]).default("paidAt"),
    sortDirection: z.enum(["asc", "desc"]).default("desc"),
    from: z.iso.datetime().optional(),
    toExclusive: z.iso.datetime().optional(),
    status: z.enum(PaymentStatus).optional(),
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

export type PaymentListQuery = z.infer<typeof paymentListQuerySchema>;
export type PaymentStatusValue = keyof typeof PaymentStatus;

export interface PaymentListItem {
  id: string;
  status: PaymentStatusValue;
  paidAt: Date | null;
  createdAt: Date;
  attendance: {
    id: string;
    status: string;
    appointment: {
      startAt: Date;
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
  };
}

export interface PaymentListResult {
  items: PaymentListItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export interface PaymentAttendanceOption {
  id: string;
  attendanceStatus: string;
  startAt: Date;
  clientName: string;
  professionalName: string;
  serviceName: string;
}

export interface PaymentFormOptions {
  attendances: PaymentAttendanceOption[];
}
