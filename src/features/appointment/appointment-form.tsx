"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AppointmentOrigin, AppointmentStatus } from "@/generated/prisma/enums";

import type {
  AppointmentClientOption,
  AppointmentListItem,
  AppointmentProfessionalOption,
  AppointmentServiceOption,
} from "./appointment.query";
import {
  appointmentFormSchema,
  type AppointmentFormData,
  type AppointmentFormInput,
} from "./appointment.schema";

interface AppointmentFormProps {
  appointment?: AppointmentListItem;
  initialStartAt?: Date;
  initialEndAt?: Date;
  clients: AppointmentClientOption[];
  professionals: AppointmentProfessionalOption[];
  services: AppointmentServiceOption[];
  canChooseProfessional: boolean;
  isPending: boolean;
  onSubmit: (data: AppointmentFormData) => void;
  onCancel: () => void;
}

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50";

const statusLabels: Record<keyof typeof AppointmentStatus, string> = {
  SCHEDULED: "Agendado",
  CONFIRMED: "Confirmado",
  CANCELLED: "Cancelado",
  NO_SHOW: "Não compareceu",
};

const originLabels: Record<keyof typeof AppointmentOrigin, string> = {
  MANUAL: "Manual",
  ONLINE: "Online",
  PHONE: "Telefone",
};

function toLocalDateTimeValue(value: Date | undefined): string {
  if (!value) {
    return "";
  }

  const localDate = new Date(value.getTime() - value.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

export function AppointmentForm({
  appointment,
  initialStartAt,
  initialEndAt,
  clients,
  professionals,
  services,
  canChooseProfessional,
  isPending,
  onSubmit,
  onCancel,
}: AppointmentFormProps) {
  const form = useForm<AppointmentFormInput, undefined, AppointmentFormData>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      clientId: appointment?.client.id ?? "",
      professionalId:
        appointment?.professional.id ?? professionals[0]?.id ?? "",
      serviceId: appointment?.service.id ?? "",
      startAt: toLocalDateTimeValue(appointment?.startAt ?? initialStartAt),
      endAt: toLocalDateTimeValue(appointment?.endAt ?? initialEndAt),
      status: appointment?.status ?? "SCHEDULED",
      origin: appointment?.origin ?? "MANUAL",
      notes: appointment?.notes ?? "",
    },
  });

  const selectedProfessionalId = useWatch({
    control: form.control,
    name: "professionalId",
  });
  const selectedProfessional = professionals.find(
    (professional) => professional.id === selectedProfessionalId,
  );
  const availableServices = services.filter((service) =>
    selectedProfessional?.serviceIds.includes(service.id),
  );

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
                disabled={isPending}
                className={selectClassName}
                aria-invalid={Boolean(form.formState.errors.clientId)}
              >
                <option value="">Selecione um cliente</option>
                {clients.map((client) => (
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
          name="professionalId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Profissional</FormLabel>
              {canChooseProfessional ? (
                <select
                  {...field}
                  disabled={isPending}
                  className={selectClassName}
                  aria-invalid={Boolean(form.formState.errors.professionalId)}
                  onChange={(event) => {
                    field.onChange(event);
                    const nextProfessional = professionals.find(
                      (professional) =>
                        professional.id === event.target.value,
                    );

                    if (
                      !nextProfessional?.serviceIds.includes(
                        form.getValues("serviceId"),
                      )
                    ) {
                      form.setValue("serviceId", "", {
                        shouldValidate: true,
                      });
                    }
                  }}
                >
                  <option value="">Selecione um profissional</option>
                  {professionals.map((professional) => (
                    <option key={professional.id} value={professional.id}>
                      {professional.name}
                    </option>
                  ))}
                </select>
              ) : (
                <>
                  <input type="hidden" {...field} />
                  <p className="text-sm text-muted-foreground">
                    {selectedProfessional?.name ?? "Profissional autenticado"}
                  </p>
                </>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="serviceId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Serviço</FormLabel>
              <select
                {...field}
                disabled={isPending || availableServices.length === 0}
                className={selectClassName}
                aria-invalid={Boolean(form.formState.errors.serviceId)}
              >
                <option value="">Selecione um serviço</option>
                {availableServices.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} ({service.duration} min)
                    {!service.active ? " · inativo" : ""}
                  </option>
                ))}
              </select>
              {selectedProfessional && availableServices.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Este profissional não possui serviços associados.
                </p>
              ) : null}
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="startAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Início</FormLabel>
                <Input
                  {...field}
                  type="datetime-local"
                  disabled={isPending}
                  aria-invalid={Boolean(form.formState.errors.startAt)}
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Término</FormLabel>
                <Input
                  {...field}
                  type="datetime-local"
                  disabled={isPending}
                  aria-invalid={Boolean(form.formState.errors.endAt)}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <p className="-mt-2 text-xs text-muted-foreground">
          O horário final pode ser ajustado independentemente da duração padrão
          do serviço.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <select
                  {...field}
                  disabled={isPending}
                  className={selectClassName}
                  aria-invalid={Boolean(form.formState.errors.status)}
                >
                  {Object.values(AppointmentStatus).map((status) => (
                    <option key={status} value={status}>
                      {statusLabels[status]}
                    </option>
                  ))}
                </select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="origin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Origem</FormLabel>
                <select
                  {...field}
                  disabled={isPending}
                  className={selectClassName}
                  aria-invalid={Boolean(form.formState.errors.origin)}
                >
                  {Object.values(AppointmentOrigin).map((origin) => (
                    <option key={origin} value={origin}>
                      {originLabels[origin]}
                    </option>
                  ))}
                </select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
                placeholder="Observações sobre o agendamento"
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
            disabled={
              isPending ||
              clients.length === 0 ||
              professionals.length === 0 ||
              availableServices.length === 0
            }
          >
            {isPending
              ? "Salvando..."
              : appointment
                ? "Salvar alterações"
                : "Cadastrar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
