"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { TextFormField } from "@/components/forms/text-form-field";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

import {
  createExampleItemSchema,
  type CreateExampleItemData,
  type CreateExampleItemInput,
} from "./example-item.schema";
import type { ExampleItemListItem } from "./example-item.query";

interface ExampleItemFormProps {
  exampleItem?: ExampleItemListItem;
  isPending: boolean;
  onSubmit: (data: CreateExampleItemData) => void;
  onCancel: () => void;
}

export function ExampleItemForm({
  exampleItem,
  isPending,
  onSubmit,
  onCancel,
}: ExampleItemFormProps) {
  const form = useForm<
    CreateExampleItemInput,
    undefined,
    CreateExampleItemData
  >({
    resolver: zodResolver(createExampleItemSchema),

    defaultValues: {
      name: exampleItem?.name ?? "",
      description: exampleItem?.description ?? "",
      active: exampleItem?.active ?? true,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <TextFormField
          form={form}
          name="name"
          label="Nome"
          placeholder="Ex.: Primeiro item"
          disabled={isPending}
        />

        <div className="space-y-2">
          <label
            htmlFor="example-item-description"
            className="text-sm font-medium"
          >
            Descrição
          </label>

          <Textarea
            id="example-item-description"
            placeholder="Descreva o item..."
            disabled={isPending}
            {...form.register("description")}
          />

          {form.formState.errors.description ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.description.message}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <input
            id="example-item-active"
            type="checkbox"
            disabled={isPending}
            {...form.register("active")}
          />

          <label htmlFor="example-item-active" className="text-sm font-medium">
            Item ativo
          </label>
        </div>

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
              : exampleItem
                ? "Salvar alterações"
                : "Cadastrar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
