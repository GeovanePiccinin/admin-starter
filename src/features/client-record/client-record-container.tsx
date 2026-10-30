"use client";

import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SortingState } from "@tanstack/react-table";
import { FileText, Pencil, Plus, Trash2 } from "lucide-react";
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
import { AttendanceStatus } from "@/generated/prisma/enums";
import { useListControls } from "@/hooks/use-list-controls";

import {
  createClientRecordAction,
  deleteClientRecordAction,
  getClientRecordFormOptions,
  getClientRecords,
  updateClientRecordAction,
} from "./client-record.actions";
import { ClientRecordForm } from "./client-record-form";
import type {
  ClientRecordListItem,
  ClientRecordListQuery,
} from "./client-record.query";
import type { ClientRecordFormData } from "./client-record.schema";

type ClientRecordSortField = ClientRecordListQuery["sortBy"];
type AttendanceLinkFilter = ClientRecordListQuery["attendanceLink"];

const PAGE_SIZE = 10;
const allowedSortFields: ClientRecordSortField[] = ["createdAt", "client"];

const attendanceLinkLabels: Record<AttendanceLinkFilter, string> = {
  all: "Todos os registros",
  linked: "Com atendimento",
  unlinked: "Sem atendimento",
};

const attendanceStatusLabels: Record<keyof typeof AttendanceStatus, string> = {
  SCHEDULED: "Agendado",
  IN_PROGRESS: "Em andamento",
  COMPLETED: "Concluído",
};

function getSortingQuery(
  sorting: SortingState,
): Pick<ClientRecordListQuery, "sortBy" | "sortDirection"> {
  const firstSort = sorting[0];

  if (!firstSort) {
    return { sortBy: "createdAt", sortDirection: "desc" };
  }

  const sortBy = allowedSortFields.includes(
    firstSort.id as ClientRecordSortField,
  )
    ? (firstSort.id as ClientRecordSortField)
    : "createdAt";

  return {
    sortBy,
    sortDirection: firstSort.desc ? "desc" : "asc",
  };
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(date);
}

