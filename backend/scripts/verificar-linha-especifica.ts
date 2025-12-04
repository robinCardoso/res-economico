/**
 * Script para verificar uma linha específica e entender o problema de sinal
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verificarLinha() {
  const uploadId = 'd56290b7-4b32-4f8a-96be-4c266b68c8a7';
  
  console.log(`🔍 Verificando upload: ${uploadId}\n`);

  // Buscar upload
  const upload = await prisma.upload.findUnique({
    where: { id: uploadId },
    include: {
      empresa: true,
      linhas: {
        where: {
          saldoAtual: {
            gte: 66.33,
            lte: 66.35,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      },
    },
  });

  if (!upload) {
    console.log('❌ Upload não encontrado');
    return;
  }

  console.log(`📁 Upload: ${upload.nomeArquivo}`);
  console.log(`   Empresa: ${upload.empresa?.razaoSocial}`);
  console.log(`   Período: ${upload.mes}/${upload.ano}`);
  console.log(`   Status: ${upload.status}\n`);

  if (upload.linhas.length === 0) {
    console.log('❌ Nenhuma linha encontrada com saldoAtual próximo a 66.34');
    return;
  }

  console.log(`📊 Linhas encontradas: ${upload.linhas.length}\n`);

  for (const linha of upload.linhas) {
    console.log('─'.repeat(80));
    console.log(`ID: ${linha.id}`);
    console.log(`Classificação: ${linha.classificacao}`);
    console.log(`Conta: ${linha.conta}`);
    console.log(`SubConta: ${linha.subConta || '(não informado)'}`);
    console.log(`Nome Conta: ${linha.nomeConta}`);
    console.log(`Tipo Conta: ${linha.tipoConta}`);
    console.log(`Nível: ${linha.nivel}`);
    console.log(`\nValores:`);
    console.log(`  Saldo Anterior: ${linha.saldoAnterior}`);
    console.log(`  Débito: ${linha.debito}`);
    console.log(`  Crédito: ${linha.credito}`);
    console.log(`  Saldo Atual: ${linha.saldoAtual}`);
    console.log(`\nCálculo:`);
    console.log(`  Saldo Anterior + Débito + Crédito = ${Number(linha.saldoAnterior) + Number(linha.debito) + Number(linha.credito)}`);
    console.log(`  Crédito + Débito = ${Number(linha.credito) + Number(linha.debito)}`);
    console.log(`  Crédito - Débito = ${Number(linha.credito) - Number(linha.debito)}`);
    console.log(`\nHash: ${linha.hashLinha}`);
    console.log(`Criado em: ${linha.createdAt}`);
    console.log('');
  }

  // Verificar se há linhas com saldoAtual negativo mas valores positivos
  const linhasComProblema = await prisma.linhaUpload.findMany({
    where: {
      uploadId,
      tipoConta: '3-DRE',
      saldoAtual: {
        gt: 0,
      },
      nomeConta: {
        contains: 'SUPERÁVIT',
      },
    },
    take: 5,
  });

  if (linhasComProblema.length > 0) {
    console.log('\n⚠️  Linhas com possível problema de sinal:');
    for (const linha of linhasComProblema) {
      console.log(`  - ${linha.nomeConta}: saldoAtual=${linha.saldoAtual}, debito=${linha.debito}, credito=${linha.credito}`);
    }
  }
}

async function main() {
  try {
    await verificarLinha();
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

