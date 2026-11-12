-- CreateTable
CREATE TABLE "professional_services" (
    "tenantId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,

    CONSTRAINT "professional_services_pkey" PRIMARY KEY ("tenantId", "professionalId", "serviceId")
);

-- CreateIndex
CREATE INDEX "professional_services_tenantId_serviceId_idx" ON "professional_services"("tenantId", "serviceId");

-- AddForeignKey
ALTER TABLE "professional_services" ADD CONSTRAINT "professional_services_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_services" ADD CONSTRAINT "professional_services_tenantId_professionalId_fkey" FOREIGN KEY ("tenantId", "professionalId") REFERENCES "professionals"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_services" ADD CONSTRAINT "professional_services_tenantId_serviceId_fkey" FOREIGN KEY ("tenantId", "serviceId") REFERENCES "services"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
