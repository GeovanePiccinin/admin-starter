import { z } from "zod";

const serviceIdsSchema = z
  .array(z.string().min(1))
  .min(1, "Selecione ao menos um serviço.")
  .refine((serviceIds) => new Set(serviceIds).size === serviceIds.length, {
    message: "Não repita serviços.",
  });

const professionalFieldsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "O nome deve possuir pelo menos 2 caracteres.")
    .max(100, "O nome deve possuir no máximo 100 caracteres."),
  email: z
    .string()
    .trim()
    .email("Informe um e-mail válido.")
    .max(254)
    .toLowerCase(),
  serviceIds: serviceIdsSchema,
});

const professionalFormBaseSchema = professionalFieldsSchema.extend({
  password: z.string().optional().or(z.literal("")),
});

export function getProfessionalFormSchema(isEditing: boolean) {
  return professionalFormBaseSchema.superRefine((data, context) => {
    if (!isEditing && (!data.password || data.password.length < 8)) {
      context.addIssue({
        code: "custom",
        path: ["password"],
        message: "A senha deve possuir pelo menos 8 caracteres.",
      });
    } else if (isEditing && data.password && data.password.length < 8) {
      context.addIssue({
        code: "custom",
        path: ["password"],
        message: "A senha deve possuir pelo menos 8 caracteres.",
      });
    }
  });
}

export const createProfessionalSchema = professionalFieldsSchema.extend({
  password: z
    .string()
    .min(8, "A senha deve possuir pelo menos 8 caracteres."),
});

export const updateProfessionalSchema = professionalFieldsSchema.extend({
  id: z.string().min(1),
  password: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((password) => !password || password.length >= 8, {
      message: "A senha deve possuir pelo menos 8 caracteres.",
    }),
});

export const deleteProfessionalSchema = z.object({
  id: z.string().min(1),
});

export type CreateProfessionalInput = z.input<
  typeof createProfessionalSchema
>;
export type CreateProfessionalData = z.output<
  typeof createProfessionalSchema
>;
export type UpdateProfessionalInput = z.input<
  typeof updateProfessionalSchema
>;
export type UpdateProfessionalData = z.output<
  typeof updateProfessionalSchema
>;
export type ProfessionalFormInput = z.input<
  typeof professionalFormBaseSchema
>;
export type ProfessionalFormData = z.output<
  typeof professionalFormBaseSchema
>;
export type DeleteProfessionalInput = z.infer<
  typeof deleteProfessionalSchema
>;
