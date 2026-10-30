"use client";

import { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import type {
  AllowFunc,
  DateSelectArg,
  EventClickArg,
} from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import type { DatesSetArg } from "@fullcalendar/core";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";

import { ErrorState } from "@/components/feedback/error-state";
import { Button } from "@/components/ui/button";
import { AppointmentStatus } from "@/generated/prisma/enums";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { getAppointmentCalendarEvents } from "./appointment.actions";
import type {
  AppointmentListItem,
  AppointmentStatusValue,
} from "./appointment.query";

interface AppointmentCalendarProps {
  search: string;
  professionalId: string;
  serviceId: string;
  status: AppointmentStatusValue | "";
  onSelectSlot: (selection: { startAt: Date; endAt: Date }) => void;
  onStatusChange: (
    appointment: AppointmentListItem,
    status: AppointmentStatusValue,
  ) => Promise<boolean>;
  onStartAttendance: (appointment: AppointmentListItem) => void;
  onOpenAttendance: (appointment: AppointmentListItem) => void;
  isStatusPending: boolean;
  isStartingAttendance: boolean;
}

interface CalendarRange {
  from: string;
  toExclusive: string;
}

const statusLabels: Record<AppointmentStatusValue, string> = {
  SCHEDULED: "Agendado",
  CONFIRMED: "Confirmado",
  CANCELLED: "Cancelado",
  NO_SHOW: "Não compareceu",
};

const originLabels: Record<AppointmentListItem["origin"], string> = {
  MANUAL: "Manual",
  ONLINE: "Online",
  PHONE: "Telefone",
};

function formatAppointmentDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

export function AppointmentCalendar({
  search,
  professionalId,
  serviceId,
  status,
  onSelectSlot,
  onStatusChange,
  onStartAttendance,
  onOpenAttendance,
  isStatusPending,
  isStartingAttendance,
}: AppointmentCalendarProps) {
  const [range, setRange] = useState<CalendarRange>();
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentListItem>();

  const appointmentsQuery = useQuery({
    queryKey: [
      "appointments",
      "calendar",
      range?.from,
      range?.toExclusive,
      search,
      professionalId,
      serviceId,
      status,
    ],
    queryFn: () => {
      if (!range) {
        throw new Error("O intervalo do calendário ainda não está disponível.");
      }

      return getAppointmentCalendarEvents({
        from: range.from,
        toExclusive: range.toExclusive,
        search,
        ...(professionalId ? { professionalId } : {}),
        ...(serviceId ? { serviceId } : {}),
        ...(status ? { status } : {}),
      });
    },
    enabled: range !== undefined,
  });

  function handleDatesSet(dates: DatesSetArg) {
    const nextRange = {
      from: dates.start.toISOString(),
      toExclusive: dates.end.toISOString(),
    };

    setRange((currentRange) =>
      currentRange?.from === nextRange.from &&
      currentRange.toExclusive === nextRange.toExclusive
        ? currentRange
        : nextRange,
    );
  }

  function handleSlotSelect(selection: DateSelectArg) {
    if (selection.allDay) {
      return;
    }

    onSelectSlot({ startAt: selection.start, endAt: selection.end });
  }

  function handleEventClick(event: EventClickArg) {
    const appointment = appointmentsQuery.data?.find(
      ({ id }) => id === event.event.id,
    );

    if (appointment) {
      setSelectedAppointment(appointment);
    }
  }

  function allowTimedSlot(selection: Parameters<AllowFunc>[0]): boolean {
    return !selection.allDay;
  }

  async function handleStatusChange(value: string) {
    if (!selectedAppointment || isStatusPending) {
      return;
    }

    const nextStatus = Object.values(AppointmentStatus).find(
      (appointmentStatus) => appointmentStatus === value,
    );

    if (!nextStatus || nextStatus === selectedAppointment.status) {
      return;
    }

    const updated = await onStatusChange(selectedAppointment, nextStatus);
    if (updated) {
      setSelectedAppointment({ ...selectedAppointment, status: nextStatus });
    }
  }

  const events =
    appointmentsQuery.data?.map((appointment) => ({
      id: appointment.id,
      title: `${appointment.client.name} · ${appointment.service.name} · ${statusLabels[appointment.status]}`,
      start: appointment.startAt.toISOString(),
      end: appointment.endAt.toISOString(),
    })) ?? [];

  return (
    <div className="space-y-3">
      {appointmentsQuery.isPending ? (
        <p className="text-sm text-muted-foreground" role="status">
          Carregando agendamentos...
        </p>
      ) : null}

      {appointmentsQuery.isError ? (
        <ErrorState
          title="Não foi possível carregar os agendamentos."
          description="Tente novamente. Se o problema persistir, verifique sua conexão."
          action={
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void appointmentsQuery.refetch();
              }}
            >
              Tentar novamente
            </Button>
          }
        />
      ) : null}

      {appointmentsQuery.isSuccess && events.length === 0 ? (
        <p className="text-sm text-muted-foreground" role="status">
          Nenhum agendamento neste período.
        </p>
      ) : null}

      <div className="rounded-lg border bg-card p-3">
        <FullCalendar
          plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "timeGridDay,timeGridWeek,dayGridMonth",
          }}
          locale={ptBrLocale}
          buttonText={{ today: "Hoje", day: "Dia", week: "Semana", month: "Mês" }}
          events={events}
          datesSet={handleDatesSet}
          selectable
          selectAllow={allowTimedSlot}
          select={handleSlotSelect}
          eventClick={handleEventClick}
          height="auto"
          nowIndicator
          eventTimeFormat={{
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }}
        />
      </div>

      <Dialog
        open={selectedAppointment !== undefined}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedAppointment(undefined);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          {selectedAppointment ? (
            <>
              <DialogHeader>
                <DialogTitle>Detalhes do agendamento</DialogTitle>
                <DialogDescription>
                  {selectedAppointment.client.name} ·{" "}
                  {selectedAppointment.service.name}
                </DialogDescription>
              </DialogHeader>

              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Data e horário</dt>
                  <dd>
                    {formatAppointmentDate(selectedAppointment.startAt)} –{" "}
                    {new Intl.DateTimeFormat("pt-BR", {
                      timeStyle: "short",
                    }).format(selectedAppointment.endAt)}
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd>
                    <select
                      aria-label="Status do agendamento"
                      className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                      value={selectedAppointment.status}
                      disabled={isStatusPending}
                      onChange={(event) => {
                        void handleStatusChange(event.target.value);
                      }}
                    >
                      {Object.values(AppointmentStatus).map((appointmentStatus) => (
                        <option key={appointmentStatus} value={appointmentStatus}>
                          {statusLabels[appointmentStatus]}
                        </option>
                      ))}
                    </select>
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Cliente</dt>
                  <dd>{selectedAppointment.client.name}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Profissional</dt>
                  <dd>{selectedAppointment.professional.name}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Serviço</dt>
                  <dd>{selectedAppointment.service.name}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Origem</dt>
                  <dd>{originLabels[selectedAppointment.origin]}</dd>
                </div>
                {selectedAppointment.notes ? (
                  <div className="sm:col-span-2">
                    <dt className="text-muted-foreground">Observações</dt>
                    <dd className="whitespace-pre-wrap">
                      {selectedAppointment.notes}
                    </dd>
                  </div>
                ) : null}
              </dl>
              <div className="flex justify-end gap-2">
                {selectedAppointment.attendanceId ? (
                  <Button
                    type="button"
                    onClick={() => onOpenAttendance(selectedAppointment)}
                  >
                    Abrir atendimento
                  </Button>
                ) : selectedAppointment.status !== "CANCELLED" ? (
                  <Button
                    type="button"
                    disabled={isStartingAttendance}
                    onClick={() => onStartAttendance(selectedAppointment)}
                  >
                    {isStartingAttendance
                      ? "Iniciando atendimento..."
                      : "Iniciar atendimento"}
                  </Button>
                ) : null}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
