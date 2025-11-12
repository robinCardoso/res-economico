-- CreateEnum
CREATE TYPE "UploadStatus" AS ENUM ('PROCESSANDO', 'CONCLUIDO', 'COM_ALERTAS', 'CANCELADO');

-- CreateEnum
CREATE TYPE "AlertaTipo" AS ENUM ('SALDO_DIVERGENTE', 'CONTA_NOVA', 'DADO_INCONSISTENTE');

-- CreateEnum
CREATE TYPE "AlertaSeveridade" AS ENUM ('BAIXA', 'MEDIA', 'ALTA');

-- CreateEnum
CREATE TYPE "AlertaStatus" AS ENUM ('ABERTO', 'EM_ANALISE', 'RESOLVIDO');

-- CreateEnum
CREATE TYPE "ContaStatus" AS ENUM ('ATIVA', 'NOVA', 'ARQUIVADA');

-- CreateTable
CREATE TABLE "Empresa" (
    "id" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "razaoSocial" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Filial" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Filial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateImportacao" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "filialId" TEXT,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "configuracao" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TemplateImportacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Upload" (
    "id" TEXT NOT NULL,
    "filialId" TEXT NOT NULL,
    "templateId" TEXT,
    "mes" INTEGER NOT NULL,
    "ano" INTEGER NOT NULL,
    "arquivoUrl" TEXT NOT NULL,
    "hashArquivo" TEXT NOT NULL,
    "status" "UploadStatus" NOT NULL DEFAULT 'PROCESSANDO',
    "totalLinhas" INTEGER NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Upload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LinhaUpload" (
    "id" TEXT NOT NULL,
    "uploadId" TEXT NOT NULL,
    "classificacao" TEXT NOT NULL,
    "conta" TEXT NOT NULL,
    "subConta" TEXT,
    "nomeConta" TEXT NOT NULL,
    "tipoConta" TEXT NOT NULL,
    "nivel" INTEGER NOT NULL,
    "titulo" BOOLEAN NOT NULL,
    "estabelecimento" BOOLEAN NOT NULL,
    "saldoAnterior" DECIMAL(18,2) NOT NULL,
    "debito" DECIMAL(18,2) NOT NULL,
    "credito" DECIMAL(18,2) NOT NULL,
    "saldoAtual" DECIMAL(18,2) NOT NULL,
    "hashLinha" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LinhaUpload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContaCatalogo" (
    "id" TEXT NOT NULL,
    "filialId" TEXT NOT NULL,
    "classificacao" TEXT NOT NULL,
    "nomeConta" TEXT NOT NULL,
    "tipoConta" TEXT NOT NULL,
    "nivel" INTEGER NOT NULL,
    "primeiraImportacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimaImportacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ContaStatus" NOT NULL DEFAULT 'ATIVA',

    CONSTRAINT "ContaCatalogo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alerta" (
    "id" TEXT NOT NULL,
    "uploadId" TEXT NOT NULL,
    "linhaId" TEXT,
    "tipo" "AlertaTipo" NOT NULL,
    "severidade" "AlertaSeveridade" NOT NULL,
    "mensagem" TEXT NOT NULL,
    "status" "AlertaStatus" NOT NULL DEFAULT 'ABERTO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Alerta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogAuditoria" (
    "id" TEXT NOT NULL,
    "recurso" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "dados" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LogAuditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_cnpj_key" ON "Empresa"("cnpj");

-- AddForeignKey
ALTER TABLE "Filial" ADD CONSTRAINT "Filial_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateImportacao" ADD CONSTRAINT "TemplateImportacao_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateImportacao" ADD CONSTRAINT "TemplateImportacao_filialId_fkey" FOREIGN KEY ("filialId") REFERENCES "Filial"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Upload" ADD CONSTRAINT "Upload_filialId_fkey" FOREIGN KEY ("filialId") REFERENCES "Filial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Upload" ADD CONSTRAINT "Upload_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "TemplateImportacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinhaUpload" ADD CONSTRAINT "LinhaUpload_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "Upload"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContaCatalogo" ADD CONSTRAINT "ContaCatalogo_filialId_fkey" FOREIGN KEY ("filialId") REFERENCES "Filial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alerta" ADD CONSTRAINT "Alerta_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "Upload"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alerta" ADD CONSTRAINT "Alerta_linhaId_fkey" FOREIGN KEY ("linhaId") REFERENCES "LinhaUpload"("id") ON DELETE SET NULL ON UPDATE CASCADE;
