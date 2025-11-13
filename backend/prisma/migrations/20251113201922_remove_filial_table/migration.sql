/*
  Warnings:

  - You are about to drop the column `filialId` on the `ContaCatalogo` table. All the data in the column will be lost.
  - You are about to drop the column `filialId` on the `TemplateImportacao` table. All the data in the column will be lost.
  - You are about to drop the column `filialId` on the `Upload` table. All the data in the column will be lost.
  - You are about to drop the `Filial` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `empresaId` to the `ContaCatalogo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `empresaId` to the `Upload` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ContaCatalogo" DROP CONSTRAINT "ContaCatalogo_filialId_fkey";

-- DropForeignKey
ALTER TABLE "Filial" DROP CONSTRAINT "Filial_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "TemplateImportacao" DROP CONSTRAINT "TemplateImportacao_filialId_fkey";

-- DropForeignKey
ALTER TABLE "Upload" DROP CONSTRAINT "Upload_filialId_fkey";

-- AlterTable
ALTER TABLE "ContaCatalogo" DROP COLUMN "filialId",
ADD COLUMN     "empresaId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "TemplateImportacao" DROP COLUMN "filialId";

-- AlterTable
ALTER TABLE "Upload" DROP COLUMN "filialId",
ADD COLUMN     "empresaId" TEXT NOT NULL;

-- DropTable
DROP TABLE "Filial";

-- AddForeignKey
ALTER TABLE "Upload" ADD CONSTRAINT "Upload_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContaCatalogo" ADD CONSTRAINT "ContaCatalogo_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
