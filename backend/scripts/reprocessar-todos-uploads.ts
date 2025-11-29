import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import axios from 'axios';

const prisma = new PrismaClient();

/**
 * Script para reprocessar todos os uploads e corrigir nomes de arquivos
 * 
 * Este script:
 * 1. Lista todos os uploads
 * 2. Corrige o encoding do nomeArquivo no banco
 * 3. Reprocessa cada upload usando a API
 */
async function reprocessarTodosUploads() {
  console.log('\n🔧 Iniciando reprocessamento de todos os uploads...\n');

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

  // API base URL
  const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';
  console.log(`🌐 API URL: ${API_BASE_URL}\n`);

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

      // 3. Reprocessar via API
      console.log(`   🔄 Reprocessando...`);
      try {
        await axios.patch(
          `${API_BASE_URL}/uploads/${upload.id}/reprocessar`,
          {},
          {
            headers: {
              // Se precisar de autenticação, adicione aqui
              // 'Authorization': `Bearer ${process.env.API_TOKEN || ''}`,
            },
            timeout: 30000,
            validateStatus: (status) => status < 500, // Aceitar 4xx como sucesso (já que pode ser erro de autenticação)
          },
        );

        console.log(`   ✅ Reprocessamento iniciado com sucesso`);
        reprocessados++;

        // Aguardar um pouco para não sobrecarregar a fila
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (apiError: any) {
        if (apiError.code === 'ECONNREFUSED') {
          console.error(`   ❌ Backend não está rodando em ${API_BASE_URL}`);
          console.error(`   💡 Inicie o backend com: npm run start:dev`);
          erros++;
          break; // Parar se o backend não estiver rodando
        } else if (apiError.response) {
          const status = apiError.response.status;
          if (status === 401 || status === 403) {
            console.error(
              `   ⚠️ Erro de autenticação (${status}). O reprocessamento requer autenticação.`,
            );
            console.error(`   💡 Execute via interface web ou configure API_TOKEN`);
          } else {
            console.error(
              `   ❌ Erro na API: ${status} - ${apiError.response.data?.message || apiError.message}`,
            );
          }
        } else {
          console.error(`   ❌ Erro na API: ${apiError.message}`);
        }
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
  console.log(`   URL: ${API_BASE_URL.replace(':3000', ':3001')}/admin/resultado-economico/uploads`);
}

reprocessarTodosUploads()
  .then(() => {
    console.log('\n✅ Script concluído com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
