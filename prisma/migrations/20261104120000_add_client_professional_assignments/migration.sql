CREATE TABLE "client_professionals" (
    "tenantId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_professionals_pkey" PRIMARY KEY ("tenantId", "clientId", "professionalId")
);

CREATE INDEX "client_professionals_tenantId_professionalId_clientId_idx"
ON "client_professionals"("tenantId", "professionalId", "clientId");

ALTER TABLE "client_professionals"
ADD CONSTRAINT "client_professionals_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "tenants"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "client_professionals"
ADD CONSTRAINT "client_professionals_tenantId_clientId_fkey"
FOREIGN KEY ("tenantId", "clientId") REFERENCES "clients"("tenantId", "id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "client_professionals"
ADD CONSTRAINT "client_professionals_tenantId_professionalId_fkey"
FOREIGN KEY ("tenantId", "professionalId") REFERENCES "professionals"("tenantId", "id")
ON DELETE CASCADE ON UPDATE CASCADE;
