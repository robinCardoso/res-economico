-- RemoveConstraint from Usuario
-- Remove the foreign key constraint that links Usuario to Empresa
ALTER TABLE "Usuario" DROP CONSTRAINT IF EXISTS "Usuario_empresaId_fkey";

-- Note: The empresaId column remains in Usuario for data preservation,
-- but users are no longer required to belong to a company.
-- This allows companies to be deleted without affecting users.
