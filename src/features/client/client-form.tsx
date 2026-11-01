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
  ClientListItem,
  ClientProfessionalOption,
} from "./client.query";
import {
  createClientSchema,
  type CreateClientData,
  type CreateClientInput,
} from "./client.schema";

interface ClientFormProps {
  client?: ClientListItem;
  professionals: ClientProfessionalOption[];
  assignedProfessionalIds: string[];
  canAssignProfessionals: boolean;
  isPending: boolean;
  onSubmit: (data: CreateClientData) => void;
  onCancel: () => void;
}

export function ClientForm({
  client,
  professionals,
  assignedProfessionalIds,
  canAssignProfessionals,
  isPending,
  onSubmit,
  onCancel,
}: ClientFormProps) {
  const form = useForm<CreateClientInput, undefined, CreateClientData>({
    resolver: zodResolver(createClientSchema),
    defaultValues: {
      name: client?.name ?? "",
      email: client?.email ?? "",
      phone: client?.phone ?? "",
      professionalIds: assignedProfessionalIds,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <TextFormField
          form={form}
          name="name"
          label="Nome"
          placeholder="Nome do cliente"
          disabled={isPending}
        />

        <TextFormField
          form={form}
          name="email"
          label="E-mail"
          type="email"
          placeholder="cliente@exemplo.com"
          disabled={isPending}
        />

        <TextFormField
          form={form}
          name="phone"
          label="Telefone"
          type="text"
          placeholder="(00) 00000-0000"
          disabled={isPending}
        />

        {canAssignProfessionals ? (
          <FormField
            control={form.control}
            name="professionalIds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Profissionais responsáveis</FormLabel>

                {professionals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Cadastre profissionais antes de atribuir este cliente.
                  </p>
                ) : (
                  <div className="max-h-56 space-y-2 overflow-y-auto rounded-md border p-3">
                    {professionals.map((professional) => (
                      <label
                        key={professional.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <input
                          ref={field.ref}
                          type="checkbox"
                          checked={
                            field.value?.includes(professional.id) ?? false
                          }
                          disabled={isPending}
                          onBlur={field.onBlur}
                          onChange={(event) => {
                            const currentIds = field.value ?? [];
                            const nextIds = event.target.checked
                              ? [...currentIds, professional.id]
                              : currentIds.filter(
                                  (id) => id !== professional.id,
                                );

                            field.onChange(nextIds);
                          }}
                          className="size-4 accent-primary"
                        />
                        <span>{professional.name}</span>
                      </label>
                    ))}
                  </div>
                )}

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

          <Button type="submit" disabled={isPending}>
            {isPending
              ? "Salvando..."
              : client
                ? "Salvar alterações"
                : "Cadastrar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
