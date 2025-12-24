-- CreateTable
CREATE TABLE IF NOT EXISTS "VendaColumnMapping" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "columnMapping" JSONB NOT NULL,
    "filters" JSONB,
    "descricao" TEXT,
    "usuarioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendaColumnMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "VendaColumnMapping_usuarioId_idx" ON "VendaColumnMapping"("usuarioId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "VendaColumnMapping_createdAt_idx" ON "VendaColumnMapping"("createdAt");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'VendaColumnMapping_usuarioId_fkey'
        AND conrelid = '"VendaColumnMapping"'::regclass
    ) THEN
        ALTER TABLE "VendaColumnMapping" ADD CONSTRAINT "VendaColumnMapping_usuarioId_fkey" 
        FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
