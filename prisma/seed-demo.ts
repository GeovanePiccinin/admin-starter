import argon2 from "argon2";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../src/generated/prisma/client";

import { assertEnvironmentDatabase } from "../src/lib/db/database-target";
import { verifyLiveDatabase } from "../scripts/lib/verify-live-database";

const tenantId = "development-tenant";
const tenantName = "Empresa de Demonstração";

const professionalDefinitions = [
  {
    userId: "seed-user-professional-1",
    professionalId: "seed-professional-1",
    name: "Mariana Costa",
    email: "mariana@example.com",
  },
  {
    userId: "seed-user-professional-2",
    professionalId: "seed-professional-2",
    name: "Rafael Oliveira",
    email: "rafael@example.com",
  },
  {
    userId: "seed-user-professional-3",
    professionalId: "seed-professional-3",
    name: "Camila Santos",
    email: "camila@example.com",
  },
] as const;

const serviceDefinitions = [
  {
    id: "seed-service-consulta",
    name: "Consulta inicial",
    description: "Primeira consulta e avaliação do cliente.",
    duration: 60,
    price: "150.00",
    active: true,
  },
  {
    id: "seed-service-retorno",
    name: "Consulta de retorno",
    description: "Acompanhamento de consulta anterior.",
    duration: 30,
    price: "80.00",
    active: true,
  },
  {
    id: "seed-service-avaliacao",
    name: "Avaliação completa",
    description: "Avaliação detalhada e planejamento.",
    duration: 90,
    price: "220.00",
    active: true,
  },
  {
    id: "seed-service-sessao",
    name: "Sessão individual",
    description: "Sessão de acompanhamento individual.",
    duration: 50,
    price: "130.00",
    active: true,
  },
  {
    id: "seed-service-antigo",
    name: "Serviço desativado",
    description: "Serviço mantido para histórico.",
    duration: 30,
    price: "60.00",
    active: false,
  },
] as const;

const clientDefinitions = [
  ["seed-client-1", "Ana Souza", "ana@example.com", "31990000001"],
  ["seed-client-2", "Bruno Lima", "bruno@example.com", "31990000002"],
  ["seed-client-3", "Carla Mendes", "carla@example.com", "31990000003"],
  ["seed-client-4", "Daniel Ferreira", "daniel@example.com", "31990000004"],
  ["seed-client-5", "Eduarda Alves", "eduarda@example.com", "31990000005"],
  ["seed-client-6", "Felipe Martins", "felipe@example.com", "31990000006"],
  ["seed-client-7", "Gabriela Rocha", "gabriela@example.com", "31990000007"],
  ["seed-client-8", "Henrique Castro", "henrique@example.com", "31990000008"],
  ["seed-client-9", "Isabela Ribeiro", "isabela@example.com", "31990000009"],
  ["seed-client-10", "João Carvalho", "joao@example.com", "31990000010"],
] as const;

type AppointmentDefinition = {
  id: string;
  clientId: string;
  professionalId: string;
  serviceId: string;
  daysFromToday: number;
  hour: number;
  status: "SCHEDULED" | "CONFIRMED" | "CANCELLED" | "NO_SHOW";
  origin: "MANUAL" | "ONLINE" | "PHONE";
  notes: string | null;
};

