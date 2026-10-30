import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck2,
  CalendarDays,
  ClipboardList,
  Clock3,
  UsersRound,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

const highlights = [
  {
    icon: CalendarDays,
    title: "Agenda organizada",
    description:
      "Visualize os horários e acompanhe os agendamentos em um só lugar.",
  },
  {
    icon: UsersRound,
    title: "Clientes e profissionais",
    description:
      "Tenha as informações de clientes, profissionais e serviços sempre à mão.",
  },
  {
    icon: ClipboardList,
    title: "Atendimentos acompanhados",
    description:
      "Consulte os atendimentos e o histórico do cliente com mais contexto.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <CalendarCheck2 aria-hidden="true" className="size-5" />
          </span>
          <span className="font-semibold tracking-tight">
            Sistema de Agendamento
          </span>
        </Link>

        <Link
          href="/login"
          className={buttonVariants({ variant: "outline" })}
        >
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
              Sua rotina de atendimentos, mais simples
            </span>
            <h1 className="mt-7 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Mais organização para cuidar de cada{" "}
              <span className="text-primary">atendimento.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
              Organize os agendamentos de clientes, acompanhe os horários da
              equipe e mantenha as informações do atendimento em um só sistema.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className={buttonVariants({ size: "lg" })}
              >
                Acessar o sistema
                <ArrowRight aria-hidden="true" />
              </Link>
              <p className="self-center text-sm text-muted-foreground">
                Entre com sua conta para continuar.
              </p>
            </div>
            <div className="mt-10 flex items-center gap-2 text-sm text-muted-foreground">
              <Clock3 aria-hidden="true" className="size-4 text-primary" />
              Agenda, clientes e atendimentos conectados.
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-primary/10 blur-2xl" />
            <div className="overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-2xl shadow-primary/10">
              <div className="flex items-center justify-between border-b px-5 py-4">
                <div>
                  <p className="text-sm font-semibold">Visão da agenda</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Um dia mais fácil de acompanhar
                  </p>
                </div>
                <span className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground">
                  Hoje
                </span>
              </div>
              <div className="space-y-3 p-5">
                <div className="flex items-center gap-4 rounded-xl border bg-background p-4">
                  <span className="w-14 text-sm font-medium tabular-nums text-muted-foreground">
                    09:00
                  </span>
                  <span className="h-12 w-1 rounded-full bg-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      Atendimento
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Cliente · Serviço
                    </p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    Confirmado
                  </span>
                </div>
                <div className="flex items-center gap-4 rounded-xl border bg-background p-4">
                  <span className="w-14 text-sm font-medium tabular-nums text-muted-foreground">
                    10:30
                  </span>
                  <span className="h-12 w-1 rounded-full bg-chart-2" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      Atendimento
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Cliente · Serviço
                    </p>
                  </div>
                  <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                    Agendado
                  </span>
                </div>
                <div className="flex items-center gap-4 rounded-xl border border-dashed bg-background/60 p-4">
                  <span className="w-14 text-sm font-medium tabular-nums text-muted-foreground">
                    13:00
                  </span>
                  <span className="h-12 w-1 rounded-full bg-border" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-muted-foreground">
                      Próximo horário disponível
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Organize a agenda da equipe
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between border-t bg-muted/40 px-5 py-3 text-xs text-muted-foreground">
                <span>Agenda em um só lugar</span>
                <CalendarDays aria-hidden="true" className="size-4" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t bg-card/50">
        <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-primary">
              Feito para sua rotina
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Do agendamento ao atendimento, tudo mais claro.
            </h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              Reúna as informações essenciais para organizar o trabalho e
              oferecer uma experiência mais cuidadosa aos seus clientes.
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
          <p>Sistema de Agendamento</p>
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
