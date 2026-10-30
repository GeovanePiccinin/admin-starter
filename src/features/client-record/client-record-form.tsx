"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { AttendanceStatus } from "@/generated/prisma/enums";

import type {
  ClientRecordAttendanceOption,
  ClientRecordFormOptions,
  ClientRecordListItem,
} from "./client-record.query";
import {
  clientRecordFormSchema,
  type ClientRecordFormData,
  type ClientRecordFormInput,
} from "./client-record.schema";

interface ClientRecordFormProps {
  record?: ClientRecordListItem;
  options: ClientRecordFormOptions;
  isAttendanceOptionsPending: boolean;
  isPending: boolean;
  onSubmit: (data: ClientRecordFormData) => void;
  onCancel: () => void;
  onClientChange: (clientId: string) => void;
}

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50";

const statusLabels: Record<keyof typeof AttendanceStatus, string> = {
  SCHEDULED: "Agendado",
  IN_PROGRESS: "Em andamento",
  COMPLETED: "Concluído",
};

function formatAttendanceOption(attendance: ClientRecordAttendanceOption) {
  const date = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(attendance.startAt);

  return `${date} · ${attendance.professionalName} · ${attendance.serviceName}`;
}

export function ClientRecordForm({
  record,
  options,
  isAttendanceOptionsPending,
  isPending,
  onSubmit,
  onCancel,
  onClientChange,
}: ClientRecordFormProps) {
  const form = useForm<ClientRecordFormInput, undefined, ClientRecordFormData>({
    resolver: zodResolver(clientRecordFormSchema),
    defaultValues: {
      clientId: record?.client.id ?? "",
      attendanceId: record?.attendance?.id ?? "",
      content: record?.content ?? "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="clientId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cliente</FormLabel>
              <select
                {...field}
                onChange={(event) => {
                  if (event.target.value !== field.value) {
                    form.setValue("attendanceId", "");
                  }
                  field.onChange(event);
                  onClientChange(event.target.value);
                }}
                disabled={isPending || options.clients.length === 0}
                className={selectClassName}
                aria-invalid={Boolean(form.formState.errors.clientId)}
              >
                <option value="">Selecione um cliente</option>
                {options.clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="attendanceId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Atendimento vinculado (opcional)</FormLabel>
              <select
                {...field}
                disabled={
                  isPending ||
                  isAttendanceOptionsPending ||
                  options.attendances.length === 0
                }
                className={selectClassName}
                aria-invalid={Boolean(form.formState.errors.attendanceId)}
              >
                <option value="">
                  {isAttendanceOptionsPending
                    ? "Carregando atendimentos..."
                    : "Sem atendimento vinculado"}
                </option>
                {options.attendances.map((attendance) => (
                  <option key={attendance.id} value={attendance.id}>
                    {formatAttendanceOption(attendance)} ·{" "}
                    {statusLabels[attendance.status]}
                  </option>
                ))}
              </select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Conteúdo</FormLabel>
              <Textarea
                {...field}
                disabled={isPending}
                rows={8}
                placeholder="Conteúdo da ficha do cliente"
                aria-invalid={Boolean(form.formState.errors.content)}
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
            disabled={isPending || options.clients.length === 0}
          >
            {isPending
              ? "Salvando..."
              : record
                ? "Salvar alterações"
                : "Cadastrar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
