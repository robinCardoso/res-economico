/**
 * Script para verificar contas de resultado com tipoConta incorreto
 * Identifica contas que deveriam ser 3-DRE mas estão como 2-Passivo ou 1-Ativo
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verificarTipoContaResultado() {
  console.log('🔍 Verificando contas de resultado com tipoConta incorreto...\n');

  // Contas de resultado conhecidas (classificações e nomes)
  const classificacoesResultado = [
    '2.07', // PATRIMÔNIO LÍQUIDO
    '2.07.05', // RESULTADO ACUMULADO
    '2.07.05.01', // SUPERÁVITS OU DÉFICITS ACUMULADOS
    '2.07.05.01.01', // Resultado do Exercício - Período Anterior ao Balanço (744)
    '2.07.05.01.01', // Resultado do Exercício-Período do Balanço (745)
    '3.14', // SUPERÁVIT/DÉFICIT DO PERÍODO
    '3.39', // RESULTADO LÍQUIDO ANTES DO IMPOSTO
    '3.41', // RESULTADO DO PERÍODO APÓS TRIBUTOS
    '3.50', // SUPERÁVIT/DÉFICIT DO PERÍODO
  ];

  const palavrasChaveResultado = [
    'RESULTADO',
    'SUPERÁVIT',
    'DÉFICIT',
    'DEFICIT',
    'LUCRO',
    'PREJUÍZO',
    'PREJUIZO',
  ];

  // Buscar todas as linhas que podem ser contas de resultado
  const linhas = await prisma.linhaUpload.findMany({
    where: {
      OR: [
        {
          classificacao: {
            startsWith: '2.07',
          },
        },
        {
          classificacao: {
            startsWith: '3.14',
          },
        },
        {
          classificacao: {
            startsWith: '3.39',
          },
        },
        {
          classificacao: {
            startsWith: '3.41',
          },
        },
        {
          classificacao: {
            startsWith: '3.50',
          },
        },
        {
          nomeConta: {
            contains: 'RESULTADO',
            mode: 'insensitive',
          },
        },
        {
          nomeConta: {
            contains: 'SUPERÁVIT',
            mode: 'insensitive',
          },
        },
        {
          nomeConta: {
            contains: 'DÉFICIT',
            mode: 'insensitive',
          },
        },
      ],
    },
    select: {
      id: true,
      uploadId: true,
      classificacao: true,
      conta: true,
      nomeConta: true,
      tipoConta: true,
      saldoAtual: true,
      upload: {
        select: {
          nomeArquivo: true,
          empresa: {
            select: {
              razaoSocial: true,
            },
          },
          mes: true,
          ano: true,
        },
      },
    },
    take: 1000, // Limitar para não sobrecarregar
  });

  console.log(`📊 Total de linhas encontradas: ${linhas.length}\n`);

  // Agrupar por tipoConta
  const linhasPorTipo = new Map<string, typeof linhas>();
  for (const linha of linhas) {
    const tipo = linha.tipoConta || 'SEM_TIPO';
    if (!linhasPorTipo.has(tipo)) {
      linhasPorTipo.set(tipo, []);
    }
    linhasPorTipo.get(tipo)!.push(linha);
  }

  console.log('📋 Distribuição por tipoConta:\n');
  for (const [tipo, grupo] of linhasPorTipo.entries()) {
    console.log(`  ${tipo}: ${grupo.length} linha(s)`);
  }

  // Identificar linhas com tipoConta incorreto
  const linhasComProblema: Array<{
    linha: typeof linhas[0];
    tipoCorreto: string;
    motivo: string;
  }> = [];

  for (const linha of linhas) {
    const nomeConta = (linha.nomeConta || '').toUpperCase();
    const classificacao = linha.classificacao || '';
    const tipoAtual = linha.tipoConta || 'SEM_TIPO';

    // Verificar se é conta de resultado
    const isContaResultado =
      classificacao.startsWith('2.07') ||
      classificacao.startsWith('3.14') ||
      classificacao.startsWith('3.39') ||
      classificacao.startsWith('3.41') ||
      classificacao.startsWith('3.50') ||
      palavrasChaveResultado.some((palavra) =>
        nomeConta.includes(palavra),
      );

    if (isContaResultado && tipoAtual !== '3-DRE') {
      linhasComProblema.push({
        linha,
        tipoCorreto: '3-DRE',
        motivo: `Conta de resultado classificada como ${tipoAtual}`,
      });
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('⚠️  LINHAS COM TIPO DE CONTA INCORRETO');
  console.log('='.repeat(80) + '\n');

  if (linhasComProblema.length === 0) {
    console.log('✅ Nenhuma linha com tipo de conta incorreto encontrada!\n');
    return;
  }

  console.log(`🔴 ${linhasComProblema.length} linha(s) com tipo de conta incorreto:\n`);

  // Agrupar por upload para facilitar análise
  const problemasPorUpload = new Map<
    string,
    Array<typeof linhasComProblema[0]>
  >();

  for (const problema of linhasComProblema) {
    const uploadId = problema.linha.uploadId;
    if (!problemasPorUpload.has(uploadId)) {
      problemasPorUpload.set(uploadId, []);
    }
    problemasPorUpload.get(uploadId)!.push(problema);
  }

  for (const [uploadId, problemas] of problemasPorUpload.entries()) {
    const primeiroProblema = problemas[0];
    const upload = primeiroProblema.linha.upload;

    console.log('─'.repeat(80));
    console.log(`📁 Upload: ${uploadId.slice(0, 8)}`);
    console.log(`   Arquivo: ${upload?.nomeArquivo}`);
    console.log(`   Empresa: ${upload?.empresa?.razaoSocial || 'N/A'}`);
    console.log(`   Período: ${upload?.mes}/${upload?.ano}`);
    console.log(`   Problemas: ${problemas.length} linha(s)\n`);

    for (const problema of problemas.slice(0, 10)) {
      // Mostrar apenas as 10 primeiras
      console.log(
        `   - ${problema.linha.classificacao} | ${problema.linha.conta} | ${problema.linha.nomeConta}`,
      );
      console.log(
        `     Tipo atual: ${problema.linha.tipoConta} → Tipo correto: ${problema.tipoCorreto}`,
      );
      console.log(`     Saldo Atual: ${problema.linha.saldoAtual}\n`);
    }

    if (problemas.length > 10) {
      console.log(`   ... e mais ${problemas.length - 10} linha(s)\n`);
    }
  }

  console.log('\n💡 Recomendações:');
  console.log('   1. Verificar no Excel original se o tipoConta está correto');
  console.log('   2. Se o Excel estiver correto, reprocessar o upload');
  console.log('   3. Se o Excel estiver incorreto, corrigir primeiro e depois reprocessar');
  console.log('   4. Ou criar script de correção em massa (a ser implementado)\n');
}

async function main() {
  try {
    await verificarTipoContaResultado();
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