const appointmentDefinitions: AppointmentDefinition[] = [
  {
    id: "seed-appointment-1",
    clientId: "seed-client-1",
    professionalId: "seed-professional-1",
    serviceId: "seed-service-consulta",
    daysFromToday: -7,
    hour: 9,
    status: "CONFIRMED",
    origin: "MANUAL",
    notes: "Consulta inicial.",
  },
  {
    id: "seed-appointment-2",
    clientId: "seed-client-2",
    professionalId: "seed-professional-1",
    serviceId: "seed-service-retorno",
    daysFromToday: -7,
    hour: 11,
    status: "CONFIRMED",
    origin: "ONLINE",
    notes: "Retorno de acompanhamento.",
  },
  {
    id: "seed-appointment-3",
    clientId: "seed-client-3",
    professionalId: "seed-professional-2",
    serviceId: "seed-service-sessao",
    daysFromToday: -6,
    hour: 9,
    status: "NO_SHOW",
    origin: "PHONE",
    notes: "Cliente não compareceu.",
  },
  {
    id: "seed-appointment-4",
    clientId: "seed-client-4",
    professionalId: "seed-professional-3",
    serviceId: "seed-service-avaliacao",
    daysFromToday: -5,
    hour: 9,
    status: "CANCELLED",
    origin: "MANUAL",
    notes: "Cancelado pelo cliente.",
  },
  {
    id: "seed-appointment-5",
    clientId: "seed-client-5",
    professionalId: "seed-professional-2",
    serviceId: "seed-service-consulta",
    daysFromToday: -4,
    hour: 10,
    status: "CONFIRMED",
    origin: "ONLINE",
    notes: "Consulta concluída.",
  },
  {
    id: "seed-appointment-6",
    clientId: "seed-client-6",
    professionalId: "seed-professional-1",
    serviceId: "seed-service-avaliacao",
    daysFromToday: 1,
    hour: 9,
    status: "CONFIRMED",
    origin: "ONLINE",
    notes: "Avaliação agendada.",
  },
  {
    id: "seed-appointment-7",
    clientId: "seed-client-7",
    professionalId: "seed-professional-1",
    serviceId: "seed-service-retorno",
    daysFromToday: 1,
    hour: 11,
    status: "SCHEDULED",
    origin: "MANUAL",
    notes: null,
  },
  {
    id: "seed-appointment-8",
    clientId: "seed-client-8",
    professionalId: "seed-professional-2",
    serviceId: "seed-service-sessao",
    daysFromToday: 1,
    hour: 9,
    status: "SCHEDULED",
    origin: "PHONE",
    notes: null,
  },
  {
    id: "seed-appointment-9",
    clientId: "seed-client-9",
    professionalId: "seed-professional-3",
    serviceId: "seed-service-avaliacao",
    daysFromToday: 2,
    hour: 9,
    status: "CONFIRMED",
    origin: "ONLINE",
    notes: "Cliente confirmou presença.",
  },
  {
    id: "seed-appointment-10",
    clientId: "seed-client-10",
    professionalId: "seed-professional-3",
    serviceId: "seed-service-retorno",
    daysFromToday: 2,
    hour: 11,
    status: "SCHEDULED",
    origin: "MANUAL",
    notes: null,
  },
  {
    id: "seed-appointment-11",
    clientId: "seed-client-1",
    professionalId: "seed-professional-2",
    serviceId: "seed-service-consulta",
    daysFromToday: 3,
    hour: 9,
    status: "SCHEDULED",
    origin: "ONLINE",
    notes: null,
  },
  {
    id: "seed-appointment-12",
    clientId: "seed-client-2",
    professionalId: "seed-professional-1",
    serviceId: "seed-service-sessao",
    daysFromToday: 3,
    hour: 11,
    status: "SCHEDULED",
    origin: "MANUAL",
    notes: null,
  },
];

const completedAppointments = [
  { appointmentId: "seed-appointment-1", index: 1, paid: true },
  { appointmentId: "seed-appointment-2", index: 2, paid: true },
  { appointmentId: "seed-appointment-5", index: 3, paid: false },
] as const;

function dateAtOffset(daysFromToday: number, hour: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  date.setHours(hour, 0, 0, 0);
  return date;
}

function assertOwnedRecord(
  existing: { tenantId: string },
  recordType: string,
): void {
  if (existing.tenantId !== tenantId) {
    throw new Error(
      `${recordType} seed ID is already used by another tenant; refusing to overwrite it.`,
    );
  }
}

async function ensureUser(
  transaction: Prisma.TransactionClient,
  input: {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "PROFESSIONAL";
    passwordHash: string;
  },
): Promise<string> {
  const [byEmail, byId] = await Promise.all([
    transaction.user.findUnique({
      where: { email: input.email },
      select: { id: true, tenantId: true, name: true, role: true },
    }),
    transaction.user.findUnique({
      where: { id: input.id },
      select: { id: true, tenantId: true, email: true, name: true, role: true },
    }),
  ]);

  if (byEmail || byId) {
    if (
      !byEmail ||
      !byId ||
      byEmail.id !== input.id ||
      byId.email !== input.email ||
      byEmail.tenantId !== tenantId ||
      byId.tenantId !== tenantId ||
      byEmail.name !== input.name ||
      byId.name !== input.name ||
      byEmail.role !== input.role ||
      byId.role !== input.role
    ) {
      throw new Error(
        `Seed account ${input.email} conflicts with an existing user; no account was changed.`,
      );
    }

    return byEmail.id;
  }

  const user = await transaction.user.create({
    data: {
      id: input.id,
      tenantId,
      name: input.name,
      email: input.email,
      passwordHash: input.passwordHash,
      role: input.role,
    },
    select: { id: true },
  });
  return user.id;
}

