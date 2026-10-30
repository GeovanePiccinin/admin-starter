"use client";

import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SortingState } from "@tanstack/react-table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
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
import { Input } from "@/components/ui/input";
import { AttendanceStatus } from "@/generated/prisma/enums";
import { useListControls } from "@/hooks/use-list-controls";

import {
  createAttendanceAction,
  deleteAttendanceAction,
  getAttendanceFormOptions,
  getAttendances,
  updateAttendanceAction,
} from "./attendance.actions";
import type {
  AttendanceListItem,
  AttendanceListQuery,
  AttendanceStatusValue,
} from "./attendance.query";
import { AttendanceForm } from "./attendance-form";
import type { AttendanceFormData } from "./attendance.schema";

type AttendanceSortField = AttendanceListQuery["sortBy"];

const PAGE_SIZE = 10;
const allowedSortFields: AttendanceSortField[] = [
  "startAt",
  "status",
  "client",
  "professional",
  "service",
];

const statusLabels: Record<keyof typeof AttendanceStatus, string> = {
  SCHEDULED: "Agendado",
  IN_PROGRESS: "Em andamento",
  COMPLETED: "Concluído",
};

function getSortingQuery(
  sorting: SortingState,
): Pick<AttendanceListQuery, "sortBy" | "sortDirection"> {
  const firstSort = sorting[0];

  if (!firstSort) {
    return { sortBy: "startAt", sortDirection: "asc" };
  }

  const sortBy = allowedSortFields.includes(firstSort.id as AttendanceSortField)
    ? (firstSort.id as AttendanceSortField)
    : "startAt";

  return {
    sortBy,
    sortDirection: firstSort.desc ? "desc" : "asc",
  };
}

function getLocalDayStartIso(date: string): string {
  return new Date(`${date}T00:00:00`).toISOString();
}

function getLocalDayAfterIso(date: string): string {
  const nextDay = new Date(`${date}T00:00:00`);
  nextDay.setDate(nextDay.getDate() + 1);
  return nextDay.toISOString();
}

