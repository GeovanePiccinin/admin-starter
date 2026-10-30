"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PaymentStatus } from "@/generated/prisma/enums";

import type {
  PaymentAttendanceOption,
  PaymentFormOptions,
  PaymentListItem,
} from "./payment.query";
import {
  paymentFormSchema,
  type PaymentFormData,
  type PaymentFormInput,
} from "./payment.schema";

interface PaymentFormProps {
  payment?: PaymentListItem;
  options: PaymentFormOptions;
  isPending: boolean;
  onSubmit: (data: PaymentFormData) => void;
  onCancel: () => void;
}

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50";

const statusLabels: Record<keyof typeof PaymentStatus, string> = {
  PENDENTE: "Pendente",
  PAGO: "Pago",
};

function toLocalDateTimeInput(date: Date | null | undefined): string {
  if (!date) {
    return "";
  }

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function formatAttendanceOption(attendance: PaymentAttendanceOption): string {
  const startAt = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(attendance.startAt);

  return `${startAt} · ${attendance.clientName} · ${attendance.professionalName} · ${attendance.serviceName}`;
}

export function PaymentForm({
  payment,
  options,
  isPending,
  onSubmit,
  onCancel,
}: PaymentFormProps) {
  const form = useForm<PaymentFormInput, undefined, PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      attendanceId: payment?.attendance.id ?? "",
      status: payment?.status ?? "PENDENTE",
      paidAt: toLocalDateTimeInput(payment?.paidAt),
    },
  });

  const [status, setStatus] = useState(payment?.status ?? "PENDENTE");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="attendanceId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Atendimento</FormLabel>
              <select
                {...field}
                disabled={isPending || options.attendances.length === 0}
                className={selectClassName}
                aria-invalid={Boolean(form.formState.errors.attendanceId)}
              >
                <option value="">Selecione um atendimento</option>
                {options.attendances.map((attendance) => (
                  <option key={attendance.id} value={attendance.id}>
                    {formatAttendanceOption(attendance)}
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
              <select
                {...field}
                disabled={isPending}
                onChange={(event) => {
                  field.onChange(event);
                  const nextStatus =
                    event.target.value === "PAGO" ? "PAGO" : "PENDENTE";
                  setStatus(nextStatus);
                  if (nextStatus === "PENDENTE") {
                    form.setValue("paidAt", "");
                  }
                }}
                className={selectClassName}
                aria-invalid={Boolean(form.formState.errors.status)}
              >
                {Object.values(PaymentStatus).map((paymentStatus) => (
                  <option key={paymentStatus} value={paymentStatus}>
                    {statusLabels[paymentStatus]}
                  </option>
                ))}
              </select>
              <FormMessage />
            </FormItem>
          )}
        />

        {status === "PAGO" ? (
          <FormField
            control={form.control}
            name="paidAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data e hora do pagamento</FormLabel>
                <Input
                  {...field}
                  type="datetime-local"
                  disabled={isPending}
                  aria-invalid={Boolean(form.formState.errors.paidAt)}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}

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
            disabled={isPending || options.attendances.length === 0}
          >
            {isPending
              ? "Salvando..."
              : payment
                ? "Salvar alterações"
                : "Cadastrar pagamento"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
