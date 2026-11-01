import { z } from "zod";

const professionalIdsSchema = z
  .array(z.string().min(1))
  .refine((ids) => new Set(ids).size === ids.length, {
    message: "Não repita profissionais.",
  });

const clientFieldsSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do cliente."),
  email: z
    .string()
    .trim()
    .email("Informe um e-mail válido.")
    .optional()
    .or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
  professionalIds: professionalIdsSchema.optional(),
});

export const createClientSchema = clientFieldsSchema;

export const updateClientSchema = clientFieldsSchema.extend({
  id: z.string().min(1),
});

export const deleteClientSchema = z.object({
  id: z.string().min(1),
});

export const clientAssignmentOptionsSchema = z.object({
  clientId: z.string().min(1).optional(),
});

export type CreateClientInput = z.input<typeof createClientSchema>;
export type CreateClientData = z.output<typeof createClientSchema>;
export type UpdateClientInput = z.input<typeof updateClientSchema>;
export type UpdateClientData = z.output<typeof updateClientSchema>;
export type DeleteClientInput = z.infer<typeof deleteClientSchema>;
export type ClientAssignmentOptionsInput = z.infer<
  typeof clientAssignmentOptionsSchema
>;
