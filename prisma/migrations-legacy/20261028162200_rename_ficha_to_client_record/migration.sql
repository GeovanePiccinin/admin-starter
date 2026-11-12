ALTER TABLE "fichas" RENAME TO "client_records";

ALTER TABLE "client_records"
  RENAME CONSTRAINT "fichas_pkey" TO "client_records_pkey";

ALTER INDEX "fichas_tenantId_id_key"
  RENAME TO "client_records_tenantId_id_key";
ALTER INDEX "fichas_tenantId_idx"
  RENAME TO "client_records_tenantId_idx";
ALTER INDEX "fichas_tenantId_clientId_idx"
  RENAME TO "client_records_tenantId_clientId_idx";
ALTER INDEX "fichas_tenantId_attendanceId_idx"
  RENAME TO "client_records_tenantId_attendanceId_idx";

ALTER TABLE "client_records"
  RENAME CONSTRAINT "fichas_tenantId_fkey" TO "client_records_tenantId_fkey";
ALTER TABLE "client_records"
  RENAME CONSTRAINT "fichas_tenantId_clientId_fkey"
  TO "client_records_tenantId_clientId_fkey";
ALTER TABLE "client_records"
  RENAME CONSTRAINT "fichas_tenantId_attendanceId_fkey"
  TO "client_records_tenantId_attendanceId_fkey";
