import * as Sentry from "@sentry/nextjs";
import { ZodError } from "zod";

import {
  AuthenticationError,
  AuthorizationError,
} from "@/lib/auth/get-authenticated-user";
import { DomainError } from "@/lib/errors/domain-error";
import { logger } from "@/lib/logger/logger";
import { RateLimitExceededError } from "@/lib/rate-limit/rate-limit";

import { createOperationId, runWithObservabilityContext } from "./context";

interface SafeActionFailure {
  level: "warn" | "error";
  category:
    | "validation"
    | "authentication"
    | "authorization"
    | "domain"
    | "rate_limit"
    | "internal";
  message: string;
}

function classifyActionFailure(error: unknown): SafeActionFailure {
  if (error instanceof ZodError) {
    return {
      level: "warn",
      category: "validation",
      message: "Os dados informados são inválidos. Revise e tente novamente.",
    };
  }

  if (error instanceof AuthenticationError) {
    return {
      level: "warn",
      category: "authentication",
      message: error.message,
    };
  }

  if (error instanceof AuthorizationError) {
    return {
      level: "warn",
      category: "authorization",
      message: error.message,
    };
  }

  if (error instanceof DomainError) {
    return {
      level: "warn",
      category: "domain",
      message: error.message,
    };
  }

  if (error instanceof RateLimitExceededError) {
    return {
      level: "warn",
      category: "rate_limit",
      message: error.message,
    };
  }

  return {
    level: "error",
    category: "internal",
    message: "Não foi possível concluir a operação. Tente novamente.",
  };
}

export async function runServerAction<T>(
  operation: string,
  callback: () => Promise<T>,
): Promise<T> {
  const operationId = createOperationId();

  return runWithObservabilityContext({ operation, operationId }, async () => {
    try {
      return await callback();
    } catch (error: unknown) {
      const failure = classifyActionFailure(error);
      const fields = {
        operation,
        operationId,
        category: failure.category,
        ...(error instanceof Error ? { errorType: error.name } : {}),
      };

      if (failure.level === "error") {
        logger.error(fields, "Unhandled Server Action failure");
        Sentry.withScope((scope) => {
          scope.setTag("operation", operation);
          scope.setTag("operation_id", operationId);
          scope.setTag("error_category", failure.category);
          Sentry.captureException(error);
        });
      } else {
        logger.warn(fields, "Server Action rejected");
      }

      throw new Error(
        failure.level === "error"
          ? `${failure.message} (referência: ${operationId})`
          : failure.message,
      );
    }
  });
}
