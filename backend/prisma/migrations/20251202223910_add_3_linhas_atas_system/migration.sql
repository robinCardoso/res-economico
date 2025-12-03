-- AlterEnum
ALTER TYPE "StatusAta" ADD VALUE 'EM_PROCESSO';
ALTER TYPE "StatusAta" ADD VALUE 'FINALIZADA';

-- CreateEnum (criar antes de usar)
CREATE TYPE "StatusPrazo" AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDO', 'VENCIDO', 'CANCELADO');

-- CreateEnum (criar antes de usar)
CREATE TYPE "TipoLembrete" AS ENUM ('EMAIL', 'NOTIFICACAO_SISTEMA', 'AMBOS');

-- AlterTable
ALTER TABLE "AtaReuniao" ADD COLUMN "dataAssinatura" TIMESTAMP(3),
ADD COLUMN "dataRegistro" TIMESTAMP(3),
ADD COLUMN "cartorioRegistro" TEXT,
ADD COLUMN "numeroRegistro" TEXT,
ADD COLUMN "pendenteAssinatura" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "pendenteRegistro" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "modeloAtaId" TEXT;

-- CreateTable
CREATE TABLE "ModeloAta" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "tipoReuniao" "TipoReuniao" NOT NULL,
    "estrutura" JSONB NOT NULL,
    "exemplo" JSONB,
    "instrucoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoPor" TEXT NOT NULL,
    "empresaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModeloAta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoricoAndamento" (
    "id" TEXT NOT NULL,
    "ataId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acao" TEXT NOT NULL,
    "descricao" TEXT,
    "responsavel" TEXT,
    "criadoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistoricoAndamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrazoAcao" (
    "id" TEXT NOT NULL,
    "ataId" TEXT NOT NULL,
    "acaoId" TEXT,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "dataPrazo" TIMESTAMP(3) NOT NULL,
    "dataConclusao" TIMESTAMP(3),
    "status" "StatusPrazo" NOT NULL DEFAULT 'PENDENTE',
    "concluido" BOOLEAN NOT NULL DEFAULT false,
    "lembretesEnviados" INTEGER NOT NULL DEFAULT 0,
    "ultimoLembrete" TIMESTAMP(3),
    "criadoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrazoAcao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LembretePrazo" (
    "id" TEXT NOT NULL,
    "prazoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tipo" "TipoLembrete" NOT NULL,
    "mensagem" TEXT NOT NULL,
    "enviado" BOOLEAN NOT NULL DEFAULT false,
    "dataEnvio" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LembretePrazo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ModeloAta_tipoReuniao_idx" ON "ModeloAta"("tipoReuniao");

-- CreateIndex
CREATE INDEX "ModeloAta_empresaId_idx" ON "ModeloAta"("empresaId");

-- CreateIndex
CREATE INDEX "ModeloAta_ativo_idx" ON "ModeloAta"("ativo");

-- CreateIndex
CREATE INDEX "HistoricoAndamento_ataId_idx" ON "HistoricoAndamento"("ataId");

-- CreateIndex
CREATE INDEX "HistoricoAndamento_data_idx" ON "HistoricoAndamento"("data");

-- CreateIndex
CREATE INDEX "PrazoAcao_ataId_idx" ON "PrazoAcao"("ataId");

-- CreateIndex
CREATE INDEX "PrazoAcao_dataPrazo_idx" ON "PrazoAcao"("dataPrazo");

-- CreateIndex
CREATE INDEX "PrazoAcao_status_idx" ON "PrazoAcao"("status");

-- CreateIndex
CREATE INDEX "PrazoAcao_concluido_idx" ON "PrazoAcao"("concluido");

-- CreateIndex
CREATE INDEX "LembretePrazo_prazoId_idx" ON "LembretePrazo"("prazoId");

-- CreateIndex
CREATE INDEX "LembretePrazo_usuarioId_idx" ON "LembretePrazo"("usuarioId");

-- CreateIndex
CREATE INDEX "LembretePrazo_enviado_idx" ON "LembretePrazo"("enviado");

-- AddForeignKey
ALTER TABLE "AtaReuniao" ADD CONSTRAINT "AtaReuniao_modeloAtaId_fkey" FOREIGN KEY ("modeloAtaId") REFERENCES "ModeloAta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModeloAta" ADD CONSTRAINT "ModeloAta_criadoPor_fkey" FOREIGN KEY ("criadoPor") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModeloAta" ADD CONSTRAINT "ModeloAta_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricoAndamento" ADD CONSTRAINT "HistoricoAndamento_ataId_fkey" FOREIGN KEY ("ataId") REFERENCES "AtaReuniao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricoAndamento" ADD CONSTRAINT "HistoricoAndamento_criadoPor_fkey" FOREIGN KEY ("criadoPor") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrazoAcao" ADD CONSTRAINT "PrazoAcao_ataId_fkey" FOREIGN KEY ("ataId") REFERENCES "AtaReuniao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrazoAcao" ADD CONSTRAINT "PrazoAcao_criadoPor_fkey" FOREIGN KEY ("criadoPor") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LembretePrazo" ADD CONSTRAINT "LembretePrazo_prazoId_fkey" FOREIGN KEY ("prazoId") REFERENCES "PrazoAcao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LembretePrazo" ADD CONSTRAINT "LembretePrazo_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