export async function runDemoSeed(): Promise<void> {
  const environment = process.env.APP_ENV;
  if (environment !== "development" && environment !== "test") {
    throw new Error("Demo seed is disabled outside development and test.");
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured.");
  }
  assertEnvironmentDatabase(connectionString, environment);
  const { target } = await verifyLiveDatabase();

  const adminPassword =
    process.env.DEMO_ADMIN_PASSWORD?.trim() || "admin123";
  const professionalPassword =
    process.env.DEMO_PROFESSIONAL_PASSWORD?.trim() || "professional123";
  if (adminPassword.length < 8 || professionalPassword.length < 8) {
    throw new Error("Demo passwords must contain at least 8 characters.");
  }

  const [adminPasswordHash, professionalPasswordHash] = await Promise.all([
    argon2.hash(adminPassword),
    argon2.hash(professionalPassword),
  ]);
  const prisma = new PrismaClient({
    adapter: new PrismaPg(
      { connectionString },
      { schema: process.env.DATABASE_SCHEMA ?? "public" },
    ),
  });

  try {
    const result = await prisma.$transaction(async (transaction) => {
      const existingTenant = await transaction.tenant.findUnique({
        where: { id: tenantId },
        select: { id: true, name: true },
      });
      if (existingTenant && existingTenant.name !== tenantName) {
        throw new Error(
          "The demo tenant ID belongs to another tenant; refusing to modify it.",
        );
      }

      if (!existingTenant) {
        await transaction.tenant.create({
          data: { id: tenantId, name: tenantName },
        });
      }

      const adminId = await ensureUser(transaction, {
        id: "seed-user-admin",
        name: "Administrador",
        email: "admin@example.com",
        role: "ADMIN",
        passwordHash: adminPasswordHash,
      });

      const professionalIds = new Map<string, string>();
      for (const definition of professionalDefinitions) {
        const userId = await ensureUser(transaction, {
          id: definition.userId,
          name: definition.name,
          email: definition.email,
          role: "PROFESSIONAL",
          passwordHash: professionalPasswordHash,
        });
        const existingProfessional =
          await transaction.professional.findUnique({
            where: {
              tenantId_userId: { tenantId, userId },
            },
            select: { id: true },
          });
        if (
          existingProfessional &&
          existingProfessional.id !== definition.professionalId
        ) {
          throw new Error(
            `Professional account ${definition.email} has a different profile ID.`,
          );
        }

        if (!existingProfessional) {
          const conflictingId = await transaction.professional.findUnique({
            where: { id: definition.professionalId },
            select: { tenantId: true },
          });
          if (conflictingId) {
            assertOwnedRecord(conflictingId, "Professional");
            throw new Error("Professional seed ID conflicts with existing data.");
          }
          await transaction.professional.create({
            data: {
              id: definition.professionalId,
              tenantId,
              userId,
            },
          });
        }
        professionalIds.set(definition.professionalId, userId);
      }

      for (const definition of serviceDefinitions) {
        const existing = await transaction.service.findUnique({
          where: { id: definition.id },
          select: { id: true, tenantId: true },
        });
        if (existing) {
          assertOwnedRecord(existing, "Service");
          await transaction.service.update({
            where: { id: definition.id },
            data: {
              name: definition.name,
              description: definition.description,
              duration: definition.duration,
              price: definition.price,
              active: definition.active,
            },
          });
        } else {
          await transaction.service.create({
            data: { tenantId, ...definition },
          });
        }
      }

      const clientNames = new Map<string, string>();
      for (const [id, name, email, phone] of clientDefinitions) {
        const existing = await transaction.client.findUnique({
          where: { id },
          select: { id: true, tenantId: true },
        });
        if (existing) {
          assertOwnedRecord(existing, "Client");
          await transaction.client.update({
            where: { id },
            data: { name, email, phone },
          });
        } else {
          await transaction.client.create({
            data: { id, tenantId, name, email, phone },
          });
        }
        clientNames.set(id, name);
      }

      const professionalServiceKeys = new Set<string>();
      const clientProfessionalKeys = new Set<string>();

      for (const [index, [clientId]] of clientDefinitions.entries()) {
        const assignedProfessional =
          professionalDefinitions[index % professionalDefinitions.length]
            .professionalId;
        clientProfessionalKeys.add(`${clientId}:${assignedProfessional}`);
      }

      const appointmentResults = new Map<
        string,
        { startAt: Date; endAt: Date; clientId: string; professionalId: string }
      >();

      for (const definition of appointmentDefinitions) {
        const service = serviceDefinitions.find(
          (item) => item.id === definition.serviceId,
        );
        if (!service || !clientNames.has(definition.clientId)) {
          throw new Error(`Invalid demo appointment ${definition.id}.`);
        }
        if (!professionalIds.has(definition.professionalId)) {
          throw new Error(
            `Invalid professional for demo appointment ${definition.id}.`,
          );
        }

        const startAt = dateAtOffset(
          definition.daysFromToday,
          definition.hour,
        );
        const endAt = new Date(startAt.getTime() + service.duration * 60_000);
        const appointmentData = {
          clientId: definition.clientId,
          professionalId: definition.professionalId,
          serviceId: definition.serviceId,
          startAt,
          endAt,
          status: definition.status,
          origin: definition.origin,
          notes: definition.notes,
        };
        const existing = await transaction.appointment.findUnique({
          where: { id: definition.id },
          select: { id: true, tenantId: true },
        });
        if (existing) {
          assertOwnedRecord(existing, "Appointment");
          await transaction.appointment.update({
            where: { id: definition.id },
            data: appointmentData,
          });
        } else {
          await transaction.appointment.create({
            data: { id: definition.id, tenantId, ...appointmentData },
          });
        }
        appointmentResults.set(definition.id, {
          startAt,
          endAt,
          clientId: definition.clientId,
          professionalId: definition.professionalId,
        });
        professionalServiceKeys.add(
          `${definition.professionalId}:${definition.serviceId}`,
        );
        clientProfessionalKeys.add(
          `${definition.clientId}:${definition.professionalId}`,
        );
      }

      const professionalServices = [...professionalServiceKeys].map((key) => {
        const [professionalId, serviceId] = key.split(":");
        if (!professionalId || !serviceId) {
          throw new Error("Invalid demo professional-service assignment.");
        }
        return { tenantId, professionalId, serviceId };
      });
      await transaction.professionalService.createMany({
        data: professionalServices,
        skipDuplicates: true,
      });

      const clientProfessionals = [...clientProfessionalKeys].map((key) => {
        const separator = key.indexOf(":");
        const clientId = key.slice(0, separator);
        const professionalId = key.slice(separator + 1);
        if (!clientId || !professionalId) {
          throw new Error("Invalid demo client-professional assignment.");
        }
        return { tenantId, clientId, professionalId };
      });
      await transaction.clientProfessional.createMany({
        data: clientProfessionals,
        skipDuplicates: true,
      });

      for (const completed of completedAppointments) {
        const appointment = appointmentResults.get(completed.appointmentId);
        if (!appointment) {
          throw new Error(
            `Missing completed demo appointment ${completed.appointmentId}.`,
          );
        }
        const attendanceId = `seed-attendance-${completed.index}`;
        const existingAttendance =
          await transaction.attendance.findUnique({
            where: {
              tenantId_appointmentId: {
                tenantId,
                appointmentId: completed.appointmentId,
              },
            },
            select: { id: true },
          });

        if (
          existingAttendance &&
          existingAttendance.id !== attendanceId
        ) {
          throw new Error(
            `Demo appointment ${completed.appointmentId} already has a non-seed attendance.`,
          );
        }

        const attendance = existingAttendance
          ? await transaction.attendance.update({
              where: { id: attendanceId },
              data: {
                status: "COMPLETED",
                startedAt: appointment.startAt,
                completedAt: appointment.endAt,
                notes: "Atendimento concluído para demonstração.",
              },
              select: { id: true },
            })
          : await transaction.attendance.create({
              data: {
                id: attendanceId,
                tenantId,
                appointmentId: completed.appointmentId,
                status: "COMPLETED",
                startedAt: appointment.startAt,
                completedAt: appointment.endAt,
                notes: "Atendimento concluído para demonstração.",
              },
              select: { id: true },
            });

        const recordId = `seed-client-record-${completed.index}`;
        const authorUser = professionalIds.get(appointment.professionalId);
        const author = professionalDefinitions.find(
          (item) => item.professionalId === appointment.professionalId,
        );
        if (!author || !authorUser) {
          throw new Error("Missing professional author for demo record.");
        }

        const existingRecord = await transaction.clientRecord.findUnique({
          where: { id: recordId },
          select: { tenantId: true, clientId: true },
        });
        if (existingRecord) {
          assertOwnedRecord(existingRecord, "Client record");
          if (existingRecord.clientId !== appointment.clientId) {
            throw new Error("Demo client record belongs to a different client.");
          }
          await transaction.clientRecord.update({
            where: { id: recordId },
            data: {
              attendanceId: attendance.id,
              content:
                "Registro demonstrativo: histórico, observações e plano de acompanhamento do cliente.",
              authorProfessionalId: appointment.professionalId,
              authorName: author.name,
            },
          });
        } else {
          await transaction.clientRecord.create({
            data: {
              id: recordId,
              tenantId,
              clientId: appointment.clientId,
              attendanceId: attendance.id,
              content:
                "Registro demonstrativo: histórico, observações e plano de acompanhamento do cliente.",
              authorProfessionalId: appointment.professionalId,
              authorName: author.name,
            },
          });
        }

        const paymentId = `seed-payment-${completed.index}`;
        const existingPayment = await transaction.payment.findUnique({
          where: {
            tenantId_attendanceId: {
              tenantId,
              attendanceId: attendance.id,
            },
          },
          select: { id: true },
        });
        if (existingPayment && existingPayment.id !== paymentId) {
          throw new Error(
            `Demo attendance ${attendance.id} already has a non-seed payment.`,
          );
        }

        const paymentData = {
          status: completed.paid ? ("PAGO" as const) : ("PENDENTE" as const),
          paidAt: completed.paid ? appointment.endAt : null,
        };
        if (existingPayment) {
          await transaction.payment.update({
            where: { id: paymentId },
            data: paymentData,
          });
        } else {
          await transaction.payment.create({
            data: {
              id: paymentId,
              tenantId,
              attendanceId: attendance.id,
              ...paymentData,
            },
          });
        }
      }

      const auditDefinitions = [
        {
          id: "seed-audit-1",
          entity: "Tenant",
          entityId: tenantId,
        },
        {
          id: "seed-audit-2",
          entity: "User",
          entityId: adminId,
        },
        {
          id: "seed-audit-3",
          entity: "Client",
          entityId: "seed-client-1",
        },
        {
          id: "seed-audit-4",
          entity: "Service",
          entityId: "seed-service-consulta",
        },
        {
          id: "seed-audit-5",
          entity: "Appointment",
          entityId: "seed-appointment-6",
        },
      ] as const;

      for (const log of auditDefinitions) {
        const existing = await transaction.auditLog.findUnique({
          where: { id: log.id },
          select: { id: true, tenantId: true },
        });
        if (existing) {
          assertOwnedRecord(existing, "Audit log");
          await transaction.auditLog.update({
            where: { id: log.id },
            data: {
              action: "SEED_CREATED",
              entity: log.entity,
              entityId: log.entityId,
              payload: `Demonstração: ${log.entity}.`,
              actorId: adminId,
            },
          });
        } else {
          await transaction.auditLog.create({
            data: {
              id: log.id,
              tenantId,
              actorId: adminId,
              action: "SEED_CREATED",
              entity: log.entity,
              entityId: log.entityId,
              payload: `Demonstração: ${log.entity}.`,
            },
          });
        }
      }

      return {
        professionals: professionalDefinitions.length,
        clients: clientDefinitions.length,
        services: serviceDefinitions.length,
        appointments: appointmentDefinitions.length,
        attendances: completedAppointments.length,
        records: completedAppointments.length,
        payments: completedAppointments.length,
        assignments: clientProfessionals.length,
      };
    });

    console.log(
      JSON.stringify({
        environment,
        database: target.database,
        tenantId,
        adminEmail: "admin@example.com",
        ...result,
      }),
    );
  } finally {
    await prisma.$disconnect();
  }
}
