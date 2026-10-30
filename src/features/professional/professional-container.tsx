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
  createProfessionalAction,
  deleteProfessionalAction,
  getProfessionalServices,
  getProfessionals,
  updateProfessionalAction,
} from "./professional.actions";
import type {
  ProfessionalListItem,
  ProfessionalListQuery,
} from "./professional.query";
import { ProfessionalForm } from "./professional-form";
import type { ProfessionalFormData } from "./professional.schema";

type ProfessionalSortField = ProfessionalListQuery["sortBy"];

const PAGE_SIZE = 10;
const allowedSortFields: ProfessionalSortField[] = [
  "name",
  "email",
  "createdAt",
];

function getSortingQuery(
  sorting: SortingState,
): Pick<ProfessionalListQuery, "sortBy" | "sortDirection"> {
  const firstSort = sorting[0];

  if (!firstSort) {
    return { sortBy: "name", sortDirection: "asc" };
  }

  const sortBy = allowedSortFields.includes(firstSort.id as ProfessionalSortField)
    ? (firstSort.id as ProfessionalSortField)
    : "name";

  return {
    sortBy,
    sortDirection: firstSort.desc ? "desc" : "asc",
  };
}

export function ProfessionalContainer() {
  const queryClient = useQueryClient();

  const {
    search,
    debouncedSearch,
    sorting,
    pagination,
    setSearch,
    setSorting,
    setPagination,
  } = useListControls<ProfessionalSortField>({
    initialPageSize: PAGE_SIZE,
    debounceDelay: 400,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState<
    ProfessionalListItem | undefined
  >();
  const [deletingProfessional, setDeletingProfessional] = useState<
    ProfessionalListItem | undefined
  >();

  const sortingQuery = getSortingQuery(sorting);
  const query: ProfessionalListQuery = {
    search: debouncedSearch,
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
    sortBy: sortingQuery.sortBy,
    sortDirection: sortingQuery.sortDirection,
  };

  const professionalsQuery = useQuery({
    queryKey: [
      "professionals",
      query.search,
      query.page,
      query.pageSize,
      query.sortBy,
      query.sortDirection,
    ],
    queryFn: () => getProfessionals(query),
    placeholderData: (previousData) => previousData,
  });

  const serviceOptionsQuery = useQuery({
    queryKey: ["professional-service-options"],
    queryFn: getProfessionalServices,
    enabled: formOpen && professionalsQuery.data?.canManage === true,
  });

  const createMutation = useMutation({
    mutationFn: createProfessionalAction,
    onSuccess: async () => {
      toast.success("Profissional cadastrado com sucesso.");
      setFormOpen(false);

      await queryClient.invalidateQueries({
        queryKey: ["professionals"],
      });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível cadastrar o profissional.",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateProfessionalAction,
    onSuccess: async () => {
      toast.success("Profissional atualizado com sucesso.");
      setFormOpen(false);
      setEditingProfessional(undefined);

      await queryClient.invalidateQueries({
        queryKey: ["professionals"],
      });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o profissional.",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProfessionalAction,
    onSuccess: async () => {
      toast.success("Profissional excluído com sucesso.");
      setDeletingProfessional(undefined);

      if (
        professionalsQuery.data?.items.length === 1 &&
        pagination.pageIndex > 0
      ) {
        setPagination((previous) => ({
          ...previous,
          pageIndex: previous.pageIndex - 1,
        }));
      }

      await queryClient.invalidateQueries({
        queryKey: ["professionals"],
      });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir o profissional.",
      );
    },
  });

  const isFormPending = createMutation.isPending || updateMutation.isPending;

  function handleCreate() {
    setEditingProfessional(undefined);
    setFormOpen(true);
  }

  function handleEdit(professional: ProfessionalListItem) {
    setEditingProfessional(professional);
    setFormOpen(true);
  }

  function handleFormSubmit(data: ProfessionalFormData) {
    if (editingProfessional) {
      updateMutation.mutate({
        id: editingProfessional.id,
        ...data,
      });

      return;
    }

    createMutation.mutate(data);
  }

  function handleDelete() {
    if (!deletingProfessional) {
      return;
    }

    deleteMutation.mutate({
      id: deletingProfessional.id,
    });
  }

  const columnHelper = createAppColumnHelper<ProfessionalListItem>();
  const columns = columnHelper.columns([
    columnHelper.accessor("name", {
      header: "Nome",
      enableSorting: true,
    }),
    columnHelper.accessor("email", {
      header: "E-mail",
      enableSorting: true,
    }),
    columnHelper.accessor("services", {
      header: "Services",
      cell: ({ getValue }) =>
        getValue()
          .map((service) => service.name)
          .join(", "),
    }),
    columnHelper.accessor("createdAt", {
      header: "Cadastrado em",
      enableSorting: true,
      cell: ({ getValue }) =>
        new Intl.DateTimeFormat("pt-BR").format(getValue()),
    }),
    ...(professionalsQuery.data?.canManage
      ? [
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
                  onClick={() => setDeletingProfessional(row.original)}
                  aria-label={`Excluir ${row.original.name}`}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ),
          }),
        ]
      : []),
  ]);

  if (professionalsQuery.isPending && !professionalsQuery.data) {
    return (
      <div className="space-y-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Pesquisar profissionais..."
        />
        <DataTableSkeleton columns={5} rows={PAGE_SIZE} />
      </div>
    );
  }

  if (professionalsQuery.isError && !professionalsQuery.data) {
    return (
      <div className="space-y-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Pesquisar profissionais..."
        />
        <ErrorState
          title="Não foi possível carregar os profissionais."
          description="Tente novamente. Se o problema persistir, verifique sua conexão."
          action={
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void professionalsQuery.refetch();
              }}
            >
              Tentar novamente
            </Button>
          }
        />
      </div>
    );
  }

  const data = professionalsQuery.data;

  if (!data) {
    return null;
  }

  return (
    <>
      <div className="space-y-4">
        {data.canManage ? <ProfessionalHeader onCreate={handleCreate} /> : null}

        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Pesquisar profissionais..."
        />

        {data.items.length === 0 ? (
          <EmptyState
            title={
              debouncedSearch
                ? "Nenhum profissional encontrado"
                : "Nenhum profissional cadastrado"
            }
            description={
              debouncedSearch
                ? "Tente alterar os termos da busca."
                : "Os profissionais cadastrados serão exibidos aqui."
            }
            action={
              data.canManage && !debouncedSearch ? (
                <Button type="button" onClick={handleCreate}>
                  <Plus />
                  Novo profissional
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="relative">
            {professionalsQuery.isFetching ? (
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
                professionalsQuery.isFetching
                  ? "opacity-60 transition-opacity"
                  : "transition-opacity"
              }
            >
              <DataTable<ProfessionalListItem>
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
            setEditingProfessional(undefined);
          }
        }}
        title={
          editingProfessional ? "Editar profissional" : "Novo profissional"
        }
        description={
          editingProfessional
            ? "Atualize os dados e os serviços executados."
            : "Cadastre o acesso e associe os serviços executados."
        }
      >
        {formOpen ? (
          serviceOptionsQuery.isPending ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Carregando serviços...
            </p>
          ) : serviceOptionsQuery.isError ? (
            <ErrorState
              title="Não foi possível carregar os serviços."
              description="Tente novamente para continuar o cadastro."
              action={
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    void serviceOptionsQuery.refetch();
                  }}
                >
                  Tentar novamente
                </Button>
              }
            />
          ) : serviceOptionsQuery.data ? (
            <ProfessionalForm
              key={editingProfessional?.id ?? "new"}
              professional={editingProfessional}
              services={serviceOptionsQuery.data}
              isPending={isFormPending}
              onSubmit={handleFormSubmit}
              onCancel={() => {
                setFormOpen(false);
                setEditingProfessional(undefined);
              }}
            />
          ) : null
        ) : null}
      </CrudFormDialog>

      <CrudConfirmDialog
        open={deletingProfessional !== undefined}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) {
            setDeletingProfessional(undefined);
          }
        }}
        title="Excluir profissional?"
        description={
          deletingProfessional
            ? `O profissional "${deletingProfessional.name}" e sua conta serão excluídos. Agendamentos ou registros de auditoria podem impedir a exclusão.`
            : "Esta operação não poderá ser desfeita."
        }
        confirmLabel={deleteMutation.isPending ? "Excluindo..." : "Excluir"}
        confirmDisabled={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </>
  );
}

interface ProfessionalHeaderProps {
  onCreate: () => void;
}

function ProfessionalHeader({ onCreate }: ProfessionalHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm text-muted-foreground">
        Gerencie os profissionais e os serviços que executam.
      </p>

      <Button type="button" onClick={onCreate}>
        <Plus />
        Novo profissional
      </Button>
    </div>
  );
}
