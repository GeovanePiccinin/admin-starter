"use server";

import { logger } from "@/lib/logger/logger";
import { requireAuthenticatedActor } from "@/lib/auth/get-authenticated-user";

import {
  createPayment,
  deletePayment,
  findPaymentFormOptions,
  findPayments,
  updatePayment,
} from "./payment.repository";
import {
  paymentListQuerySchema,
  type PaymentListResult,
} from "./payment.query";
import {
  createPaymentSchema,
  deletePaymentSchema,
  paymentFormOptionsSchema,
  updatePaymentSchema,
} from "./payment.schema";

async function getPaymentActor() {
  const actor = await requireAuthenticatedActor();

  if (actor.role === "PROFESSIONAL" && !actor.professionalId) {
    throw new Error("O perfil profissional não está configurado.");
  }

  return actor;
}

function getProfessionalScope(actor: Awaited<ReturnType<typeof getPaymentActor>>) {
  return actor.role === "PROFESSIONAL"
    ? actor.professionalId ?? undefined
    : undefined;
}

export async function getPayments(input: unknown): Promise<PaymentListResult> {
  const actor = await getPaymentActor();
  const query = paymentListQuerySchema.parse(input);

  return findPayments(
    actor.tenantId,
    query,
    getProfessionalScope(actor),
  );
}

export async function getPaymentFormOptions(input: unknown) {
  const actor = await getPaymentActor();
  const parsedInput = paymentFormOptionsSchema.parse(input);

  return findPaymentFormOptions(
    actor.tenantId,
    getProfessionalScope(actor),
    parsedInput.paymentId,
  );
}

export async function createPaymentAction(input: unknown): Promise<void> {
  const actor = await getPaymentActor();
  const data = createPaymentSchema.parse(input);

  try {
    await createPayment(
      actor.tenantId,
      data,
      getProfessionalScope(actor),
    );

    logger.info(
      { operation: "payment.create", tenantId: actor.tenantId },
      "Payment created",
    );
  } catch (error: unknown) {
    logger.error(
      { operation: "payment.create", tenantId: actor.tenantId, error },
      "Failed to create payment",
    );

    throw error;
  }
}

export async function updatePaymentAction(input: unknown): Promise<void> {
  const actor = await getPaymentActor();
  const data = updatePaymentSchema.parse(input);

  try {
    await updatePayment(
      actor.tenantId,
      data,
      getProfessionalScope(actor),
    );

    logger.info(
      {
        operation: "payment.update",
        tenantId: actor.tenantId,
        paymentId: data.id,
      },
      "Payment updated",
    );
  } catch (error: unknown) {
    logger.error(
      {
        operation: "payment.update",
        tenantId: actor.tenantId,
        paymentId: data.id,
        error,
      },
      "Failed to update payment",
    );

    throw error;
  }
}

export async function deletePaymentAction(input: unknown): Promise<void> {
  const actor = await getPaymentActor();
  const data = deletePaymentSchema.parse(input);

  try {
    await deletePayment(
      actor.tenantId,
      data.id,
      getProfessionalScope(actor),
    );

    logger.info(
      {
        operation: "payment.delete",
        tenantId: actor.tenantId,
        paymentId: data.id,
      },
      "Payment deleted",
    );
  } catch (error: unknown) {
    logger.error(
      {
        operation: "payment.delete",
        tenantId: actor.tenantId,
        paymentId: data.id,
        error,
      },
      "Failed to delete payment",
    );

    throw error;
  }
}
