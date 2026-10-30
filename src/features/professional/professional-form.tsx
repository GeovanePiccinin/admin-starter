"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { TextFormField } from "@/components/forms/text-form-field";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import type {
  ProfessionalListItem,
  ProfessionalServiceOption,
} from "./professional.query";
import {
  getProfessionalFormSchema,
  type ProfessionalFormData,
  type ProfessionalFormInput,
} from "./professional.schema";

interface ProfessionalFormProps {
  professional?: ProfessionalListItem;
  services: ProfessionalServiceOption[];
  isPending: boolean;
  onSubmit: (data: ProfessionalFormData) => void;
  onCancel: () => void;
}

export function ProfessionalForm({
  professional,
  services,
  isPending,
  onSubmit,
  onCancel,
}: ProfessionalFormProps) {
  const form = useForm<
    ProfessionalFormInput,
    undefined,
    ProfessionalFormData
  >({
    resolver: zodResolver(getProfessionalFormSchema(Boolean(professional))),
    defaultValues: {
      name: professional?.name ?? "",
      email: professional?.email ?? "",
      password: "",
      serviceIds: professional?.services.map((service) => service.id) ?? [],
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <TextFormField
          form={form}
          name="name"
          label="Nome"
          placeholder="Nome do profissional"
          disabled={isPending}
        />

        <TextFormField
          form={form}
          name="email"
          label="E-mail"
          type="email"
          placeholder="profissional@exemplo.com"
          disabled={isPending}
        />

        <TextFormField
          form={form}
          name="password"
          label={professional ? "Nova senha (opcional)" : "Senha"}
          type="password"
          placeholder={
            professional
              ? "Deixe em branco para manter a senha atual"
              : "Mínimo de 8 caracteres"
          }
          disabled={isPending}
        />

        <FormField
          control={form.control}
          name="serviceIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Serviços executados</FormLabel>

              {services.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Cadastre ao menos um serviço antes de criar um profissional.
                </p>
              ) : (
                <div className="max-h-56 space-y-2 overflow-y-auto rounded-md border p-3">
                  {services.map((service) => (
                    <label
                      key={service.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        ref={field.ref}
                        type="checkbox"
                        checked={field.value.includes(service.id)}
                        disabled={isPending}
                        onBlur={field.onBlur}
                        onChange={(event) => {
                          const nextServiceIds = event.target.checked
                            ? [...field.value, service.id]
                            : field.value.filter((id) => id !== service.id);

                          field.onChange(nextServiceIds);
                        }}
                        className="size-4 accent-primary"
                      />
                      <span>
                        {service.name}
                        {!service.active ? " (inativo)" : ""}
                      </span>
                    </label>
                  ))}
                </div>
              )}

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

          <Button type="submit" disabled={isPending || services.length === 0}>
            {isPending
              ? "Salvando..."
              : professional
                ? "Salvar alterações"
                : "Cadastrar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
