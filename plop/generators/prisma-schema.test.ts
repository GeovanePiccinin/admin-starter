import { describe, expect, it } from "vitest";

import {
  getUnsupportedScalarFields,
  parsePrismaSchema,
} from "./prisma-schema";

const schema = `
enum State {
  DRAFT @map("draft")
  PUBLISHED
}

model Article {
  id          String   @id @default(cuid())
  tenantId    String
  title       String
  slug        String   @default("draft(slug)")
  body        String?
  state       State    @default(DRAFT)
  publishedAt DateTime?
  createdAt   DateTime @default(now())
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  tags        Tag[]

  @@index([tenantId])
}

model Document {
  id        String @id @default(cuid())
  tenantId  String
  metadata  Json
}

model User {
  id           String @id @default(cuid())
  tenantId     String
  passwordHash String
}

model ExampleRelation {
  id        String @id @default(cuid())
  tenantId  String
  ownerId   String
  owner     ExampleOwner @relation(fields: [ownerId], references: [id])
}

model Tenant {
  id String @id
}

model ExampleOwner {
  id String @id
}

model Tag {
  id String @id
}

model JoinRecord {
  tenantId String
  articleId String

  @@id([tenantId, articleId])
}
`;

describe("parsePrismaSchema", () => {
  it("extracts editable scalar fields, optionality, and enum defaults", () => {
    const models = parsePrismaSchema(schema);

    expect(models).toEqual([
      {
        name: "Article",
        fields: [
          { name: "title", type: "String", optional: false },
          {
            name: "slug",
            type: "String",
            optional: false,
            defaultValue: "draft(slug)",
          },
          { name: "body", type: "String", optional: true },
          {
            name: "state",
            type: "State",
            optional: false,
            defaultValue: "DRAFT",
            enumValues: ["DRAFT", "PUBLISHED"],
          },
          { name: "publishedAt", type: "DateTime", optional: true },
        ],
      },
      {
        name: "User",
        fields: [{ name: "passwordHash", type: "String", optional: false }],
      },
    ]);
  });

  it("does not offer models with tenant-scoped foreign-key relations", () => {
    expect(parsePrismaSchema(schema).map((model) => model.name)).not.toContain(
      "ExampleRelation",
    );
  });

  it("reports unsupported scalar values instead of generating partial CRUDs", () => {
    expect(getUnsupportedScalarFields(schema)).toEqual(
      new Map([
        ["Document", ["metadata (Json)"]],
        ["User", ["passwordHash (sensitive field)"]],
      ]),
    );
  });
});
