import { describe, expect, it } from "vitest";

import { getCrudAccessPolicy } from "./crud-policy";

describe("getCrudAccessPolicy", () => {
  it("enables the generic scaffold only for reviewed model policies", () => {
    expect(getCrudAccessPolicy("ExampleItem")).toMatchObject({
      scaffoldSupported: true,
    });
    expect(getCrudAccessPolicy("Client")).toMatchObject({
      scaffoldSupported: false,
    });
  });

  it("restricts example item reads and mutations to administrators", () => {
    expect(getCrudAccessPolicy("ExampleItem")).toEqual({
      scaffoldSupported: true,
      readRoles: ["ADMIN"],
      createRoles: ["ADMIN"],
      manageRoles: ["ADMIN"],
    });
  });

  it("disables unknown models until their access policy is reviewed", () => {
    expect(getCrudAccessPolicy("NewModel")).toEqual({
      scaffoldSupported: false,
      readRoles: ["ADMIN"],
      createRoles: ["ADMIN"],
      manageRoles: ["ADMIN"],
    });
  });
});
