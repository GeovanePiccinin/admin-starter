export type CrudRole = "ADMIN";

export interface CrudAccessPolicy {
  scaffoldSupported: boolean;
  readRoles: readonly CrudRole[];
  createRoles: readonly CrudRole[];
  manageRoles: readonly CrudRole[];
}

const adminOnly: readonly CrudRole[] = ["ADMIN"];

const policies: Record<string, CrudAccessPolicy> = {
  ExampleItem: {
    scaffoldSupported: true,
    readRoles: adminOnly,
    createRoles: adminOnly,
    manageRoles: adminOnly,
  },
};

export function getCrudAccessPolicy(modelName: string): CrudAccessPolicy {
  return (
    policies[modelName] ?? {
      scaffoldSupported: false,
      readRoles: adminOnly,
      createRoles: adminOnly,
      manageRoles: adminOnly,
    }
  );
}
