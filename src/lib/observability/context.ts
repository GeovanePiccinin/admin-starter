import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";

export interface ObservabilityContext {
  operationId: string;
  operation: string;
  tenantId?: string;
}

const storage = new AsyncLocalStorage<ObservabilityContext>();

export function createOperationId(): string {
  return randomUUID();
}

export function runWithObservabilityContext<T>(
  context: ObservabilityContext,
  callback: () => Promise<T>,
): Promise<T> {
  return storage.run(context, callback);
}

export function getObservabilityContext():
  | ObservabilityContext
  | undefined {
  return storage.getStore();
}

export function addObservabilityContext(
  context: Partial<Pick<ObservabilityContext, "tenantId">>,
): void {
  const current = storage.getStore();
  if (current) {
    Object.assign(current, context);
  }
}
