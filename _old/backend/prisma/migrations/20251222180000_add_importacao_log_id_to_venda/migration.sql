-- AlterTable: Adicionar campo importacaoLogId à tabela Venda
ALTER TABLE "Venda" ADD COLUMN IF NOT EXISTS "importacaoLogId" TEXT;

-- CreateIndex: Criar índice para performance em deleção de importações
CREATE INDEX IF NOT EXISTS "Venda_importacaoLogId_idx" ON "Venda"("importacaoLogId");

-- AddForeignKey: Adicionar foreign key (opcional, mas recomendado para integridade)
-- NOTA: Usando onDelete: SetNull para não deletar vendas se o log for deletado diretamente
-- A deleção será controlada pelo código da aplicação
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'Venda_importacaoLogId_fkey'
    AND conrelid = '"Venda"'::regclass
  ) THEN
    ALTER TABLE "Venda"
    ADD CONSTRAINT "Venda_importacaoLogId_fkey"
    FOREIGN KEY ("importacaoLogId") REFERENCES "VendaImportacaoLog"("id")
    ON DELETE SET NULL;
  END IF;
END $$;
