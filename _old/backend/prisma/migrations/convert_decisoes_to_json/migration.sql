-- Migration para converter decisoes de String para Json e adicionar campos pautas e acoes
-- Preserva dados existentes
-- Verifica se a tabela AtaReuniao existe antes de executar

DO $$
BEGIN
  -- Verificar se a tabela AtaReuniao existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'AtaReuniao') THEN
    
    -- 1. Adicionar colunas temporárias se não existirem
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'AtaReuniao' AND column_name = 'decisoes_json') THEN
      ALTER TABLE "AtaReuniao" ADD COLUMN "decisoes_json" JSONB;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'AtaReuniao' AND column_name = 'pautas') THEN
      ALTER TABLE "AtaReuniao" ADD COLUMN "pautas" JSONB;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'AtaReuniao' AND column_name = 'acoes') THEN
      ALTER TABLE "AtaReuniao" ADD COLUMN "acoes" JSONB;
    END IF;
    
    -- 2. Converter decisoes de String para Json apenas se a coluna decisoes existir e não for JSONB
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'AtaReuniao' 
      AND column_name = 'decisoes' 
      AND data_type != 'jsonb'
    ) THEN
      -- Converter decisoes de String para Json (preservando dados existentes)
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
      END;
      
      -- 4. Remover coluna antiga e renomear se não for JSONB
      ALTER TABLE "AtaReuniao" DROP COLUMN IF EXISTS "decisoes";
      ALTER TABLE "AtaReuniao" RENAME COLUMN "decisoes_json" TO "decisoes";
    END IF;
    
    -- 3. Converter observacoes para acoes se contiver JSON válido
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'AtaReuniao' AND column_name = 'observacoes') THEN
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
      END;
    END IF;
    
  END IF; -- Fim da verificação se a tabela AtaReuniao existe
END $$;
