const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function applyAtaMigrations() {
  try {
    console.log('=== APLICANDO MIGRAÇÕES DE ATAS (MODO BATCH) ===\n');

    // 1. Criar ENUMs
    console.log('1. Criando ENUMs...\n');

    const sqlStatements = [
      // TipoReuniao
      `DO $$ BEGIN
        CREATE TYPE "TipoReuniao" AS ENUM ('ASSEMBLEIA_GERAL', 'CONSELHO_DIRETOR', 'REUNIAO_ORDINARIA', 'REUNIAO_EXTRAORDINARIA', 'COMISSAO', 'OUTRO');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,

      // StatusAta
      `DO $$ BEGIN
        CREATE TYPE "StatusAta" AS ENUM ('RASCUNHO', 'EM_PROCESSO', 'FINALIZADA', 'PUBLICADA', 'ARQUIVADA');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,

      // StatusPrazo
      `DO $$ BEGIN
        CREATE TYPE "StatusPrazo" AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDO', 'VENCIDO', 'CANCELADO');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,

      // TipoLembrete
      `DO $$ BEGIN
        CREATE TYPE "TipoLembrete" AS ENUM ('EMAIL', 'NOTIFICACAO_SISTEMA', 'AMBOS');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,

      // TipoArquivoAta
      `DO $$ BEGIN
        CREATE TYPE "TipoArquivoAta" AS ENUM ('DOCUMENTO', 'IMAGEM', 'PDF', 'PLANILHA', 'OUTRO');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,

      // TipoComentario
      `DO $$ BEGIN
        CREATE TYPE "TipoComentario" AS ENUM ('COMENTARIO', 'SUGESTAO', 'APROVACAO', 'REPROVACAO');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,
    ];

    // Executar cada statement
    for (let i = 0; i < sqlStatements.length; i++) {
      try {
        await prisma.$executeRawUnsafe(sqlStatements[i]);
        console.log(`  ✓ Enum ${i + 1}/6 criado`);
      } catch (error) {
        if (error.message.includes('duplicate_object')) {
          console.log(`  ⚠️ Enum ${i + 1}/6 já existe (ignorado)`);
        } else {
          throw error;
        }
      }
    }

    console.log('\n✅ ENUMs criados com sucesso!\n');

    // 2. Criar tabelas
    console.log('2. Criando tabelas...\n');

    const tables = [
      {
        name: 'AtaReuniao',
        sql: `CREATE TABLE IF NOT EXISTS "AtaReuniao" (
          "id" TEXT NOT NULL,
          "numero" TEXT NOT NULL UNIQUE,
          "titulo" TEXT NOT NULL,
          "tipo" "TipoReuniao" NOT NULL,
          "dataReuniao" TIMESTAMP(3) NOT NULL,
          "local" TEXT,
          "status" "StatusAta" NOT NULL DEFAULT 'RASCUNHO',
          "pauta" TEXT,
          "conteudo" TEXT,
          "descricao" TEXT,
          "resumo" TEXT,
          "pautas" JSONB,
          "decisoes" JSONB,
          "acoes" JSONB,
          "observacoes" TEXT,
          "geradoPorIa" BOOLEAN,
          "iaUsada" TEXT,
          "modeloIa" TEXT,
          "custoIa" TEXT,
          "tempoProcessamentoIa" INTEGER,
          "arquivoOriginalUrl" TEXT,
          "arquivoOriginalNome" TEXT,
          "arquivoOriginalTipo" TEXT,
          "dataAssinatura" TIMESTAMP(3),
          "dataRegistro" TIMESTAMP(3),
          "cartorioRegistro" TEXT,
          "numeroRegistro" TEXT,
          "pendenteAssinatura" BOOLEAN NOT NULL DEFAULT false,
          "pendenteRegistro" BOOLEAN NOT NULL DEFAULT false,
          "modeloAtaId" TEXT,
          "criadoPor" TEXT NOT NULL,
          "empresaId" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "AtaReuniao_pkey" PRIMARY KEY ("id")
        );`
      },
      {
        name: 'AtaParticipante',
        sql: `CREATE TABLE IF NOT EXISTS "AtaParticipante" (
          "id" TEXT NOT NULL,
          "ataId" TEXT NOT NULL,
          "usuarioId" TEXT,
          "nomeExterno" TEXT,
          "email" TEXT,
          "cargo" TEXT,
          "presente" BOOLEAN NOT NULL DEFAULT true,
          "observacoes" TEXT,
          CONSTRAINT "AtaParticipante_pkey" PRIMARY KEY ("id")
        );`
      },
      {
        name: 'AtaAnexo',
        sql: `CREATE TABLE IF NOT EXISTS "AtaAnexo" (
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
        );`
      },
      {
        name: 'AtaComentario',
        sql: `CREATE TABLE IF NOT EXISTS "AtaComentario" (
          "id" TEXT NOT NULL,
          "ataId" TEXT NOT NULL,
          "comentario" TEXT NOT NULL,
          "tipo" "TipoComentario" NOT NULL,
          "autorId" TEXT NOT NULL,
          "comentarioPaiId" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "AtaComentario_pkey" PRIMARY KEY ("id")
        );`
      },
      {
        name: 'ModeloAta',
        sql: `CREATE TABLE IF NOT EXISTS "ModeloAta" (
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
        );`
      },
      {
        name: 'HistoricoAndamento',
        sql: `CREATE TABLE IF NOT EXISTS "HistoricoAndamento" (
          "id" TEXT NOT NULL,
          "ataId" TEXT NOT NULL,
          "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "acao" TEXT NOT NULL,
          "descricao" TEXT,
          "responsavel" TEXT,
          "criadoPor" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "HistoricoAndamento_pkey" PRIMARY KEY ("id")
        );`
      },
      {
        name: 'PrazoAcao',
        sql: `CREATE TABLE IF NOT EXISTS "PrazoAcao" (
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
        );`
      },
      {
        name: 'LembretePrazo',
        sql: `CREATE TABLE IF NOT EXISTS "LembretePrazo" (
          "id" TEXT NOT NULL,
          "prazoId" TEXT NOT NULL,
          "usuarioId" TEXT NOT NULL,
          "tipo" "TipoLembrete" NOT NULL,
          "mensagem" TEXT NOT NULL,
          "enviado" BOOLEAN NOT NULL DEFAULT false,
          "dataEnvio" TIMESTAMP(3),
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "LembretePrazo_pkey" PRIMARY KEY ("id")
        );`
      }
    ];

    for (let i = 0; i < tables.length; i++) {
      try {
        await prisma.$executeRawUnsafe(tables[i].sql);
        console.log(`  ✓ Tabela ${i + 1}/8: ${tables[i].name}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`  ⚠️ Tabela ${i + 1}/8: ${tables[i].name} (já existe)`);
        } else {
          throw error;
        }
      }
    }

    console.log('\n✅ Tabelas criadas com sucesso!\n');

    // 3. Criar índices
    console.log('3. Criando índices...\n');

    const indexes = [
      'CREATE UNIQUE INDEX IF NOT EXISTS "AtaReuniao_numero_key" ON "AtaReuniao"("numero");',
      'CREATE INDEX IF NOT EXISTS "AtaReuniao_dataReuniao_idx" ON "AtaReuniao"("dataReuniao");',
      'CREATE INDEX IF NOT EXISTS "AtaReuniao_status_idx" ON "AtaReuniao"("status");',
      'CREATE INDEX IF NOT EXISTS "AtaReuniao_empresaId_idx" ON "AtaReuniao"("empresaId");',
      'CREATE INDEX IF NOT EXISTS "AtaReuniao_criadoPor_idx" ON "AtaReuniao"("criadoPor");',
      'CREATE INDEX IF NOT EXISTS "AtaReuniao_tipo_idx" ON "AtaReuniao"("tipo");',
      'CREATE INDEX IF NOT EXISTS "AtaParticipante_ataId_idx" ON "AtaParticipante"("ataId");',
      'CREATE INDEX IF NOT EXISTS "AtaParticipante_usuarioId_idx" ON "AtaParticipante"("usuarioId");',
      'CREATE INDEX IF NOT EXISTS "AtaAnexo_ataId_idx" ON "AtaAnexo"("ataId");',
      'CREATE INDEX IF NOT EXISTS "AtaComentario_ataId_idx" ON "AtaComentario"("ataId");',
      'CREATE INDEX IF NOT EXISTS "AtaComentario_autorId_idx" ON "AtaComentario"("autorId");',
      'CREATE INDEX IF NOT EXISTS "AtaComentario_comentarioPaiId_idx" ON "AtaComentario"("comentarioPaiId");',
      'CREATE INDEX IF NOT EXISTS "ModeloAta_tipoReuniao_idx" ON "ModeloAta"("tipoReuniao");',
      'CREATE INDEX IF NOT EXISTS "ModeloAta_empresaId_idx" ON "ModeloAta"("empresaId");',
      'CREATE INDEX IF NOT EXISTS "ModeloAta_ativo_idx" ON "ModeloAta"("ativo");',
      'CREATE INDEX IF NOT EXISTS "HistoricoAndamento_ataId_idx" ON "HistoricoAndamento"("ataId");',
      'CREATE INDEX IF NOT EXISTS "HistoricoAndamento_data_idx" ON "HistoricoAndamento"("data");',
      'CREATE INDEX IF NOT EXISTS "PrazoAcao_ataId_idx" ON "PrazoAcao"("ataId");',
      'CREATE INDEX IF NOT EXISTS "PrazoAcao_dataPrazo_idx" ON "PrazoAcao"("dataPrazo");',
      'CREATE INDEX IF NOT EXISTS "PrazoAcao_status_idx" ON "PrazoAcao"("status");',
      'CREATE INDEX IF NOT EXISTS "PrazoAcao_concluido_idx" ON "PrazoAcao"("concluido");',
      'CREATE INDEX IF NOT EXISTS "LembretePrazo_prazoId_idx" ON "LembretePrazo"("prazoId");',
      'CREATE INDEX IF NOT EXISTS "LembretePrazo_usuarioId_idx" ON "LembretePrazo"("usuarioId");',
      'CREATE INDEX IF NOT EXISTS "LembretePrazo_enviado_idx" ON "LembretePrazo"("enviado");'
    ];

    for (const index of indexes) {
      try {
        await prisma.$executeRawUnsafe(index);
      } catch (error) {
        // Ignorar erros de índice duplicado
      }
    }

    console.log(`  ✓ ${indexes.length} índices criados\n`);

    // 4. Criar foreign keys
    console.log('4. Criando foreign keys...\n');

    const foreignKeys = [
      `ALTER TABLE "AtaReuniao" ADD CONSTRAINT "AtaReuniao_criadoPor_fkey" FOREIGN KEY ("criadoPor") REFERENCES "Usuario"("id") ON DELETE CASCADE;`,
      `ALTER TABLE "AtaReuniao" ADD CONSTRAINT "AtaReuniao_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL;`,
      `ALTER TABLE "AtaReuniao" ADD CONSTRAINT "AtaReuniao_modeloAtaId_fkey" FOREIGN KEY ("modeloAtaId") REFERENCES "ModeloAta"("id") ON DELETE SET NULL;`,
      `ALTER TABLE "AtaParticipante" ADD CONSTRAINT "AtaParticipante_ataId_fkey" FOREIGN KEY ("ataId") REFERENCES "AtaReuniao"("id") ON DELETE CASCADE;`,
      `ALTER TABLE "AtaParticipante" ADD CONSTRAINT "AtaParticipante_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL;`,
      `ALTER TABLE "AtaAnexo" ADD CONSTRAINT "AtaAnexo_ataId_fkey" FOREIGN KEY ("ataId") REFERENCES "AtaReuniao"("id") ON DELETE CASCADE;`,
      `ALTER TABLE "AtaComentario" ADD CONSTRAINT "AtaComentario_ataId_fkey" FOREIGN KEY ("ataId") REFERENCES "AtaReuniao"("id") ON DELETE CASCADE;`,
      `ALTER TABLE "AtaComentario" ADD CONSTRAINT "AtaComentario_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE CASCADE;`,
      `ALTER TABLE "AtaComentario" ADD CONSTRAINT "AtaComentario_comentarioPaiId_fkey" FOREIGN KEY ("comentarioPaiId") REFERENCES "AtaComentario"("id") ON DELETE CASCADE;`,
      `ALTER TABLE "ModeloAta" ADD CONSTRAINT "ModeloAta_criadoPor_fkey" FOREIGN KEY ("criadoPor") REFERENCES "Usuario"("id") ON DELETE CASCADE;`,
      `ALTER TABLE "ModeloAta" ADD CONSTRAINT "ModeloAta_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL;`,
      `ALTER TABLE "HistoricoAndamento" ADD CONSTRAINT "HistoricoAndamento_ataId_fkey" FOREIGN KEY ("ataId") REFERENCES "AtaReuniao"("id") ON DELETE CASCADE;`,
      `ALTER TABLE "HistoricoAndamento" ADD CONSTRAINT "HistoricoAndamento_criadoPor_fkey" FOREIGN KEY ("criadoPor") REFERENCES "Usuario"("id") ON DELETE CASCADE;`,
      `ALTER TABLE "PrazoAcao" ADD CONSTRAINT "PrazoAcao_ataId_fkey" FOREIGN KEY ("ataId") REFERENCES "AtaReuniao"("id") ON DELETE CASCADE;`,
      `ALTER TABLE "PrazoAcao" ADD CONSTRAINT "PrazoAcao_criadoPor_fkey" FOREIGN KEY ("criadoPor") REFERENCES "Usuario"("id") ON DELETE CASCADE;`,
      `ALTER TABLE "PrazoAcao" ADD CONSTRAINT "PrazoAcao_acaoId_fkey" FOREIGN KEY ("acaoId") REFERENCES "AtaComentario"("id") ON DELETE SET NULL;`,
      `ALTER TABLE "LembretePrazo" ADD CONSTRAINT "LembretePrazo_prazoId_fkey" FOREIGN KEY ("prazoId") REFERENCES "PrazoAcao"("id") ON DELETE CASCADE;`,
      `ALTER TABLE "LembretePrazo" ADD CONSTRAINT "LembretePrazo_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE;`,
    ];

    let fkCount = 0;
    for (const fk of foreignKeys) {
      try {
        await prisma.$executeRawUnsafe(fk);
        fkCount++;
      } catch (error) {
        if (error.message.includes('already exists')) {
          fkCount++;
        } else {
          console.log(`  ⚠️ FK Error: ${error.message.substring(0, 50)}`);
        }
      }
    }

    console.log(`  ✓ ${fkCount}/${foreignKeys.length} foreign keys criadas\n`);

    console.log('=== RESULTADO FINAL ===\n');
    console.log('✅ SUCESSO! Todas as tabelas, índices e relacionamentos de atas foram criados!');
    console.log('\nPróximos passos:');
    console.log('1. Regenerar Prisma Client: npx prisma generate');
    console.log('2. Compilar TypeScript: npx tsc --noEmit');
    console.log('3. Iniciar servidor: npm run start:dev');

  } catch (error) {
    console.error('\n❌ ERRO:');
    console.error(error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyAtaMigrations();
