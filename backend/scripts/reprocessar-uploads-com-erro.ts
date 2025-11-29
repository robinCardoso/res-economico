import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UploadsService } from '../src/uploads/uploads.service';
import { PrismaService } from '../src/core/prisma/prisma.service';
import * as fs from 'fs';

/**
 * Script para reprocessar uploads com erro ou travados
 * 
 * Este script:
 * 1. Identifica uploads com problemas (travados ou cancelados)
 * 2. Reprocessa cada um deles
 */
async function reprocessarUploadsComErro() {
  console.log('\n🔧 Iniciando reprocessamento de uploads com erro...\n');

  // Inicializar NestJS
  console.log('🚀 Inicializando NestJS...');
  const app = await NestFactory.createApplicationContext(AppModule);
  const uploadsService = app.get(UploadsService);
  const prismaService = app.get(PrismaService);
  const prisma = prismaService;

  try {
    // 1. Uploads processando há mais de 10 minutos
    const dezMinutosAtras = new Date(Date.now() - 10 * 60 * 1000);
    const uploadsTravados = await prisma.upload.findMany({
      where: {
        status: 'PROCESSANDO',
        updatedAt: {
          lt: dezMinutosAtras,
        },
      },
      include: {
        empresa: {
          select: {
            razaoSocial: true,
          },
        },
      },
    });

    // 2. Uploads cancelados
    const uploadsCancelados = await prisma.upload.findMany({
      where: {
        status: 'CANCELADO',
      },
      include: {
        empresa: {
          select: {
            razaoSocial: true,
          },
        },
      },
    });

    const uploadsComProblema = [...uploadsTravados, ...uploadsCancelados];

    console.log(`📊 Total de uploads com problema: ${uploadsComProblema.length}\n`);

    if (uploadsComProblema.length === 0) {
      console.log('✅ Nenhum upload com problema encontrado!');
      return;
    }

    let reprocessados = 0;
    let erros = 0;
    let arquivosNaoEncontrados = 0;

    for (let i = 0; i < uploadsComProblema.length; i++) {
      const upload = uploadsComProblema[i];
      const progresso = Math.round(((i + 1) / uploadsComProblema.length) * 100);

      console.log(
        `\n[${i + 1}/${uploadsComProblema.length}] (${progresso}%) Processando: ${upload.id.substring(0, 8)}...`,
      );
      console.log(`   Empresa: ${upload.empresa?.razaoSocial || 'N/A'}`);
      console.log(`   Período: ${upload.mes}/${upload.ano}`);
      console.log(`   Status atual: ${upload.status}`);
      console.log(`   Arquivo: ${upload.nomeArquivo}`);

      try {
        // Verificar se o arquivo existe
        const filePath = upload.arquivoUrl.replace('/uploads/', './uploads/');
        if (!fs.existsSync(filePath)) {
          console.log(`   ⚠️ Arquivo não encontrado: ${filePath}`);
          arquivosNaoEncontrados++;
          continue;
        }

        // Reprocessar
        console.log(`   🔄 Reprocessando...`);
        try {
          await uploadsService.reprocessar(upload.id, 'system');
          console.log(`   ✅ Reprocessamento iniciado com sucesso`);
          reprocessados++;

          // Aguardar um pouco para não sobrecarregar a fila
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (error: any) {
          console.error(`   ❌ Erro ao reprocessar: ${error.message}`);
          erros++;
        }
      } catch (error: any) {
        console.error(`   ❌ Erro ao processar upload ${upload.id}:`, error.message);
        erros++;
      }
    }

    console.log(`\n✅ Processo concluído!`);
    console.log(`   ✅ Uploads reprocessados: ${reprocessados}`);
    console.log(`   ⚠️ Arquivos não encontrados: ${arquivosNaoEncontrados}`);
    console.log(`   ❌ Erros: ${erros}`);
    console.log(
      `\n💡 Nota: Os uploads foram adicionados à fila de processamento.`,
    );
    console.log(`   Verifique o status na interface ou nos logs do backend.`);
  } finally {
    await app.close();
  }
}

reprocessarUploadsComErro()
  .then(() => {
    console.log('\n✅ Script concluído com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  });

