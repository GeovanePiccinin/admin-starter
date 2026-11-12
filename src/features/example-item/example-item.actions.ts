"use server";

import { logger } from "@/lib/logger/logger";
import { writeAuditLog } from "@/lib/audit/audit-log";
import { runServerAction } from "@/lib/observability/server-action";
import {
  requireAuthenticatedActor,
  requireRole,
} from "@/lib/auth/get-authenticated-user";

import {
  createExampleItemSchema,
  deleteExampleItemSchema,
  updateExampleItemSchema,
} from "./example-item.schema";

import {
  createExampleItem,
  deleteExampleItem,
  findExampleItems,
  updateExampleItem,
} from "./example-item.repository";

import {
  exampleItemListQuerySchema,
  type ExampleItemListResult,
} from "./example-item.query";

export async function getExampleItems(
  input: unknown,
): Promise<ExampleItemListResult> {
  return runServerAction("exampleItem.list", async () => {
    const actor = await requireAuthenticatedActor();
    requireRole(actor, "ADMIN");

    const query = exampleItemListQuerySchema.parse(input);

    return findExampleItems(actor.tenantId, query);
  });
}

export async function createExampleItemAction(input: unknown): Promise<void> {
  return runServerAction("exampleItem.create", async () => {
    const actor = await requireAuthenticatedActor();
    requireRole(actor, "ADMIN");
    const data = createExampleItemSchema.parse(input);
    const exampleItemId = await createExampleItem(actor.tenantId, data);
    await writeAuditLog({
      tenantId: actor.tenantId,
      actorId: actor.id,
      action: "create",
      entity: "ExampleItem",
      entityId: exampleItemId,
    });

    logger.info(
      {
        operation: "exampleItem.create",
        tenantId: actor.tenantId,
      },
      "Example item created",
    );
  });
}

export async function updateExampleItemAction(input: unknown): Promise<void> {
  return runServerAction("exampleItem.update", async () => {
    const actor = await requireAuthenticatedActor();
    requireRole(actor, "ADMIN");
    const data = updateExampleItemSchema.parse(input);
    await updateExampleItem(actor.tenantId, data);
    await writeAuditLog({
      tenantId: actor.tenantId,
      actorId: actor.id,
      action: "update",
      entity: "ExampleItem",
      entityId: data.id,
    });

    logger.info(
      {
        operation: "exampleItem.update",
        tenantId: actor.tenantId,
        exampleItemId: data.id,
      },
      "Example item updated",
    );
  });
}

export async function deleteExampleItemAction(input: unknown): Promise<void> {
  return runServerAction("exampleItem.delete", async () => {
    const actor = await requireAuthenticatedActor();
    requireRole(actor, "ADMIN");
    const data = deleteExampleItemSchema.parse(input);
    await deleteExampleItem(actor.tenantId, data.id);
    await writeAuditLog({
      tenantId: actor.tenantId,
      actorId: actor.id,
      action: "delete",
      entity: "ExampleItem",
      entityId: data.id,
    });

    logger.info(
      {
        operation: "exampleItem.delete",
        tenantId: actor.tenantId,
        exampleItemId: data.id,
      },
      "Example item deleted",
    );
  });
}
