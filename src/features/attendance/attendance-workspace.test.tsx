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

const { getAttendanceWorkspace } = vi.hoisted(() => ({
  getAttendanceWorkspace: vi.fn(),
}));

vi.mock("./attendance.actions", () => ({
  getAttendanceWorkspace,
}));

const workspace: AttendanceWorkspace = {
  id: "attendance-current",
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
    getAttendanceWorkspace.mockReset();
    getAttendanceWorkspace.mockResolvedValue(workspace);
  });

  it("shows attendance details and expandable client history and records without mutation controls", async () => {
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
    expect(screen.queryByRole("button", { name: /editar|excluir/i })).toBeNull();
    expect(getAttendanceWorkspace).toHaveBeenCalledWith({ id: workspace.id });
  });

  it("shows an empty state when the attendance is unavailable", async () => {
    getAttendanceWorkspace.mockResolvedValue(null);
    renderWorkspace();

    expect(await screen.findByText("Atendimento não encontrado")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Voltar para atendimentos" }),
    ).toBeTruthy();
  });
});
