"use client";

import { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { Button } from "@/components/ui/button";
import { getAttendanceWorkspace } from "./attendance.actions";
import type {
  AppointmentStatusValue,
  AttendanceStatusValue,
  AttendanceWorkspace,
} from "./attendance.query";

type WorkspaceTab = "attendance" | "history" | "records";

const tabLabels: Record<WorkspaceTab, string> = {
  attendance: "Atendimento",
  history: "Histórico",
  records: "Prontuário",
};

const attendanceStatusLabels: Record<AttendanceStatusValue, string> = {
  SCHEDULED: "Agendado",
  IN_PROGRESS: "Em andamento",
  COMPLETED: "Concluído",
};

const appointmentStatusLabels: Record<AppointmentStatusValue, string> = {
  SCHEDULED: "Agendado",
  CONFIRMED: "Confirmado",
  CANCELLED: "Cancelado",
  NO_SHOW: "Não compareceu",
};

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(date);
}

function InfoField({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="space-y-1">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value || "—"}</dd>
    </div>
  );
}

function AttendanceDetails({ workspace }: { workspace: AttendanceWorkspace }) {
  return (
    <section
      role="tabpanel"
      id="attendance-panel-attendance"
      aria-labelledby="attendance-tab-attendance"
      className="rounded-lg border bg-card p-5"
    >
      <h2 className="text-lg font-semibold">Informações do atendimento</h2>
      <dl className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <InfoField
          label="Status do atendimento"
          value={attendanceStatusLabels[workspace.status]}
        />
        <InfoField
          label="Iniciado em"
          value={workspace.startedAt ? formatDateTime(workspace.startedAt) : null}
        />
        <InfoField
          label="Concluído em"
          value={
            workspace.completedAt ? formatDateTime(workspace.completedAt) : null
          }
        />
        <InfoField label="Cliente" value={workspace.appointment.client.name} />
        <InfoField
          label="E-mail do cliente"
          value={workspace.appointment.client.email}
        />
        <InfoField
          label="Telefone do cliente"
          value={workspace.appointment.client.phone}
        />
        <InfoField
          label="Profissional"
          value={workspace.appointment.professional.name}
        />
        <InfoField label="Serviço" value={workspace.appointment.service.name} />
        <InfoField
          label="Duração"
          value={`${workspace.appointment.service.duration} minutos`}
        />
        <InfoField
          label="Valor do serviço"
          value={new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(workspace.appointment.service.price)}
        />
        <InfoField
          label="Agendamento"
          value={formatDateTime(workspace.appointment.startAt)}
        />
        <InfoField
          label="Status do agendamento"
          value={appointmentStatusLabels[workspace.appointment.status]}
        />
      </dl>
      {workspace.appointment.notes ? (
        <div className="mt-5 space-y-1">
          <h3 className="text-sm text-muted-foreground">
            Observações do agendamento
          </h3>
          <p className="whitespace-pre-wrap text-sm">
            {workspace.appointment.notes}
          </p>
        </div>
      ) : null}
      {workspace.notes ? (
        <div className="mt-5 space-y-1">
          <h3 className="text-sm text-muted-foreground">
            Observações do atendimento
          </h3>
          <p className="whitespace-pre-wrap text-sm">{workspace.notes}</p>
        </div>
      ) : null}
    </section>
  );
}

