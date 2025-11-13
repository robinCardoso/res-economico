/*
  Warnings:

  - Changed the type of `codigo` on the `Filial` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Empresa" ADD COLUMN     "nomeFantasia" TEXT;

-- AlterTable
ALTER TABLE "Filial" DROP COLUMN "codigo",
ADD COLUMN     "codigo" INTEGER NOT NULL;
