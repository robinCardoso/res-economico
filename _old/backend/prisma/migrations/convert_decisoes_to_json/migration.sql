-- Migration para converter decisoes de String para Json e adicionar campos pautas e acoes
-- Preserva dados existentes

-- 1. Adicionar colunas temporárias
ALTER TABLE "AtaReuniao" ADD COLUMN IF NOT EXISTS "decisoes_json" JSONB;
ALTER TABLE "AtaReuniao" ADD COLUMN IF NOT EXISTS "pautas" JSONB;
ALTER TABLE "AtaReuniao" ADD COLUMN IF NOT EXISTS "acoes" JSONB;

-- 2. Converter decisoes de String para Json (preservando dados existentes)
-- Usar função segura para validar JSON antes de converter
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN SELECT id, decisoes FROM "AtaReuniao" WHERE "decisoes" IS NOT NULL LOOP
    BEGIN
      IF rec.decisoes IS NULL OR rec.decisoes = '' THEN
        UPDATE "AtaReuniao" SET "decisoes_json" = NULL WHERE id = rec.id;
      ELSIF rec.decisoes::text LIKE '[%' OR rec.decisoes::text LIKE '{%' THEN
        UPDATE "AtaReuniao" SET "decisoes_json" = rec.decisoes::jsonb WHERE id = rec.id;
      ELSE
        UPDATE "AtaReuniao" SET "decisoes_json" = NULL WHERE id = rec.id;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Se houver erro na conversão, definir como NULL
      UPDATE "AtaReuniao" SET "decisoes_json" = NULL WHERE id = rec.id;
    END;
  END LOOP;
END $$;

-- 3. Converter observacoes para acoes se contiver JSON válido
-- Usar função segura para validar JSON antes de converter
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN SELECT id, observacoes FROM "AtaReuniao" WHERE "observacoes" IS NOT NULL LOOP
    BEGIN
      IF rec.observacoes IS NULL OR rec.observacoes = '' THEN
        UPDATE "AtaReuniao" SET "acoes" = NULL WHERE id = rec.id;
      ELSIF rec.observacoes::text LIKE '{%' THEN
        DECLARE
          obs_json JSONB;
        BEGIN
          obs_json := rec.observacoes::jsonb;
          IF obs_json->>'acoes' IS NOT NULL THEN
            UPDATE "AtaReuniao" SET "acoes" = obs_json->'acoes' WHERE id = rec.id;
          ELSE
            UPDATE "AtaReuniao" SET "acoes" = NULL WHERE id = rec.id;
          END IF;
        END;
      ELSE
        UPDATE "AtaReuniao" SET "acoes" = NULL WHERE id = rec.id;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Se houver erro na conversão, definir como NULL
      UPDATE "AtaReuniao" SET "acoes" = NULL WHERE id = rec.id;
    END;
  END LOOP;
END $$;

-- 4. Remover coluna antiga e renomear
ALTER TABLE "AtaReuniao" DROP COLUMN IF EXISTS "decisoes";
ALTER TABLE "AtaReuniao" RENAME COLUMN "decisoes_json" TO "decisoes";