export function ClientRecordContainer() {
  const queryClient = useQueryClient();
  const {
    search,
    debouncedSearch,
    sorting,
    pagination,
    setSearch,
    setSorting,
    setPagination,
  } = useListControls<ClientRecordSortField>({
    initialPageSize: PAGE_SIZE,
    debounceDelay: 400,
  });

  const [attendanceLink, setAttendanceLink] =
    useState<AttendanceLinkFilter>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [editingRecord, setEditingRecord] = useState<
    ClientRecordListItem | undefined
  >();
  const [deletingRecord, setDeletingRecord] = useState<
    ClientRecordListItem | undefined
  >();

  const sortingQuery = getSortingQuery(sorting);
  const query: ClientRecordListQuery = {
    search: debouncedSearch,
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
    sortBy: sortingQuery.sortBy,
    sortDirection: sortingQuery.sortDirection,
    attendanceLink,
  };

  const recordsQuery = useQuery({
    queryKey: [
      "client-records",
      query.search,
      query.page,
      query.pageSize,
      query.sortBy,
      query.sortDirection,
      query.attendanceLink,
    ],
    queryFn: () => getClientRecords(query),
    placeholderData: (previousData) => previousData,
  });

  const formOptionsQuery = useQuery({
    queryKey: ["client-record-form-options", selectedClientId],
    queryFn: () =>
      getClientRecordFormOptions({
        ...(selectedClientId ? { clientId: selectedClientId } : {}),
      }),
    enabled: formOpen,
    placeholderData: (previousData) => previousData,
  });

  const createMutation = useMutation({
    mutationFn: createClientRecordAction,
    onSuccess: async () => {
      toast.success("Ficha do cliente cadastrada com sucesso.");
      setFormOpen(false);
      setSelectedClientId("");
      await queryClient.invalidateQueries({ queryKey: ["client-records"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível cadastrar a ficha do cliente.",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateClientRecordAction,
    onSuccess: async () => {
      toast.success("Ficha do cliente atualizada com sucesso.");
      setFormOpen(false);
      setEditingRecord(undefined);
      setSelectedClientId("");
      await queryClient.invalidateQueries({ queryKey: ["client-records"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar a ficha do cliente.",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteClientRecordAction,
    onSuccess: async () => {
      toast.success("Ficha do cliente excluída com sucesso.");
      setDeletingRecord(undefined);

      if (recordsQuery.data?.items.length === 1 && pagination.pageIndex > 0) {
        setPagination((previous) => ({
          ...previous,
          pageIndex: previous.pageIndex - 1,
        }));
      }

      await queryClient.invalidateQueries({ queryKey: ["client-records"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir a ficha do cliente.",
      );
    },
  });

  const isFormPending = createMutation.isPending || updateMutation.isPending;

  function handleCreate() {
    setEditingRecord(undefined);
    setSelectedClientId("");
    setFormOpen(true);
  }

  function handleEdit(record: ClientRecordListItem) {
    setEditingRecord(record);
    setSelectedClientId(record.client.id);
    setFormOpen(true);
  }

  function handleFormSubmit(data: ClientRecordFormData) {
    if (editingRecord) {
      updateMutation.mutate({ id: editingRecord.id, ...data });
      return;
    }

    createMutation.mutate(data);
  }

  function handleDelete() {
    if (deletingRecord) {
      deleteMutation.mutate({ id: deletingRecord.id });
    }
  }

  const columnHelper = createAppColumnHelper<ClientRecordListItem>();
  const columns = columnHelper.columns([
    columnHelper.accessor("client.name", {
      id: "client",
      header: "Cliente",
      enableSorting: true,
    }),
    columnHelper.accessor("content", {
      header: "Conteúdo",
      enableSorting: false,
      cell: ({ getValue }) => (
        <p className="max-w-lg truncate" title={getValue()}>
          {getValue()}
        </p>
      ),
    }),
    columnHelper.accessor("createdAt", {
      header: "Criada em",
      enableSorting: true,
      cell: ({ getValue }) => formatDate(getValue()),
    }),
    columnHelper.accessor(
      (record) => record.attendance?.startAt ?? null,
      {
        id: "attendance",
        header: "Atendimento",
        enableSorting: false,
        cell: ({ row }) =>
          row.original.attendance
            ? `${formatDate(row.original.attendance.startAt)} · ${
                attendanceStatusLabels[row.original.attendance.status]
              }`
            : "—",
      },
    ),
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
            aria-label={`Editar ficha de ${row.original.client.name}`}
          >
            <Pencil className="size-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setDeletingRecord(row.original)}
            aria-label={`Excluir ficha de ${row.original.client.name}`}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    }),
  ]);

  if (recordsQuery.isPending && !recordsQuery.data) {
    return (
      <div className="space-y-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Pesquisar fichas..."
        />
        <DataTableSkeleton columns={5} rows={PAGE_SIZE} />
      </div>
    );
  }

  if (recordsQuery.isError && !recordsQuery.data) {
    return (
      <div className="space-y-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Pesquisar fichas..."
        />
        <ErrorState
          title="Não foi possível carregar as fichas dos clientes."
          description="Tente novamente. Se o problema persistir, verifique sua conexão."
          action={
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void recordsQuery.refetch();
              }}
            >
              Tentar novamente
            </Button>
          }
        />
      </div>
    );
  }

  const data = recordsQuery.data;

  if (!data) {
    return null;
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Gerencie as fichas vinculadas aos clientes.
          </p>
          <Button type="button" onClick={handleCreate}>
            <Plus />
            Nova ficha
          </Button>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Pesquisar por cliente ou conteúdo..."
          />
          <select
            value={attendanceLink}
            onChange={(event) => {
              setAttendanceLink(event.target.value as AttendanceLinkFilter);
              setPagination((previous) => ({ ...previous, pageIndex: 0 }));
            }}
            className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm sm:w-52"
            aria-label="Filtrar por vínculo com atendimento"
          >
            {Object.entries(attendanceLinkLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {data.items.length === 0 ? (
          <EmptyState
            title={
              debouncedSearch || attendanceLink !== "all"
                ? "Nenhuma ficha encontrada"
                : "Nenhuma ficha cadastrada"
            }
            description={
              debouncedSearch || attendanceLink !== "all"
                ? "Altere a pesquisa ou o filtro para tentar novamente."
                : "As fichas cadastradas serão exibidas aqui."
            }
            action={
              !debouncedSearch && attendanceLink === "all" ? (
                <Button type="button" onClick={handleCreate}>
                  <FileText />
                  Nova ficha
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="relative">
            {recordsQuery.isFetching ? (
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
                recordsQuery.isFetching
                  ? "opacity-60 transition-opacity"
                  : "transition-opacity"
              }
            >
              <DataTable<ClientRecordListItem>
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
            setEditingRecord(undefined);
            setSelectedClientId("");
          }
        }}
        title={editingRecord ? "Editar ficha do cliente" : "Nova ficha do cliente"}
        description={
          editingRecord
            ? "Atualize o conteúdo e os vínculos da ficha."
            : "Cadastre uma ficha para um cliente."
        }
      >
        {formOpen && formOptionsQuery.data ? (
          <ClientRecordForm
            key={editingRecord?.id ?? "new"}
            record={editingRecord}
            options={formOptionsQuery.data}
            isAttendanceOptionsPending={formOptionsQuery.isFetching}
            isPending={isFormPending}
            onSubmit={handleFormSubmit}
            onClientChange={(clientId) => {
              setSelectedClientId(clientId);
            }}
            onCancel={() => {
              setFormOpen(false);
              setEditingRecord(undefined);
              setSelectedClientId("");
            }}
          />
        ) : formOpen && formOptionsQuery.isError ? (
          <ErrorState
            title="Não foi possível carregar as opções do formulário."
            description="Tente novamente."
            action={
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  void formOptionsQuery.refetch();
                }}
              >
                Tentar novamente
              </Button>
            }
          />
        ) : (
          <DataTableSkeleton columns={1} rows={3} />
        )}
      </CrudFormDialog>

      <CrudConfirmDialog
        open={deletingRecord !== undefined}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) {
            setDeletingRecord(undefined);
          }
        }}
        title="Excluir ficha do cliente?"
        description={
          deletingRecord
            ? `A ficha de "${deletingRecord.client.name}" será excluída permanentemente.`
            : "Esta operação não poderá ser desfeita."
        }
        confirmLabel={deleteMutation.isPending ? "Excluindo..." : "Excluir"}
        confirmDisabled={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </>
  );
}
