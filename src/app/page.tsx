import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  Code2,
  Database,
  Layers3,
  ShieldCheck,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

const highlights = [
  {
    icon: Layers3,
    title: "Uma base pronta para evoluir",
    description:
      "Arquitetura organizada por funcionalidades, com componentes reutilizáveis e uma feature de exemplo.",
  },
  {
    icon: ShieldCheck,
    title: "Acesso protegido",
    description:
      "Autenticação por credenciais, autorização administrativa e isolamento de dados por tenant.",
  },
  {
    icon: Database,
    title: "Ambiente local reproduzível",
    description:
      "PostgreSQL 16 em Docker Compose, bancos separados para desenvolvimento e testes.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Code2 aria-hidden="true" className="size-5" />
          </span>
          <span className="font-semibold tracking-tight">Software Starter</span>
        </Link>

        <Link href="/login" className={buttonVariants({ variant: "outline" })}>
          Entrar
        </Link>
      </header>

      <section className="relative isolate">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 mx-auto h-[34rem] max-w-6xl bg-[radial-gradient(ellipse_at_top,var(--color-accent),transparent_65%)] opacity-70"
        />
        <div className="mx-auto grid w-full max-w-7xl items-center gap-14 px-6 pb-20 pt-16 sm:pt-24 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pb-28 lg:pt-28">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border bg-card/80 px-3 py-1 text-sm text-muted-foreground shadow-sm">
              <span className="size-2 rounded-full bg-primary" />
              Base técnica para novos produtos web
            </span>
            <h1 className="mt-7 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Comece com uma base{" "}
              <span className="text-primary">pronta para crescer.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
              Um starter full-stack com autenticação, autorização,
              multi-tenancy, persistência, testes e observabilidade. Clone,
              execute localmente e evolua a partir de uma feature funcional.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/login" className={buttonVariants({ size: "lg" })}>
                Acessar o starter
                <ArrowRight aria-hidden="true" />
              </Link>
              <p className="self-center text-sm text-muted-foreground">
                Acesso restrito a usuários autenticados.
              </p>
            </div>
            <div className="mt-10 flex items-center gap-2 text-sm text-muted-foreground">
              <Boxes aria-hidden="true" className="size-4 text-primary" />
              Exemplo pronto para servir de referência a novas features.
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-primary/10 blur-2xl" />
            <div className="overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-2xl shadow-primary/10">
              <div className="border-b px-5 py-4">
                <p className="text-sm font-semibold">Fundação do projeto</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Aplicação, dados e operações essenciais
                </p>
              </div>
              <div className="space-y-3 p-5">
                {[
                  ["Aplicação", "Next.js · React · TypeScript"],
                  ["Persistência", "PostgreSQL · Prisma ORM"],
                  ["Acesso", "NextAuth · sessão JWT"],
                  ["Qualidade", "Vitest · ESLint · CI"],
                ].map(([area, technologies]) => (
                  <div
                    key={area}
                    className="flex flex-col gap-1 rounded-xl border bg-background p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="text-sm font-semibold">{area}</span>
                    <span className="text-xs text-muted-foreground">
                      {technologies}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between border-t bg-muted/40 px-5 py-3 text-xs text-muted-foreground">
                <span>Desenvolvimento local com Docker Compose</span>
                <Database aria-hidden="true" className="size-4" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t bg-card/50">
        <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-primary">
              Software Starter
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Infraestrutura reutilizável, domínio flexível.
            </h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              A feature ExampleItem demonstra validação, Server Actions,
              persistência tenant-scoped, autorização administrativa e interface
              CRUD sem impor um domínio de produto.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {highlights.map(({ icon: Icon, title, description }) => (
              <article
                key={title}
                className="rounded-2xl border bg-background p-6 shadow-sm"
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <h3 className="mt-5 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-6 py-6 text-sm text-muted-foreground sm:flex-row lg:px-8">
          <p>Software Starter · base para evolução incremental</p>
          <Link
            href="/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Acessar minha conta
          </Link>
        </div>
      </footer>
    </main>
  );
}
