"use client";

import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SortingState } from "@tanstack/react-table";
import { CalendarDays, List, Pencil, Plus, Trash2 } from "lucide-react";
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
import { createAttendanceAction } from "@/features/attendance/attendance.actions";
import { AppointmentOrigin, AppointmentStatus } from "@/generated/prisma/enums";
import { useListControls } from "@/hooks/use-list-controls";

import {
  createAppointmentAction,
  deleteAppointmentAction,
  getAppointmentFilterOptions,
  getAppointmentFormOptions,
  getAppointments,
  updateAppointmentAction,
} from "./appointment.actions";
import { AppointmentCalendar } from "./appointment-calendar";
import type {
  AppointmentListItem,
  AppointmentListQuery,
  AppointmentStatusValue,
} from "./appointment.query";
import { AppointmentForm } from "./appointment-form";
import type { AppointmentFormData } from "./appointment.schema";

type AppointmentSortField = AppointmentListQuery["sortBy"];

const PAGE_SIZE = 10;
const allowedSortFields: AppointmentSortField[] = [
  "startAt",
  "status",
  "client",
  "professional",
  "service",
  "createdAt",
];

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

const filterSelectClassName =
  "h-8 min-w-40 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function getSortingQuery(
  sorting: SortingState,
): Pick<AppointmentListQuery, "sortBy" | "sortDirection"> {
  const firstSort = sorting[0];

  if (!firstSort) {
    return { sortBy: "startAt", sortDirection: "asc" };
  }

  const sortBy = allowedSortFields.includes(firstSort.id as AppointmentSortField)
    ? (firstSort.id as AppointmentSortField)
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

function isAppointmentStatus(value: string): value is AppointmentStatusValue {
  return Object.values(AppointmentStatus).some(
    (appointmentStatus) => appointmentStatus === value,
  );
}

function toMutationInput(data: AppointmentFormData) {
  return {
    ...data,
    startAt: new Date(data.startAt).toISOString(),
    endAt: new Date(data.endAt).toISOString(),
  };
}

function formatAppointmentDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function AppointmentContainer() {
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
  } = useListControls<AppointmentSortField>({
    initialPageSize: PAGE_SIZE,
    debounceDelay: 400,
  });

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [professionalId, setProfessionalId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [status, setStatus] = useState<AppointmentStatusValue | "">("");
  const [view, setView] = useState<"table" | "calendar">("table");
  const [formOpen, setFormOpen] = useState(false);
  const [newAppointmentSlot, setNewAppointmentSlot] = useState<
    { startAt: Date; endAt: Date } | undefined
  >();
  const [editingAppointment, setEditingAppointment] = useState<
    AppointmentListItem | undefined
  >();
  const [deletingAppointment, setDeletingAppointment] = useState<
    AppointmentListItem | undefined
  >();

  const sortingQuery = getSortingQuery(sorting);
  const rangeInvalid = Boolean(fromDate && toDate && fromDate > toDate);
  const query: AppointmentListQuery = {
    search: debouncedSearch,
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
    sortBy: sortingQuery.sortBy,
    sortDirection: sortingQuery.sortDirection,
    ...(fromDate ? { from: getLocalDayStartIso(fromDate) } : {}),
    ...(toDate ? { toExclusive: getLocalDayAfterIso(toDate) } : {}),
    ...(professionalId ? { professionalId } : {}),
    ...(serviceId ? { serviceId } : {}),
    ...(status ? { status } : {}),
  };

  const appointmentsQuery = useQuery({
    queryKey: [
      "appointments",
      query.search,
      query.page,
      query.pageSize,
      query.sortBy,
      query.sortDirection,
      query.from,
      query.toExclusive,
      query.professionalId,
      query.serviceId,
      query.status,
    ],
    queryFn: () => getAppointments(query),
    enabled: view === "table" && !rangeInvalid,
    placeholderData: (previousData) => previousData,
  });

  const filterOptionsQuery = useQuery({
    queryKey: ["appointment-filter-options"],
    queryFn: getAppointmentFilterOptions,
  });

  const formOptionsQuery = useQuery({
    queryKey: ["appointment-form-options"],
    queryFn: getAppointmentFormOptions,
    enabled: formOpen,
  });

  const createMutation = useMutation({
    mutationFn: createAppointmentAction,
    onSuccess: async () => {
      toast.success("Agendamento cadastrado com sucesso.");
      setFormOpen(false);

      await queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível cadastrar o agendamento.",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateAppointmentAction,
    onSuccess: async () => {
      toast.success("Agendamento atualizado com sucesso.");
      setFormOpen(false);
      setEditingAppointment(undefined);

      await queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o agendamento.",
      );
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({
      appointment,
      status,
    }: {
      appointment: AppointmentListItem;
      status: AppointmentStatusValue;
    }) =>
      updateAppointmentAction({
        id: appointment.id,
        clientId: appointment.client.id,
        professionalId: appointment.professional.id,
        serviceId: appointment.service.id,
        startAt: appointment.startAt.toISOString(),
        endAt: appointment.endAt.toISOString(),
        status,
        origin: appointment.origin,
        notes: appointment.notes ?? "",
      }),
    onSuccess: async () => {
      toast.success("Status do agendamento atualizado.");
      await queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o status do agendamento.",
      );
    },
  });

  const startAttendanceMutation = useMutation({
    mutationFn: createAttendanceAction,
    onSuccess: async (attendanceId) => {
      toast.success("Atendimento iniciado com sucesso.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["appointments"] }),
        queryClient.invalidateQueries({ queryKey: ["attendances"] }),
      ]);
      router.push(`/attendances/${attendanceId}`);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível iniciar o atendimento.",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAppointmentAction,
    onSuccess: async () => {
      toast.success("Agendamento excluído com sucesso.");
      setDeletingAppointment(undefined);

      if (
        appointmentsQuery.data?.items.length === 1 &&
        pagination.pageIndex > 0
      ) {
        setPagination((previous) => ({
          ...previous,
          pageIndex: previous.pageIndex - 1,
        }));
      }

      await queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir o agendamento.",
      );
    },
  });

  const isFormPending = createMutation.isPending || updateMutation.isPending;

  function handleCreate() {
    setEditingAppointment(undefined);
    setNewAppointmentSlot(undefined);
    setFormOpen(true);
  }

  function handleCreateFromSlot(selection: { startAt: Date; endAt: Date }) {
    setEditingAppointment(undefined);
    setNewAppointmentSlot(selection);
    setFormOpen(true);
  }

  function handleEdit(appointment: AppointmentListItem) {
    setEditingAppointment(appointment);
    setNewAppointmentSlot(undefined);
    setFormOpen(true);
  }

  function handleFormSubmit(data: AppointmentFormData) {
    const mutationInput = toMutationInput(data);

    if (editingAppointment) {
      updateMutation.mutate({
        id: editingAppointment.id,
        ...mutationInput,
      });

      return;
    }

    createMutation.mutate(mutationInput);
  }

  function handleDelete() {
    if (!deletingAppointment) {
      return;
    }

    deleteMutation.mutate({ id: deletingAppointment.id });
  }

  async function handleStatusChange(
    appointment: AppointmentListItem,
    nextStatus: AppointmentStatusValue,
  ): Promise<boolean> {
    return updateStatusMutation
      .mutateAsync({ appointment, status: nextStatus })
      .then(
        () => true,
        () => false,
      );
  }

  function handleStartAttendance(appointment: AppointmentListItem) {
    if (appointment.attendanceId) {
      router.push(`/attendances/${appointment.attendanceId}`);
      return;
    }

    if (appointment.status === "CANCELLED" || startAttendanceMutation.isPending) {
      return;
    }

    startAttendanceMutation.mutate({
      appointmentId: appointment.id,
      notes: "",
    });
  }

  function handleOpenAttendance(appointment: AppointmentListItem) {
    if (appointment.attendanceId) {
      router.push(`/attendances/${appointment.attendanceId}`);
    }
  }

  const columnHelper = createAppColumnHelper<AppointmentListItem>();
  const columns = columnHelper.columns([
    columnHelper.accessor("startAt", {
      header: "Data e horário",
      enableSorting: true,
      cell: ({ row }) =>
        `${formatAppointmentDate(row.original.startAt)} – ${new Intl.DateTimeFormat(
          "pt-BR",
          { timeStyle: "short" },
        ).format(row.original.endAt)}`,
    }),
    columnHelper.accessor((row) => row.client.name, {
      id: "client",
      header: "Cliente",
      enableSorting: true,
    }),
    columnHelper.accessor((row) => row.professional.name, {
      id: "professional",
      header: "Profissional",
      enableSorting: true,
    }),
    columnHelper.accessor((row) => row.service.name, {
      id: "service",
      header: "Serviço",
      enableSorting: true,
    }),
    columnHelper.accessor("status", {
      header: "Status",
      enableSorting: true,
      cell: ({ getValue }) => statusLabels[getValue()],
    }),
    columnHelper.accessor("origin", {
      header: "Origem",
      cell: ({ getValue }) => originLabels[getValue()],
    }),
    columnHelper.display({
      id: "actions",
      header: "Ações",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          {row.original.attendanceId ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleOpenAttendance(row.original)}
            >
              Abrir atendimento
            </Button>
          ) : row.original.status !== "CANCELLED" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={startAttendanceMutation.isPending}
              onClick={() => handleStartAttendance(row.original)}
            >
              Iniciar atendimento
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => handleEdit(row.original)}
            aria-label={`Editar agendamento de ${row.original.client.name}`}
          >
            <Pencil className="size-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setDeletingAppointment(row.original)}
            aria-label={`Excluir agendamento de ${row.original.client.name}`}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    }),
  ]);

  const filters = filterOptionsQuery.data;
  const listContent = rangeInvalid ? (
    <p className="text-sm text-destructive">
      A data final deve ser igual ou posterior à data inicial.
    </p>
  ) : appointmentsQuery.isPending && !appointmentsQuery.data ? (
    <DataTableSkeleton columns={7} rows={PAGE_SIZE} />
  ) : appointmentsQuery.isError && !appointmentsQuery.data ? (
    <ErrorState
      title="Não foi possível carregar os agendamentos."
      description="Tente novamente. Se o problema persistir, verifique sua conexão."
      action={
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            void appointmentsQuery.refetch();
          }}
        >
          Tentar novamente
        </Button>
      }
    />
  ) : appointmentsQuery.data?.items.length === 0 ? (
    <EmptyState
      title={
        debouncedSearch || fromDate || toDate || professionalId || serviceId || status
          ? "Nenhum agendamento encontrado"
          : "Nenhum agendamento cadastrado"
      }
      description={
        debouncedSearch || fromDate || toDate || professionalId || serviceId || status
          ? "Tente ajustar a busca ou os filtros."
          : "Cadastre o primeiro agendamento para começar."
      }
      action={
        <Button type="button" onClick={handleCreate}>
          <Plus />
          Novo agendamento
        </Button>
      }
    />
  ) : appointmentsQuery.data ? (
    <div className="relative">
      {appointmentsQuery.isFetching ? (
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
          appointmentsQuery.isFetching
            ? "opacity-60 transition-opacity"
            : "transition-opacity"
        }
      >
        <DataTable<AppointmentListItem>
          columns={columns}
          data={appointmentsQuery.data.items}
          sorting={sorting}
          onSortingChange={setSorting}
          pagination={pagination}
          onPaginationChange={setPagination}
          rowCount={appointmentsQuery.data.total}
        />
      </div>
    </div>
  ) : null;

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Consulte e gerencie os agendamentos do tenant.
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={view === "table" ? "default" : "outline"}
              aria-pressed={view === "table"}
              onClick={() => setView("table")}
            >
              <List />
              Tabela
            </Button>
            <Button
              type="button"
              variant={view === "calendar" ? "default" : "outline"}
              aria-pressed={view === "calendar"}
              onClick={() => setView("calendar")}
            >
              <CalendarDays />
              Calendário
            </Button>
            <Button type="button" onClick={handleCreate}>
              <Plus />
              Novo agendamento
            </Button>
          </div>
        </div>

        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Pesquisar cliente, profissional, serviço ou observação..."
        />

        <div className="flex flex-wrap items-end gap-3">
          {view === "table" ? (
            <>
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
            </>
          ) : null}

          <label className="space-y-1 text-xs font-medium">
            <span>Profissional</span>
            <select
              value={professionalId}
              onChange={(event) => {
                setProfessionalId(event.target.value);
                setPagination((current) => ({ ...current, pageIndex: 0 }));
              }}
              className={filterSelectClassName}
            >
              <option value="">Todos</option>
              {filters?.professionals.map((professional) => (
                <option key={professional.id} value={professional.id}>
                  {professional.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-xs font-medium">
            <span>Serviço</span>
            <select
              value={serviceId}
              onChange={(event) => {
                setServiceId(event.target.value);
                setPagination((current) => ({ ...current, pageIndex: 0 }));
              }}
              className={filterSelectClassName}
            >
              <option value="">Todos</option>
              {filters?.services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-xs font-medium">
            <span>Status</span>
            <select
              value={status}
              onChange={(event) => {
                const value = event.target.value;
                setStatus(value === "" || isAppointmentStatus(value) ? value : "");
                setPagination((current) => ({ ...current, pageIndex: 0 }));
              }}
              className={filterSelectClassName}
            >
              <option value="">Todos</option>
              {Object.values(AppointmentStatus).map((appointmentStatus) => (
                <option key={appointmentStatus} value={appointmentStatus}>
                  {statusLabels[appointmentStatus]}
                </option>
              ))}
            </select>
          </label>
        </div>

        {filterOptionsQuery.isError ? (
          <ErrorState
            title="Não foi possível carregar os filtros."
            description="Tente novamente para carregar profissionais e serviços."
            action={
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  void filterOptionsQuery.refetch();
                }}
              >
                Tentar novamente
              </Button>
            }
          />
        ) : null}

        {view === "table" ? (
          listContent
        ) : (
          <AppointmentCalendar
            search={debouncedSearch}
            professionalId={professionalId}
            serviceId={serviceId}
            status={status}
            onSelectSlot={handleCreateFromSlot}
            onStatusChange={handleStatusChange}
            onStartAttendance={handleStartAttendance}
            onOpenAttendance={handleOpenAttendance}
            isStatusPending={updateStatusMutation.isPending}
            isStartingAttendance={startAttendanceMutation.isPending}
          />
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
            setEditingAppointment(undefined);
            setNewAppointmentSlot(undefined);
          }
        }}
        title={editingAppointment ? "Editar agendamento" : "Novo agendamento"}
        description={
          editingAppointment
            ? "Atualize os dados do agendamento."
            : "Informe o cliente, profissional, serviço e horário."
        }
      >
        {formOpen ? (
          formOptionsQuery.isPending ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Carregando opções...
            </p>
          ) : formOptionsQuery.isError ? (
            <ErrorState
              title="Não foi possível carregar as opções do formulário."
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
            <AppointmentForm
              key={
                editingAppointment?.id ??
                `${newAppointmentSlot?.startAt.toISOString() ?? "new"}-${newAppointmentSlot?.endAt.toISOString() ?? ""}`
              }
              appointment={editingAppointment}
              initialStartAt={newAppointmentSlot?.startAt}
              initialEndAt={newAppointmentSlot?.endAt}
              clients={formOptionsQuery.data.clients}
              professionals={formOptionsQuery.data.professionals}
              services={formOptionsQuery.data.services}
              canChooseProfessional={formOptionsQuery.data.canChooseProfessional}
              isPending={isFormPending}
              onSubmit={handleFormSubmit}
              onCancel={() => {
                setFormOpen(false);
                setEditingAppointment(undefined);
                setNewAppointmentSlot(undefined);
              }}
            />
          ) : null
        ) : null}
      </CrudFormDialog>

      <CrudConfirmDialog
        open={deletingAppointment !== undefined}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) {
            setDeletingAppointment(undefined);
          }
        }}
        title="Excluir agendamento?"
        description={
          deletingAppointment?.hasAttendance
            ? "Este agendamento possui atendimento vinculado e não poderá ser excluído."
            : deletingAppointment
              ? `O agendamento de "${deletingAppointment.client.name}" será excluído permanentemente.`
              : "Esta operação não poderá ser desfeita."
        }
        confirmLabel={deleteMutation.isPending ? "Excluindo..." : "Excluir"}
        confirmDisabled={
          deleteMutation.isPending || deletingAppointment?.hasAttendance === true
        }
        onConfirm={handleDelete}
      />
    </>
  );
}
