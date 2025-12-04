/**
 * Script para limpar linhas e alertas duplicados
 * Mantém apenas a versão mais recente de cada duplicata
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ResultadoLimpeza {
  uploadId: string;
  linhasRemovidas: number;
  alertasRemovidos: number;
  totalLinhasAtualizado: number;
}

async function limparDuplicatas() {
  console.log('🧹 Iniciando limpeza de duplicatas...\n');

  // Buscar todos os uploads
  const uploads = await prisma.upload.findMany({
    select: {
      id: true,
      nomeArquivo: true,
      empresa: {
        select: {
          razaoSocial: true,
        },
      },
      mes: true,
      ano: true,
      totalLinhas: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  console.log(`📊 Total de uploads encontrados: ${uploads.length}\n`);

  const resultados: ResultadoLimpeza[] = [];

  for (const upload of uploads) {
    console.log(`\n📁 Processando upload: ${upload.id.slice(0, 8)} - ${upload.nomeArquivo}`);

    // Buscar todas as linhas do upload
    const linhas = await prisma.linhaUpload.findMany({
      where: {
        uploadId: upload.id,
      },
      orderBy: {
        createdAt: 'asc', // Mais antigas primeiro
      },
    });

    // Agrupar por classificacao + conta + subConta
    const linhasAgrupadas = new Map<
      string,
      Array<{ id: string; createdAt: Date }>
    >();

    for (const linha of linhas) {
      const chave = `${linha.classificacao}|${linha.conta}|${linha.subConta || ''}`;
      if (!linhasAgrupadas.has(chave)) {
        linhasAgrupadas.set(chave, []);
      }
      linhasAgrupadas.get(chave)!.push({
        id: linha.id,
        createdAt: linha.createdAt,
      });
    }

    // Identificar e remover duplicatas (manter apenas a mais recente)
    let linhasRemovidas = 0;
    const idsParaRemover: string[] = [];

    for (const [chave, grupo] of linhasAgrupadas.entries()) {
      if (grupo.length > 1) {
        // Ordenar por data (mais recente primeiro)
        grupo.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        
        // Manter apenas a primeira (mais recente), remover as outras
        const idsDuplicadas = grupo.slice(1).map((l) => l.id);
        idsParaRemover.push(...idsDuplicadas);
        linhasRemovidas += idsDuplicadas.length;

        console.log(
          `   🔴 Encontradas ${grupo.length} duplicatas para ${chave.split('|')[0]} | ${chave.split('|')[1]}`,
        );
        console.log(`      Mantendo: ${grupo[0].id} (mais recente)`);
        console.log(`      Removendo: ${idsDuplicadas.length} duplicata(s)`);
      }
    }

    // Remover linhas duplicadas
    if (idsParaRemover.length > 0) {
      // Primeiro, remover alertas associados a essas linhas
      const alertasRemovidos = await prisma.alerta.deleteMany({
        where: {
          linhaId: {
            in: idsParaRemover,
          },
        },
      });

      console.log(`   🗑️  Removidos ${alertasRemovidos.count} alerta(s) associados às linhas duplicadas`);

      // Depois, remover as linhas
      const resultado = await prisma.linhaUpload.deleteMany({
        where: {
          id: {
            in: idsParaRemover,
          },
        },
      });

      linhasRemovidas = resultado.count;
      console.log(`   ✅ Removidas ${linhasRemovidas} linha(s) duplicada(s)`);
    }

    // Buscar alertas duplicados (mesmo uploadId, mesmo tipo e mensagem)
    const alertas = await prisma.alerta.findMany({
      where: {
        uploadId: upload.id,
      },
      orderBy: {
        createdAt: 'asc', // Mais antigos primeiro
      },
    });

    // Agrupar por tipo + mensagem
    const alertasAgrupados = new Map<
      string,
      Array<{ id: string; createdAt: Date }>
    >();

    for (const alerta of alertas) {
      const chave = `${alerta.tipo}|${alerta.mensagem}`;
      if (!alertasAgrupados.has(chave)) {
        alertasAgrupados.set(chave, []);
      }
      alertasAgrupados.get(chave)!.push({
        id: alerta.id,
        createdAt: alerta.createdAt,
      });
    }

    // Identificar e remover alertas duplicados (manter apenas o mais recente)
    let alertasRemovidos = 0;
    const idsAlertasParaRemover: string[] = [];

    for (const [chave, grupo] of alertasAgrupados.entries()) {
      if (grupo.length > 1) {
        // Ordenar por data (mais recente primeiro)
        grupo.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        
        // Manter apenas o primeiro (mais recente), remover os outros
        const idsDuplicados = grupo.slice(1).map((a) => a.id);
        idsAlertasParaRemover.push(...idsDuplicados);
        alertasRemovidos += idsDuplicados.length;

        console.log(
          `   🔴 Encontrados ${grupo.length} alertas duplicados do tipo ${chave.split('|')[0]}`,
        );
        console.log(`      Mantendo: ${grupo[0].id} (mais recente)`);
        console.log(`      Removendo: ${idsDuplicados.length} duplicata(s)`);
      }
    }

    // Remover alertas duplicados
    if (idsAlertasParaRemover.length > 0) {
      const resultado = await prisma.alerta.deleteMany({
        where: {
          id: {
            in: idsAlertasParaRemover,
          },
        },
      });

      alertasRemovidos = resultado.count;
      console.log(`   ✅ Removidos ${alertasRemovidos} alerta(s) duplicado(s)`);
    }

    // Atualizar totalLinhas do upload
    const totalLinhasAtual = await prisma.linhaUpload.count({
      where: {
        uploadId: upload.id,
      },
    });

    if (totalLinhasAtual !== upload.totalLinhas) {
      await prisma.upload.update({
        where: { id: upload.id },
        data: { totalLinhas: totalLinhasAtual },
      });
      console.log(
        `   📊 Total de linhas atualizado: ${upload.totalLinhas} → ${totalLinhasAtual}`,
      );
    }

    if (linhasRemovidas > 0 || alertasRemovidos > 0) {
      resultados.push({
        uploadId: upload.id,
        linhasRemovidas,
        alertasRemovidos,
        totalLinhasAtualizado: totalLinhasAtual,
      });
    } else {
      console.log(`   ✅ Nenhuma duplicata encontrada`);
    }
  }

  // Resumo final
  console.log('\n' + '='.repeat(80));
  console.log('📋 RESUMO DA LIMPEZA');
  console.log('='.repeat(80) + '\n');

  if (resultados.length === 0) {
    console.log('✅ Nenhuma duplicata encontrada em nenhum upload!\n');
    return;
  }

  const totalLinhasRemovidas = resultados.reduce(
    (acc, r) => acc + r.linhasRemovidas,
    0,
  );
  const totalAlertasRemovidos = resultados.reduce(
    (acc, r) => acc + r.alertasRemovidos,
    0,
  );

  console.log(`✅ Limpeza concluída para ${resultados.length} upload(s):\n`);
  console.log(`   📊 Total de linhas removidas: ${totalLinhasRemovidas}`);
  console.log(`   📊 Total de alertas removidos: ${totalAlertasRemovidos}\n`);

  console.log('Detalhes por upload:');
  for (const resultado of resultados) {
    const upload = await prisma.upload.findUnique({
      where: { id: resultado.uploadId },
      select: { nomeArquivo: true },
    });
    console.log(
      `   - ${resultado.uploadId.slice(0, 8)}: ${resultado.linhasRemovidas} linhas, ${resultado.alertasRemovidos} alertas`,
    );
  }

  console.log('\n✅ Limpeza concluída com sucesso!\n');
}

async function main() {
  try {
    // Confirmar antes de executar
    console.log('⚠️  ATENÇÃO: Este script irá REMOVER linhas e alertas duplicados!');
    console.log('   Serão mantidas apenas as versões mais recentes.\n');
    
    // Em produção, você pode adicionar uma confirmação interativa aqui
    // Por enquanto, vamos executar diretamente
    
    await limparDuplicatas();
  } catch (error) {
    console.error('❌ Erro ao executar limpeza:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

