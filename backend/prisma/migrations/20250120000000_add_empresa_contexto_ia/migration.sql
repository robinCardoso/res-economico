-- CreateEnum
CREATE TYPE "PorteEmpresa" AS ENUM ('MICRO', 'PEQUENA', 'MEDIA', 'GRANDE');

-- CreateEnum
CREATE TYPE "ModeloNegocio" AS ENUM ('ASSOCIACAO', 'COMERCIO', 'INDUSTRIA', 'SERVICOS', 'AGROPECUARIA', 'OUTRO');

-- AlterTable: Adicionar campos à tabela Empresa
ALTER TABLE "Empresa" ADD COLUMN "setor" TEXT;
ALTER TABLE "Empresa" ADD COLUMN "porte" "PorteEmpresa";
ALTER TABLE "Empresa" ADD COLUMN "dataFundacao" TIMESTAMP(3);
ALTER TABLE "Empresa" ADD COLUMN "descricao" TEXT;
ALTER TABLE "Empresa" ADD COLUMN "website" TEXT;
ALTER TABLE "Empresa" ADD COLUMN "modeloNegocio" "ModeloNegocio";
ALTER TABLE "Empresa" ADD COLUMN "modeloNegocioDetalhes" JSONB;
ALTER TABLE "Empresa" ADD COLUMN "contasReceita" JSONB;
ALTER TABLE "Empresa" ADD COLUMN "custosCentralizados" BOOLEAN;
ALTER TABLE "Empresa" ADD COLUMN "contasCustos" JSONB;

-- CreateTable: Configuração Global por Modelo de Negócio
CREATE TABLE "ConfiguracaoModeloNegocio" (
    "id" TEXT NOT NULL,
    "modeloNegocio" "ModeloNegocio" NOT NULL,
    "modeloNegocioDetalhes" JSONB NOT NULL,
    "contasReceita" JSONB NOT NULL,
    "contasCustos" JSONB NOT NULL,
    "custosCentralizados" BOOLEAN NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracaoModeloNegocio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Garantir que cada modelo de negócio tenha apenas uma configuração ativa
CREATE UNIQUE INDEX "ConfiguracaoModeloNegocio_modeloNegocio_key" ON "ConfiguracaoModeloNegocio"("modeloNegocio");

