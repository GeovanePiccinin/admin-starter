"use client";

import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SortingState } from "@tanstack/react-table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { CrudConfirmDialog } from "@/components/crud/crud-confirm-dialog";
import { CrudFormDialog } from "@/components/crud/crud-form-dialog";
import { DataTable } from "@/components/data-table/data-table";
import { createAppColumnHelper } from "@/components/data-table/table";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { SearchInput } from "@/components/search-input/search-input";
import { Button } from "@/components/ui/button";

import { useListControls } from "@/hooks/use-list-controls";

import {
  createClientAction,
  deleteClientAction,
  getClients,
  updateClientAction,
} from "./client.actions";
import { ClientForm } from "./client-form";
import type { CreateClientData } from "./client.schema";
import type { ClientListItem, ClientListQuery } from "./client.query";

type ClientSortField = ClientListQuery["sortBy"];

const PAGE_SIZE = 10;
const allowedSortFields: ClientSortField[] = ["name", "email", "phone"];

function getSortingQuery(
  sorting: SortingState,
): Pick<ClientListQuery, "sortBy" | "sortDirection"> {
  const firstSort = sorting[0];

  if (!firstSort) {
    return { sortBy: "name", sortDirection: "asc" };
  }

  const sortBy = allowedSortFields.includes(firstSort.id as ClientSortField)
    ? (firstSort.id as ClientSortField)
    : "name";

  return {
    sortBy,
    sortDirection: firstSort.desc ? "desc" : "asc",
  };
}

