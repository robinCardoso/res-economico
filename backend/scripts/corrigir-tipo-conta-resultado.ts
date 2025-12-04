/**
 * Script para corrigir tipoConta de contas de resultado
 * Altera de 2-Passivo ou 1-Ativo para 3-DRE quando apropriado
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function corrigirTipoContaResultado() {
  console.log('🔧 Corrigindo tipoConta de contas de resultado...\n');

  // Contas de resultado conhecidas (classificações)
  const classificacoesResultado = [
    '2.07', // PATRIMÔNIO LÍQUIDO
    '2.07.05', // RESULTADO ACUMULADO
    '2.07.05.01', // SUPERÁVITS OU DÉFICITS ACUMULADOS
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

  // Buscar todas as linhas que são contas de resultado mas têm tipoConta incorreto
  const linhas = await prisma.linhaUpload.findMany({
    where: {
      OR: [
        {
          classificacao: {
            startsWith: '2.07',
          },
          tipoConta: {
            not: '3-DRE',
          },
        },
        {
          classificacao: {
            startsWith: '3.14',
          },
          tipoConta: {
            not: '3-DRE',
          },
        },
        {
          classificacao: {
            startsWith: '3.39',
          },
          tipoConta: {
            not: '3-DRE',
          },
        },
        {
          classificacao: {
            startsWith: '3.41',
          },
          tipoConta: {
            not: '3-DRE',
          },
        },
        {
          classificacao: {
            startsWith: '3.50',
          },
          tipoConta: {
            not: '3-DRE',
          },
        },
        {
          nomeConta: {
            contains: 'RESULTADO',
            mode: 'insensitive',
          },
          tipoConta: {
            not: '3-DRE',
          },
        },
        {
          nomeConta: {
            contains: 'SUPERÁVIT',
            mode: 'insensitive',
          },
          tipoConta: {
            not: '3-DRE',
          },
        },
        {
          nomeConta: {
            contains: 'DÉFICIT',
            mode: 'insensitive',
          },
          tipoConta: {
            not: '3-DRE',
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
    },
  });

  console.log(`📊 Total de linhas encontradas com tipoConta incorreto: ${linhas.length}\n`);

  if (linhas.length === 0) {
    console.log('✅ Nenhuma linha precisa ser corrigida!\n');
    return;
  }

  // Filtrar apenas as que realmente são contas de resultado
  const linhasParaCorrigir = linhas.filter((linha) => {
    const nomeConta = (linha.nomeConta || '').toUpperCase();
    const classificacao = linha.classificacao || '';

    return (
      classificacao.startsWith('2.07') ||
      classificacao.startsWith('3.14') ||
      classificacao.startsWith('3.39') ||
      classificacao.startsWith('3.41') ||
      classificacao.startsWith('3.50') ||
      palavrasChaveResultado.some((palavra) =>
        nomeConta.includes(palavra),
      )
    );
  });

  console.log(`🔧 Linhas que serão corrigidas: ${linhasParaCorrigir.length}\n`);

  if (linhasParaCorrigir.length === 0) {
    console.log('✅ Nenhuma linha precisa ser corrigida após filtro!\n');
    return;
  }

  // Agrupar por upload para mostrar estatísticas
  const porUpload = new Map<string, number>();
  for (const linha of linhasParaCorrigir) {
    const count = porUpload.get(linha.uploadId) || 0;
    porUpload.set(linha.uploadId, count + 1);
  }

  console.log(`📁 Uploads afetados: ${porUpload.size}\n`);

  // Mostrar algumas linhas que serão corrigidas
  console.log('Exemplos de linhas que serão corrigidas:');
  for (const linha of linhasParaCorrigir.slice(0, 10)) {
    console.log(
      `  - ${linha.classificacao} | ${linha.conta} | ${linha.nomeConta}`,
    );
    console.log(`    ${linha.tipoConta} → 3-DRE`);
  }
  if (linhasParaCorrigir.length > 10) {
    console.log(`  ... e mais ${linhasParaCorrigir.length - 10} linha(s)\n`);
  }

  // Confirmar antes de corrigir
  console.log('\n⚠️  ATENÇÃO: Este script irá alterar o tipoConta de linhas existentes!');
  console.log('   Serão corrigidas apenas contas de resultado com tipoConta incorreto.\n');

  // Executar correção
  let corrigidas = 0;
  let erros = 0;

  for (const linha of linhasParaCorrigir) {
    try {
      await prisma.linhaUpload.update({
        where: { id: linha.id },
        data: { tipoConta: '3-DRE' },
      });
      corrigidas++;
    } catch (error) {
      console.error(`❌ Erro ao corrigir linha ${linha.id}:`, error);
      erros++;
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('📋 RESULTADO DA CORREÇÃO');
  console.log('='.repeat(80) + '\n');
  console.log(`✅ Linhas corrigidas: ${corrigidas}`);
  if (erros > 0) {
    console.log(`❌ Erros: ${erros}`);
  }
  console.log('');

  // Atualizar catálogo de contas também
  console.log('🔄 Atualizando catálogo de contas...\n');

  const contasCatalogo = await prisma.contaCatalogo.findMany({
    where: {
      OR: [
        {
          classificacao: {
            startsWith: '2.07',
          },
          tipoConta: {
            not: '3-DRE',
          },
        },
        {
          classificacao: {
            startsWith: '3.14',
          },
          tipoConta: {
            not: '3-DRE',
          },
        },
        {
          classificacao: {
            startsWith: '3.39',
          },
          tipoConta: {
            not: '3-DRE',
          },
        },
        {
          classificacao: {
            startsWith: '3.41',
          },
          tipoConta: {
            not: '3-DRE',
          },
        },
        {
          classificacao: {
            startsWith: '3.50',
          },
          tipoConta: {
            not: '3-DRE',
          },
        },
      ],
    },
  });

  let catalogoCorrigido = 0;
  for (const conta of contasCatalogo) {
    try {
      await prisma.contaCatalogo.update({
        where: { id: conta.id },
        data: { tipoConta: '3-DRE' },
      });
      catalogoCorrigido++;
    } catch (error) {
      console.error(`❌ Erro ao corrigir conta catálogo ${conta.id}:`, error);
    }
  }

  console.log(`✅ Contas do catálogo corrigidas: ${catalogoCorrigido}\n`);

  console.log('✅ Correção concluída!\n');
  console.log('💡 Próximos passos:');
  console.log('   1. Verificar se o relatório agora mostra os valores corretos');
  console.log('   2. Se ainda houver problemas, pode ser necessário reprocessar os uploads');
  console.log('');
}

async function main() {
  try {
    await corrigirTipoContaResultado();
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

