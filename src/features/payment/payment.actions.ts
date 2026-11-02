"use server";

import { logger } from "@/lib/logger/logger";
import { writeAuditLog } from "@/lib/audit/audit-log";
import { requireAuthenticatedActor } from "@/lib/auth/get-authenticated-user";
import { DomainError } from "@/lib/errors/domain-error";
import { runServerAction } from "@/lib/observability/server-action";

import {
  createPayment,
  deletePayment,
  findPaymentForAttendance,
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
  paymentAttendanceQuerySchema,
  paymentFormOptionsSchema,
  updatePaymentSchema,
} from "./payment.schema";

async function getPaymentActor() {
  const actor = await requireAuthenticatedActor();

  if (actor.role === "PROFESSIONAL" && !actor.professionalId) {
    throw new DomainError("O perfil profissional não está configurado.");
  }

  return actor;
}

function getProfessionalScope(actor: Awaited<ReturnType<typeof getPaymentActor>>) {
  return actor.role === "PROFESSIONAL"
    ? actor.professionalId ?? undefined
    : undefined;
}

export async function getPayments(input: unknown): Promise<PaymentListResult> {
  return runServerAction("payment.list", async () => {
    const actor = await getPaymentActor();
    const query = paymentListQuerySchema.parse(input);

    return findPayments(
      actor.tenantId,
      query,
      getProfessionalScope(actor),
    );
  });
}

export async function getPaymentForAttendance(input: unknown) {
  return runServerAction("payment.for-attendance", async () => {
    const actor = await getPaymentActor();
    const data = paymentAttendanceQuerySchema.parse(input);

    return findPaymentForAttendance(
      actor.tenantId,
      data.attendanceId,
      getProfessionalScope(actor),
    );
  });
}

export async function getPaymentFormOptions(input: unknown) {
  return runServerAction("payment.form-options", async () => {
    const actor = await getPaymentActor();
    const parsedInput = paymentFormOptionsSchema.parse(input);

    return findPaymentFormOptions(
      actor.tenantId,
      getProfessionalScope(actor),
      parsedInput.paymentId,
    );
  });
}

export async function createPaymentAction(input: unknown): Promise<void> {
  return runServerAction("payment.create", async () => {
    const actor = await getPaymentActor();
    const data = createPaymentSchema.parse(input);
    const paymentId = await createPayment(
      actor.tenantId,
      data,
      getProfessionalScope(actor),
    );
    await writeAuditLog({
      tenantId: actor.tenantId,
      actorId: actor.id,
      action: "create",
      entity: "Payment",
      entityId: paymentId,
    });

    logger.info(
      { operation: "payment.create", tenantId: actor.tenantId },
      "Payment created",
    );
  });
}

export async function updatePaymentAction(input: unknown): Promise<void> {
  return runServerAction("payment.update", async () => {
    const actor = await getPaymentActor();
    const data = updatePaymentSchema.parse(input);
    await updatePayment(
      actor.tenantId,
      data,
      getProfessionalScope(actor),
    );
    await writeAuditLog({
      tenantId: actor.tenantId,
      actorId: actor.id,
      action: "update",
      entity: "Payment",
      entityId: data.id,
    });

    logger.info(
      {
        operation: "payment.update",
        tenantId: actor.tenantId,
        paymentId: data.id,
      },
      "Payment updated",
    );
  });
}

export async function deletePaymentAction(input: unknown): Promise<void> {
  return runServerAction("payment.delete", async () => {
    const actor = await getPaymentActor();
    const data = deletePaymentSchema.parse(input);
    await deletePayment(
      actor.tenantId,
      data.id,
      getProfessionalScope(actor),
    );
    await writeAuditLog({
      tenantId: actor.tenantId,
      actorId: actor.id,
      action: "delete",
      entity: "Payment",
      entityId: data.id,
    });

    logger.info(
      {
        operation: "payment.delete",
        tenantId: actor.tenantId,
        paymentId: data.id,
      },
      "Payment deleted",
    );
  });
}