function isAttendanceStatus(value: string): value is AttendanceStatusValue {
  return Object.values(AttendanceStatus).some(
    (attendanceStatus) => attendanceStatus === value,
  );
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function AttendanceContainer() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    search,
    debouncedSearch,
    sorting,
    pagination,
    setSearch,
    setSorting,
    setPagination,
  } = useListControls<AttendanceSortField>({
    initialPageSize: PAGE_SIZE,
    debounceDelay: 400,
  });

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [status, setStatus] = useState<AttendanceStatusValue | "">("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<
    AttendanceListItem | undefined
  >();
  const [deletingAttendance, setDeletingAttendance] = useState<
    AttendanceListItem | undefined
  >();

  const sortingQuery = getSortingQuery(sorting);
  const rangeInvalid = Boolean(fromDate && toDate && fromDate > toDate);
  const query: AttendanceListQuery = {
    search: debouncedSearch,
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
    sortBy: sortingQuery.sortBy,
    sortDirection: sortingQuery.sortDirection,
    ...(fromDate ? { from: getLocalDayStartIso(fromDate) } : {}),
    ...(toDate ? { toExclusive: getLocalDayAfterIso(toDate) } : {}),
    ...(status ? { status } : {}),
  };

  const attendancesQuery = useQuery({
    queryKey: [
      "attendances",
      query.search,
      query.page,
      query.pageSize,
      query.sortBy,
      query.sortDirection,
      query.from,
      query.toExclusive,
      query.status,
    ],
    queryFn: () => getAttendances(query),
    enabled: !rangeInvalid,
    placeholderData: (previousData) => previousData,
  });

  const formOptionsQuery = useQuery({
    queryKey: ["attendance-form-options", editingAttendance?.id],
    queryFn: () =>
      getAttendanceFormOptions(
        editingAttendance ? { attendanceId: editingAttendance.id } : {},
      ),
    enabled: formOpen,
  });

  const createMutation = useMutation({
    mutationFn: createAttendanceAction,
    onSuccess: async () => {
      toast.success("Atendimento cadastrado com sucesso.");
      setFormOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["attendances"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível cadastrar o atendimento.",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateAttendanceAction,
    onSuccess: async () => {
      toast.success("Atendimento atualizado com sucesso.");
      setFormOpen(false);
      setEditingAttendance(undefined);
      await queryClient.invalidateQueries({ queryKey: ["attendances"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o atendimento.",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAttendanceAction,
    onSuccess: async () => {
      toast.success("Atendimento excluído com sucesso.");
      setDeletingAttendance(undefined);

      if (
        attendancesQuery.data?.items.length === 1 &&
        pagination.pageIndex > 0
      ) {
        setPagination((previous) => ({
          ...previous,
          pageIndex: previous.pageIndex - 1,
        }));
      }

      await queryClient.invalidateQueries({ queryKey: ["attendances"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir o atendimento.",
      );
    },
  });

  const isFormPending = createMutation.isPending || updateMutation.isPending;

  function handleCreate() {
    setEditingAttendance(undefined);
    setFormOpen(true);
  }

  function handleEdit(attendance: AttendanceListItem) {
    setEditingAttendance(attendance);
    setFormOpen(true);
  }

  function handleFormSubmit(data: AttendanceFormData) {
    if (editingAttendance) {
      updateMutation.mutate({
        ...data,
        id: editingAttendance.id,
      });

      return;
    }

    createMutation.mutate({
      appointmentId: data.appointmentId,
      notes: data.notes,
    });
  }

  function handleDelete() {
    if (deletingAttendance) {
      deleteMutation.mutate({ id: deletingAttendance.id });
    }
  }

  const columnHelper = createAppColumnHelper<AttendanceListItem>();
  const columns = columnHelper.columns([
    columnHelper.accessor((row) => row.appointment.startAt, {
      id: "startAt",
      header: "Agendamento",
      enableSorting: true,
      cell: ({ row }) => formatDateTime(row.original.appointment.startAt),
    }),
    columnHelper.accessor((row) => row.appointment.client.name, {
      id: "client",
      header: "Cliente",
      enableSorting: true,
    }),
    columnHelper.accessor((row) => row.appointment.professional.name, {
      id: "professional",
      header: "Profissional",
      enableSorting: true,
    }),
    columnHelper.accessor((row) => row.appointment.service.name, {
      id: "service",
      header: "Serviço",
      enableSorting: true,
    }),
    columnHelper.accessor("status", {
      header: "Status",
      enableSorting: true,
      cell: ({ getValue }) => statusLabels[getValue()],
    }),
    columnHelper.accessor("startedAt", {
      header: "Iniciado em",
      cell: ({ getValue }) => (getValue() ? formatDateTime(getValue()!) : "—"),
    }),
    columnHelper.accessor("completedAt", {
      header: "Concluído em",
      cell: ({ getValue }) => (getValue() ? formatDateTime(getValue()!) : "—"),
    }),
    columnHelper.display({
      id: "actions",
      header: "Ações",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push(`/attendances/${row.original.id}`)}
            aria-label={`Abrir atendimento de ${row.original.appointment.client.name}`}
          >
            Abrir
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => handleEdit(row.original)}
            aria-label={`Editar atendimento de ${row.original.appointment.client.name}`}
          >
            <Pencil className="size-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setDeletingAttendance(row.original)}
            aria-label={`Excluir atendimento de ${row.original.appointment.client.name}`}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    }),
  ]);

  const listContent = rangeInvalid ? (
    <p className="text-sm text-destructive">
      A data final deve ser igual ou posterior à data inicial.
    </p>
  ) : attendancesQuery.isPending && !attendancesQuery.data ? (
    <DataTableSkeleton columns={8} rows={PAGE_SIZE} />
  ) : attendancesQuery.isError && !attendancesQuery.data ? (
    <ErrorState
      title="Não foi possível carregar os atendimentos."
      description="Tente novamente. Se o problema persistir, verifique sua conexão."
      action={
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            void attendancesQuery.refetch();
          }}
        >
          Tentar novamente
        </Button>
      }
    />
  ) : attendancesQuery.data?.items.length === 0 ? (
    <EmptyState
      title={
        debouncedSearch || fromDate || toDate || status
          ? "Nenhum atendimento encontrado"
          : "Nenhum atendimento cadastrado"
      }
      description={
        debouncedSearch || fromDate || toDate || status
          ? "Tente ajustar a busca ou os filtros."
          : "Inicie um atendimento a partir de um agendamento disponível."
      }
      action={
        <Button type="button" onClick={handleCreate}>
          <Plus />
          Novo atendimento
        </Button>
      }
    />
  ) : attendancesQuery.data ? (
    <div className="relative">
      {attendancesQuery.isFetching ? (
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
          attendancesQuery.isFetching
            ? "opacity-60 transition-opacity"
            : "transition-opacity"
        }
      >
        <DataTable<AttendanceListItem>
          columns={columns}
          data={attendancesQuery.data.items}
          sorting={sorting}
          onSortingChange={setSorting}
          pagination={pagination}
          onPaginationChange={setPagination}
          rowCount={attendancesQuery.data.total}
        />
      </div>
    </div>
  ) : null;

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Acompanhe os atendimentos vinculados aos agendamentos.
          </p>
          <Button type="button" onClick={handleCreate}>
            <Plus />
            Novo atendimento
          </Button>
        </div>

        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Pesquisar cliente, profissional, serviço ou observação..."
        />

        <div className="flex flex-wrap items-end gap-3">
          <label className="space-y-1 text-xs font-medium">
            <span>De</span>
            <Input
              type="date"
              value={fromDate}
              onChange={(event) => {
                setFromDate(event.target.value);
                setPagination((current) => ({ ...current, pageIndex: 0 }));
              }}
              className="w-40"
            />
          </label>
          <label className="space-y-1 text-xs font-medium">
            <span>Até</span>
            <Input
              type="date"
              value={toDate}
              onChange={(event) => {
                setToDate(event.target.value);
                setPagination((current) => ({ ...current, pageIndex: 0 }));
              }}
              className="w-40"
            />
          </label>
          <label className="space-y-1 text-xs font-medium">
            <span>Status</span>
            <select
              value={status}
              onChange={(event) => {
                const value = event.target.value;
                setStatus(value === "" || isAttendanceStatus(value) ? value : "");
                setPagination((current) => ({ ...current, pageIndex: 0 }));
              }}
              className="h-8 min-w-40 rounded-lg border border-input bg-background px-2.5 text-sm"
            >
              <option value="">Todos</option>
              {Object.values(AttendanceStatus).map((attendanceStatus) => (
                <option key={attendanceStatus} value={attendanceStatus}>
                  {statusLabels[attendanceStatus]}
                </option>
              ))}
            </select>
          </label>
        </div>

        {listContent}
      </div>

      <CrudFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          if (isFormPending && !open) {
            return;
          }

          setFormOpen(open);
          if (!open) {
            setEditingAttendance(undefined);
          }
        }}
        title={editingAttendance ? "Editar atendimento" : "Novo atendimento"}
        description={
          editingAttendance
            ? "Atualize o agendamento, o status ou as observações."
            : "Selecione um agendamento para iniciar o atendimento."
        }
      >
        {formOpen ? (
          formOptionsQuery.isPending ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Carregando agendamentos...
            </p>
          ) : formOptionsQuery.isError ? (
            <ErrorState
              title="Não foi possível carregar os agendamentos."
              description="Tente novamente para continuar."
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
          ) : formOptionsQuery.data ? (
            <AttendanceForm
              key={editingAttendance?.id ?? "new"}
              attendance={editingAttendance}
              appointments={formOptionsQuery.data.appointments}
              isPending={isFormPending}
              onSubmit={handleFormSubmit}
              onCancel={() => {
                setFormOpen(false);
                setEditingAttendance(undefined);
              }}
            />
          ) : null
        ) : null}
      </CrudFormDialog>

      <CrudConfirmDialog
        open={deletingAttendance !== undefined}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) {
            setDeletingAttendance(undefined);
          }
        }}
        title="Excluir atendimento?"
        description={
          deletingAttendance?.hasRelatedRecords
            ? "Este atendimento possui ficha de cliente ou pagamento vinculado e não poderá ser excluído."
            : deletingAttendance
              ? `O atendimento de "${deletingAttendance.appointment.client.name}" será excluído permanentemente.`
              : "Esta operação não poderá ser desfeita."
        }
        confirmLabel={deleteMutation.isPending ? "Excluindo..." : "Excluir"}
        confirmDisabled={
          deleteMutation.isPending ||
          deletingAttendance?.hasRelatedRecords === true
        }
        onConfirm={handleDelete}
      />
    </>
  );
}
