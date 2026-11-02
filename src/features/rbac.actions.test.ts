/**
 * @vitest-environment node
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn<() => Promise<unknown>>(),
  findActor: vi.fn<() => Promise<unknown>>(),
  findClientAssignmentOptions: vi.fn(),
  findClients: vi.fn(),
  createClient: vi.fn(),
  updateClient: vi.fn(),
  deleteClient: vi.fn(),
  findServices: vi.fn(),
  createService: vi.fn(),
  updateService: vi.fn(),
  deleteService: vi.fn(),
  findProfessionals: vi.fn(),
  findProfessionalServices: vi.fn(),
  createProfessional: vi.fn(),
  updateProfessional: vi.fn(),
  deleteProfessional: vi.fn(),
  findAppointments: vi.fn(),
  findAppointmentsInRange: vi.fn(),
  findAppointmentFilterOptions: vi.fn(),
  findAppointmentFormOptions: vi.fn(),
  createAppointment: vi.fn(),
  updateAppointment: vi.fn(),
  deleteAppointment: vi.fn(),
  findAttendances: vi.fn(),
  findAttendanceWorkspace: vi.fn(),
  findAttendanceFormOptions: vi.fn(),
  createAttendance: vi.fn(),
  updateAttendance: vi.fn(),
  deleteAttendance: vi.fn(),
  findPayments: vi.fn(),
  findPaymentFormOptions: vi.fn(),
  createPayment: vi.fn(),
  updatePayment: vi.fn(),
  deletePayment: vi.fn(),
  findClientRecords: vi.fn(),
  findClientRecordFormOptions: vi.fn(),
  createClientRecord: vi.fn(),
  updateClientRecord: vi.fn(),
  deleteClientRecord: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: {
      findFirst: mocks.findActor,
    },
  },
}));

vi.mock("@/lib/logger/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("argon2", () => ({
  default: {
    hash: vi.fn(async () => "hashed-password"),
  },
}));

vi.mock("./client/client.repository", () => ({
  findClientAssignmentOptions: mocks.findClientAssignmentOptions,
  findClients: mocks.findClients,
  createClient: mocks.createClient,
  updateClient: mocks.updateClient,
  deleteClient: mocks.deleteClient,
}));

vi.mock("./service/service.repository", () => ({
  findServices: mocks.findServices,
  createService: mocks.createService,
  updateService: mocks.updateService,
  deleteService: mocks.deleteService,
}));

vi.mock("./professional/professional.repository", () => ({
  findProfessionals: mocks.findProfessionals,
  findProfessionalServices: mocks.findProfessionalServices,
  createProfessional: mocks.createProfessional,
  updateProfessional: mocks.updateProfessional,
  deleteProfessional: mocks.deleteProfessional,
}));

vi.mock("./appointment/appointment.repository", () => ({
  findAppointments: mocks.findAppointments,
  findAppointmentsInRange: mocks.findAppointmentsInRange,
  findAppointmentFilterOptions: mocks.findAppointmentFilterOptions,
  findAppointmentFormOptions: mocks.findAppointmentFormOptions,
  createAppointment: mocks.createAppointment,
  updateAppointment: mocks.updateAppointment,
  deleteAppointment: mocks.deleteAppointment,
}));

vi.mock("./attendance/attendance.repository", () => ({
  findAttendances: mocks.findAttendances,
  findAttendanceWorkspace: mocks.findAttendanceWorkspace,
  findAttendanceFormOptions: mocks.findAttendanceFormOptions,
  createAttendance: mocks.createAttendance,
  updateAttendance: mocks.updateAttendance,
  deleteAttendance: mocks.deleteAttendance,
}));

vi.mock("./payment/payment.repository", () => ({
  findPayments: mocks.findPayments,
  findPaymentFormOptions: mocks.findPaymentFormOptions,
  createPayment: mocks.createPayment,
  updatePayment: mocks.updatePayment,
  deletePayment: mocks.deletePayment,
}));

vi.mock("./client-record/client-record.repository", () => ({
  findClientRecords: mocks.findClientRecords,
  findClientRecordFormOptions: mocks.findClientRecordFormOptions,
  createClientRecord: mocks.createClientRecord,
  updateClientRecord: mocks.updateClientRecord,
  deleteClientRecord: mocks.deleteClientRecord,
}));

import {
  createClientAction,
  deleteClientAction,
  getClientAssignmentOptions,
  getClients,
  updateClientAction,
} from "./client/client.actions";
import {
  createServiceAction,
  deleteServiceAction,
  getServices,
  updateServiceAction,
} from "./service/service.actions";
import {
  createProfessionalAction,
  deleteProfessionalAction,
  getProfessionalServices,
  getProfessionals,
  updateProfessionalAction,
} from "./professional/professional.actions";
import {
  createAppointmentAction,
  deleteAppointmentAction,
  getAppointments,
  getAppointmentCalendarEvents,
  getAppointmentFilterOptions,
  getAppointmentFormOptions,
  updateAppointmentAction,
} from "./appointment/appointment.actions";
import {
  createAttendanceAction,
  deleteAttendanceAction,
  getAttendanceFormOptions,
  getAttendances,
  getAttendanceWorkspace,
  updateAttendanceAction,
} from "./attendance/attendance.actions";
import {
  createPaymentAction,
  deletePaymentAction,
  getPaymentFormOptions,
  getPayments,
  updatePaymentAction,
} from "./payment/payment.actions";
import {
  createClientRecordAction,
  deleteClientRecordAction,
  getClientRecordFormOptions,
  getClientRecords,
  updateClientRecordAction,
} from "./client-record/client-record.actions";

const tenantId = "tenant-current";
const userId = "user-current";
const professionalId = "professional-current";

function actor(role: "ADMIN" | "PROFESSIONAL") {
  return {
    id: userId,
    tenantId,
    name: "Usuário atual",
    email: "current@example.com",
    role,
    professional: role === "PROFESSIONAL" ? { id: professionalId } : null,
  };
}

const session = {
  user: {
    id: userId,
    tenantId,
  },
};

const validAppointmentInput = {
  clientId: "client-1",
  professionalId: "untrusted-professional",
  serviceId: "service-1",
  startAt: new Date("2032-04-05T10:00:00.000Z").toISOString(),
  endAt: new Date("2032-04-05T11:00:00.000Z").toISOString(),
  status: "SCHEDULED",
  origin: "MANUAL",
  notes: "",
};

describe("RBAC Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue(session);
    mocks.findActor.mockResolvedValue(actor("ADMIN"));
    mocks.findProfessionals.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 10,
      pageCount: 0,
    });
  });

  it("rejects missing sessions and users no longer present in the session tenant", async () => {
    mocks.auth.mockResolvedValueOnce(null);
    await expect(getClients({})).rejects.toThrow("Usuário não autenticado.");
    expect(mocks.findClients).not.toHaveBeenCalled();

    mocks.findActor.mockResolvedValueOnce(null);
    await expect(getClients({})).rejects.toThrow("Usuário não autenticado.");
    expect(mocks.findClients).not.toHaveBeenCalled();

    mocks.auth.mockResolvedValueOnce({
      user: { id: userId, tenantId: "tenant-other" },
    });
    mocks.findActor.mockResolvedValueOnce(null);
    await expect(getClients({})).rejects.toThrow("Usuário não autenticado.");

    expect(mocks.findActor).toHaveBeenLastCalledWith({
      where: { id: userId, tenantId: "tenant-other" },
      select: {
        id: true,
        tenantId: true,
        name: true,
        email: true,
        role: true,
        professional: { select: { id: true } },
      },
    });
  });

  it("uses the current database role and tenant, not values supplied in the session or payload", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: userId, tenantId, role: "ADMIN", professionalId: "forged" },
    });
    mocks.findActor.mockResolvedValue(actor("PROFESSIONAL"));

    await expect(
      updateClientAction({ id: "client-1", name: "Alteração" }),
    ).rejects.toThrow("Você não tem permissão");
    expect(mocks.updateClient).not.toHaveBeenCalled();

    mocks.findActor.mockResolvedValue(actor("ADMIN"));
    await createClientAction({
      name: "Cliente novo",
      tenantId: "tenant-forged",
    });
    expect(mocks.createClient).toHaveBeenCalledWith(
      tenantId,
      expect.objectContaining({ name: "Cliente novo" }),
    );
  });

  it("allows professionals to read and create clients but not edit or delete", async () => {
    mocks.findActor.mockResolvedValue(actor("PROFESSIONAL"));

    await getClients({});
    await createClientAction({
      name: "Cliente novo",
      professionalIds: ["professional-untrusted"],
    });
    await expect(
      updateClientAction({ id: "client-1", name: "Alteração" }),
    ).rejects.toThrow("Você não tem permissão");
    await expect(deleteClientAction({ id: "client-1" })).rejects.toThrow(
      "Você não tem permissão",
    );

    expect(mocks.findClients).toHaveBeenCalledWith(tenantId, expect.anything());
    expect(mocks.createClient).toHaveBeenCalledWith(
      tenantId,
      expect.objectContaining({ name: "Cliente novo" }),
    );
    expect(mocks.updateClient).not.toHaveBeenCalled();
    expect(mocks.deleteClient).not.toHaveBeenCalled();
  });

  it("allows only admins to read and change client responsibility assignments", async () => {
    await getClientAssignmentOptions({ clientId: "client-1" });
    expect(mocks.findClientAssignmentOptions).toHaveBeenCalledWith(
      tenantId,
      "client-1",
    );

    mocks.findActor.mockResolvedValue(actor("PROFESSIONAL"));
    await expect(getClientAssignmentOptions({})).rejects.toThrow(
      "Você não tem permissão",
    );
    expect(mocks.findClientAssignmentOptions).toHaveBeenCalledTimes(1);
  });

  it("allows only admins to mutate services and professionals", async () => {
    mocks.findActor.mockResolvedValue(actor("PROFESSIONAL"));

    await getServices({});
    await getProfessionals({});
    await expect(
      createServiceAction({
        name: "Serviço",
        description: "",
        duration: 30,
        price: 50,
        active: true,
      }),
    ).rejects.toThrow("Você não tem permissão");
    await expect(updateServiceAction({})).rejects.toThrow(
      "Você não tem permissão",
    );
    await expect(deleteServiceAction({})).rejects.toThrow(
      "Você não tem permissão",
    );
    await expect(createProfessionalAction({})).rejects.toThrow(
      "Você não tem permissão",
    );
    await expect(updateProfessionalAction({})).rejects.toThrow(
      "Você não tem permissão",
    );
    await expect(deleteProfessionalAction({})).rejects.toThrow(
      "Você não tem permissão",
    );
    await expect(getProfessionalServices()).rejects.toThrow(
      "Você não tem permissão",
    );

    expect(mocks.createService).not.toHaveBeenCalled();
    expect(mocks.updateService).not.toHaveBeenCalled();
    expect(mocks.deleteService).not.toHaveBeenCalled();
    expect(mocks.createProfessional).not.toHaveBeenCalled();
    expect(mocks.updateProfessional).not.toHaveBeenCalled();
    expect(mocks.deleteProfessional).not.toHaveBeenCalled();
    expect(mocks.findProfessionalServices).not.toHaveBeenCalled();
  });

  it("allows admins to use the approved client, service, and professional mutations", async () => {
    await createClientAction({
      name: "Cliente novo",
      professionalIds: ["professional-1"],
    });
    await updateClientAction({ id: "client-1", name: "Cliente atualizado" });
    await deleteClientAction({ id: "client-1" });

    await createServiceAction({
      name: "Consulta",
      description: "",
      duration: 60,
      price: 100,
      active: true,
    });
    await updateServiceAction({
      id: "service-1",
      name: "Consulta",
      description: "",
      duration: 60,
      price: 100,
      active: true,
    });
    await deleteServiceAction({ id: "service-1" });

    await createProfessionalAction({
      name: "Profissional",
      email: "professional@example.com",
      password: "password-123",
      serviceIds: ["service-1"],
    });
    await updateProfessionalAction({
      id: "professional-1",
      name: "Profissional",
      email: "professional@example.com",
      password: "",
      serviceIds: ["service-1"],
    });
    await deleteProfessionalAction({ id: "professional-1" });

    expect(mocks.createClient).toHaveBeenCalledWith(
      tenantId,
      expect.objectContaining({ name: "Cliente novo" }),
      ["professional-1"],
    );
    expect(mocks.updateClient).toHaveBeenCalledTimes(1);
    expect(mocks.deleteClient).toHaveBeenCalledTimes(1);
    expect(mocks.createService).toHaveBeenCalledTimes(1);
    expect(mocks.updateService).toHaveBeenCalledTimes(1);
    expect(mocks.deleteService).toHaveBeenCalledTimes(1);
    expect(mocks.createProfessional).toHaveBeenCalledTimes(1);
    expect(mocks.updateProfessional).toHaveBeenCalledTimes(1);
    expect(mocks.deleteProfessional).toHaveBeenCalledTimes(1);
  });

  it("forces the current professional scope in appointment actions", async () => {
    mocks.findActor.mockResolvedValue(actor("PROFESSIONAL"));

    await getAppointments({});
    await createAppointmentAction(validAppointmentInput);
    await updateAppointmentAction({ id: "appointment-1", ...validAppointmentInput });
    await deleteAppointmentAction({ id: "appointment-1" });

    expect(mocks.findAppointments).toHaveBeenCalledWith(
      tenantId,
      expect.anything(),
      professionalId,
    );
    expect(mocks.createAppointment).toHaveBeenCalledWith(
      tenantId,
      expect.objectContaining({ professionalId: "untrusted-professional" }),
      professionalId,
    );
    expect(mocks.updateAppointment).toHaveBeenCalledWith(
      tenantId,
      expect.objectContaining({ professionalId: professionalId }),
      professionalId,
    );
    expect(mocks.deleteAppointment).toHaveBeenCalledWith(
      tenantId,
      "appointment-1",
      professionalId,
    );
  });

  it("keeps admin appointment, attendance, and payment queries tenant-wide", async () => {
    await getAppointments({});
    await getAppointmentCalendarEvents({
      from: "2032-04-05T00:00:00.000Z",
      toExclusive: "2032-04-06T00:00:00.000Z",
    });
    await getAppointmentFilterOptions();
    await getAppointmentFormOptions();
    await getAttendances({});
    await getAttendanceWorkspace({ id: "attendance-1" });
    await getAttendanceFormOptions({});
    await getPayments({});
    await getPaymentFormOptions({});

    expect(mocks.findAppointments).toHaveBeenCalledWith(
      tenantId,
      expect.anything(),
      undefined,
    );
    expect(mocks.findAppointmentsInRange).toHaveBeenCalledWith(
      tenantId,
      expect.anything(),
      undefined,
    );
    expect(mocks.findAppointmentFilterOptions).toHaveBeenCalledWith(
      tenantId,
      undefined,
    );
    expect(mocks.findAppointmentFormOptions).toHaveBeenCalledWith(
      tenantId,
      undefined,
    );
    expect(mocks.findAttendances).toHaveBeenCalledWith(
      tenantId,
      expect.anything(),
      undefined,
    );
    expect(mocks.findAttendanceWorkspace).toHaveBeenCalledWith(
      tenantId,
      "attendance-1",
      undefined,
    );
    expect(mocks.findAttendanceFormOptions).toHaveBeenCalledWith(
      tenantId,
      undefined,
      undefined,
    );
    expect(mocks.findPayments).toHaveBeenCalledWith(
      tenantId,
      expect.anything(),
      undefined,
    );
    expect(mocks.findPaymentFormOptions).toHaveBeenCalledWith(
      tenantId,
      undefined,
      undefined,
    );
  });

  it("forces the current professional scope in attendance and payment actions", async () => {
    mocks.findActor.mockResolvedValue(actor("PROFESSIONAL"));

    await getAttendances({});
    await getAttendanceWorkspace({ id: "attendance-1" });
    await createAttendanceAction({ appointmentId: "appointment-1", notes: "" });
    await updateAttendanceAction({
      id: "attendance-1",
      appointmentId: "appointment-1",
      status: "IN_PROGRESS",
      notes: "",
    });
    await deleteAttendanceAction({ id: "attendance-1" });

    await getPayments({});
    await createPaymentAction({
      attendanceId: "attendance-1",
      status: "PENDENTE",
      paidAt: null,
    });
    await updatePaymentAction({
      id: "payment-1",
      attendanceId: "attendance-1",
      status: "PENDENTE",
      paidAt: null,
    });
    await deletePaymentAction({ id: "payment-1" });

    expect(mocks.findAttendances).toHaveBeenCalledWith(
      tenantId,
      expect.anything(),
      professionalId,
    );
    expect(mocks.findAttendanceWorkspace).toHaveBeenCalledWith(
      tenantId,
      "attendance-1",
      professionalId,
    );
    expect(mocks.createAttendance).toHaveBeenCalledWith(
      tenantId,
      expect.objectContaining({ appointmentId: "appointment-1" }),
      professionalId,
    );
    expect(mocks.updateAttendance).toHaveBeenCalledWith(
      tenantId,
      expect.objectContaining({ id: "attendance-1" }),
      professionalId,
    );
    expect(mocks.deleteAttendance).toHaveBeenCalledWith(
      tenantId,
      "attendance-1",
      professionalId,
    );
    expect(mocks.findPayments).toHaveBeenCalledWith(
      tenantId,
      expect.anything(),
      professionalId,
    );
    expect(mocks.createPayment).toHaveBeenCalledWith(
      tenantId,
      expect.objectContaining({ attendanceId: "attendance-1" }),
      professionalId,
    );
    expect(mocks.updatePayment).toHaveBeenCalledWith(
      tenantId,
      expect.objectContaining({ id: "payment-1" }),
      professionalId,
    );
    expect(mocks.deletePayment).toHaveBeenCalledWith(
      tenantId,
      "payment-1",
      professionalId,
    );
  });

  it("scopes professional clinical actions to their assigned clients", async () => {
    mocks.findActor.mockResolvedValue(actor("PROFESSIONAL"));

    await getClientRecords({});
    await getClientRecordFormOptions({ clientId: "client-1" });
    await createClientRecordAction({
      clientId: "client-1",
      attendanceId: "",
      content: "Registro",
    });
    await updateClientRecordAction({
      id: "record-1",
      clientId: "client-1",
      attendanceId: "",
      content: "Registro atualizado",
    });
    await deleteClientRecordAction({ id: "record-1" });

    expect(mocks.findClientRecords).toHaveBeenCalledWith(
      tenantId,
      expect.anything(),
      professionalId,
    );
    expect(mocks.findClientRecordFormOptions).toHaveBeenCalledWith(
      tenantId,
      "client-1",
      professionalId,
    );
    expect(mocks.createClientRecord).toHaveBeenCalledWith(
      tenantId,
      expect.objectContaining({ clientId: "client-1" }),
      professionalId,
      { professionalId, name: "Usuário atual" },
    );
    expect(mocks.updateClientRecord).toHaveBeenCalledWith(
      tenantId,
      expect.objectContaining({ id: "record-1" }),
      professionalId,
    );
    expect(mocks.deleteClientRecord).toHaveBeenCalledWith(
      tenantId,
      "record-1",
      professionalId,
    );
  });

  it("keeps all clinical-record operations available to admins within their tenant", async () => {
    await getClientRecords({});
    await getClientRecordFormOptions({});
    await createClientRecordAction({
      clientId: "client-1",
      attendanceId: "",
      content: "Registro",
    });
    await updateClientRecordAction({
      id: "record-1",
      clientId: "client-1",
      attendanceId: "",
      content: "Registro atualizado",
    });
    await deleteClientRecordAction({ id: "record-1" });

    expect(mocks.findClientRecords).toHaveBeenCalledWith(
      tenantId,
      expect.anything(),
      undefined,
    );
    expect(mocks.findClientRecordFormOptions).toHaveBeenCalledWith(
      tenantId,
      undefined,
      undefined,
    );
    expect(mocks.createClientRecord).toHaveBeenCalledWith(
      tenantId,
      expect.objectContaining({ clientId: "client-1" }),
      undefined,
      undefined,
    );
    expect(mocks.updateClientRecord).toHaveBeenCalledWith(
      tenantId,
      expect.objectContaining({ id: "record-1" }),
      undefined,
    );
    expect(mocks.deleteClientRecord).toHaveBeenCalledWith(
      tenantId,
      "record-1",
      undefined,
    );
  });
});
