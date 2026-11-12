"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SortingState } from "@tanstack/react-table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { CrudConfirmDialog } from "@/components/crud/crud-confirm-dialog";
import { CrudFormDialog } from "@/components/crud/crud-form-dialog";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { createAppColumnHelper } from "@/components/data-table/table";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { SearchInput } from "@/components/search-input/search-input";
import { Button } from "@/components/ui/button";
import { useListControls } from "@/hooks/use-list-controls";

import {
  createExampleItemAction,
  deleteExampleItemAction,
  getExampleItems,
  updateExampleItemAction,
} from "./example-item.actions";
import type { CreateExampleItemData } from "./example-item.schema";
import type {
  ExampleItemListItem,
  ExampleItemListQuery,
} from "./example-item.query";
import { ExampleItemForm } from "./example-item-form";

type ExampleItemSortField = "name" | "active" | "createdAt";

const PAGE_SIZE = 10;

const allowedSortFields: ExampleItemSortField[] = [
  "name",
  "active",
  "createdAt",
];

function getSortingQuery(
  sorting: SortingState,
): Pick<ExampleItemListQuery, "sortBy" | "sortDirection"> {
  const firstSort = sorting[0];

  if (!firstSort) {
    return { sortBy: "name", sortDirection: "asc" };
  }

  const sortBy = allowedSortFields.includes(
    firstSort.id as ExampleItemSortField,
  )
    ? (firstSort.id as ExampleItemSortField)
    : "name";

  return {
    sortBy,
    sortDirection: firstSort.desc ? "desc" : "asc",
  };
}

