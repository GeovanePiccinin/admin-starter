import { z } from "zod";

export const clientListQuerySchema = z.object({
  search: z.string().trim().max(100).default(""),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(10),
  sortBy: z.enum(["name", "email", "phone"]).default("name"),
  sortDirection: z.enum(["asc", "desc"]).default("asc"),
});

export type ClientListQuery = z.infer<typeof clientListQuerySchema>;

export interface ClientListItem {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

export interface ClientListResult {
  items: ClientListItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}
