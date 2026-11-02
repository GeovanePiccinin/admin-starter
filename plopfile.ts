import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { NodePlopAPI } from "plop";

import {
  getUnsupportedScalarFields,
  parsePrismaSchema,
  type PrismaSchemaField,
} from "./plop/generators/prisma-schema.ts";
import { getCrudAccessPolicy } from "./plop/generators/crud-policy.ts";

interface CrudAnswers {
  modelName: string;
  pluralName: string;
  singularLabel: string;
  pluralLabel: string;
}

interface TemplateField extends PrismaSchemaField {
  label: string;
  isBoolean: boolean;
  isDateTime: boolean;
  isEnum: boolean;
  isLongText: boolean;
  isNumeric: boolean;
  isString: boolean;
  inputType: string;
  listType: string;
  zodSchema: string;
  formDefaultExpression: string;
  writeExpression: string;
  mapExpression: string;
}

const fieldLabels: Record<string, string> = {
  name: "Nome",
  email: "E-mail",
  phone: "Telefone",
  description: "Descrição",
  duration: "Duração",
  price: "Preço",
  active: "Ativo",
  status: "Status",
  origin: "Origem",
  notes: "Observações",
  content: "Conteúdo",
  title: "Título",
  clientId: "Cliente",
  professionalId: "Profissional",
  serviceId: "Serviço",
  appointmentId: "Agendamento",
  attendanceId: "Atendimento",
  startAt: "Data e hora de início",
  endAt: "Data e hora de término",
  startedAt: "Data e hora de início",
  completedAt: "Data e hora de conclusão",
  paidAt: "Data e hora do pagamento",
  passwordHash: "Hash da senha",
};

const defaultLabels: Record<string, [string, string]> = {
  Appointment: ["Agendamento", "Agendamentos"],
  Attendance: ["Atendimento", "Atendimentos"],
  AuditLog: ["Registro de auditoria", "Registros de auditoria"],
  Client: ["Cliente", "Clientes"],
  ClientRecord: ["Prontuário", "Prontuários"],
  Payment: ["Pagamento", "Pagamentos"],
  Professional: ["Profissional", "Profissionais"],
  Service: ["Serviço", "Serviços"],
  User: ["Usuário", "Usuários"],
};

const defaultPluralNames: Record<string, string> = {
  Appointment: "appointments",
  Attendance: "attendances",
  AuditLog: "auditLogs",
  Client: "clients",
  ClientRecord: "clientRecords",
  Payment: "payments",
  Professional: "professionals",
  Service: "services",
  User: "users",
};

