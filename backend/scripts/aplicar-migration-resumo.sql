-- Migration para adicionar ResumoEconomico
-- Execute este script diretamente no PostgreSQL se a migration automática falhar

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "ResumoStatus" AS ENUM ('PROCESSANDO', 'CONCLUIDO', 'ERRO', 'CANCELADO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "ResumoEconomico" (
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

-- CreateIndex (IF NOT EXISTS não funciona para índices, então verificamos antes)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'ResumoEconomico_empresaId_ano_mes_idx'
    ) THEN
        CREATE INDEX "ResumoEconomico_empresaId_ano_mes_idx" ON "ResumoEconomico"("empresaId", "ano", "mes");
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'ResumoEconomico_criadoPor_createdAt_idx'
    ) THEN
        CREATE INDEX "ResumoEconomico_criadoPor_createdAt_idx" ON "ResumoEconomico"("criadoPor", "createdAt");
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'ResumoEconomico_status_idx'
    ) THEN
        CREATE INDEX "ResumoEconomico_status_idx" ON "ResumoEconomico"("status");
    END IF;
END $$;

-- AddForeignKey (verificando se já existe)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'ResumoEconomico_empresaId_fkey'
    ) THEN
        ALTER TABLE "ResumoEconomico" 
        ADD CONSTRAINT "ResumoEconomico_empresaId_fkey" 
        FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'ResumoEconomico_uploadId_fkey'
    ) THEN
        ALTER TABLE "ResumoEconomico" 
        ADD CONSTRAINT "ResumoEconomico_uploadId_fkey" 
        FOREIGN KEY ("uploadId") REFERENCES "Upload"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'ResumoEconomico_criadoPor_fkey'
    ) THEN
        ALTER TABLE "ResumoEconomico" 
        ADD CONSTRAINT "ResumoEconomico_criadoPor_fkey" 
        FOREIGN KEY ("criadoPor") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

