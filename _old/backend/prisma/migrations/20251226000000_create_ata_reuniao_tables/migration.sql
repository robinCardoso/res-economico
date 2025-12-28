-- CreateEnum for TipoReuniao
DO $$ BEGIN
  CREATE TYPE "TipoReuniao" AS ENUM ('ASSEMBLEIA_GERAL', 'CONSELHO_DIRETOR', 'REUNIAO_ORDINARIA', 'REUNIAO_EXTRAORDINARIA', 'COMISSAO', 'OUTRO');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateEnum for StatusAta (if not exists)
DO $$ BEGIN
  CREATE TYPE "StatusAta" AS ENUM ('RASCUNHO', 'EM_PROCESSO', 'FINALIZADA', 'PUBLICADA', 'ARQUIVADA');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateEnum for StatusPrazo
DO $$ BEGIN
  CREATE TYPE "StatusPrazo" AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDO', 'VENCIDO', 'CANCELADO');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateEnum for TipoLembrete
DO $$ BEGIN
  CREATE TYPE "TipoLembrete" AS ENUM ('EMAIL', 'NOTIFICACAO_SISTEMA', 'AMBOS');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateEnum for TipoArquivoAta
DO $$ BEGIN
  CREATE TYPE "TipoArquivoAta" AS ENUM ('DOCUMENTO', 'IMAGEM', 'PDF', 'PLANILHA', 'OUTRO');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateEnum for TipoComentario
DO $$ BEGIN
  CREATE TYPE "TipoComentario" AS ENUM ('COMENTARIO', 'SUGESTAO', 'APROVACAO', 'REPROVACAO');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable AtaReuniao
CREATE TABLE IF NOT EXISTS "AtaReuniao" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "tipo" "TipoReuniao" NOT NULL,
    "dataReuniao" TIMESTAMP(3) NOT NULL,
    "local" TEXT,
    "status" "StatusAta" NOT NULL DEFAULT 'RASCUNHO',
    
    -- Conteúdo
    "pauta" TEXT,
    "conteudo" TEXT,
    "descricao" TEXT,
    "resumo" TEXT,
    "pautas" JSONB,
    "decisoes" JSONB,
    "acoes" JSONB,
    "observacoes" TEXT,
    
    -- Metadados de IA
    "geradoPorIa" BOOLEAN,
    "iaUsada" TEXT,
    "modeloIa" TEXT,
    "custoIa" TEXT,
    "tempoProcessamentoIa" INTEGER,
    
    -- Arquivo original
    "arquivoOriginalUrl" TEXT,
    "arquivoOriginalNome" TEXT,
    "arquivoOriginalTipo" TEXT,
    
    -- Novos campos para "Em Processo"
    "dataAssinatura" TIMESTAMP(3),
    "dataRegistro" TIMESTAMP(3),
    "cartorioRegistro" TEXT,
    "numeroRegistro" TEXT,
    "pendenteAssinatura" BOOLEAN NOT NULL DEFAULT false,
    "pendenteRegistro" BOOLEAN NOT NULL DEFAULT false,
    
    -- Relacionamento com modelo
    "modeloAtaId" TEXT,
    
    -- Relacionamentos
    "criadoPor" TEXT NOT NULL,
    "empresaId" TEXT,
    
    -- Metadados
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AtaReuniao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AtaReuniao_numero_key" ON "AtaReuniao"("numero");
CREATE INDEX "AtaReuniao_dataReuniao_idx" ON "AtaReuniao"("dataReuniao");
CREATE INDEX "AtaReuniao_status_idx" ON "AtaReuniao"("status");
CREATE INDEX "AtaReuniao_empresaId_idx" ON "AtaReuniao"("empresaId");
CREATE INDEX "AtaReuniao_criadoPor_idx" ON "AtaReuniao"("criadoPor");
CREATE INDEX "AtaReuniao_tipo_idx" ON "AtaReuniao"("tipo");

