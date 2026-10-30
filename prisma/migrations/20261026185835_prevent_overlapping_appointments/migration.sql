
-- Necessária para operadores de igualdade sobre texto nas constraints GiST.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- O início deve ser anterior ao término.
ALTER TABLE "appointments"
ADD CONSTRAINT "appointments_valid_interval"
CHECK ("startAt" < "endAt");

-- Impede sobreposição para o mesmo tenant e profissional.
-- Intervalos [início, fim) permitem agendamentos consecutivos.
-- Agendamentos CANCELLED não participam da exclusão.
ALTER TABLE "appointments"
ADD CONSTRAINT "appointments_no_overlapping_active"
EXCLUDE USING gist (
  "tenantId" WITH =,
  "professionalId" WITH =,
  tsrange("startAt", "endAt", '[)') WITH &&
)
WHERE ("status" <> 'CANCELLED');
