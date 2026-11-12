import { z } from "zod";

const exampleItemFieldsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "O nome deve possuir pelo menos 2 caracteres.")
    .max(100, "O nome deve possuir no máximo 100 caracteres."),

  description: z
    .string()
    .trim()
    .max(500, "A descrição deve possuir no máximo 500 caracteres.")
    .optional()
    .or(z.literal("")),

  active: z.boolean(),
});

export const createExampleItemSchema = exampleItemFieldsSchema;

export const updateExampleItemSchema = exampleItemFieldsSchema.extend({
  id: z.string().min(1),
});

export const deleteExampleItemSchema = z.object({
  id: z.string().min(1),
});

export type CreateExampleItemInput = z.input<typeof createExampleItemSchema>;

export type CreateExampleItemData = z.output<typeof createExampleItemSchema>;

export type UpdateExampleItemInput = z.input<typeof updateExampleItemSchema>;

export type UpdateExampleItemData = z.output<typeof updateExampleItemSchema>;

export type DeleteExampleItemInput = z.infer<typeof deleteExampleItemSchema>;
