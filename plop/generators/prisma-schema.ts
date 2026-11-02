export interface PrismaSchemaField {
  name: string;
  type: string;
  optional: boolean;
  defaultValue?: string | number | boolean;
  enumValues?: string[];
}

export interface PrismaSchemaModel {
  name: string;
  fields: PrismaSchemaField[];
}

const prismaScalarTypes = new Set([
  "String",
  "Boolean",
  "Int",
  "BigInt",
  "Float",
  "Decimal",
  "DateTime",
]);

const generatedFieldNames = new Set([
  "id",
  "tenantId",
  "createdAt",
  "updatedAt",
]);

function extractBlockNames(schema: string, blockType: "model" | "enum") {
  const expression = new RegExp(
    `^${blockType}\\s+(\\w+)\\s*\\{([\\s\\S]*?)^\\}`,
    "gm",
  );
  const blocks = new Map<string, string>();

  for (const match of schema.matchAll(expression)) {
    const name = match[1];
    const body = match[2];

    if (name && body !== undefined) {
      blocks.set(name, body);
    }
  }

  return blocks;
}

function readDefaultValue(
  attributes: string,
  enumValues: string[] | undefined,
): string | number | boolean | undefined {
  const match = attributes.match(/@default\(("(?:\\.|[^"\\])*"|[^()]*)\)/);
  const value = match?.[1]?.trim();

  if (!value) {
    return undefined;
  }

  if (value.startsWith('"') && value.endsWith('"')) {
    try {
      return JSON.parse(value) as string;
    } catch {
      return value.slice(1, -1);
    }
  }

  if (value === "true" || value === "false") {
    return value === "true";
  }

  if (/^-?\d+(?:\.\d+)?$/.test(value)) {
    return Number(value);
  }

  if (enumValues?.includes(value)) {
    return value;
  }

  return undefined;
}

export function parsePrismaSchema(schema: string): PrismaSchemaModel[] {
  const modelBlocks = extractBlockNames(schema, "model");
  const enumBlocks = extractBlockNames(schema, "enum");
  const modelNames = new Set(modelBlocks.keys());
  const parsedModels: PrismaSchemaModel[] = [];

  for (const [modelName, body] of modelBlocks) {
    const relationScalarFields = new Set(
      [...body.matchAll(/@relation\([^)]*fields:\s*\[([^\]]+)\]/g)].flatMap(
        (match) =>
          match[1]
            ?.split(",")
            .map((field) => field.trim())
            .filter(Boolean) ?? [],
      ),
    );
    const rawFields = [...body.matchAll(
      /^[ \t]{2,}(\w+)[ \t]+([A-Za-z]\w*)(\?)?(\[\])?(?:[ \t]+(.+))?$/gm,
    )];
    const parsedFields = rawFields.flatMap((match) => {
      const [, name, type, optionalMark, listMark, attributes = ""] = match;

      if (!name || !type || listMark || modelNames.has(type)) {
        return [];
      }

      if (!prismaScalarTypes.has(type) && !enumBlocks.has(type)) {
        return [];
      }

      const enumValues = enumBlocks
        .get(type)
        ?.match(/^[ \t]{2,}(\w+)(?:[ \t]+@map\("[^"]*"\))?[ \t]*$/gm)
        ?.map((value) => value.trim().split(/[ \t]+/)[0]!);
      const defaultValue = readDefaultValue(attributes, enumValues);

      return [
        {
          name,
          type,
          optional: Boolean(optionalMark),
          ...(defaultValue === undefined ? {} : { defaultValue }),
          ...(enumValues ? { enumValues } : {}),
        },
      ];
    });

    const fields = parsedFields.filter(
      (field) => !generatedFieldNames.has(field.name),
    );
    const hasForeignKeyFields = fields.some((field) =>
      relationScalarFields.has(field.name),
    );
    const hasStringId = rawFields.some(
      (match) =>
        match[1] === "id" &&
        match[2] === "String" &&
        !match[4] &&
        /@id\b/.test(match[5] ?? ""),
    );
    const hasStringTenantId = rawFields.some(
      (match) =>
        match[1] === "tenantId" &&
        match[2] === "String" &&
        !match[4],
    );

    if (
      hasStringId &&
      hasStringTenantId &&
      !hasForeignKeyFields &&
      fields.length > 0
    ) {
      parsedModels.push({ name: modelName, fields });
    }
  }

  return parsedModels;
}

export function getUnsupportedScalarFields(schema: string): Map<string, string[]> {
  const modelBlocks = extractBlockNames(schema, "model");
  const modelNames = new Set(modelBlocks.keys());
  const enumNames = new Set(extractBlockNames(schema, "enum").keys());
  const supportedTypes = new Set([...prismaScalarTypes, ...enumNames]);
  const unsupported = new Map<string, string[]>();

  for (const [modelName, body] of modelBlocks) {
    const fields = [...body.matchAll(
      /^[ \t]{2,}(\w+)[ \t]+([A-Za-z]\w*)(\?)?(\[\])?(?:[ \t]+(.+))?$/gm,
    )];
    const unsupportedFields = fields.flatMap((match) => {
      const [, name, type, , listMark] = match;

      if (
        !name ||
        !type ||
        generatedFieldNames.has(name) ||
        modelNames.has(type)
      ) {
        return [];
      }

      if (/(password|secret|token|apiKey|privateKey)/i.test(name)) {
        return [`${name} (sensitive field)`];
      }

      if (supportedTypes.has(type) && !listMark) {
        return [];
      }

      return [`${name} (${listMark ? `${type}[]` : type})`];
    });

    if (unsupportedFields.length > 0) {
      unsupported.set(modelName, unsupportedFields);
    }
  }

  return unsupported;
}
