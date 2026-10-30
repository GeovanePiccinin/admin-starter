"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { AttendanceStatus } from "@/generated/prisma/enums";

import type {
  AttendanceAppointmentOption,
  AttendanceListItem,
} from "./attendance.query";
import {
  attendanceFormSchema,
  type AttendanceFormData,
  type AttendanceFormInput,
} from "./attendance.schema";

interface AttendanceFormProps {
  attendance?: AttendanceListItem;
  appointments: AttendanceAppointmentOption[];
  isPending: boolean;
  onSubmit: (data: AttendanceFormData) => void;
  onCancel: () => void;
}

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50";

const statusLabels: Record<keyof typeof AttendanceStatus, string> = {
  SCHEDULED: "Agendado",
  IN_PROGRESS: "Em andamento",
  COMPLETED: "Concluído",
};

function formatAppointmentOption(appointment: AttendanceAppointmentOption) {
  const date = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(appointment.startAt);

  return `${date} · ${appointment.clientName} · ${appointment.professionalName} · ${appointment.serviceName}`;
}

function allowedStatuses(
  currentStatus: keyof typeof AttendanceStatus | undefined,
): (keyof typeof AttendanceStatus)[] {
  if (!currentStatus) {
    return ["SCHEDULED"];
  }

  const statuses = Object.values(AttendanceStatus);
  const currentIndex = statuses.indexOf(currentStatus);

  return statuses.slice(currentIndex, currentIndex + 2);
}

export function AttendanceForm({
  attendance,
  appointments,
  isPending,
  onSubmit,
  onCancel,
}: AttendanceFormProps) {
  const form = useForm<AttendanceFormInput, undefined, AttendanceFormData>({
    resolver: zodResolver(attendanceFormSchema),
    defaultValues: {
      appointmentId: attendance?.appointment.id ?? "",
      status: attendance?.status ?? "SCHEDULED",
      notes: attendance?.notes ?? "",
    },
  });

  const statuses = allowedStatuses(attendance?.status);
  const startedAt = attendance?.startedAt;
  const completedAt = attendance?.completedAt;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="appointmentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Agendamento</FormLabel>
              <select
                {...field}
                disabled={isPending || appointments.length === 0}
                className={selectClassName}
                aria-invalid={Boolean(form.formState.errors.appointmentId)}
              >
                <option value="">Selecione um agendamento</option>
                {appointments.map((appointment) => (
                  <option key={appointment.id} value={appointment.id}>
                    {formatAppointmentOption(appointment)}
                  </option>
                ))}
              </select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              {attendance ? (
                <select
                  {...field}
                  disabled={isPending}
                  className={selectClassName}
                  aria-invalid={Boolean(form.formState.errors.status)}
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {statusLabels[status]}
                    </option>
                  ))}
                </select>
              ) : (
                <>
                  <input type="hidden" {...field} />
                  <p className="text-sm text-muted-foreground">
                    {statusLabels.SCHEDULED}
                  </p>
                </>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {attendance ? (
          <div className="grid gap-3 rounded-md border p-3 text-sm sm:grid-cols-2">
            <p>
              <span className="text-muted-foreground">Início: </span>
              {startedAt
                ? new Intl.DateTimeFormat("pt-BR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  }).format(startedAt)
                : "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Conclusão: </span>
              {completedAt
                ? new Intl.DateTimeFormat("pt-BR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  }).format(completedAt)
                : "—"}
            </p>
          </div>
        ) : null}

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <Textarea
                {...field}
                disabled={isPending}
                maxLength={2000}
                placeholder="Observações sobre o atendimento"
                aria-invalid={Boolean(form.formState.errors.notes)}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            disabled={isPending || appointments.length === 0}
          >
            {isPending
              ? "Salvando..."
              : attendance
                ? "Salvar alterações"
                : "Iniciar atendimento"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