export function ClientContainer() {
  const queryClient = useQueryClient();

  const {
    search,
    debouncedSearch,
    sorting,
    pagination,
    setSearch,
    setSorting,
    setPagination,
  } = useListControls<ClientSortField>({
    initialPageSize: PAGE_SIZE,
    debounceDelay: 400,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<
    ClientListItem | undefined
  >();
  const [deletingClient, setDeletingClient] = useState<
    ClientListItem | undefined
  >();

  const sortingQuery = getSortingQuery(sorting);
  const query: ClientListQuery = {
    search: debouncedSearch,
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
    sortBy: sortingQuery.sortBy,
    sortDirection: sortingQuery.sortDirection,
  };

  const clientsQuery = useQuery({
    queryKey: [
      "clients",
      query.search,
      query.page,
      query.pageSize,
      query.sortBy,
      query.sortDirection,
    ],
    queryFn: () => getClients(query),
    placeholderData: (previousData) => previousData,
  });

  const createMutation = useMutation({
    mutationFn: createClientAction,
    onSuccess: async () => {
      toast.success("Cliente cadastrado com sucesso.");
      setFormOpen(false);

      await queryClient.invalidateQueries({
        queryKey: ["clients"],
      });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível cadastrar o cliente.",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateClientAction,
    onSuccess: async () => {
      toast.success("Cliente atualizado com sucesso.");
      setFormOpen(false);
      setEditingClient(undefined);

      await queryClient.invalidateQueries({
        queryKey: ["clients"],
      });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o cliente.",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteClientAction,
    onSuccess: async () => {
      toast.success("Cliente excluído com sucesso.");
      setDeletingClient(undefined);

      if (clientsQuery.data?.items.length === 1 && pagination.pageIndex > 0) {
        setPagination((previous) => ({
          ...previous,
          pageIndex: previous.pageIndex - 1,
        }));
      }

      await queryClient.invalidateQueries({
        queryKey: ["clients"],
      });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir o cliente.",
      );
    },
  });

  const isFormPending = createMutation.isPending || updateMutation.isPending;

  function handleCreate() {
    setEditingClient(undefined);
    setFormOpen(true);
  }

  function handleEdit(client: ClientListItem) {
    setEditingClient(client);
    setFormOpen(true);
  }

  function handleFormSubmit(clientData: CreateClientData) {
    if (editingClient) {
      updateMutation.mutate({
        id: editingClient.id,
        ...clientData,
      });

      return;
    }

    createMutation.mutate(clientData);
  }

  function handleDelete() {
    if (!deletingClient) {
      return;
    }

    deleteMutation.mutate({ id: deletingClient.id });
  }

  const columnHelper = createAppColumnHelper<ClientListItem>();
  const columns = columnHelper.columns([
    columnHelper.accessor("name", {
      header: "Nome",
      enableSorting: true,
    }),
    columnHelper.accessor("email", {
      header: "E-mail",
      enableSorting: true,
      cell: ({ getValue }) => getValue() ?? "—",
    }),
    columnHelper.accessor("phone", {
      header: "Telefone",
      enableSorting: true,
      cell: ({ getValue }) => getValue() ?? "—",
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
            onClick={() => handleEdit(row.original)}
            aria-label={`Editar ${row.original.name}`}
          >
            <Pencil className="size-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setDeletingClient(row.original)}
            aria-label={`Excluir ${row.original.name}`}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    }),
  ]);

  if (clientsQuery.isPending && !clientsQuery.data) {
    return (
      <div className="space-y-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Pesquisar clientes..."
        />
        <DataTableSkeleton columns={4} rows={PAGE_SIZE} />
      </div>
    );
  }

  if (clientsQuery.isError && !clientsQuery.data) {
    return (
      <div className="space-y-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Pesquisar clientes..."
        />
        <ErrorState
          title="Não foi possível carregar os clientes."
          description="Tente novamente. Se o problema persistir, verifique sua conexão."
          action={
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void clientsQuery.refetch();
              }}
            >
              Tentar novamente
            </Button>
          }
        />
      </div>
    );
  }

  const data = clientsQuery.data;

  if (!data) {
    return null;
  }

  return (
    <>
      <div className="space-y-4">
        <ClientHeader onCreate={handleCreate} />

        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Pesquisar clientes..."
        />

        {data.items.length === 0 ? (
          <EmptyState
            title={
              debouncedSearch
                ? "Nenhum cliente encontrado"
                : "Nenhum cliente cadastrado"
            }
            description={
              debouncedSearch
                ? "Tente alterar os termos da busca."
                : "Os clientes cadastrados serão exibidos aqui."
            }
            action={
              !debouncedSearch ? (
                <Button type="button" onClick={handleCreate}>
                  <Plus />
                  Novo cliente
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="relative">
            {clientsQuery.isFetching ? (
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
                clientsQuery.isFetching
                  ? "opacity-60 transition-opacity"
                  : "transition-opacity"
              }
            >
              <DataTable<ClientListItem>
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
            setEditingClient(undefined);
          }
        }}
        title={editingClient ? "Editar cliente" : "Novo cliente"}
        description={
          editingClient
            ? "Atualize os dados do cliente."
            : "Cadastre um novo cliente."
        }
      >
        {formOpen ? (
          <ClientForm
            key={editingClient?.id ?? "new"}
            client={editingClient}
            isPending={isFormPending}
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setFormOpen(false);
              setEditingClient(undefined);
            }}
          />
        ) : null}
      </CrudFormDialog>

      <CrudConfirmDialog
        open={deletingClient !== undefined}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) {
            setDeletingClient(undefined);
          }
        }}
        title="Excluir cliente?"
        description={
          deletingClient
            ? `O cliente "${deletingClient.name}" será excluído permanentemente.`
            : "Esta operação não poderá ser desfeita."
        }
        confirmLabel={deleteMutation.isPending ? "Excluindo..." : "Excluir"}
        confirmDisabled={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </>
  );
}

interface ClientHeaderProps {
  onCreate: () => void;
}

function ClientHeader({ onCreate }: ClientHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm text-muted-foreground">
        Gerencie os clientes cadastrados.
      </p>

      <Button type="button" onClick={onCreate}>
        <Plus />
        Novo cliente
      </Button>
    </div>
  );
}
