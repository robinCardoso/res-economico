-- CreateTable
CREATE TABLE IF NOT EXISTS "VendaAnalyticsFilter" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "descricao" TEXT,
    "usuarioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendaAnalyticsFilter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "VendaAnalyticsFilter_usuarioId_idx" ON "VendaAnalyticsFilter"("usuarioId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "VendaAnalyticsFilter_createdAt_idx" ON "VendaAnalyticsFilter"("createdAt");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'VendaAnalyticsFilter_usuarioId_fkey'
        AND conrelid = '"VendaAnalyticsFilter"'::regclass
    ) THEN
        ALTER TABLE "VendaAnalyticsFilter" ADD CONSTRAINT "VendaAnalyticsFilter_usuarioId_fkey" 
        FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
