import { describe, expect, it } from "vitest";

import { getCrudAccessPolicy } from "./crud-policy";

describe("getCrudAccessPolicy", () => {
  it("enables the generic scaffold only for reviewed model policies", () => {
    expect(getCrudAccessPolicy("Service")).toMatchObject({
      scaffoldSupported: true,
    });
    expect(getCrudAccessPolicy("Client")).toMatchObject({
      scaffoldSupported: false,
    });
  });

  it("allows professional reads but restricts service mutations to administrators", () => {
    expect(getCrudAccessPolicy("Service")).toEqual({
      scaffoldSupported: true,
      readRoles: ["ADMIN", "PROFESSIONAL"],
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
