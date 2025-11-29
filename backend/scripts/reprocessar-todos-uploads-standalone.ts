import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UploadsService } from '../src/uploads/uploads.service';
import { PrismaService } from '../src/core/prisma/prisma.service';
import * as fs from 'fs';

/**
 * Script standalone para reprocessar todos os uploads
 * 
 * Este script:
 * 1. Inicializa o NestJS
 * 2. Corrige encoding dos nomes de arquivos
 * 3. Reprocessa todos os uploads diretamente
 */
async function reprocessarTodosUploads() {
  console.log('\n🔧 Iniciando reprocessamento de todos os uploads...\n');

  // Inicializar NestJS
  console.log('🚀 Inicializando NestJS...');
  const app = await NestFactory.createApplicationContext(AppModule);
  const uploadsService = app.get(UploadsService);
  const prismaService = app.get(PrismaService);
  const prisma = prismaService;

  try {
    // Buscar todos os uploads
    const uploads = await prisma.upload.findMany({
      include: {
        empresa: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`📊 Total de uploads encontrados: ${uploads.length}\n`);

    if (uploads.length === 0) {
      console.log('✅ Nenhum upload para reprocessar!');
      return;
    }

    let corrigidos = 0;
    let reprocessados = 0;
    let erros = 0;
    let arquivosNaoEncontrados = 0;

    for (let i = 0; i < uploads.length; i++) {
      const upload = uploads[i];
      const progresso = Math.round(((i + 1) / uploads.length) * 100);

      console.log(
        `\n[${i + 1}/${uploads.length}] (${progresso}%) Processando: ${upload.id.substring(0, 8)}...`,
      );
      console.log(`   Empresa: ${upload.empresa?.razaoSocial || 'N/A'}`);
      console.log(`   Período: ${upload.mes}/${upload.ano}`);
      console.log(`   Nome atual: ${upload.nomeArquivo}`);

      try {
        // 1. Corrigir encoding do nomeArquivo
        let nomeArquivoCorrigido = upload.nomeArquivo;
        let foiCorrigido = false;

        // Tentar corrigir encoding se contém caracteres corrompidos
        if (
          nomeArquivoCorrigido.includes('??') ||
          nomeArquivoCorrigido.includes('Ã') ||
          nomeArquivoCorrigido.includes('Â') ||
          nomeArquivoCorrigido.includes('Õ')
        ) {
          try {
            // Tentar correção: Latin-1 → UTF-8
            const tentativa1 = Buffer.from(nomeArquivoCorrigido, 'latin1').toString('utf8');
            if (
              tentativa1 !== nomeArquivoCorrigido &&
              !tentativa1.includes('\uFFFD') &&
              !tentativa1.includes('??')
            ) {
              nomeArquivoCorrigido = tentativa1;
              foiCorrigido = true;
            }
          } catch (error) {
            // Ignorar erro
          }

          // Se ainda tem problemas, tentar substituições comuns
          if (nomeArquivoCorrigido.includes('??')) {
            nomeArquivoCorrigido = nomeArquivoCorrigido
              .replace(/Uni\?\?o/g, 'União')
              .replace(/Rede Uni\?\?o/g, 'Rede União')
              .replace(/Balancete Rede Uni\?\?o/g, 'Balancete Rede União')
              .replace(/\?\?/g, '');
            foiCorrigido = true;
          }
        }

        // Atualizar nomeArquivo no banco se foi corrigido
        if (foiCorrigido && nomeArquivoCorrigido !== upload.nomeArquivo) {
          await prisma.upload.update({
            where: { id: upload.id },
            data: { nomeArquivo: nomeArquivoCorrigido },
          });
          console.log(`   ✅ Nome corrigido: "${upload.nomeArquivo}" → "${nomeArquivoCorrigido}"`);
          corrigidos++;
        }

        // 2. Verificar se o arquivo existe
        const filePath = upload.arquivoUrl.replace('/uploads/', './uploads/');
        if (!fs.existsSync(filePath)) {
          console.log(`   ⚠️ Arquivo não encontrado: ${filePath}`);
          arquivosNaoEncontrados++;
          continue;
        }

        // 3. Reprocessar diretamente
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
    console.log(`   ✅ Nomes corrigidos: ${corrigidos}`);
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

reprocessarTodosUploads()
  .then(() => {
    console.log('\n✅ Script concluído com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  });

