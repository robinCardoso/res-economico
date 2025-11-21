-- CreateEnum
CREATE TYPE "ResumoStatus" AS ENUM ('PROCESSANDO', 'CONCLUIDO', 'ERRO', 'CANCELADO');

-- CreateTable
CREATE TABLE "ResumoEconomico" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "mes" INTEGER,
    "ano" INTEGER NOT NULL,
    "empresaId" TEXT,
    "uploadId" TEXT,
    "tipoAnalise" TEXT NOT NULL,
    "parametros" JSONB NOT NULL,
    "resultado" JSONB NOT NULL,
    "modeloIA" TEXT NOT NULL,
    "status" "ResumoStatus" NOT NULL DEFAULT 'PROCESSANDO',
    "criadoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResumoEconomico_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResumoEconomico_empresaId_ano_mes_idx" ON "ResumoEconomico"("empresaId", "ano", "mes");

-- CreateIndex
CREATE INDEX "ResumoEconomico_criadoPor_createdAt_idx" ON "ResumoEconomico"("criadoPor", "createdAt");

-- CreateIndex
CREATE INDEX "ResumoEconomico_status_idx" ON "ResumoEconomico"("status");

-- AddForeignKey
ALTER TABLE "ResumoEconomico" ADD CONSTRAINT "ResumoEconomico_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumoEconomico" ADD CONSTRAINT "ResumoEconomico_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "Upload"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumoEconomico" ADD CONSTRAINT "ResumoEconomico_criadoPor_fkey" FOREIGN KEY ("criadoPor") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

