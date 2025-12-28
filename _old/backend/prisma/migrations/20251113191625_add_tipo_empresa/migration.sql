-- CreateEnum
CREATE TYPE "TipoEmpresa" AS ENUM ('MATRIZ', 'FILIAL');

-- AlterTable
ALTER TABLE "Empresa" ADD COLUMN     "tipo" "TipoEmpresa" NOT NULL DEFAULT 'MATRIZ';