-- CreateTable AtaParticipante
CREATE TABLE IF NOT EXISTS "AtaParticipante" (
    "id" TEXT NOT NULL,
    "ataId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "nomeExterno" TEXT,
    "email" TEXT,
    "cargo" TEXT,
    "presente" BOOLEAN NOT NULL DEFAULT true,
    "observacoes" TEXT,

    CONSTRAINT "AtaParticipante_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AtaParticipante_ataId_idx" ON "AtaParticipante"("ataId");
CREATE INDEX "AtaParticipante_usuarioId_idx" ON "AtaParticipante"("usuarioId");

-- CreateTable AtaAnexo
CREATE TABLE IF NOT EXISTS "AtaAnexo" (
    "id" TEXT NOT NULL,
    "ataId" TEXT NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "urlArquivo" TEXT NOT NULL,
    "tipoArquivo" "TipoArquivoAta" NOT NULL,
    "tamanhoArquivo" INTEGER,
    "mimeType" TEXT,
    "uploadedBy" TEXT,
    "descricao" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AtaAnexo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AtaAnexo_ataId_idx" ON "AtaAnexo"("ataId");

-- CreateTable AtaComentario
CREATE TABLE IF NOT EXISTS "AtaComentario" (
    "id" TEXT NOT NULL,
    "ataId" TEXT NOT NULL,
    "comentario" TEXT NOT NULL,
    "tipo" "TipoComentario" NOT NULL,
    "autorId" TEXT NOT NULL,
    "comentarioPaiId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AtaComentario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AtaComentario_ataId_idx" ON "AtaComentario"("ataId");
CREATE INDEX "AtaComentario_autorId_idx" ON "AtaComentario"("autorId");
CREATE INDEX "AtaComentario_comentarioPaiId_idx" ON "AtaComentario"("comentarioPaiId");

-- CreateTable ModeloAta
CREATE TABLE IF NOT EXISTS "ModeloAta" (
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

-- CreateIndex
CREATE INDEX "ModeloAta_tipoReuniao_idx" ON "ModeloAta"("tipoReuniao");
CREATE INDEX "ModeloAta_empresaId_idx" ON "ModeloAta"("empresaId");
CREATE INDEX "ModeloAta_ativo_idx" ON "ModeloAta"("ativo");

-- CreateTable HistoricoAndamento
CREATE TABLE IF NOT EXISTS "HistoricoAndamento" (
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

-- CreateIndex
CREATE INDEX "HistoricoAndamento_ataId_idx" ON "HistoricoAndamento"("ataId");
CREATE INDEX "HistoricoAndamento_data_idx" ON "HistoricoAndamento"("data");

-- CreateTable PrazoAcao
CREATE TABLE IF NOT EXISTS "PrazoAcao" (
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

-- CreateIndex
CREATE INDEX "PrazoAcao_ataId_idx" ON "PrazoAcao"("ataId");
CREATE INDEX "PrazoAcao_dataPrazo_idx" ON "PrazoAcao"("dataPrazo");
CREATE INDEX "PrazoAcao_status_idx" ON "PrazoAcao"("status");
CREATE INDEX "PrazoAcao_concluido_idx" ON "PrazoAcao"("concluido");

-- CreateTable LembretePrazo
CREATE TABLE IF NOT EXISTS "LembretePrazo" (
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
CREATE INDEX "LembretePrazo_prazoId_idx" ON "LembretePrazo"("prazoId");
CREATE INDEX "LembretePrazo_usuarioId_idx" ON "LembretePrazo"("usuarioId");
CREATE INDEX "LembretePrazo_enviado_idx" ON "LembretePrazo"("enviado");

-- AddForeignKey constraints
DO $$ 
BEGIN
  -- AtaReuniao -> Usuario (criadoPor)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AtaReuniao_criadoPor_fkey') THEN
    ALTER TABLE "AtaReuniao" ADD CONSTRAINT "AtaReuniao_criadoPor_fkey" FOREIGN KEY ("criadoPor") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  
  -- AtaReuniao -> Empresa
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AtaReuniao_empresaId_fkey') THEN
    ALTER TABLE "AtaReuniao" ADD CONSTRAINT "AtaReuniao_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  
  -- AtaReuniao -> ModeloAta
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AtaReuniao_modeloAtaId_fkey') THEN
    ALTER TABLE "AtaReuniao" ADD CONSTRAINT "AtaReuniao_modeloAtaId_fkey" FOREIGN KEY ("modeloAtaId") REFERENCES "ModeloAta"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  
  -- AtaParticipante -> AtaReuniao
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AtaParticipante_ataId_fkey') THEN
    ALTER TABLE "AtaParticipante" ADD CONSTRAINT "AtaParticipante_ataId_fkey" FOREIGN KEY ("ataId") REFERENCES "AtaReuniao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  
  -- AtaParticipante -> Usuario
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AtaParticipante_usuarioId_fkey') THEN
    ALTER TABLE "AtaParticipante" ADD CONSTRAINT "AtaParticipante_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  
  -- AtaAnexo -> AtaReuniao
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AtaAnexo_ataId_fkey') THEN
    ALTER TABLE "AtaAnexo" ADD CONSTRAINT "AtaAnexo_ataId_fkey" FOREIGN KEY ("ataId") REFERENCES "AtaReuniao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  
  -- AtaComentario -> AtaReuniao
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AtaComentario_ataId_fkey') THEN
    ALTER TABLE "AtaComentario" ADD CONSTRAINT "AtaComentario_ataId_fkey" FOREIGN KEY ("ataId") REFERENCES "AtaReuniao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  
  -- AtaComentario -> Usuario (autorId)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AtaComentario_autorId_fkey') THEN
    ALTER TABLE "AtaComentario" ADD CONSTRAINT "AtaComentario_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  
  -- AtaComentario -> AtaComentario (comentarioPaiId)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AtaComentario_comentarioPaiId_fkey') THEN
    ALTER TABLE "AtaComentario" ADD CONSTRAINT "AtaComentario_comentarioPaiId_fkey" FOREIGN KEY ("comentarioPaiId") REFERENCES "AtaComentario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  
  -- ModeloAta -> Usuario (criadoPor)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ModeloAta_criadoPor_fkey') THEN
    ALTER TABLE "ModeloAta" ADD CONSTRAINT "ModeloAta_criadoPor_fkey" FOREIGN KEY ("criadoPor") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  
  -- ModeloAta -> Empresa
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ModeloAta_empresaId_fkey') THEN
    ALTER TABLE "ModeloAta" ADD CONSTRAINT "ModeloAta_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  
  -- HistoricoAndamento -> AtaReuniao
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'HistoricoAndamento_ataId_fkey') THEN
    ALTER TABLE "HistoricoAndamento" ADD CONSTRAINT "HistoricoAndamento_ataId_fkey" FOREIGN KEY ("ataId") REFERENCES "AtaReuniao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  
  -- HistoricoAndamento -> Usuario (criadoPor)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'HistoricoAndamento_criadoPor_fkey') THEN
    ALTER TABLE "HistoricoAndamento" ADD CONSTRAINT "HistoricoAndamento_criadoPor_fkey" FOREIGN KEY ("criadoPor") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  
  -- PrazoAcao -> AtaReuniao
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PrazoAcao_ataId_fkey') THEN
    ALTER TABLE "PrazoAcao" ADD CONSTRAINT "PrazoAcao_ataId_fkey" FOREIGN KEY ("ataId") REFERENCES "AtaReuniao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  
  -- PrazoAcao -> Usuario (criadoPor)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PrazoAcao_criadoPor_fkey') THEN
    ALTER TABLE "PrazoAcao" ADD CONSTRAINT "PrazoAcao_criadoPor_fkey" FOREIGN KEY ("criadoPor") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  
  -- LembretePrazo -> PrazoAcao
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LembretePrazo_prazoId_fkey') THEN
    ALTER TABLE "LembretePrazo" ADD CONSTRAINT "LembretePrazo_prazoId_fkey" FOREIGN KEY ("prazoId") REFERENCES "PrazoAcao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  
  -- LembretePrazo -> Usuario
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LembretePrazo_usuarioId_fkey') THEN
    ALTER TABLE "LembretePrazo" ADD CONSTRAINT "LembretePrazo_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  
  -- LogAlteracaoAta -> AtaReuniao (if LogAlteracaoAta exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'LogAlteracaoAta') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LogAlteracaoAta_ataId_fkey') THEN
      ALTER TABLE "LogAlteracaoAta" ADD CONSTRAINT "LogAlteracaoAta_ataId_fkey" FOREIGN KEY ("ataId") REFERENCES "AtaReuniao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END IF;
  
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN others THEN 
    RAISE WARNING 'Error adding foreign key: %', SQLERRM;
END $$;
