-- Esta migração adiciona campos às tabelas de Atas já existentes
-- As tabelas ModeloAta, HistoricoAndamento, PrazoAcao e LembretePrazo já foram criadas pela migração 20251226000000_create_ata_reuniao_tables

-- AlterTable AtaReuniao - adiciona campos que podem não existir
DO $$ 
BEGIN
  -- Adicionar dataAssinatura se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'AtaReuniao' AND column_name = 'dataAssinatura'
  ) THEN
    ALTER TABLE "AtaReuniao" ADD COLUMN "dataAssinatura" TIMESTAMP(3);
  END IF;
  
  -- Adicionar dataRegistro se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'AtaReuniao' AND column_name = 'dataRegistro'
  ) THEN
    ALTER TABLE "AtaReuniao" ADD COLUMN "dataRegistro" TIMESTAMP(3);
  END IF;
  
  -- Adicionar cartorioRegistro se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'AtaReuniao' AND column_name = 'cartorioRegistro'
  ) THEN
    ALTER TABLE "AtaReuniao" ADD COLUMN "cartorioRegistro" TEXT;
  END IF;
  
  -- Adicionar numeroRegistro se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'AtaReuniao' AND column_name = 'numeroRegistro'
  ) THEN
    ALTER TABLE "AtaReuniao" ADD COLUMN "numeroRegistro" TEXT;
  END IF;
  
  -- Adicionar pendenteAssinatura se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'AtaReuniao' AND column_name = 'pendenteAssinatura'
  ) THEN
    ALTER TABLE "AtaReuniao" ADD COLUMN "pendenteAssinatura" BOOLEAN NOT NULL DEFAULT false;
  END IF;
  
  -- Adicionar pendenteRegistro se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'AtaReuniao' AND column_name = 'pendenteRegistro'
  ) THEN
    ALTER TABLE "AtaReuniao" ADD COLUMN "pendenteRegistro" BOOLEAN NOT NULL DEFAULT false;
  END IF;
  
  -- Adicionar modeloAtaId se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'AtaReuniao' AND column_name = 'modeloAtaId'
  ) THEN
    ALTER TABLE "AtaReuniao" ADD COLUMN "modeloAtaId" TEXT;
  END IF;
  
END $$;

-- AddForeignKey (caso não exista)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AtaReuniao_modeloAtaId_fkey') THEN
    ALTER TABLE "AtaReuniao" ADD CONSTRAINT "AtaReuniao_modeloAtaId_fkey" FOREIGN KEY ("modeloAtaId") REFERENCES "ModeloAta"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey (Missing from earlier migration - LogAlteracaoAta to AtaReuniao)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'LogAlteracaoAta') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LogAlteracaoAta_ataId_fkey') THEN
      ALTER TABLE "LogAlteracaoAta" ADD CONSTRAINT "LogAlteracaoAta_ataId_fkey" FOREIGN KEY ("ataId") REFERENCES "AtaReuniao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
