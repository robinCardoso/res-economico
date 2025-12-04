/**
 * Script para identificar linhas e alertas duplicados que deveriam ter sido apagados
 * durante o reprocessamento mas não foram
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface LinhaDuplicada {
  uploadId: string;
  classificacao: string;
  conta: string;
  subConta: string | null;
  quantidade: number;
  ids: string[];
  createdAt: Date[];
}

interface AlertaDuplicado {
  uploadId: string;
  tipo: string;
  mensagem: string;
  quantidade: number;
  ids: string[];
}

async function identificarLinhasDuplicadas() {
  console.log('🔍 Identificando linhas duplicadas...\n');

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
      status: true,
      totalLinhas: true,
      _count: {
        select: {
          linhas: true,
          alertas: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  console.log(`📊 Total de uploads encontrados: ${uploads.length}\n`);

  // Para cada upload, verificar duplicatas
  const uploadsComProblemas: Array<{
    upload: typeof uploads[0];
    linhasDuplicadas: LinhaDuplicada[];
    alertasDuplicados: AlertaDuplicado[];
    linhasOrfas: number;
  }> = [];

  for (const upload of uploads) {
    // Verificar se há mais linhas do que deveria
    const linhasCount = upload._count.linhas;
    const totalLinhas = upload.totalLinhas || 0;

    if (linhasCount !== totalLinhas) {
      console.log(
        `⚠️  Upload ${upload.id.slice(0, 8)}: Contagem inconsistente!`,
      );
      console.log(`   - Total esperado: ${totalLinhas}`);
      console.log(`   - Total encontrado: ${linhasCount}`);
      console.log(`   - Diferença: ${linhasCount - totalLinhas}\n`);
    }

    // Buscar linhas duplicadas (mesmo uploadId, mesma classificacao/conta/subConta)
    const linhas = await prisma.linhaUpload.findMany({
      where: {
        uploadId: upload.id,
      },
      select: {
        id: true,
        classificacao: true,
        conta: true,
        subConta: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
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

    // Identificar duplicatas
    const linhasDuplicadas: LinhaDuplicada[] = [];
    for (const [chave, grupo] of linhasAgrupadas.entries()) {
      if (grupo.length > 1) {
        const [classificacao, conta, subConta] = chave.split('|');
        linhasDuplicadas.push({
          uploadId: upload.id,
          classificacao,
          conta,
          subConta: subConta || null,
          quantidade: grupo.length,
          ids: grupo.map((l) => l.id),
          createdAt: grupo.map((l) => l.createdAt),
        });
      }
    }

    // Buscar alertas duplicados (mesmo uploadId, mesmo tipo e mensagem)
    const alertas = await prisma.alerta.findMany({
      where: {
        uploadId: upload.id,
      },
      select: {
        id: true,
        tipo: true,
        mensagem: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Agrupar por tipo + mensagem
    const alertasAgrupados = new Map<
      string,
      Array<{ id: string; createdAt: Date }>
    >();

    for (const alerta of alertas) {
      const chave = `${alerta.tipo}|${alerta.mensagem.substring(0, 100)}`;
      if (!alertasAgrupados.has(chave)) {
        alertasAgrupados.set(chave, []);
      }
      alertasAgrupados.get(chave)!.push({
        id: alerta.id,
        createdAt: alerta.createdAt,
      });
    }

    // Identificar alertas duplicados
    const alertasDuplicados: AlertaDuplicado[] = [];
    for (const [chave, grupo] of alertasAgrupados.entries()) {
      if (grupo.length > 1) {
        const [tipo, mensagem] = chave.split('|');
        alertasDuplicados.push({
          uploadId: upload.id,
          tipo,
          mensagem,
          quantidade: grupo.length,
          ids: grupo.map((a) => a.id),
        });
      }
    }

    // Verificar linhas órfãs (criadas antes do último reprocessamento)
    // Se houver linhas com createdAt muito antigo comparado ao upload, podem ser órfãs
    const uploadInfo = await prisma.upload.findUnique({
      where: { id: upload.id },
      select: { createdAt: true, updatedAt: true },
    });

    let linhasOrfas = 0;
    if (uploadInfo) {
      // Linhas criadas muito antes do upload atualizado podem ser órfãs
      const tempoLimite = new Date(uploadInfo.updatedAt);
      tempoLimite.setHours(tempoLimite.getHours() - 1); // 1 hora antes do update

      const linhasOrfasCount = await prisma.linhaUpload.count({
        where: {
          uploadId: upload.id,
          createdAt: {
            lt: tempoLimite,
          },
        },
      });

      if (linhasOrfasCount > 0) {
        linhasOrfas = linhasOrfasCount;
      }
    }

    if (
      linhasDuplicadas.length > 0 ||
      alertasDuplicados.length > 0 ||
      linhasOrfas > 0 ||
      linhasCount !== totalLinhas
    ) {
      uploadsComProblemas.push({
        upload,
        linhasDuplicadas,
        alertasDuplicados,
        linhasOrfas,
      });
    }
  }

  // Exibir resultados
  console.log('\n' + '='.repeat(80));
  console.log('📋 RESUMO DE PROBLEMAS ENCONTRADOS');
  console.log('='.repeat(80) + '\n');

  if (uploadsComProblemas.length === 0) {
    console.log('✅ Nenhum problema encontrado! Todos os uploads estão limpos.\n');
    return;
  }

  console.log(
    `⚠️  ${uploadsComProblemas.length} upload(s) com problemas encontrados:\n`,
  );

  for (const problema of uploadsComProblemas) {
    const { upload, linhasDuplicadas, alertasDuplicados, linhasOrfas } =
      problema;

    console.log('─'.repeat(80));
    console.log(`📁 Upload: ${upload.id.slice(0, 8)}`);
    console.log(`   Arquivo: ${upload.nomeArquivo}`);
    console.log(`   Empresa: ${upload.empresa?.razaoSocial || 'N/A'}`);
    console.log(`   Período: ${upload.mes}/${upload.ano}`);
    console.log(`   Status: ${upload.status}`);
    console.log(`   Total esperado: ${upload.totalLinhas || 0}`);
    console.log(`   Total encontrado: ${upload._count.linhas}`);

    if (linhasDuplicadas.length > 0) {
      console.log(`\n   🔴 LINHAS DUPLICADAS: ${linhasDuplicadas.length} grupo(s)`);
      for (const dup of linhasDuplicadas.slice(0, 5)) {
        // Mostrar apenas as 5 primeiras
        console.log(
          `      - ${dup.classificacao} | ${dup.conta} | ${dup.subConta || '(sem sub)'}: ${dup.quantidade} cópias`,
        );
        console.log(`        IDs: ${dup.ids.slice(0, 3).join(', ')}${dup.ids.length > 3 ? '...' : ''}`);
        console.log(
          `        Criadas em: ${dup.createdAt.map((d) => d.toISOString().substring(0, 19)).join(', ')}`,
        );
      }
      if (linhasDuplicadas.length > 5) {
        console.log(`      ... e mais ${linhasDuplicadas.length - 5} grupo(s)`);
      }
    }

    if (alertasDuplicados.length > 0) {
      console.log(`\n   🔴 ALERTAS DUPLICADOS: ${alertasDuplicados.length} grupo(s)`);
      for (const dup of alertasDuplicados.slice(0, 3)) {
        // Mostrar apenas os 3 primeiros
        console.log(
          `      - ${dup.tipo}: ${dup.quantidade} cópias`,
        );
        console.log(`        Mensagem: ${dup.mensagem.substring(0, 80)}...`);
        console.log(`        IDs: ${dup.ids.slice(0, 3).join(', ')}${dup.ids.length > 3 ? '...' : ''}`);
      }
      if (alertasDuplicados.length > 3) {
        console.log(`      ... e mais ${alertasDuplicados.length - 3} grupo(s)`);
      }
    }

    if (linhasOrfas > 0) {
      console.log(`\n   ⚠️  LINHAS ÓRFÃS: ${linhasOrfas} linha(s) criadas antes do último reprocessamento`);
    }

    if (upload._count.linhas !== (upload.totalLinhas || 0)) {
      console.log(
        `\n   ⚠️  CONTAGEM INCONSISTENTE: Esperado ${upload.totalLinhas || 0}, encontrado ${upload._count.linhas}`,
      );
    }

    console.log('');
  }

  // Estatísticas gerais
  console.log('\n' + '='.repeat(80));
  console.log('📊 ESTATÍSTICAS GERAIS');
  console.log('='.repeat(80));

  const totalLinhasDuplicadas = uploadsComProblemas.reduce(
    (acc, p) =>
      acc +
      p.linhasDuplicadas.reduce((sum, dup) => sum + (dup.quantidade - 1), 0),
    0,
  );

  const totalAlertasDuplicados = uploadsComProblemas.reduce(
    (acc, p) =>
      acc +
      p.alertasDuplicados.reduce((sum, dup) => sum + (dup.quantidade - 1), 0),
    0,
  );

  const totalLinhasOrfas = uploadsComProblemas.reduce(
    (acc, p) => acc + p.linhasOrfas,
    0,
  );

  console.log(`Total de linhas duplicadas: ${totalLinhasDuplicadas}`);
  console.log(`Total de alertas duplicados: ${totalAlertasDuplicados}`);
  console.log(`Total de linhas órfãs: ${totalLinhasOrfas}`);

  console.log('\n💡 Para corrigir, você pode:');
  console.log('   1. Reprocessar os uploads afetados usando o botão "Reprocessar"');
  console.log('   2. Ou executar um script de limpeza manual (a ser criado)');
  console.log('');
}

async function main() {
  try {
    await identificarLinhasDuplicadas();
  } catch (error) {
    console.error('❌ Erro ao executar script:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

