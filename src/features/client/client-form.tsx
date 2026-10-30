"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { TextFormField } from "@/components/forms/text-form-field";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";

import {
  createClientSchema,
  type CreateClientData,
  type CreateClientInput,
} from "./client.schema";
import type { ClientListItem } from "./client.query";

interface ClientFormProps {
  client?: ClientListItem;
  isPending: boolean;
  onSubmit: (data: CreateClientData) => void;
  onCancel: () => void;
}

export function ClientForm({
  client,
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
