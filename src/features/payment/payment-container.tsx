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
import { Input } from "@/components/ui/input";
import { PaymentStatus } from "@/generated/prisma/enums";
import { useListControls } from "@/hooks/use-list-controls";

import {
  createPaymentAction,
  deletePaymentAction,
  getPaymentFormOptions,
  getPayments,
  updatePaymentAction,
} from "./payment.actions";
import { PaymentForm } from "./payment-form";
import type {
  PaymentListItem,
  PaymentListQuery,
  PaymentStatusValue,
} from "./payment.query";
import type { PaymentFormData } from "./payment.schema";

type PaymentSortField = PaymentListQuery["sortBy"];

const PAGE_SIZE = 10;
const allowedSortFields: PaymentSortField[] = ["paidAt", "status", "client"];

const statusLabels: Record<keyof typeof PaymentStatus, string> = {
  PENDENTE: "Pendente",
  PAGO: "Pago",
};

function getSortingQuery(
  sorting: SortingState,
): Pick<PaymentListQuery, "sortBy" | "sortDirection"> {
  const firstSort = sorting[0];

  if (!firstSort) {
    return { sortBy: "paidAt", sortDirection: "desc" };
  }

  const sortBy = allowedSortFields.includes(firstSort.id as PaymentSortField)
    ? (firstSort.id as PaymentSortField)
    : "paidAt";

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

function isPaymentStatus(value: string): value is PaymentStatusValue {
  return Object.values(PaymentStatus).some(
    (paymentStatus) => paymentStatus === value,
  );
}

function formatDateTime(date: Date | null): string {
  if (!date) {
    return "—";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function PaymentContainer() {
  const queryClient = useQueryClient();
  const {
    search,
    debouncedSearch,
    sorting,
    pagination,
    setSearch,
    setSorting,
    setPagination,
  } = useListControls<PaymentSortField>({
    initialPageSize: PAGE_SIZE,
    debounceDelay: 400,
  });

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [status, setStatus] = useState<PaymentStatusValue | "">("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<
    PaymentListItem | undefined
  >();
  const [deletingPayment, setDeletingPayment] = useState<
    PaymentListItem | undefined
  >();

  const sortingQuery = getSortingQuery(sorting);
  const rangeInvalid = Boolean(fromDate && toDate && fromDate > toDate);
  const query: PaymentListQuery = {
    search: debouncedSearch,
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
    sortBy: sortingQuery.sortBy,
    sortDirection: sortingQuery.sortDirection,
    ...(fromDate ? { from: getLocalDayStartIso(fromDate) } : {}),
    ...(toDate ? { toExclusive: getLocalDayAfterIso(toDate) } : {}),
    ...(status ? { status } : {}),
  };

  const paymentsQuery = useQuery({
    queryKey: [
      "payments",
      query.search,
      query.page,
      query.pageSize,
      query.sortBy,
      query.sortDirection,
      query.from,
      query.toExclusive,
      query.status,
    ],
    queryFn: () => getPayments(query),
    enabled: !rangeInvalid,
    placeholderData: (previousData) => previousData,
  });

  const formOptionsQuery = useQuery({
    queryKey: ["payment-form-options", editingPayment?.id],
    queryFn: () =>
      getPaymentFormOptions(
        editingPayment ? { paymentId: editingPayment.id } : {},
      ),
    enabled: formOpen,
  });

  const createMutation = useMutation({
    mutationFn: createPaymentAction,
    onSuccess: async () => {
      toast.success("Pagamento cadastrado com sucesso.");
      setFormOpen(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["payments"] }),
        queryClient.invalidateQueries({ queryKey: ["attendances"] }),
      ]);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível cadastrar o pagamento.",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: updatePaymentAction,
    onSuccess: async () => {
      toast.success("Pagamento atualizado com sucesso.");
      setFormOpen(false);
      setEditingPayment(undefined);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["payments"] }),
        queryClient.invalidateQueries({ queryKey: ["attendances"] }),
      ]);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o pagamento.",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePaymentAction,
    onSuccess: async () => {
      toast.success("Pagamento excluído com sucesso.");
      setDeletingPayment(undefined);

      if (paymentsQuery.data?.items.length === 1 && pagination.pageIndex > 0) {
        setPagination((previous) => ({
          ...previous,
          pageIndex: previous.pageIndex - 1,
        }));
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["payments"] }),
        queryClient.invalidateQueries({ queryKey: ["attendances"] }),
      ]);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir o pagamento.",
      );
    },
  });

  const isFormPending = createMutation.isPending || updateMutation.isPending;

  function handleCreate() {
    setEditingPayment(undefined);
    setFormOpen(true);
  }

  function handleEdit(payment: PaymentListItem) {
    setEditingPayment(payment);
    setFormOpen(true);
  }

  function toActionData(data: PaymentFormData) {
    return {
      ...data,
      paidAt: data.status === "PAGO" ? new Date(data.paidAt).toISOString() : null,
    };
  }

  function handleFormSubmit(data: PaymentFormData) {
    const actionData = toActionData(data);

    if (editingPayment) {
      updateMutation.mutate({
        ...actionData,
        id: editingPayment.id,
      });
      return;
    }

    createMutation.mutate(actionData);
  }

  function handleDelete() {
    if (deletingPayment) {
      deleteMutation.mutate({ id: deletingPayment.id });
    }
  }

  const columnHelper = createAppColumnHelper<PaymentListItem>();
  const columns = columnHelper.columns([
    columnHelper.accessor("attendance.appointment.client.name", {
      id: "client",
      header: "Cliente",
      enableSorting: true,
    }),
    columnHelper.accessor("attendance.appointment.service.name", {
      id: "service",
      header: "Serviço",
      enableSorting: false,
    }),
    columnHelper.accessor("attendance.appointment.professional.name", {
      id: "professional",
      header: "Profissional",
      enableSorting: false,
    }),
    columnHelper.accessor("status", {
      header: "Status",
      enableSorting: true,
      cell: ({ getValue }) => statusLabels[getValue()],
    }),
    columnHelper.accessor("paidAt", {
      header: "Pago em",
      enableSorting: true,
      cell: ({ getValue }) => formatDateTime(getValue()),
    }),
    columnHelper.accessor("attendance.appointment.startAt", {
      id: "appointment",
      header: "Atendimento",
      enableSorting: false,
      cell: ({ getValue }) => formatDateTime(getValue()),
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
            aria-label={`Editar pagamento de ${row.original.attendance.appointment.client.name}`}
          >
            <Pencil className="size-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setDeletingPayment(row.original)}
            aria-label={`Excluir pagamento de ${row.original.attendance.appointment.client.name}`}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    }),
  ]);

  if (paymentsQuery.isPending && !paymentsQuery.data) {
    return (
      <div className="space-y-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Pesquisar pagamentos..."
        />
        <DataTableSkeleton columns={7} rows={PAGE_SIZE} />
      </div>
    );
  }

  if (paymentsQuery.isError && !paymentsQuery.data) {
    return (
      <div className="space-y-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Pesquisar pagamentos..."
        />
        <ErrorState
          title="Não foi possível carregar os pagamentos."
          description="Tente novamente. Se o problema persistir, verifique sua conexão."
          action={
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void paymentsQuery.refetch();
              }}
            >
              Tentar novamente
            </Button>
          }
        />
      </div>
    );
  }

  const data = paymentsQuery.data;

  if (!data) {
    return null;
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Gerencie pagamentos associados aos atendimentos.
          </p>
          <Button type="button" onClick={handleCreate}>
            <Plus />
            Novo pagamento
          </Button>
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Pesquisar cliente, profissional ou serviço..."
          />
          <label className="space-y-1 text-xs font-medium">
            <span>Pago a partir de</span>
            <Input
              type="date"
              value={fromDate}
              onChange={(event) => {
                setFromDate(event.target.value);
                setPagination((current) => ({ ...current, pageIndex: 0 }));
              }}
              aria-invalid={rangeInvalid}
            />
          </label>
          <label className="space-y-1 text-xs font-medium">
            <span>Pago até</span>
            <Input
              type="date"
              value={toDate}
              onChange={(event) => {
                setToDate(event.target.value);
                setPagination((current) => ({ ...current, pageIndex: 0 }));
              }}
              aria-invalid={rangeInvalid}
            />
          </label>
          <label className="space-y-1 text-xs font-medium">
            <span>Status</span>
            <select
              value={status}
              onChange={(event) => {
                const value = event.target.value;
                setStatus(value === "" || isPaymentStatus(value) ? value : "");
                setPagination((current) => ({ ...current, pageIndex: 0 }));
              }}
              className="h-8 min-w-36 rounded-lg border border-input bg-background px-2.5 text-sm"
            >
              <option value="">Todos</option>
              {Object.values(PaymentStatus).map((paymentStatus) => (
                <option key={paymentStatus} value={paymentStatus}>
                  {statusLabels[paymentStatus]}
                </option>
              ))}
            </select>
          </label>
        </div>

        {rangeInvalid ? (
          <p className="text-sm text-destructive">
            A data final deve ser igual ou posterior à data inicial.
          </p>
        ) : data.items.length === 0 ? (
          <EmptyState
            title={
              debouncedSearch || status || fromDate || toDate
                ? "Nenhum pagamento encontrado"
                : "Nenhum pagamento cadastrado"
            }
            description={
              debouncedSearch || status || fromDate || toDate
                ? "Altere a pesquisa ou os filtros para tentar novamente."
                : "Os pagamentos cadastrados serão exibidos aqui."
            }
            action={
              !debouncedSearch && !status && !fromDate && !toDate ? (
                <Button type="button" onClick={handleCreate}>
                  <Plus />
                  Novo pagamento
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="relative">
            {paymentsQuery.isFetching ? (
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
                paymentsQuery.isFetching
                  ? "opacity-60 transition-opacity"
                  : "transition-opacity"
              }
            >
              <DataTable<PaymentListItem>
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
            setEditingPayment(undefined);
          }
        }}
        title={editingPayment ? "Editar pagamento" : "Novo pagamento"}
        description={
          editingPayment
            ? "Atualize o atendimento, o status ou a data do pagamento."
            : "Associe um pagamento a um atendimento."
        }
      >
        {formOpen && formOptionsQuery.isPending ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Carregando atendimentos...
          </p>
        ) : formOpen && formOptionsQuery.isError ? (
          <ErrorState
            title="Não foi possível carregar os atendimentos."
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
        ) : formOpen && formOptionsQuery.data ? (
          <PaymentForm
            key={editingPayment?.id ?? "new"}
            payment={editingPayment}
            options={formOptionsQuery.data}
            isPending={isFormPending}
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setFormOpen(false);
              setEditingPayment(undefined);
            }}
          />
        ) : null}
      </CrudFormDialog>

      <CrudConfirmDialog
        open={deletingPayment !== undefined}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) {
            setDeletingPayment(undefined);
          }
        }}
        title="Excluir pagamento?"
        description={
          deletingPayment
            ? `O registro de pagamento de "${deletingPayment.attendance.appointment.client.name}" será excluído permanentemente.`
            : "Esta operação não poderá ser desfeita."
        }
        confirmLabel={deleteMutation.isPending ? "Excluindo..." : "Excluir"}
        confirmDisabled={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </>
  );
}
