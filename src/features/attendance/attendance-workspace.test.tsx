/**
 * @vitest-environment jsdom
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AttendanceWorkspace } from "./attendance.query";
import { AttendanceWorkspace as AttendanceWorkspaceView } from "./attendance-workspace";

const actions = vi.hoisted(() => ({
  getAttendanceWorkspace: vi.fn(),
  getAttendanceFormOptions: vi.fn(),
  updateAttendanceAction: vi.fn(),
  completeAttendanceAction: vi.fn(),
  createClientRecordAction: vi.fn(),
  getClientRecordFormOptions: vi.fn(),
}));

vi.mock("./attendance.actions", () => ({
  getAttendanceWorkspace: actions.getAttendanceWorkspace,
  getAttendanceFormOptions: actions.getAttendanceFormOptions,
  updateAttendanceAction: actions.updateAttendanceAction,
  completeAttendanceAction: actions.completeAttendanceAction,
}));

vi.mock("@/features/client-record/client-record.actions", () => ({
  createClientRecordAction: actions.createClientRecordAction,
  getClientRecordFormOptions: actions.getClientRecordFormOptions,
}));

const workspace: AttendanceWorkspace = {
  id: "attendance-current",
  canCreateClientRecord: true,
  status: "IN_PROGRESS",
  startedAt: new Date("2032-04-05T10:00:00.000Z"),
  completedAt: null,
  notes: "Observação atual",
  appointment: {
    id: "appointment-current",
    startAt: new Date("2032-04-05T10:00:00.000Z"),
    endAt: new Date("2032-04-05T11:00:00.000Z"),
    status: "CONFIRMED",
    notes: null,
    client: {
      id: "client-1",
      name: "Ana Cliente",
      email: "ana@example.com",
      phone: "11999999999",
    },
    professional: { id: "professional-1", name: "Bruno Profissional" },
    service: { id: "service-1", name: "Corte", duration: 60, price: 50 },
  },
  history: [
    {
      id: "attendance-previous",
      status: "COMPLETED",
      startedAt: new Date("2032-03-05T10:00:00.000Z"),
      completedAt: new Date("2032-03-05T11:00:00.000Z"),
      notes: "Observação anterior",
      appointment: {
        startAt: new Date("2032-03-05T10:00:00.000Z"),
        endAt: new Date("2032-03-05T11:00:00.000Z"),
        status: "CONFIRMED",
        professional: { name: "Bruno Profissional" },
        service: { name: "Corte anterior" },
      },
    },
  ],
  clientRecords: [
    {
      id: "record-1",
      content: "Conteúdo confidencial do prontuário",
      authorName: "Bruno Profissional",
      createdAt: new Date("2032-03-05T11:00:00.000Z"),
      updatedAt: new Date("2032-03-05T11:00:00.000Z"),
      attendance: null,
    },
  ],
};

function renderWorkspace() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AttendanceWorkspaceView attendanceId={workspace.id} />
    </QueryClientProvider>,
  );
}

describe("Attendance workspace", () => {
  beforeEach(() => {
    actions.getAttendanceWorkspace.mockReset();
    actions.getAttendanceWorkspace.mockResolvedValue(workspace);
    actions.getAttendanceFormOptions.mockReset();
    actions.getAttendanceFormOptions.mockResolvedValue({
      appointments: [
        {
          id: "appointment-current",
          startAt: new Date("2032-04-05T10:00:00.000Z"),
          endAt: new Date("2032-04-05T11:00:00.000Z"),
          clientName: "Ana Cliente",
          professionalName: "Bruno Profissional",
          serviceName: "Corte",
        },
      ],
    });
    actions.updateAttendanceAction.mockReset().mockResolvedValue(undefined);
    actions.completeAttendanceAction.mockReset().mockResolvedValue(undefined);
    actions.createClientRecordAction.mockReset().mockResolvedValue(undefined);
    actions.getClientRecordFormOptions.mockReset().mockResolvedValue({
      clients: [{ id: "client-1", name: "Ana Cliente" }],
      attendances: [
        {
          id: "attendance-current",
          status: "IN_PROGRESS",
          startAt: new Date("2032-04-05T10:00:00.000Z"),
          professionalName: "Bruno Profissional",
          serviceName: "Corte",
        },
      ],
    });
  });

  it("shows attendance details and expandable client history and records", async () => {
    renderWorkspace();

    const attendancePanel = await screen.findByRole("tabpanel", {
      name: "Atendimento",
    });
    expect(within(attendancePanel).getByText("Bruno Profissional")).toBeTruthy();
    expect(within(attendancePanel).getByText("Observação atual")).toBeTruthy();

    fireEvent.click(screen.getByRole("tab", { name: "Histórico" }));
    const historySummary = await screen.findByText(/Corte anterior/);
    const historyDetails = historySummary.closest("details");
    if (!(historyDetails instanceof HTMLDetailsElement)) {
      throw new Error("O histórico deve ser expansível.");
    }

    fireEvent.click(historySummary);
    await waitFor(() => expect(historyDetails.open).toBe(true));
    expect(screen.getByText("Observação anterior")).toBeTruthy();
    fireEvent.click(historySummary);
    await waitFor(() => expect(historyDetails.open).toBe(false));

    fireEvent.click(screen.getByRole("tab", { name: "Prontuário" }));
    const recordSummary = await screen.findByText(/Registro de/);
    const recordDetails = recordSummary.closest("details");
    if (!(recordDetails instanceof HTMLDetailsElement)) {
      throw new Error("O registro do cliente deve ser expansível.");
    }

    fireEvent.click(recordSummary);
    await waitFor(() => expect(recordDetails.open).toBe(true));
    expect(screen.getByText("Conteúdo confidencial do prontuário")).toBeTruthy();
    fireEvent.click(recordSummary);
    await waitFor(() => expect(recordDetails.open).toBe(false));
    expect(
      screen.getByRole("button", { name: "Editar atendimento" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Concluir atendimento" }),
    ).toBeTruthy();
    expect(actions.getAttendanceWorkspace).toHaveBeenCalledWith({
      id: workspace.id,
    });
  });

  it("updates attendance through the existing form", async () => {
    renderWorkspace();

    fireEvent.click(
      await screen.findByRole("button", { name: "Editar atendimento" }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Salvar alterações" }),
    );

    await waitFor(() => {
      expect(actions.updateAttendanceAction).toHaveBeenCalledWith({
        id: workspace.id,
        appointmentId: workspace.appointment.id,
        status: workspace.status,
        notes: workspace.notes,
      }, expect.anything());
    });
  });

  it("creates a client record linked to the workspace client and attendance", async () => {
    renderWorkspace();

    fireEvent.click(await screen.findByRole("tab", { name: "Prontuário" }));
    fireEvent.click(await screen.findByRole("button", { name: "Criar ficha" }));
    fireEvent.change(
      await screen.findByPlaceholderText("Conteúdo da ficha do cliente"),
      { target: { value: "Novo registro clínico" } },
    );
    fireEvent.click(await screen.findByRole("button", { name: "Cadastrar" }));

    await waitFor(() => {
      expect(actions.createClientRecordAction).toHaveBeenCalledWith({
        clientId: workspace.appointment.client.id,
        attendanceId: workspace.id,
        content: "Novo registro clínico",
      }, expect.anything());
    });
  });

  it("completes an in-progress attendance and offers the associated payment", async () => {
    renderWorkspace();

    fireEvent.click(
      await screen.findByRole("button", { name: "Concluir atendimento" }),
    );
    fireEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "Concluir atendimento",
      }),
    );

    await waitFor(() => {
      expect(actions.completeAttendanceAction).toHaveBeenCalledWith({
        id: workspace.id,
      }, expect.anything());
    });
    expect(
      await screen.findByRole("link", { name: "Acessar pagamento" }),
    ).toHaveAttribute(
      "href",
      `/payments?attendanceId=${workspace.id}`,
    );
  });

  it("shows an empty state when the attendance is unavailable", async () => {
    actions.getAttendanceWorkspace.mockResolvedValue(null);
    renderWorkspace();

    expect(await screen.findByText("Atendimento não encontrado")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Voltar para atendimentos" }),
    ).toBeTruthy();
  });
});
