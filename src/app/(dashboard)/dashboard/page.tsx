import { DataTableTest } from "@/components/data-table/data-table-test";
import { QueryTest } from "@/components/query/query-test";
import { FeedbackTest } from "@/components/feedback/feedback-test";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { FormTest } from "@/components/forms/form-test";
import { CrudFormDialogTest } from "@/components/crud/crud-form-dialog-test";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Bem-vindo ao Software Starter
        </h1>

        <p className="text-muted-foreground">
          Explore os componentes reutilizáveis e a feature de referência.
        </p>
      </div>

      <section className="flex flex-col gap-4 rounded-xl border bg-card p-6 text-card-foreground sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="font-semibold">Comece pela feature de exemplo</h2>
          <p className="text-sm text-muted-foreground">
            Veja como validação, autorização, auditoria e persistência se
            conectam em uma funcionalidade.
          </p>
        </div>
        <Link
          href="/example-items"
          className={buttonVariants({ variant: "outline" })}
        >
          Ver itens de exemplo
          <ArrowRight aria-hidden="true" />
        </Link>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-medium">Estados de carregamento</h2>
          <p className="text-sm text-muted-foreground">
            Exemplo de feedback visual durante uma consulta.
          </p>
        </div>

        <DataTableSkeleton columns={3} rows={5} />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Formulários</h2>

          <p className="text-sm text-muted-foreground">
            Integração entre React Hook Form, Zod e os componentes de formulário.
          </p>
        </div>

        <div className="max-w-md">
          <FormTest />
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Formulário em Dialog</h2>

          <p className="text-sm text-muted-foreground">
            Exemplo de formulário em diálogo para criação e edição.
          </p>
        </div>

        <CrudFormDialogTest />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Estados de feedback</h2>

        <FeedbackTest />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Consulta no navegador</h2>

        <QueryTest />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-medium">Tabela de dados</h2>

          <p className="text-sm text-muted-foreground">
            Exemplo com dados fictícios para demonstrar ordenação e paginação.
          </p>
        </div>

        <DataTableTest />
      </section>
    </div>
  );
}
