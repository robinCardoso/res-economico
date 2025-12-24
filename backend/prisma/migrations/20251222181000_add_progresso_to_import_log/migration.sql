-- AlterTable: Adicionar campos de progresso à tabela VendaImportacaoLog
ALTER TABLE "VendaImportacaoLog" ADD COLUMN IF NOT EXISTS "progresso" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "VendaImportacaoLog" ADD COLUMN IF NOT EXISTS "linhasProcessadas" INTEGER NOT NULL DEFAULT 0;
