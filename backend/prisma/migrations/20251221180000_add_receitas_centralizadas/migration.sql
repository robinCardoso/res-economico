-- AlterTable: Adicionar campo receitasCentralizadas à tabela Empresa
ALTER TABLE "Empresa" ADD COLUMN "receitasCentralizadas" BOOLEAN;

-- AlterTable: Adicionar campo receitasCentralizadas à tabela ConfiguracaoModeloNegocio
ALTER TABLE "ConfiguracaoModeloNegocio" ADD COLUMN "receitasCentralizadas" BOOLEAN NOT NULL DEFAULT false;

