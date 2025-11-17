-- AlterTable
-- Adicionar coluna como nullable primeiro
ALTER TABLE "Upload" ADD COLUMN "nomeArquivo" TEXT;

-- Atualizar registros existentes com o nome do arquivo extraído do arquivoUrl (se possível)
-- Para registros existentes, vamos usar o filename do arquivoUrl como fallback
UPDATE "Upload" 
SET "nomeArquivo" = SUBSTRING("arquivoUrl" FROM '/([^/]+)$')
WHERE "nomeArquivo" IS NULL;

-- Se ainda houver registros vazios, usar um nome padrão
UPDATE "Upload" 
SET "nomeArquivo" = 'arquivo_anterior.xls'
WHERE "nomeArquivo" IS NULL;

-- Agora tornar o campo NOT NULL
ALTER TABLE "Upload" ALTER COLUMN "nomeArquivo" SET NOT NULL;