function AttendanceHistory({ workspace }: { workspace: AttendanceWorkspace }) {
  return (
    <section
      role="tabpanel"
      id="attendance-panel-history"
      aria-labelledby="attendance-tab-history"
      className="space-y-3"
    >
      {workspace.history.length === 0 ? (
        <EmptyState
          title="Nenhum atendimento anterior"
          description="O histórico deste cliente aparecerá aqui."
        />
      ) : (
        workspace.history.map((item) => (
          <details
            key={item.id}
            className="group relative rounded-lg border bg-card p-4 pr-10 open:shadow-sm"
          >
            <summary className="cursor-pointer list-none font-medium marker:hidden">
              <span className="flex flex-wrap items-center justify-between gap-2">
                <span>{formatDateTime(item.appointment.startAt)}</span>
                <span className="text-sm text-muted-foreground">
                  {attendanceStatusLabels[item.status]}
                </span>
              </span>
              <span className="mt-1 block text-sm text-muted-foreground">
                {item.appointment.service.name} ·{" "}
                {item.appointment.professional.name}
              </span>
              <ChevronDown
                aria-hidden="true"
                className="absolute right-4 top-4 size-4 transition-transform group-open:rotate-180"
              />
            </summary>
            <dl className="mt-4 grid gap-3 border-t pt-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Horário</dt>
                <dd>
                  {formatDateTime(item.appointment.startAt)} –{" "}
                  {new Intl.DateTimeFormat("pt-BR", {
                    timeStyle: "short",
                  }).format(item.appointment.endAt)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Profissional</dt>
                <dd>{item.appointment.professional.name}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Status do atendimento</dt>
                <dd>{attendanceStatusLabels[item.status]}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Iniciado em</dt>
                <dd>{item.startedAt ? formatDateTime(item.startedAt) : "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Concluído em</dt>
                <dd>
                  {item.completedAt ? formatDateTime(item.completedAt) : "—"}
                </dd>
              </div>
              {item.notes ? (
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">Observações</dt>
                  <dd className="whitespace-pre-wrap">{item.notes}</dd>
                </div>
              ) : null}
            </dl>
          </details>
        ))
      )}
    </section>
  );
}

function ClientRecords({ workspace }: { workspace: AttendanceWorkspace }) {
  return (
    <section
      role="tabpanel"
      id="attendance-panel-records"
      aria-labelledby="attendance-tab-records"
      className="space-y-3"
    >
      {workspace.clientRecords.length === 0 ? (
        <EmptyState
          title="Nenhum registro no prontuário"
          description="Os registros deste cliente aparecerão aqui."
        />
      ) : (
        workspace.clientRecords.map((record) => (
          <details
            key={record.id}
            className="group relative rounded-lg border bg-card p-4 pr-10 open:shadow-sm"
          >
            <summary className="cursor-pointer list-none font-medium marker:hidden">
              <span className="flex flex-wrap items-center justify-between gap-2">
                <span>Registro de {formatDate(record.createdAt)}</span>
                {record.attendance ? (
                  <span className="text-sm text-muted-foreground">
                    Atendimento de{" "}
                    {formatDate(record.attendance.startAt)}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    Registro sem atendimento vinculado
                  </span>
                )}
              </span>
              <ChevronDown
                aria-hidden="true"
                className="absolute right-4 top-4 size-4 transition-transform group-open:rotate-180"
              />
            </summary>
            <div className="mt-4 border-t pt-4">
              <p className="whitespace-pre-wrap text-sm">{record.content}</p>
            </div>
          </details>
        ))
      )}
    </section>
  );
}

export function AttendanceWorkspace({ attendanceId }: { attendanceId: string }) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("attendance");
  const workspaceQuery = useQuery({
    queryKey: ["attendance-workspace", attendanceId],
    queryFn: () => getAttendanceWorkspace({ id: attendanceId }),
  });

  if (workspaceQuery.isPending) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground" role="status">
        Carregando atendimento...
      </p>
    );
  }

  if (workspaceQuery.isError) {
    return (
      <ErrorState
        title="Não foi possível carregar o atendimento."
        description="Tente novamente. Se o problema persistir, verifique sua conexão."
        action={
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              void workspaceQuery.refetch();
            }}
          >
            Tentar novamente
          </Button>
        }
      />
    );
  }

  const workspace = workspaceQuery.data;
  if (!workspace) {
    return (
      <EmptyState
        title="Atendimento não encontrado"
        description="O atendimento não existe ou não está disponível para seu usuário."
        action={
          <Link
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            href="/attendances"
          >
            Voltar para atendimentos
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            Cliente: {workspace.appointment.client.name}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Atendimento
          </h1>
        </div>
        <Link
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          href="/attendances"
        >
          Voltar para atendimentos
        </Link>
      </div>

      <div
        role="tablist"
        aria-label="Informações do atendimento"
        className="flex flex-wrap gap-2 border-b pb-2"
      >
        {(Object.keys(tabLabels) as WorkspaceTab[]).map((tab) => (
          <Button
            key={tab}
            id={`attendance-tab-${tab}`}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            aria-controls={`attendance-panel-${tab}`}
            variant={activeTab === tab ? "default" : "outline"}
            onClick={() => setActiveTab(tab)}
          >
            {tabLabels[tab]}
          </Button>
        ))}
      </div>

      <div hidden={activeTab !== "attendance"}>
        <AttendanceDetails workspace={workspace} />
      </div>
      <div hidden={activeTab !== "history"}>
        <AttendanceHistory workspace={workspace} />
      </div>
      <div hidden={activeTab !== "records"}>
        <ClientRecords workspace={workspace} />
      </div>
    </div>
  );
}
