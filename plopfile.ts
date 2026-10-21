import type { NodePlopAPI } from "plop";

interface CrudAnswers {
  entityName: string;
  pluralName: string;
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

      return [
        {
          type: "add",
          path: "src/features/{{kebabCase entityName}}/{{kebabCase entityName}}-container.tsx",
          templateFile: "plop/templates/crud/container.tsx.hbs",
        },
        {
          type: "add",
          path: "src/features/{{kebabCase entityName}}/{{kebabCase entityName}}-form.tsx",
          templateFile: "plop/templates/crud/form.tsx.hbs",
        },
        {
          type: "add",
          path: "src/features/{{kebabCase entityName}}/{{kebabCase entityName}}.actions.ts",
          templateFile: "plop/templates/crud/actions.ts.hbs",
        },
        {
          type: "add",
          path: "src/features/{{kebabCase entityName}}/{{kebabCase entityName}}.query.ts",
          templateFile: "plop/templates/crud/query.ts.hbs",
        },
        {
          type: "add",
          path: "src/features/{{kebabCase entityName}}/{{kebabCase entityName}}.repository.ts",
          templateFile: "plop/templates/crud/repository.ts.hbs",
        },
        {
          type: "add",
          path: "src/features/{{kebabCase entityName}}/{{kebabCase entityName}}.schema.ts",
          templateFile: "plop/templates/crud/schema.ts.hbs",
        },
        {
          type: "add",
          path: "src/features/{{kebabCase entityName}}/{{kebabCase entityName}}.test.ts",
          templateFile: "plop/templates/crud/test.ts.hbs",
        },
        {
          type: "add",
          path: "src/app/(dashboard)/{{kebabCase pluralName}}/page.tsx",
          templateFile: "plop/templates/crud/page.tsx.hbs",
        },
      ];
    },
  });
}
