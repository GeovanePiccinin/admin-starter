-- Backfill service assignments from the services already scheduled for each professional.
INSERT INTO "professional_services" ("tenantId", "professionalId", "serviceId")
SELECT DISTINCT "tenantId", "professionalId", "serviceId"
FROM "appointments"
ON CONFLICT ("tenantId", "professionalId", "serviceId") DO NOTHING;