function toKebabCase(value: string): string {
  return value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

function toCamelCase(value: string): string {
  const camelCase = value
    .trim()
    .replace(/[-_\s]+(.)?/g, (_, letter: string | undefined) =>
      letter ? letter.toUpperCase() : "",
    );

  return camelCase[0]!.toLowerCase() + camelCase.slice(1);
}

function humanize(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function pluralize(value: string): string {
  if (/(s|x|z|ch|sh)$/i.test(value)) {
    return `${value}es`;
  }

  if (/[^aeiou]y$/i.test(value)) {
    return `${value.slice(0, -1)}ies`;
  }

  return `${value}s`;
}

function literal(value: string): string {
  return JSON.stringify(value);
}

function getZodSchema(
  field: PrismaSchemaField,
  label: string,
  entityName: string,
): string {
  let schema: string;

  switch (field.type) {
    case "String":
      schema = "z.string().trim()";
      if (field.name === "email") {
        schema += `.email(${literal("Informe um e-mail válido.")})`;
      } else if (field.name === "name" && entityName === "Service") {
        schema += `.min(2, ${literal("O nome deve possuir pelo menos 2 caracteres.")}).max(100, ${literal("O nome deve possuir no máximo 100 caracteres.")})`;
      } else if (field.name === "description" && entityName === "Service") {
        schema += `.max(500, ${literal("A descrição deve possuir no máximo 500 caracteres.")})`;
      } else if (!field.optional) {
        schema += ".min(1, " + literal(`Informe ${label.toLowerCase()}.`) + ")";
      }
      break;
    case "Boolean":
      schema = "z.boolean()";
      break;
    case "Int":
      schema = "z.coerce.number().int()";
      if (field.name === "duration" && entityName === "Service") {
        schema += `.positive(${literal("A duração deve ser maior que zero.")})`;
      }
      break;
    case "BigInt":
      schema = "z.coerce.bigint()";
      break;
    case "Float":
    case "Decimal":
      schema = "z.coerce.number()";
      if (field.name === "price" && entityName === "Service") {
        schema += `.nonnegative(${literal("O preço não pode ser negativo.")})`;
      }
      break;
    case "DateTime":
      schema = "z.coerce.date()";
      break;
    default:
      schema = `z.enum(${field.type})`;
  }

  if (!field.optional) {
    return schema;
  }

  if (field.type === "String" || field.enumValues) {
    return `${schema}.optional().or(z.literal(""))`;
  }

  return `z.preprocess((value) => value === "" ? undefined : value, ${schema}.optional())`;
}

function getFieldDefault(field: PrismaSchemaField): string {
  if (field.type === "Boolean") {
    return JSON.stringify(field.defaultValue ?? false);
  }

  if (field.type === "DateTime") {
    return field.defaultValue === undefined
      ? '""'
      : `new Date(${literal(String(field.defaultValue))}).toISOString().slice(0, 16)`;
  }

  if (field.enumValues) {
    const value = field.defaultValue ?? (field.optional ? "" : field.enumValues[0]);
    return literal(String(value ?? ""));
  }

  if (field.type === "Int" || field.type === "Float" || field.type === "Decimal") {
    const value = field.defaultValue;
    return value === undefined ? '""' : literal(String(value));
  }

  if (field.type === "BigInt") {
    return field.defaultValue === undefined
      ? '""'
      : literal(String(field.defaultValue));
  }

  return literal(String(field.defaultValue ?? ""));
}

function getListType(field: PrismaSchemaField): string {
  let type: string;

  switch (field.type) {
    case "String":
    case "Boolean":
      type = field.type === "String" ? "string" : "boolean";
      break;
    case "Int":
    case "Float":
      type = "number";
      break;
    case "BigInt":
    case "Decimal":
      type = "string";
      break;
    case "DateTime":
      type = "Date";
      break;
    default:
      type = field.type;
  }

  return field.optional ? `${type} | null` : type;
}

function createTemplateField(
  field: PrismaSchemaField,
  entityName: string,
): TemplateField {
  const isNumeric = ["Int", "BigInt", "Float", "Decimal"].includes(field.type);
  const isString = field.type === "String";
  const isDateTime = field.type === "DateTime";
  const isBoolean = field.type === "Boolean";
  const isEnum = Boolean(field.enumValues);
  const isLongText = ["description", "notes", "content", "payload"].includes(
    field.name,
  );
  const inputType = isDateTime
    ? "datetime-local"
    : isNumeric
      ? "number"
      : field.name === "email"
        ? "email"
        : field.name === "phone"
          ? "tel"
          : "text";
  const mapExpression =
    field.type === "Decimal" || field.type === "BigInt"
      ? field.optional
        ? `record.${field.name} == null ? null : record.${field.name}.toString()`
        : `record.${field.name}.toString()`
      : `record.${field.name}`;
  const writeExpression = field.optional
    ? isString
      ? `input.${field.name} || null`
      : `input.${field.name} ?? null`
    : `input.${field.name}`;
  const formDefaultExpression = isDateTime
    ? `${toCamelCase(entityName)}?.${field.name} ? formatDateTimeLocal(${toCamelCase(entityName)}.${field.name}) : ${getFieldDefault(field)}`
    : `${toCamelCase(entityName)}?.${field.name} ?? ${getFieldDefault(field)}`;

  return {
    ...field,
    label: fieldLabels[field.name] ?? humanize(field.name),
    isBoolean,
    isDateTime,
    isEnum,
    isLongText,
    isNumeric,
    isString,
    inputType,
    listType: getListType(field),
    zodSchema: getZodSchema(
      field,
      fieldLabels[field.name] ?? humanize(field.name),
      entityName,
    ),
    formDefaultExpression,
    writeExpression,
    mapExpression,
  };
}

function readScaffoldModels() {
  const schemaPath = join(process.cwd(), "prisma", "schema.prisma");
  let schema: string;

  try {
    schema = readFileSync(schemaPath, "utf8");
  } catch (error: unknown) {
    throw new Error(`Não foi possível ler ${schemaPath}.`, { cause: error });
  }

  const unsupportedFields = getUnsupportedScalarFields(schema);
  const models = parsePrismaSchema(schema).filter(
    (model) =>
      !unsupportedFields.has(model.name) &&
      getCrudAccessPolicy(model.name).scaffoldSupported,
  );

  if (models.length === 0) {
    throw new Error(
      "Nenhum model com política de acesso revisada e campos compatíveis foi encontrado em prisma/schema.prisma.",
    );
  }

  return models;
}

function plopfile(plop: NodePlopAPI): void {
  const models = readScaffoldModels();
  const modelChoices = models.map((model) => ({
    name: model.name,
    value: model.name,
  }));
  const modelsByName = new Map(models.map((model) => [model.name, model]));

  plop.setGenerator("crud", {
    description:
      "Generate a tenant-scoped CRUD feature from a Prisma model",

    prompts: [
      {
        type: "list",
        name: "modelName",
        message: "Prisma model:",
        choices: modelChoices,
      },
      {
        type: "input",
        name: "pluralName",
        message: "Plural name for generated identifiers and route:",
        default: (answers: CrudAnswers) =>
          defaultPluralNames[answers.modelName] ??
          pluralize(answers.modelName[0]!.toLowerCase() +
            answers.modelName.slice(1)),
        validate: (value: unknown): true | string => {
          if (
            typeof value !== "string" ||
            !/^[A-Za-z][A-Za-z0-9 _-]*$/.test(value.trim())
          ) {
            return "Use somente letras, números, espaços, hífens ou sublinhados.";
          }

          return true;
        },
      },
      {
        type: "input",
        name: "singularLabel",
        message: "Label singular exibido na interface:",
        default: (answers: CrudAnswers) =>
          defaultLabels[answers.modelName]?.[0] ??
          humanize(answers.modelName),
        validate: (value: unknown): true | string =>
          typeof value === "string" && value.trim()
            ? true
            : "Informe um label singular.",
      },
      {
        type: "input",
        name: "pluralLabel",
        message: "Label plural exibido na interface:",
        default: (answers: CrudAnswers) =>
          defaultLabels[answers.modelName]?.[1] ??
          pluralize(humanize(answers.modelName)),
        validate: (value: unknown): true | string =>
          typeof value === "string" && value.trim()
            ? true
            : "Informe um label plural.",
      },
    ],

    actions: (answers) => {
      if (!answers) {
        throw new Error("As respostas do gerador são obrigatórias.");
      }

      const {
        modelName,
        pluralName,
        singularLabel,
        pluralLabel,
      } = answers as CrudAnswers;
      const model = modelsByName.get(modelName);

      if (!model) {
        throw new Error(`O model "${modelName}" não está disponível no schema.`);
      }

      const fields = model.fields.map((field) =>
        createTemplateField(field, model.name),
      );
      const accessPolicy = getCrudAccessPolicy(model.name);
      const enumNames = [
        ...new Set(fields.filter((field) => field.isEnum).map((field) => field.type)),
      ];
      const sortableFields = fields.map((field) => field.name);
      const defaultSortField =
        fields.find((field) => field.type === "String")?.name ??
        sortableFields[0] ??
        "id";
      const singular = singularLabel.trim();
      const templateData = {
        entityName: model.name,
        pluralName: pluralName.trim(),
        pluralCamelCase: toCamelCase(pluralName),
        singularLabel: singular,
        pluralLabel: pluralLabel.trim(),
        routeName: toKebabCase(pluralName),
        messages: {
          createSuccess: literal(`${singular} cadastrado com sucesso.`),
          createError: literal(`Não foi possível cadastrar ${singular}.`),
          updateSuccess: literal(`${singular} atualizado com sucesso.`),
          updateError: literal(`Não foi possível atualizar ${singular}.`),
          deleteSuccess: literal(`${singular} excluído com sucesso.`),
          deleteError: literal(`Não foi possível excluir ${singular}.`),
          notFound: literal(`${singular} não encontrado.`),
        },
        fields,
        enumNames,
        hasEnums: enumNames.length > 0,
        hasDateTimeFields: fields.some((field) => field.isDateTime),
        hasInputFields: fields.some((field) => !field.isBoolean && !field.isEnum),
        hasLongTextFields: fields.some((field) => field.isLongText),
        sortableFields,
        defaultSortField,
        searchableFields: fields.filter((field) => field.type === "String"),
        hasSearchableFields: fields.some((field) => field.type === "String"),
        readRequiresAdmin: accessPolicy.readRoles.length === 1,
        createRequiresAdmin: accessPolicy.createRoles.length === 1,
        tableColumnCount: fields.length + 1,
        tableColumnCountExpression: `{${fields.length + 1}}`,
      };
      const featureDirectory = join(
        "src",
        "features",
        toKebabCase(model.name),
      );
      const templateDirectory = join("plop", "templates", "crud");
      const fileTemplates = [
        ["form.tsx.hbs", `${toKebabCase(model.name)}-form.tsx`],
        ["actions.ts.hbs", `${toKebabCase(model.name)}.actions.ts`],
        ["query.ts.hbs", `${toKebabCase(model.name)}.query.ts`],
        ["repository.ts.hbs", `${toKebabCase(model.name)}.repository.ts`],
        ["schema.ts.hbs", `${toKebabCase(model.name)}.schema.ts`],
        ["test.ts.hbs", `${toKebabCase(model.name)}.test.ts`],
        ["container.tsx.hbs", `${toKebabCase(model.name)}-container.tsx`],
      ];
      const actions = fileTemplates.map(([template, file]) => ({
        type: "add" as const,
        path: join(featureDirectory, file!),
        templateFile: join(templateDirectory, template!),
        data: templateData,
      }));

      actions.push({
        type: "add" as const,
        path: join("src", "app", "(dashboard)", templateData.routeName, "page.tsx"),
        templateFile: join(templateDirectory, "page.tsx.hbs"),
        data: templateData,
      });

      return actions;
    },
  });
}

export default plopfile;
