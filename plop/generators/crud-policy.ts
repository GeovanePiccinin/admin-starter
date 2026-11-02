export type CrudRole = "ADMIN" | "PROFESSIONAL";

export interface CrudAccessPolicy {
  scaffoldSupported: boolean;
  readRoles: readonly CrudRole[];
  createRoles: readonly CrudRole[];
  manageRoles: readonly CrudRole[];
}

const allRoles: readonly CrudRole[] = ["ADMIN", "PROFESSIONAL"];
const adminOnly: readonly CrudRole[] = ["ADMIN"];

const policies: Record<string, CrudAccessPolicy> = {
  Service: {
    scaffoldSupported: true,
    readRoles: allRoles,
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
