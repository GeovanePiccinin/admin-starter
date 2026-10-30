import { z } from "zod";

export const professionalListQuerySchema = z.object({
  search: z.string().trim().max(100).default(""),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(10),
  sortBy: z.enum(["name", "email", "createdAt"]).default("name"),
  sortDirection: z.enum(["asc", "desc"]).default("asc"),
});

export type ProfessionalListQuery = z.infer<
  typeof professionalListQuerySchema
>;

export interface ProfessionalListItem {
  id: string;
  name: string;
  email: string;
  services: {
    id: string;
    name: string;
  }[];
  createdAt: Date;
}

export interface ProfessionalServiceOption {
  id: string;
  name: string;
  active: boolean;
}

export interface ProfessionalListResult {
  items: ProfessionalListItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}
