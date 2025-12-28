-- CreateEnum
CREATE TYPE "TipoAlteracaoAta" AS ENUM ('CRIACAO', 'EDICAO', 'EXCLUSAO', 'MUDANCA_STATUS', 'ADICAO_HISTORICO', 'EDICAO_HISTORICO', 'EXCLUSAO_HISTORICO', 'ADICAO_PRAZO', 'EDICAO_PRAZO', 'EXCLUSAO_PRAZO', 'CONCLUSAO_PRAZO', 'ADICAO_COMENTARIO', 'EDICAO_COMENTARIO', 'EXCLUSAO_COMENTARIO', 'UPLOAD_ARQUIVO', 'DOWNLOAD_ARQUIVO');

-- CreateTable
CREATE TABLE "PreferenciaNotificacao" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "emailAtivo" BOOLEAN NOT NULL DEFAULT true,
    "sistemaAtivo" BOOLEAN NOT NULL DEFAULT true,
    "pushAtivo" BOOLEAN NOT NULL DEFAULT false,
    "lembrete3Dias" BOOLEAN NOT NULL DEFAULT true,
    "lembrete1Dia" BOOLEAN NOT NULL DEFAULT true,
    "lembreteHoje" BOOLEAN NOT NULL DEFAULT true,
    "lembreteVencido" BOOLEAN NOT NULL DEFAULT true,
    "horarioInicio" TEXT NOT NULL DEFAULT '08:00',
    "horarioFim" TEXT NOT NULL DEFAULT '18:00',
    "diasSemana" TEXT[] DEFAULT ARRAY['segunda', 'terca', 'quarta', 'quinta', 'sexta']::TEXT[],
    "notificarPrazos" BOOLEAN NOT NULL DEFAULT true,
    "notificarHistorico" BOOLEAN NOT NULL DEFAULT false,
    "notificarComentarios" BOOLEAN NOT NULL DEFAULT false,
    "notificarStatus" BOOLEAN NOT NULL DEFAULT true,
    "resumoDiario" BOOLEAN NOT NULL DEFAULT false,
    "resumoSemanal" BOOLEAN NOT NULL DEFAULT true,
    "diaResumoSemanal" TEXT NOT NULL DEFAULT 'segunda',
    "horarioResumoSemanal" TEXT NOT NULL DEFAULT '09:00',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreferenciaNotificacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogAlteracaoAta" (
    "id" TEXT NOT NULL,
    "ataId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tipoAlteracao" "TipoAlteracaoAta" NOT NULL,
    "campo" TEXT,
    "valorAnterior" TEXT,
    "valorNovo" TEXT,
    "descricao" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LogAlteracaoAta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PreferenciaNotificacao_usuarioId_key" ON "PreferenciaNotificacao"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_usuarioId_endpoint_key" ON "PushSubscription"("usuarioId", "endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_usuarioId_idx" ON "PushSubscription"("usuarioId");

-- CreateIndex
CREATE INDEX "LogAlteracaoAta_ataId_idx" ON "LogAlteracaoAta"("ataId");

-- CreateIndex
CREATE INDEX "LogAlteracaoAta_usuarioId_idx" ON "LogAlteracaoAta"("usuarioId");

-- CreateIndex
CREATE INDEX "LogAlteracaoAta_tipoAlteracao_idx" ON "LogAlteracaoAta"("tipoAlteracao");

-- CreateIndex
CREATE INDEX "LogAlteracaoAta_createdAt_idx" ON "LogAlteracaoAta"("createdAt");

-- AddForeignKey
ALTER TABLE "PreferenciaNotificacao" ADD CONSTRAINT "PreferenciaNotificacao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey (LogAlteracaoAta.usuarioId only - ataId FK will be added later when AtaReuniao exists)
ALTER TABLE "LogAlteracaoAta" ADD CONSTRAINT "LogAlteracaoAta_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

