import { z } from "zod";

import { PaymentStatus } from "@/generated/prisma/enums";

const paymentFieldsSchema = z
  .object({
    attendanceId: z.string().min(1, "Selecione um atendimento."),
    status: z.enum(PaymentStatus),
    paidAt: z.iso.datetime().nullable(),
  })
  .superRefine((payment, context) => {
    if (payment.status === "PAGO" && !payment.paidAt) {
      context.addIssue({
        code: "custom",
        path: ["paidAt"],
        message: "Informe a data do pagamento.",
      });
    }

    if (payment.status === "PENDENTE" && payment.paidAt) {
      context.addIssue({
        code: "custom",
        path: ["paidAt"],
        message: "Pagamentos pendentes não devem ter data de pagamento.",
      });
    }

    if (payment.status === "PENDENTE" && payment.paidAt) {
      context.addIssue({
        code: "custom",
        path: ["paidAt"],
        message: "Pagamentos pendentes não devem ter data de pagamento.",
      });
    }
  });

const paymentFormFieldsSchema = z
  .object({
    attendanceId: z.string().min(1, "Selecione um atendimento."),
    status: z.enum(PaymentStatus),
    paidAt: z.string(),
  })
  .superRefine((payment, context) => {
    if (payment.status === "PAGO" && !payment.paidAt) {
      context.addIssue({
        code: "custom",
        path: ["paidAt"],
        message: "Informe a data do pagamento.",
      });
    }

    if (payment.paidAt && !Number.isFinite(new Date(payment.paidAt).getTime())) {
      context.addIssue({
        code: "custom",
        path: ["paidAt"],
        message: "Informe uma data válida.",
      });
    }

    if (payment.status === "PENDENTE" && payment.paidAt) {
      context.addIssue({
        code: "custom",
        path: ["paidAt"],
        message: "Pagamentos pendentes não devem ter data de pagamento.",
      });
    }
  });

export const paymentFormSchema = paymentFormFieldsSchema;
export const createPaymentSchema = paymentFieldsSchema;

export const updatePaymentSchema = paymentFieldsSchema.extend({
  id: z.string().min(1),
});

export const deletePaymentSchema = z.object({
  id: z.string().min(1),
});

export const paymentFormOptionsSchema = z.object({
  paymentId: z.string().min(1).optional(),
});

export type PaymentFormInput = z.input<typeof paymentFormSchema>;
export type PaymentFormData = z.output<typeof paymentFormSchema>;
export type CreatePaymentData = z.output<typeof createPaymentSchema>;
export type UpdatePaymentData = z.output<typeof updatePaymentSchema>;
export type DeletePaymentInput = z.infer<typeof deletePaymentSchema>;
