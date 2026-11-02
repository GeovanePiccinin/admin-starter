INSERT INTO "client_professionals" ("tenantId", "clientId", "professionalId")
SELECT DISTINCT "tenantId", "clientId", "professionalId"
FROM "appointments"
ON CONFLICT ("tenantId", "clientId", "professionalId") DO NOTHING;
