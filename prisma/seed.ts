import "dotenv/config";
import argon2 from "argon2";

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

const TENANT_ID = "development-tenant";
const ADMIN_ID = "seed-user-admin";

const PASSWORD = "admin123";

const professionalDefinitions = [
  {
    id: "seed-user-professional-1",
    professionalId: "seed-professional-1",
    name: "Mariana Costa",
    email: "mariana@example.com",
  },
  {
    id: "seed-user-professional-2",
    professionalId: "seed-professional-2",
    name: "Rafael Oliveira",
    email: "rafael@example.com",
  },
  {
    id: "seed-user-professional-3",
    professionalId: "seed-professional-3",
    name: "Camila Santos",
    email: "camila@example.com",
  },
] as const;

const clientDefinitions = [
  {
    id: "seed-client-1",
    name: "Ana Souza",
    email: "ana@example.com",
    phone: "31990000001",
  },
  {
    id: "seed-client-2",
    name: "Bruno Lima",
    email: "bruno@example.com",
    phone: "31990000002",
  },
  {
    id: "seed-client-3",
    name: "Carla Mendes",
    email: "carla@example.com",
    phone: "31990000003",
  },
  {
    id: "seed-client-4",
    name: "Daniel Ferreira",
    email: "daniel@example.com",
    phone: "31990000004",
  },
  {
    id: "seed-client-5",
    name: "Eduarda Alves",
    email: "eduarda@example.com",
    phone: "31990000005",
  },
  {
    id: "seed-client-6",
    name: "Felipe Martins",
    email: "felipe@example.com",
    phone: "31990000006",
  },
  {
    id: "seed-client-7",
    name: "Gabriela Rocha",
    email: "gabriela@example.com",
    phone: "31990000007",
  },
  {
    id: "seed-client-8",
    name: "Henrique Castro",
    email: "henrique@example.com",
    phone: "31990000008",
  },
  {
    id: "seed-client-9",
    name: "Isabela Ribeiro",
    email: "isabela@example.com",
    phone: "31990000009",
  },
  {
    id: "seed-client-10",
    name: "João Carvalho",
    email: "joao@example.com",
    phone: "31990000010",
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

type AppointmentDefinition = {
  id: string;
  clientId: string;
  professionalId: string;
  serviceId: string;
  daysFromToday: number;
  hour: number;
  minute: number;
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
    minute: 0,
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
    minute: 0,
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
    minute: 0,
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
    minute: 0,
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
    minute: 0,
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
    minute: 0,
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
    minute: 0,
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
    minute: 0,
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
    minute: 0,
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
    minute: 0,
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
    minute: 0,
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
    minute: 0,
    status: "SCHEDULED",
    origin: "MANUAL",
    notes: null,
  },
];

function dateAtOffset(
  daysFromToday: number,
  hour: number,
  minute: number,
): Date {
  const date = new Date();

  date.setDate(date.getDate() + daysFromToday);
  date.setHours(hour, minute, 0, 0);

  return date;
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

async function main(): Promise<void> {
  const passwordHash = await argon2.hash(PASSWORD);

  // 1. Tenant
  const tenant = await prisma.tenant.upsert({
    where: {
      id: TENANT_ID,
    },
    update: {
      name: "Empresa de Demonstração",
    },
    create: {
      id: TENANT_ID,
      name: "Empresa de Demonstração",
    },
  });

  // 2. Administrador
  const admin = await prisma.user.upsert({
    where: {
      email: "admin@example.com",
    },
    update: {
      name: "Administrador",
      passwordHash,
      role: "ADMIN",
    },
    create: {
      id: ADMIN_ID,
      tenantId: tenant.id,
      name: "Administrador",
      email: "admin@example.com",
      passwordHash,
      role: "ADMIN",
    },
  });

  // 3. Usuários profissionais e seus perfis
  for (const definition of professionalDefinitions) {
    const user = await prisma.user.upsert({
      where: {
        email: definition.email,
      },
      update: {
        name: definition.name,
        passwordHash,
        role: "PROFESSIONAL",
      },
      create: {
        id: definition.id,
        tenantId: tenant.id,
        name: definition.name,
        email: definition.email,
        passwordHash,
        role: "PROFESSIONAL",
      },
    });

    await prisma.professional.upsert({
      where: {
        tenantId_userId: {
          tenantId: tenant.id,
          userId: user.id,
        },
      },
      update: {},
      create: {
        id: definition.professionalId,
        tenantId: tenant.id,
        userId: user.id,
      },
    });
  }

  // 4. Clientes
  for (const client of clientDefinitions) {
    await prisma.client.upsert({
      where: {
        id: client.id,
      },
      update: {
        name: client.name,
        email: client.email,
        phone: client.phone,
      },
      create: {
        id: client.id,
        tenantId: tenant.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
      },
    });
  }

  // 5. Serviços
  for (const service of serviceDefinitions) {
    await prisma.service.upsert({
      where: {
        id: service.id,
      },
      update: {
        name: service.name,
        description: service.description,
        duration: service.duration,
        price: service.price,
        active: service.active,
      },
      create: {
        id: service.id,
        tenantId: tenant.id,
        name: service.name,
        description: service.description,
        duration: service.duration,
        price: service.price,
        active: service.active,
      },
    });
  }

  // 6. Agendamentos
  const appointmentResults = new Map<
    string,
    {
      id: string;
      clientId: string;
      startAt: Date;
      endAt: Date;
      status: AppointmentDefinition["status"];
    }
  >();

  for (const definition of appointmentDefinitions) {
    const service = serviceDefinitions.find(
      (item) => item.id === definition.serviceId,
    );

    if (!service) {
      throw new Error(`Serviço não encontrado: ${definition.serviceId}`);
    }

    const startAt = dateAtOffset(
      definition.daysFromToday,
      definition.hour,
      definition.minute,
    );

    const endAt = addMinutes(startAt, service.duration);

    const appointment = await prisma.appointment.upsert({
      where: {
        id: definition.id,
      },
      update: {
        clientId: definition.clientId,
        professionalId: definition.professionalId,
        serviceId: definition.serviceId,
        startAt,
        endAt,
        status: definition.status,
        origin: definition.origin,
        notes: definition.notes,
      },
      create: {
        id: definition.id,
        tenantId: tenant.id,
        clientId: definition.clientId,
        professionalId: definition.professionalId,
        serviceId: definition.serviceId,
        startAt,
        endAt,
        status: definition.status,
        origin: definition.origin,
        notes: definition.notes,
      },
    });

    appointmentResults.set(definition.id, {
      id: appointment.id,
      clientId: definition.clientId,
      startAt,
      endAt,
      status: definition.status,
    });
  }

  const professionalServiceAssignments = Array.from(
    new Map(
      appointmentDefinitions.map((appointment) => [
        `${appointment.professionalId}:${appointment.serviceId}`,
        {
          tenantId: tenant.id,
          professionalId: appointment.professionalId,
          serviceId: appointment.serviceId,
        },
      ]),
    ).values(),
  );

  await prisma.professionalService.createMany({
    data: professionalServiceAssignments,
    skipDuplicates: true,
  });

  // 7. Atendimentos, registros de clientes e pagamentos.
  // Apenas agendamentos históricos confirmados recebem atendimento.
  const completedAppointmentIds = [
    "seed-appointment-1",
    "seed-appointment-2",
    "seed-appointment-5",
  ];

  for (const [index, appointmentId] of completedAppointmentIds.entries()) {
    const appointment = appointmentResults.get(appointmentId);

    if (!appointment) {
      throw new Error(`Agendamento não encontrado: ${appointmentId}`);
    }

    const attendanceId = `seed-attendance-${index + 1}`;
    const startedAt = appointment.startAt;
    const completedAt = appointment.endAt;

    const attendance = await prisma.attendance.upsert({
      where: {
        tenantId_appointmentId: {
          tenantId: tenant.id,
          appointmentId: appointment.id,
        },
      },
      update: {
        status: "COMPLETED",
        startedAt,
        completedAt,
        notes: "Atendimento concluído para demonstração.",
      },
      create: {
        id: attendanceId,
        tenantId: tenant.id,
        appointmentId: appointment.id,
        status: "COMPLETED",
        startedAt,
        completedAt,
        notes: "Atendimento concluído para demonstração.",
      },
    });

    await prisma.clientRecord.upsert({
      where: {
        id: `seed-ficha-${index + 1}`,
      },
      update: {
        clientId: appointment.clientId,
        attendanceId: attendance.id,
        content:
          "Registro demonstrativo: histórico, observações e plano de acompanhamento do cliente.",
      },
      create: {
        id: `seed-ficha-${index + 1}`,
        tenantId: tenant.id,
        clientId: appointment.clientId,
        attendanceId: attendance.id,
        content:
          "Registro demonstrativo: histórico, observações e plano de acompanhamento do cliente.",
      },
    });

    const isPaid = index < 2;

    await prisma.payment.upsert({
      where: {
        tenantId_attendanceId: {
          tenantId: tenant.id,
          attendanceId: attendance.id,
        },
      },
      update: {
        status: isPaid ? "PAGO" : "PENDENTE",
        paidAt: isPaid ? completedAt : null,
      },
      create: {
        id: `seed-payment-${index + 1}`,
        tenantId: tenant.id,
        attendanceId: attendance.id,
        status: isPaid ? "PAGO" : "PENDENTE",
        paidAt: isPaid ? completedAt : null,
      },
    });
  }

  // 8. Auditoria
  const auditDefinitions = [
    {
      id: "seed-audit-1",
      action: "SEED_CREATED",
      entity: "Tenant",
      entityId: tenant.id,
      payload: "Empresa de demonstração criada ou atualizada.",
    },
    {
      id: "seed-audit-2",
      action: "SEED_CREATED",
      entity: "User",
      entityId: admin.id,
      payload: "Administrador de demonstração criado ou atualizado.",
    },
    {
      id: "seed-audit-3",
      action: "SEED_CREATED",
      entity: "Client",
      entityId: "seed-client-1",
      payload: "Cliente de demonstração.",
    },
    {
      id: "seed-audit-4",
      action: "SEED_CREATED",
      entity: "Service",
      entityId: "seed-service-consulta",
      payload: "Serviço de demonstração.",
    },
    {
      id: "seed-audit-5",
      action: "SEED_CREATED",
      entity: "Appointment",
      entityId: "seed-appointment-6",
      payload: "Agendamento futuro de demonstração.",
    },
  ] as const;

  for (const log of auditDefinitions) {
    await prisma.auditLog.upsert({
      where: {
        id: log.id,
      },
      update: {
        action: log.action,
        entity: log.entity,
        entityId: log.entityId,
        payload: log.payload,
        actorId: admin.id,
      },
      create: {
        id: log.id,
        tenantId: tenant.id,
        actorId: admin.id,
        action: log.action,
        entity: log.entity,
        entityId: log.entityId,
        payload: log.payload,
      },
    });
  }

  console.log("Seed concluído com sucesso.");
  console.log("Tenant: Empresa de Demonstração");
  console.log("Administrador: admin@example.com");
  console.log("Senha de demonstração: admin123");
  console.log("Profissionais: 3");
  console.log("Clientes: 10");
  console.log("Serviços: 5");
  console.log(`Agendamentos: ${appointmentResults.size}`);
  console.log("Atendimentos: 3");
  console.log("Fichas: 3");
  console.log("Pagamentos: 3");
  console.log("Registros de auditoria: 5");
}

main()
  .catch((error: unknown) => {
    console.error("Erro ao executar seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
