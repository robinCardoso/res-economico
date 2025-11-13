-- CreateEnum
CREATE TYPE "Departamento" AS ENUM ('FINANCEIRO', 'COMPRAS', 'GESTOR');

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "departamento" "Departamento";