export function ExampleItemContainer() {
  const queryClient = useQueryClient();
  const {
    search,
    debouncedSearch,
    sorting,
    pagination,
    setSearch,
    setSorting,
    setPagination,
  } = useListControls<ExampleItemSortField>({
    initialPageSize: PAGE_SIZE,
    debounceDelay: 400,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<
    ExampleItemListItem | undefined
  >();
  const [deletingItem, setDeletingItem] = useState<
    ExampleItemListItem | undefined
  >();

  const sortingQuery = getSortingQuery(sorting);
  const query: ExampleItemListQuery = {
    search: debouncedSearch,
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
    sortBy: sortingQuery.sortBy,
    sortDirection: sortingQuery.sortDirection,
  };

  const itemsQuery = useQuery({
    queryKey: [
      "example-items",
      query.search,
      query.page,
      query.pageSize,
      query.sortBy,
      query.sortDirection,
    ],
    queryFn: () => getExampleItems(query),
    placeholderData: (previousData) => previousData,
  });

  const createMutation = useMutation({
    mutationFn: createExampleItemAction,
    onSuccess: async () => {
      toast.success("Item de exemplo cadastrado com sucesso.");
      setFormOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["example-items"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível cadastrar o item de exemplo.",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateExampleItemAction,
    onSuccess: async () => {
      toast.success("Item de exemplo atualizado com sucesso.");
      setFormOpen(false);
      setEditingItem(undefined);
      await queryClient.invalidateQueries({ queryKey: ["example-items"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o item de exemplo.",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteExampleItemAction,
    onSuccess: async () => {
      toast.success("Item de exemplo excluído com sucesso.");
      setDeletingItem(undefined);
      await queryClient.invalidateQueries({ queryKey: ["example-items"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir o item de exemplo.",
      );
    },
  });

  const isFormPending = createMutation.isPending || updateMutation.isPending;

  function handleCreate() {
    setEditingItem(undefined);
    setFormOpen(true);
  }

  function handleFormSubmit(data: CreateExampleItemData) {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, ...data });
      return;
    }

    createMutation.mutate(data);
  }

  function handleDelete() {
    if (deletingItem) {
      deleteMutation.mutate({ id: deletingItem.id });
    }
  }

  const columnHelper = createAppColumnHelper<ExampleItemListItem>();
  const columns = columnHelper.columns([
    columnHelper.accessor("name", {
      header: "Nome",
      enableSorting: true,
    }),
    columnHelper.accessor("description", {
      header: "Descrição",
      enableSorting: false,
      cell: ({ getValue }) => getValue() || "—",
    }),
    columnHelper.accessor("active", {
      header: "Status",
      enableSorting: true,
      cell: ({ getValue }) => (getValue() ? "Ativo" : "Inativo"),
    }),
    columnHelper.display({
      id: "actions",
      header: "Ações",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => {
              setEditingItem(row.original);
              setFormOpen(true);
            }}
            aria-label={`Editar ${row.original.name}`}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setDeletingItem(row.original)}
            aria-label={`Excluir ${row.original.name}`}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    }),
  ]);

  if (itemsQuery.isPending && !itemsQuery.data) {
    return (
      <div className="space-y-4">
        <ExampleItemHeader onCreate={handleCreate} />
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Pesquisar itens de exemplo..."
        />
        <DataTableSkeleton columns={4} rows={PAGE_SIZE} />
      </div>
    );
  }

  if (itemsQuery.isError && !itemsQuery.data) {
    return (
      <div className="space-y-4">
        <ExampleItemHeader onCreate={handleCreate} />
        <ErrorState
          title="Não foi possível carregar os itens de exemplo."
          description="Tente novamente. Se o problema persistir, verifique sua conexão."
          action={
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void itemsQuery.refetch();
              }}
            >
              Tentar novamente
            </Button>
          }
        />
      </div>
    );
  }

  const data = itemsQuery.data;

  if (!data) {
    return null;
  }

  return (
    <>
      <div className="space-y-4">
        <ExampleItemHeader onCreate={handleCreate} />
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Pesquisar itens de exemplo..."
        />
        {data.items.length === 0 ? (
          <EmptyState
            title={
              debouncedSearch
                ? "Nenhum item encontrado"
                : "Nenhum item cadastrado"
            }
            description={
              debouncedSearch
                ? "Tente alterar os termos da busca."
                : "Cadastre o primeiro item de exemplo para começar."
            }
            action={
              !debouncedSearch ? (
                <Button type="button" onClick={handleCreate}>
                  <Plus />
                  Novo item
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="relative">
            {itemsQuery.isFetching ? (
              <div className="absolute right-2 top-2 z-10 flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
                <span
                  className="size-3 animate-spin rounded-full border-2 border-current border-t-transparent"
                  aria-hidden="true"
                />
                Atualizando...
              </div>
            ) : null}
            <div
              className={
                itemsQuery.isFetching
                  ? "opacity-60 transition-opacity"
                  : "transition-opacity"
              }
            >
              <DataTable<ExampleItemListItem>
                columns={columns}
                data={data.items}
                sorting={sorting}
                onSortingChange={setSorting}
                pagination={pagination}
                onPaginationChange={setPagination}
                rowCount={data.total}
              />
            </div>
          </div>
        )}
      </div>

      <CrudFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          if (isFormPending && !open) {
            return;
          }
          setFormOpen(open);
          if (!open) {
            setEditingItem(undefined);
          }
        }}
        title={editingItem ? "Editar item de exemplo" : "Novo item de exemplo"}
        description={
          editingItem
            ? "Atualize os dados do item de exemplo."
            : "Cadastre um novo item de exemplo."
        }
      >
        {formOpen ? (
          <ExampleItemForm
            key={editingItem?.id ?? "new"}
            exampleItem={editingItem}
            isPending={isFormPending}
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setFormOpen(false);
              setEditingItem(undefined);
            }}
          />
        ) : null}
      </CrudFormDialog>

      <CrudConfirmDialog
        open={deletingItem !== undefined}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingItem(undefined);
          }
        }}
        title="Excluir item de exemplo?"
        description={
          deletingItem
            ? `O item "${deletingItem.name}" será excluído permanentemente.`
            : "Esta operação não poderá ser desfeita."
        }
        confirmLabel={deleteMutation.isPending ? "Excluindo..." : "Excluir"}
        confirmDisabled={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </>
  );
}

interface ExampleItemHeaderProps {
  onCreate: () => void;
}

function ExampleItemHeader({ onCreate }: ExampleItemHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm text-muted-foreground">
          Exemplo de uma funcionalidade CRUD protegida e isolada por tenant.
        </p>
      </div>
      <Button type="button" onClick={onCreate}>
        <Plus />
        Novo item
      </Button>
    </div>
  );
}
