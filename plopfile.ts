import type { NodePlopAPI } from "plop";

interface CrudAnswers {
  entityName: string;
  pluralName: string;
}

function toKebabCase(value: string): string {
  return value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

export default function (plop: NodePlopAPI): void {
  plop.setGenerator("crud", {
    description: "Generate a CRUD feature",

    prompts: [
      {
        type: "input",
        name: "entityName",
        message: "Entity name:",
        validate: (value: unknown): true | string => {
          if (typeof value !== "string" || value.trim().length === 0) {
            return "Entity name is required.";
          }

          return true;
        },
      },
      {
        type: "input",
        name: "pluralName",
        message: "Plural name:",
        validate: (value: unknown): true | string => {
          if (typeof value !== "string" || value.trim().length === 0) {
            return "Plural name is required.";
          }

          return true;
        },
      },
    ],

    actions: (answers) => {
      if (!answers) {
        throw new Error("Generator answers are required.");
      }

      const { entityName, pluralName } = answers as CrudAnswers;
      const entity = toKebabCase(entityName);
      const plural = toKebabCase(pluralName);

      return [
        {
          type: "add",
          path: `src/features/${entity}/${entity}-form.tsx`,
          templateFile: "plop/templates/crud/form.tsx.hbs",
        },
        {
          type: "add",
          path: `src/features/${entity}/${entity}.actions.ts`,
          templateFile: "plop/templates/crud/actions.ts.hbs",
        },
        {
          type: "add",
          path: `src/features/${entity}/${entity}.query.ts`,
          templateFile: "plop/templates/crud/query.ts.hbs",
        },
        {
          type: "add",
          path: `src/features/${entity}/${entity}.repository.ts`,
          templateFile: "plop/templates/crud/repository.ts.hbs",
        },
        {
          type: "add",
          path: `src/features/${entity}/${entity}.schema.ts`,
          templateFile: "plop/templates/crud/schema.ts.hbs",
        },
        {
          type: "add",
          path: `src/features/${entity}/${entity}.test.ts`,
          templateFile: "plop/templates/crud/test.ts.hbs",
        },
      ];
    },
  });
}
