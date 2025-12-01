-- Migration para converter decisoes de String para Json e adicionar campos pautas e acoes
-- Preserva dados existentes

-- 1. Adicionar colunas temporárias
ALTER TABLE "AtaReuniao" ADD COLUMN IF NOT EXISTS "decisoes_json" JSONB;
ALTER TABLE "AtaReuniao" ADD COLUMN IF NOT EXISTS "pautas" JSONB;
ALTER TABLE "AtaReuniao" ADD COLUMN IF NOT EXISTS "acoes" JSONB;

-- 2. Converter decisoes de String para Json (preservando dados existentes)
UPDATE "AtaReuniao"
SET "decisoes_json" = CASE
  WHEN "decisoes" IS NULL OR "decisoes" = '' THEN NULL
  WHEN "decisoes"::text LIKE '[%' OR "decisoes"::text LIKE '{%' THEN "decisoes"::jsonb
  ELSE NULL
END
WHERE "decisoes" IS NOT NULL;

-- 3. Converter observacoes para acoes se contiver JSON válido
UPDATE "AtaReuniao"
SET "acoes" = CASE
  WHEN "observacoes" IS NULL OR "observacoes" = '' THEN NULL
  WHEN "observacoes"::text LIKE '{%' THEN 
    CASE 
      WHEN ("observacoes"::jsonb->>'acoes') IS NOT NULL THEN ("observacoes"::jsonb->'acoes')
      ELSE NULL
    END
  ELSE NULL
END
WHERE "observacoes" IS NOT NULL;

-- 4. Remover coluna antiga e renomear
ALTER TABLE "AtaReuniao" DROP COLUMN IF EXISTS "decisoes";
ALTER TABLE "AtaReuniao" RENAME COLUMN "decisoes_json" TO "decisoes";

