import { z } from "zod";

const clientRecordFieldsSchema = z.object({
  clientId: z.string().min(1, "Selecione um cliente."),
  attendanceId: z.string(),
  content: z.string().trim().min(1, "Informe o conteúdo da ficha."),
});

export const clientRecordFormSchema = clientRecordFieldsSchema;
export const createClientRecordSchema = clientRecordFieldsSchema;

export const updateClientRecordSchema = clientRecordFieldsSchema.extend({
  id: z.string().min(1),
});

export const deleteClientRecordSchema = z.object({
  id: z.string().min(1),
});

export const clientRecordFormOptionsSchema = z.object({
  clientId: z.string().min(1).optional(),
});

export type ClientRecordFormInput = z.input<typeof clientRecordFormSchema>;
export type ClientRecordFormData = z.output<typeof clientRecordFormSchema>;
export type CreateClientRecordData = z.output<
  typeof createClientRecordSchema
>;
export type UpdateClientRecordData = z.output<
  typeof updateClientRecordSchema
>;
export type DeleteClientRecordInput = z.infer<
  typeof deleteClientRecordSchema
>;
