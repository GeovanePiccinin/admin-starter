import { z } from "zod";

export const exampleItemListQuerySchema = z.object({
  search: z.string().trim().max(100).default(""),

  page: z.number().int().positive().default(1),

  pageSize: z.number().int().positive().max(100).default(20),

  sortBy: z
    .enum(["name", "active", "createdAt"])
    .default("name"),

  sortDirection: z.enum(["asc", "desc"]).default("asc"),
});

export type ExampleItemListQuery = z.infer<typeof exampleItemListQuerySchema>;

export interface ExampleItemListItem {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExampleItemListResult {
  items: ExampleItemListItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}
