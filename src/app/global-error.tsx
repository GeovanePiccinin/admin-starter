"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body>
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
          <h1 className="text-xl font-semibold">
            Ocorreu um erro inesperado.
          </h1>
          <p className="text-sm text-muted-foreground">
            Tente novamente. Se o problema persistir, entre em contato com o
            suporte.
          </p>
          <button
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
            onClick={reset}
            type="button"
          >
            Tentar novamente
          </button>
        </main>
      </body>
    </html>
  );
}
