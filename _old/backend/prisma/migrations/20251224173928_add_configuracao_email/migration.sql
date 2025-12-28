-- CreateEnum
CREATE TYPE "StatusEnvioEmail" AS ENUM ('PENDENTE', 'ENVIADO', 'FALHA', 'CANCELADO');

-- CreateTable
CREATE TABLE "ConfiguracaoEmail" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "porta" INTEGER NOT NULL,
    "autenticar" BOOLEAN NOT NULL DEFAULT true,
    "usuario" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "copiasPara" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracaoEmail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogEnvioEmail" (
    "id" TEXT NOT NULL,
    "configuracaoId" TEXT NOT NULL,
    "destinatario" TEXT NOT NULL,
    "assunto" TEXT NOT NULL,
    "corpo" TEXT,
    "status" "StatusEnvioEmail" NOT NULL DEFAULT 'PENDENTE',
    "erro" TEXT,
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "enviadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LogEnvioEmail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConfiguracaoEmail_ativo_idx" ON "ConfiguracaoEmail"("ativo");

-- CreateIndex
CREATE INDEX "LogEnvioEmail_configuracaoId_idx" ON "LogEnvioEmail"("configuracaoId");

-- CreateIndex
CREATE INDEX "LogEnvioEmail_status_idx" ON "LogEnvioEmail"("status");

-- CreateIndex
CREATE INDEX "LogEnvioEmail_createdAt_idx" ON "LogEnvioEmail"("createdAt");

-- CreateIndex
CREATE INDEX "LogEnvioEmail_destinatario_idx" ON "LogEnvioEmail"("destinatario");

-- AddForeignKey
ALTER TABLE "LogEnvioEmail" ADD CONSTRAINT "LogEnvioEmail_configuracaoId_fkey" FOREIGN KEY ("configuracaoId") REFERENCES "ConfiguracaoEmail"("id") ON DELETE CASCADE ON UPDATE CASCADE;

